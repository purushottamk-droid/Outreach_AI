import json
import logging
import time
from typing import Any, Dict, Optional

from google.cloud import secretmanager
from google.api_core.exceptions import NotFound, PermissionDenied, GoogleAPIError

from utils.config import PROJECT_ID, DEFAULT_VERSION, MAX_RETRIES, RETRY_DELAY_SECONDS #
# =========================
# CONFIG
# =========================

# PROJECT_ID = "your-project-id"
# DEFAULT_VERSION = "latest"

# In-memory cache (simple optimization)
_SECRET_CACHE: Dict[str, Any] = {}

# Retry config
# MAX_RETRIES = 3
# RETRY_DELAY_SECONDS = 1


# =========================
# LOGGER
# =========================

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# =========================
# SECRET FETCH FUNCTION
# =========================

def get_secret(
    secret_id: str,
    version: str = DEFAULT_VERSION,
    use_cache: bool = True
) -> Dict[str, Any]:
    """
    Fetch a secret from Google Cloud Secret Manager.

    Args:
        secret_id (str): Secret name in GCP
        version (str): Secret version (default: latest)
        use_cache (bool): Whether to use in-memory cache

    Returns:
        dict: Parsed JSON secret

    Raises:
        RuntimeError: If secret cannot be retrieved or parsed
    """

    cache_key = f"{secret_id}:{version}"

    # ✅ Cache check
    if use_cache and cache_key in _SECRET_CACHE:
        logger.debug(f"Cache hit for secret: {secret_id}")
        return _SECRET_CACHE[cache_key]

    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{secret_id}/versions/{version}"

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.debug(f"Fetching secret: {secret_id} (attempt {attempt})")

            response = client.access_secret_version(name=name)

            payload = response.payload.data.decode("UTF-8")

            try:
                parsed_secret = json.loads(payload)
            except json.JSONDecodeError as e:
                logger.error(f"Secret {secret_id} is not valid JSON")
                raise RuntimeError(f"Invalid JSON in secret '{secret_id}'") from e

            # ✅ Cache it
            if use_cache:
                _SECRET_CACHE[cache_key] = parsed_secret

            return parsed_secret

        except NotFound:
            logger.error(f"Secret not found: {secret_id}")
            raise RuntimeError(f"Secret '{secret_id}' not found")

        except PermissionDenied:
            logger.error(f"Permission denied for secret: {secret_id}")
            raise RuntimeError(f"Permission denied for secret '{secret_id}'")

        except GoogleAPIError as e:
            logger.warning(f"GCP API error on attempt {attempt}: {e}")

            if attempt == MAX_RETRIES:
                raise RuntimeError(
                    f"Failed to fetch secret '{secret_id}' after {MAX_RETRIES} attempts"
                ) from e

            time.sleep(RETRY_DELAY_SECONDS * attempt)

        except Exception as e:
            logger.exception("Unexpected error while fetching secret")

            raise RuntimeError(
                f"Unexpected error fetching secret '{secret_id}'"
            ) from e
def save_secret(
    secret_id: str,
    secret_value: str
) -> None:
    """
    Create or update a secret in Google Cloud Secret Manager.
    """
    client = secretmanager.SecretManagerServiceClient()
    parent = f"projects/{PROJECT_ID}"
    secret_name = f"{parent}/secrets/{secret_id}"

    # Create secret if it doesn't exist
    try:
        client.get_secret(request={"name": secret_name})
    except NotFound:
        client.create_secret(
            request={
                "parent": parent,
                "secret_id": secret_id,
                "secret": {"replication": {"automatic": {}}}
            }
        )

    # Add new version with the value
    client.add_secret_version(
        request={
            "parent": secret_name,
            "payload": {"data": secret_value.encode("UTF-8")}
        }
    )

    # Invalidate cache
    _SECRET_CACHE.pop(f"{secret_id}:{DEFAULT_VERSION}", None)

    logger.info(f"Secret saved: {secret_id}")