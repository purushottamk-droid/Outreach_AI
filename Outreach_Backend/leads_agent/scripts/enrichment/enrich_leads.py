import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# NOW imports below
import asyncio
import logging
from typing import Dict, List, Tuple, Optional

from fastapi import BackgroundTasks
from google.cloud import bigquery

from tools.tool import scrape_tool, tech_tool
from utils.config import PROJECT_ID, LEADS_TABLE
from utils.bq_helper import client
"""
===============================================================================
HOW TO RUN MANUALLY
===============================================================================

python -m scripts.enrichment.enrich_leads


===============================================================================
HOW TO SET UP AS SCHEDULED JOB
===============================================================================

OPTION 1 — CRON JOB

Example:
*/15 * * * * cd /path/to/project && python -m scripts.enrichment.enrich_leads

OPTION 2 — GOOGLE CLOUD SCHEDULER

Create a scheduled HTTP trigger or Cloud Run job
that runs this script every X minutes.

OPTION 3 — GITHUB ACTIONS

Run this script on a schedule using workflow cron.


===============================================================================
REQUIRED ENVIRONMENT VARIABLES
===============================================================================

export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export GOOGLE_CLOUD_PROJECT="atgeir-moae-dev"

===============================================================================
"""

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)

BATCH_SIZE = 5
BATCH_DELAY_SECONDS = 2
MAX_RETRIES = 3


# ============================================================================
# FETCH UNENRICHED LEADS
# ============================================================================

async def fetch_unenriched_leads() -> List[Dict]:
    """
    Fetch all leads where enriched_at IS NULL
    """

    query = f"""
    SELECT
        id,
        name,
        email,
        company,
        company_website,
        company_summary,
        tech_stack
    FROM `{LEADS_TABLE}`
    WHERE enriched_at IS NULL
    ORDER BY created_at ASC
    """

    query_job = client.query(query)
    rows = query_job.result()

    return [dict(row.items()) for row in rows]


# ============================================================================
# UPDATE LEAD IN BIGQUERY
# ============================================================================

async def update_lead_enrichment(
    lead_id: str,
    company_summary: str,
    tech_stack: str
) -> None:
    """
    Update enrichment data for a lead
    """

    update_query = f"""
    UPDATE `{LEADS_TABLE}`
    SET
        company_summary = @company_summary,
        tech_stack = @tech_stack,
        enriched_at = CURRENT_TIMESTAMP()
    WHERE id = @lead_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "company_summary",
                "STRING",
                company_summary
            ),
            bigquery.ScalarQueryParameter(
                "tech_stack",
                "STRING",
                tech_stack
            ),
            bigquery.ScalarQueryParameter(
                "lead_id",
                "STRING",
                lead_id
            )
        ]
    )

    query_job = client.query(
        update_query,
        job_config=job_config
    )

    query_job.result()


# ============================================================================
# TOOL EXECUTION WRAPPERS
# ============================================================================

async def run_scrape_tool(url: str) -> str:
    result = await scrape_tool(url)
    # result is dict: {url, pages, page_count}
    # combine all pages into one summary string
    pages = result.get("pages", {})
    combined = " ".join(pages.values())
    return combined[:8000]  # limit size

async def run_tech_tool(url: str) -> str:
    result = await tech_tool(url)
    # result is dict: {technologies, categories, technology_count}
    technologies = result.get("technologies", [])
    import json
    return json.dumps(technologies)


# ============================================================================
# SINGLE LEAD ENRICHMENT
# ============================================================================

async def enrich_lead(
    lead: Dict,
    current_index: int,
    total_leads: int
) -> Tuple[str, Optional[bool]]:
    """
    Enrich a single lead with retry logic
    """

    lead_id = lead["id"]
    company = lead["company"]
    website = lead.get("company_website")

    logger.info(
        f"Enriching lead {current_index} of {total_leads}: {company}"
    )

    # ------------------------------------------------------------------------
    # Skip if no website
    # ------------------------------------------------------------------------

    if not website:
        logger.warning(
            f"⚠️ Skipped: {company} - company_website is NULL"
        )
        return lead_id, None

    # ------------------------------------------------------------------------
    # Retry loop
    # ------------------------------------------------------------------------

    for attempt in range(1, MAX_RETRIES + 1):

        try:

            # ---------------------------------------------------------------
            # Run tools concurrently
            # ---------------------------------------------------------------

            company_summary, tech_stack = await asyncio.gather(
                run_scrape_tool(website),
                run_tech_tool(website)
            )

            # ---------------------------------------------------------------
            # Fallback safety
            # ---------------------------------------------------------------

            if not company_summary:
                company_summary = ""

            if not tech_stack:
                tech_stack = "[]"

            # ---------------------------------------------------------------
            # Update BigQuery
            # ---------------------------------------------------------------

            await update_lead_enrichment(
                lead_id=lead_id,
                company_summary=company_summary,
                tech_stack=tech_stack
            )

            logger.info(
                f"✅ Enriched: {company}"
            )

            return lead_id, True

        except Exception as e:

            logger.error(
                f"❌ Failed: {company} - Attempt {attempt}/{MAX_RETRIES} - {str(e)}"
            )

            if attempt < MAX_RETRIES:
                await asyncio.sleep(1)

    return lead_id, False


# ============================================================================
# BATCH PROCESSING
# ============================================================================

async def process_batches(leads: List[Dict]) -> None:
    """
    Process leads in batches of 5
    """

    total = len(leads)

    enriched_count = 0
    failed_count = 0
    skipped_count = 0

    for batch_start in range(0, total, BATCH_SIZE):

        batch = leads[
            batch_start: batch_start + BATCH_SIZE
        ]

        tasks = []

        for idx, lead in enumerate(
            batch,
            start=batch_start + 1
        ):

            tasks.append(
                enrich_lead(
                    lead=lead,
                    current_index=idx,
                    total_leads=total
                )
            )

        results = await asyncio.gather(*tasks)

        # --------------------------------------------------------------------
        # Aggregate stats
        # --------------------------------------------------------------------

        for _, result in results:

            if result is True:
                enriched_count += 1

            elif result is False:
                failed_count += 1

            else:
                skipped_count += 1

        # --------------------------------------------------------------------
        # Delay between batches
        # --------------------------------------------------------------------

        if batch_start + BATCH_SIZE < total:
            await asyncio.sleep(
                BATCH_DELAY_SECONDS
            )

    logger.info(
        f"Enriched: {enriched_count} | Failed: {failed_count} | Skipped: {skipped_count}"
    )


# ============================================================================
# ENRICH SINGLE LEAD
# ============================================================================

async def enrich_single_lead(
    lead_id: str
) -> None:
    """
    Enrich a single lead by ID
    Used for background auto-trigger
    """

    query = f"""
    SELECT
        id,
        company,
        company_website,
        company_summary
    FROM `{LEADS_TABLE}`
    WHERE id = @lead_id
    LIMIT 1
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "lead_id",
                "STRING",
                lead_id
            )
        ]
    )

    query_job = client.query(
        query,
        job_config=job_config
    )

    rows = list(query_job.result())

    if not rows:
        logger.warning(
            f"Lead not found: {lead_id}"
        )
        return

    lead = dict(rows[0].items())

    # ------------------------------------------------------------------------
    # Skip if already enriched
    # ------------------------------------------------------------------------

    if lead.get("company_summary"):

        logger.info(
            f"Lead already enriched: {lead['company']}"
        )

        return

    await enrich_lead(
        lead=lead,
        current_index=1,
        total_leads=1
    )


# ============================================================================
# FASTAPI BACKGROUND TASK
# ============================================================================

def trigger_enrichment_background(
    background_tasks: BackgroundTasks,
    lead_id: str
) -> None:
    """
    Trigger background enrichment after lead insert
    """

    async def background_runner():
        await enrich_single_lead(lead_id)

    background_tasks.add_task(
    enrich_single_lead,  # ✅ Direct coroutine
    lead_id
)


# ============================================================================
# MAIN ENTRYPOINT
# ============================================================================

async def main():

    logger.info(
        "Fetching unenriched leads..."
    )

    leads = await fetch_unenriched_leads()

    if not leads:

        logger.info(
            "No unenriched leads found."
        )

        return

    logger.info(
        f"Found {len(leads)} unenriched leads"
    )

    await process_batches(leads)


# ============================================================================
# SCRIPT START
# ============================================================================

if __name__ == "__main__":
    asyncio.run(main())