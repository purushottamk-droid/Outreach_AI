import base64
import json
import requests
from bs4 import BeautifulSoup
from email.mime.text import MIMEText
from datetime import datetime, timedelta

from google.adk.tools import FunctionTool, ToolContext
from google.cloud import secretmanager
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import uuid

from utils.secret_helper import get_secret
import logging
from utils.config import SECRET_ID,GMAIL_SCOPES,CALENDAR_SCOPES 

from scrapling.fetchers import StealthyFetcher
from urllib.parse import urljoin, urlparse
from typing import Dict, Any, List, Optional, Set
import asyncio
import time
import re

# Move to top with other imports
from utils.bq_helper import (
    get_lead_by_email,
    fetch_communications_by_lead_id,
    insert_communication_log,
    search_leads,           # ← new
    get_lead_by_id,         # ← new
    update_lead_status,     # ← new
    update_lead_after_email,# ← new
    update_campaign_stats,  # ← new
    insert_communication_log_v2  # ← new
)




# =========================
# CONFIG
# =========================

# GMAIL_SECRET_ID = "gmail-api-credentials"
# CALENDAR_SECRET_ID = "google-calendar-credentials"

# GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
# CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar"]


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# =========================
# TOOL 1: WEBSITE SCRAPER
# =========================

SCRAPER_TIMEOUT = 30000
MAX_TEXT_LENGTH = 8000

SKIP_PATTERNS = [
    "/blog/", "/find-apps/", "/app/",
    "/legal/", "/privacy/", "/terms/",
    "/login/", "/signup/", "/pricing/",
    "/cdn-cgi/", "/static/", "/press/",
    "/careers/", "/jobs/", "/sitemap/",
    "/cookie/", "/gdpr/", "/accessibility/"
]

PRIORITY_PATHS = [
    "", "/about", "/about-us", "/company",
    "/products", "/solutions", "/platform",
    "/customers", "/enterprise", "/startups",
    "/features", "/how-it-works", "/why-us", "/blog"
]

def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    text = re.sub(r"[^\x20-\x7E\n]", "", text)
    text = text.replace("\x00", "")
    return text.strip()


class WebScraper:
    def __init__(self):
        self.timeout     = SCRAPER_TIMEOUT
        self.max_retries = 2
        self.retry_delay = 2
        self.max_chars   = MAX_TEXT_LENGTH
        self.max_pages   = 5

    def fetch_page(self, url: str):
        for attempt in range(1, self.max_retries + 1):
            try:
                page = StealthyFetcher.fetch(
                    url,
                    headless=True,
                    network_idle=False,
                    timeout=self.timeout
                )
                if not page:
                    return None
                final_url = getattr(page, "url", "")
                if final_url:
                    original_domain = urlparse(url).netloc
                    final_domain    = urlparse(final_url).netloc
                    if original_domain and final_domain and original_domain != final_domain:
                        return None
                return page
            except Exception as e:
                logger.warning(f"[FETCH ERROR] {url} (Attempt {attempt}): {e}")
            time.sleep(self.retry_delay)
        return None

    def is_valid_content(self, text: str) -> bool:
        if not text:
            return False
        if len(text.split()) < 50:
            return False
        if "404" in text.lower():
            return False
        return True

    def extract_text(self, page) -> str:
        try:
            html = getattr(page, "raw", None) or getattr(page, "body", None)
            if not html:
                return ""
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style", "noscript", "header", "footer", "nav"]):
                tag.decompose()
            main = (
                soup.find("main") or
                soup.find("article") or
                soup.find("section")
            )
            text    = main.get_text(separator=" ") if main else soup.get_text(separator=" ")
            cleaned = clean_text(text)
            for word in ["skip to content"]:
                cleaned = cleaned.replace(word, "")
            return cleaned.strip()[:self.max_chars]
        except Exception as e:
            logger.warning(f"[TEXT ERROR]: {e}")
            return ""

    def extract_links(self, page, base_url: str) -> Set[str]:
        links = set()
        try:
            html = getattr(page, "raw", None) or getattr(page, "body", None)
            if not html:
                return links
            soup = BeautifulSoup(html, "html.parser")
            base_domain = urlparse(base_url).netloc
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"].strip()
                if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
                    continue
                full_url = urljoin(base_url, href)
                parsed   = urlparse(full_url)
                if parsed.netloc != base_domain:
                    continue
                if parsed.scheme not in ("http", "https"):
                    continue
                if any(pattern in full_url for pattern in SKIP_PATTERNS):
                    continue
                clean_url = parsed._replace(fragment="").geturl()
                links.add(clean_url)
        except Exception as e:
            logger.warning(f"[LINK EXTRACT ERROR]: {e}")
        return links

    def scrape_page(self, url: str) -> Optional[str]:
        page = self.fetch_page(url)
        if not page:
            return None
        text = self.extract_text(page)
        if not self.is_valid_content(text):
            return None
        return text

    def full_crawl(self, base_url: str) -> Dict:
        visited  = set()
        pages    = {}
        to_visit = [urljoin(base_url, path) for path in PRIORITY_PATHS]
        seen_queue = set(to_visit)

        while to_visit and len(pages) < self.max_pages:
            url = to_visit.pop(0)
            if url in visited:
                continue
            visited.add(url)
            page = self.fetch_page(url)
            if not page:
                continue
            text = self.extract_text(page)
            if self.is_valid_content(text):
                path = urlparse(url).path.strip("/") or "homepage"
                pages[path] = text
            new_links = self.extract_links(page, base_url)
            for link in new_links:
                if link not in seen_queue and link not in visited:
                    to_visit.append(link)
                    seen_queue.add(link)

        return {
            "url":        base_url,
            "pages":      pages,
            "page_count": len(pages)
        }

    def scrape_company(self, base_url: str) -> Dict:
        if not base_url.startswith("http"):
            base_url = "https://" + base_url
        result = self.full_crawl(base_url)
        if not result["pages"]:
            text = self.scrape_page(base_url)
            if text:
                result["pages"]["homepage"] = text
                result["page_count"] = 1
        return result


# Singleton
_scraper_instance = WebScraper()


async def scrape_tool(url: str) -> dict:
    """
    Scrapes a company website using full crawl and returns structured content.
    Use this tool when a company URL is provided.

    Args:
        url: The full URL of the company website to scrape.

    Returns:
        A dict with keys: url, pages (dict of page_name → text), page_count.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        _scraper_instance.scrape_company,
        url
    )


# =========================
# TOOL 2: TECH STACK LOOKUP
# =========================

TECH_SIGNATURES = {

    # -----------------------------
    # FRONTEND FRAMEWORKS
    # -----------------------------
    "React": {
        "scripts": ["react-dom", "/react@", "react.production.min.js"],
        "html": ["__react", "data-reactroot", "data-reactid", "__REACT"],
        "meta": []
    },
    "Vue.js": {
        "scripts": ["vue.min.js", "vue.js", "/vue@"],
        "html": ["__vue__", "data-v-app", "vue-router"],
        "meta": []
    },
    "Angular": {
        "scripts": ["@angular/core", "angular.min.js"],
        "html": ["ng-version=", "_nghost-", "ng-app="],
        "meta": []
    },
    "Next.js": {
        "scripts": ["/_next/static/chunks/"],
        "html": ["__NEXT_DATA__", "__nextjs_original-stack-frames"],
        "meta": []
    },
    "Nuxt.js": {
        "scripts": ["/_nuxt/"],
        "html": ["__NUXT__", "data-n-head"],
        "meta": []
    },
    "Svelte": {
        "scripts": ["svelte/internal", ".svelte.js"],
        "html": ["svelte-announcer", "__svelte"],
        "meta": []
    },
    "jQuery": {
        "scripts": ["jquery.min.js", "jquery.js", "/jquery@", "jquery-3", "jquery-2"],
        "html": ["jquery.min.js", "jquery.js"],
        "meta": []
    },
    "Bootstrap": {
        "scripts": ["bootstrap.min.js", "bootstrap.bundle.min.js"],
        "html": ["bootstrap.min.css", "bootstrap.css", "bootstrap.bundle"],
        "meta": []
    },
    "Tailwind CSS": {
        "scripts": ["cdn.tailwindcss.com"],
        "html": ["cdn.tailwindcss.com", "tailwindcss@"],
        "meta": []
    },

    # -----------------------------
    # CMS / PLATFORMS
    # -----------------------------
    "WordPress": {
        "scripts": ["wp-content/themes/", "wp-content/plugins/", "wp-includes/js/"],
        "html": ["wp-content/uploads/", "wp-json/wp/"],
        "meta": ["generator=wordpress"]
    },
    "Shopify": {
        "scripts": ["cdn.shopify.com", "shopify.com/s/files"],
        "html": ["Shopify.shop", "myshopify.com", "shopify.loadFeatures"],
        "meta": []
    },
    "Webflow": {
        "scripts": ["assets.website-files.com", "webflow.js"],
        "html": ["data-wf-page", "data-wf-site", "data-wf-domain"],
        "meta": ["generator=webflow"]
    },
    "Wix": {
        "scripts": ["static.wixstatic.com"],
        "html": ["wix-warmup-data", "wixsite.com"],
        "meta": []
    },
    "Squarespace": {
        "scripts": ["static1.squarespace.com"],
        "html": ["static1.squarespace.com", "squarespace-cdn"],
        "meta": ["generator=squarespace"]
    },
    "HubSpot CMS": {
        "scripts": ["js.hs-scripts.com"],
        "html": ["hs-beacon", "hsVars", "hsCookieBanner"],
        "meta": []
    },
    "Ghost": {
        "scripts": ["ghost.org/js"],
        "html": ["ghost-url", "ghost/core"],
        "meta": ["generator=ghost"]
    },

    # -----------------------------
    # ANALYTICS
    # -----------------------------
    "Google Analytics": {
        "scripts": ["google-analytics.com/analytics.js", "googletagmanager.com/gtag/js"],
        "html": ["gtag('config'", "ga('create'", "UA-", "__ga"],
        "meta": []
    },
    "Mixpanel": {
        "scripts": ["cdn.mxpnl.com", "cdn4.mxpnl.com"],
        "html": ["mixpanel.init(", "mixpanel.track("],
        "meta": []
    },
    "Segment": {
        "scripts": ["cdn.segment.com/analytics.js"],
        "html": ["analytics.load(", "analytics.page(", "analytics.identify("],
        "meta": []
    },
    "Hotjar": {
        "scripts": ["static.hotjar.com"],
        "html": ["hjid:", "hjsv:", "_hjSettings"],
        "meta": []
    },
    "Heap": {
        "scripts": ["cdn.heapanalytics.com"],
        "html": ["heap.load(", "window.heap"],
        "meta": []
    },
    "Amplitude": {
        "scripts": ["cdn.amplitude.com"],
        "html": ["amplitude.init(", "amplitude.getInstance()"],
        "meta": []
    },
    "Plausible": {
        "scripts": ["plausible.io/js/plausible.js"],
        "html": [],
        "meta": []
    },

    # -----------------------------
    # MARKETING / CRM
    # -----------------------------
    "HubSpot": {
        "scripts": ["js.hubspot.com", "js.hsforms.net"],
        "html": ["hbspt.forms.create", "hbspt.cta"],
        "meta": []
    },
    "Salesforce": {
        "scripts": ["salesforceliveagent.com", "force.com/resource"],
        "html": ["salesforceliveagent", "visualforce", "sfdcChatButton"],
        "meta": []
    },
    "Marketo": {
        "scripts": ["munchkin.marketo.net"],
        "html": ["mktoForms2", "MktoForms2", "Munchkin.init("],
        "meta": []
    },
    "Intercom": {
        "scripts": ["widget.intercom.io", "js.intercomcdn.com"],
        "html": ["intercomSettings", "Intercom('boot'", "Intercom('show'"],
        "meta": []
    },
    "Drift": {
        "scripts": ["js.driftt.com"],
        "html": ["drift.load(", "drift.identify("],
        "meta": []
    },
    "Zendesk": {
        "scripts": ["static.zdassets.com"],
        "html": ["zE('webWidget'", "zEmbed", "zESettings"],
        "meta": []
    },
    "Klaviyo": {
        "scripts": ["static.klaviyo.com/onsite/js"],
        "html": ["klaviyo.init(", "_learnq.push"],
        "meta": []
    },
    "Mailchimp": {
        "scripts": ["chimpstatic.com"],
        "html": ["mc-embedded-subscribe-form", "mc_embed_signup"],
        "meta": []
    },

    # -----------------------------
    # INFRASTRUCTURE / CDN
    # -----------------------------
    "Cloudflare": {
        "scripts": [],
        "html": ["__cf_bm", "cf.challenge"],
        "meta": [],
        "headers": ["cf-ray", "server=cloudflare"]
    },
    "AWS CloudFront": {
        "scripts": [],
        "html": [],
        "meta": [],
        "headers": ["x-amz-cf-id", "via=cloudfront"]
    },
    "Fastly": {
        "scripts": [],
        "html": [],
        "meta": [],
        "headers": ["x-served-by=cache", "x-fastly-request-id"]
    },
    "Vercel": {
        "scripts": ["/_vercel/insights"],
        "html": ["__NEXT_DATA__"],   # Next.js = usually Vercel
        "meta": [],
        "headers": ["x-vercel-id", "x-vercel-cache"]
    },
    "Netlify": {
        "scripts": [],
        "html": [],
        "meta": [],
        "headers": ["x-nf-request-id", "server=netlify"]
    },

    # -----------------------------
    # PAYMENT
    # -----------------------------
    "Stripe": {
        "scripts": ["js.stripe.com/v3", "js.stripe.com/v2"],
        "html": ["Stripe(", "stripe.createToken", "data-stripe"],
        "meta": []
    },
    "PayPal": {
        "scripts": ["paypal.com/sdk/js"],
        "html": ["paypal.Buttons(", "paypal-button-container"],
        "meta": []
    },
    "Braintree": {
        "scripts": ["js.braintreegateway.com"],
        "html": ["braintree.client.create", "braintree.dropin.create"],
        "meta": []
    },

    # -----------------------------
    # CUSTOMER SUPPORT
    # -----------------------------
    "Freshdesk": {
        "scripts": ["wchat.freshchat.com"],
        "html": ["FreshworksWidget(", "fcWidget.init("],
        "meta": []
    },
    "LiveChat": {
        "scripts": ["cdn.livechatinc.com"],
        "html": ["__lc.license", "LiveChatWidget"],
        "meta": []
    },

    # -----------------------------
    # A/B TESTING
    # -----------------------------
    "Optimizely": {
        "scripts": ["cdn.optimizely.com"],
        "html": ["optimizely.push(", "window.optimizely"],
        "meta": []
    },
    "VWO": {
        "scripts": ["dev.visualwebsiteoptimizer.com"],
        "html": ["vwoCode", "_vwo_code"],
        "meta": []
    },

    # -----------------------------
    # TAG MANAGERS
    # -----------------------------
    "Google Tag Manager": {
        "scripts": ["googletagmanager.com/gtm.js"],
        "html": ["GTM-", "googletagmanager.com/ns.html"],
        "meta": []
    },

    # -----------------------------
    # VIDEO / MEDIA
    # -----------------------------
    "Wistia": {
        "scripts": ["fast.wistia.com/assets"],
        "html": ["wistia_async_", "wistia-embed"],
        "meta": []
    },
    "Vimeo": {
        "scripts": ["player.vimeo.com/api"],
        "html": ["player.vimeo.com/video"],
        "meta": []
    },
    "YouTube": {
        "scripts": ["youtube.com/iframe_api"],
        "html": ["youtube.com/embed/", "youtu.be/"],
        "meta": []
    },
}


# ============================================================
# CATEGORY MAPPING
# ============================================================

TECH_CATEGORIES = {
    "Frontend Framework": ["React", "Vue.js", "Angular", "Next.js", "Nuxt.js", "Svelte", "jQuery", "Bootstrap", "Tailwind CSS"],
    "CMS / Platform":    ["WordPress", "Shopify", "Webflow", "Wix", "Squarespace", "HubSpot CMS", "Ghost"],
    "Analytics":         ["Google Analytics", "Mixpanel", "Segment", "Hotjar", "Heap", "Amplitude", "Plausible"],
    "CRM / Marketing":   ["HubSpot", "Salesforce", "Marketo", "Intercom", "Drift", "Zendesk", "Klaviyo", "Mailchimp"],
    "Infrastructure":    ["Cloudflare", "AWS CloudFront", "Fastly", "Vercel", "Netlify"],
    "Payment":           ["Stripe", "PayPal", "Braintree"],
    "Support":           ["Freshdesk", "LiveChat", "Zendesk"],
    "A/B Testing":       ["Optimizely", "VWO"],
    "Tag Manager":       ["Google Tag Manager"],
    "Video":             ["Wistia", "Vimeo", "YouTube"],
}


# ============================================================
# DETECTOR CLASS
# ============================================================

class TechDetector:

    def detect(self, html: str, headers: dict = {}) -> Dict:
        html_lower = html.lower()
        detected = []

        for tech, patterns in TECH_SIGNATURES.items():
            found = False

            # Check script patterns
            for pattern in patterns.get("scripts", []):
                if pattern.lower() in html_lower:
                    found = True
                    break

            # Check HTML patterns
            if not found:
                for pattern in patterns.get("html", []):
                    if pattern.lower() in html_lower:
                        found = True
                        break

            # Check meta patterns
            if not found:
                for pattern in patterns.get("meta", []):
                    if pattern.lower() in html_lower:
                        found = True
                        break

            # Check header patterns
            if not found:
                for pattern in patterns.get("headers", []):
                    for k, v in headers.items():
                        if pattern.lower() in f"{k}={v}".lower():
                            found = True
                            break

            if found:
                detected.append(tech)

        # Deduplicate
        detected = list(dict.fromkeys(detected))

        # Build categories
        categorized = {}
        uncategorized = []

        for tech in detected:
            placed = False
            for category, tech_list in TECH_CATEGORIES.items():
                if tech in tech_list:
                    if category not in categorized:
                        categorized[category] = []
                    categorized[category].append(tech)
                    placed = True
                    break
            if not placed:
                uncategorized.append(tech)

        if uncategorized:
            categorized["Other"] = uncategorized

        return {
            "technologies": detected,
            "categories": categorized,
            "technology_count": len(detected)
        }


# ============================================================
# SCRAPE + DETECT
# ============================================================

_detector = TechDetector()


def _run_detection(url: str) -> dict:
    if not url.startswith("http"):
        url = "https://" + url

    domain = urlparse(url).netloc.replace("www.", "")
    logger.info(f"[TECH DETECTOR] Scanning → {url}")

    try:
        page = StealthyFetcher.fetch(
            url,
            headless=True,
            network_idle=True,
            timeout=60000
        )

        if not page:
            return {"domain": domain, "technologies": [], "categories": {}, "technology_count": 0}

        html  = getattr(page, "raw", None) or getattr(page, "body", None) or ""
        headers = getattr(page, "headers", {}) or {}

        result = _detector.detect(str(html), dict(headers))
        result["domain"] = domain
        result["url"] = url

        logger.info(f"[TECH DETECTOR] Found {result['technology_count']} technologies for {domain}")

        return result

    except Exception as e:
        logger.error(f"[TECH DETECTOR ERROR] {url}: {e}")
        return {
            "domain": domain,
            "url": url,
            "technologies": [],
            "categories": {},
            "technology_count": 0,
            "error": str(e)
        }


# ============================================================
# ADK TOOL FUNCTION
# ============================================================

async def tech_tool(url: str) -> dict:
    """
    Detects the technology stack of a company website.
    Use this tool to find what technologies, frameworks, CRM, analytics,
    payment and infrastructure tools a company uses.

    Args:
        url: The company website URL (e.g. https://zapier.com)

    Returns:
        A dict with detected technologies and categories.
    """
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _run_detection, url)
    return result


# =========================
# TOOL 3: GMAIL SENDER
# =========================

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# =========================
# EMAIL HTML FORMATTER
# =========================

def format_email_as_html(body: str) -> str:
    """Convert plain text email to HTML with proper formatting"""
    paragraphs = body.split("\n\n")
    html_paragraphs = []
    for para in paragraphs:
        para = para.replace("\n", "<br>")
        html_paragraphs.append(f"<p style='margin:0 0 12px 0;'>{para}</p>")
    return "".join(html_paragraphs)

def build_gmail_service():
    creds_info = get_secret(SECRET_ID)

    creds = Credentials(
        token=creds_info["access_token"],
        refresh_token=creds_info["refresh_token"],
        token_uri=creds_info.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=creds_info["client_id"],
        client_secret=creds_info["client_secret"],
        scopes=GMAIL_SCOPES,
    )

    # 🔄 Auto-refresh if expired
    if creds.expired and creds.refresh_token:
        from google.auth.transport.requests import Request
        creds.refresh(Request())

        # OPTIONAL: persist updated access_token back to Secret Manager
        # (you can implement update_secret() if needed)

    return build("gmail", "v1", credentials=creds)


def send_gmail_message(
    to_email: str,
    subject: str,
    body: str,
    tool_context: ToolContext
) -> dict:

    try:
        # -------------------------
        # Resolve Lead
        # -------------------------
        logger.info(f"[GMAIL] Resolving lead → {to_email}")
        lead = get_lead_by_email(to_email)

        if not lead:
            logger.warning(f"[GMAIL] Lead not found → {to_email}")
            return {"status": "error", "error_message": "Lead not found"}

        lead_id = lead["id"]
        logger.info(f"[GMAIL] Lead resolved → lead_id: {lead_id}")

        # -------------------------
        # Send Email
        # -------------------------
        logger.info(f"[GMAIL] Sending email → {to_email} | subject: {subject}")
        service = build_gmail_service()
        
        html_body = format_email_as_html(body)
        message = MIMEText(html_body, "html")
        message["to"] = to_email
        message["subject"] = subject

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        sent = (
            service.users()
            .messages()
            .send(userId="me", body={"raw": raw_message})
            .execute()
        )

        message_id = sent.get("id")
        logger.info(f"[GMAIL] Email sent successfully → message_id: {message_id}")

        # -------------------------
        # DB LOG (SUCCESS)
        # -------------------------
        insert_communication_log({
            "id": str(uuid.uuid4()),
            "lead_id": lead_id,
            "type": "email",
            "status": "success",
            "to_email": to_email,
            "subject": subject,
            "body": body,
            "message_id": message_id,
            "created_at": datetime.utcnow().isoformat()
        })

        return {
            "status": "success",
            "message_id": message_id
        }

    except Exception as e:
        logger.error(f"[GMAIL] Failed to send email → {to_email} | error: {e}")

        # -------------------------
        # Try to log failure
        # -------------------------
        try:
            lead = get_lead_by_email(to_email)
            lead_id = lead["id"] if lead else None

            insert_communication_log({
                "id": str(uuid.uuid4()),
                "lead_id": lead_id,
                "type": "email",
                "status": "failed",
                "to_email": to_email,
                "error_message": str(e),
                "created_at": datetime.utcnow().isoformat()
            })
        except Exception:
            pass  # avoid cascading failure

        return {
            "status": "error",
            "error_message": str(e)
        }
gmail_tool = FunctionTool(func=send_gmail_message)


# =========================
# TOOL 4: CALENDAR BOOKING
# =========================


def build_calendar_service():
    creds_info = get_secret(SECRET_ID)

    creds = Credentials(
        token=creds_info["access_token"],
        refresh_token=creds_info["refresh_token"],
        token_uri=creds_info.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=creds_info["client_id"],
        client_secret=creds_info["client_secret"],
        scopes=CALENDAR_SCOPES,
    )

    # 🔄 Auto-refresh if expired
    if creds.expired and creds.refresh_token:
        from google.auth.transport.requests import Request
        creds.refresh(Request())

        # OPTIONAL:
        # Persist updated access_token back to Secret Manager
        # update_secret(CALENDAR_SECRET_ID, creds)

    return build("calendar", "v3", credentials=creds)

def book_calendar_event(
    attendee_email: str,
    start_time_iso: str,
    duration_minutes: int,
    title: str,
    description: str,
    tool_context: ToolContext
) -> dict:

    try:
        # -------------------------
        # Resolve Lead
        # -------------------------
        logger.info(f"[CALENDAR] Resolving lead → {attendee_email}")
        lead = get_lead_by_email(attendee_email)

        if not lead:
            logger.warning(f"[CALENDAR] Lead not found → {attendee_email}")
            return {"status": "error", "error_message": "Lead not found"}

        lead_id = lead["id"]
        logger.info(f"[CALENDAR] Lead resolved → lead_id: {lead_id}")

        # -------------------------
        # Build Event
        # -------------------------
        logger.info(f"[CALENDAR] Booking meeting → {attendee_email} | title: {title} | time: {start_time_iso} | duration: {duration_minutes}mins")
        service = build_calendar_service()

        start_time = datetime.fromisoformat(start_time_iso)
        end_time = start_time + timedelta(minutes=duration_minutes)

        event = {
            "summary": title,
            "description": description,
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": "Asia/Kolkata",
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": "Asia/Kolkata",
            },
            "attendees": [{"email": attendee_email}],
            "conferenceData": {
                "createRequest": {
                    "requestId": f"meet-{int(datetime.utcnow().timestamp())}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
        }

        created_event = (
            service.events()
            .insert(
                calendarId="primary",
                body=event,
                conferenceDataVersion=1
            )
            .execute()
        )

        event_id = created_event.get("id")
        meet_link = None

        if "conferenceData" in created_event:
            for ep in created_event["conferenceData"].get("entryPoints", []):
                if ep.get("entryPointType") == "video":
                    meet_link = ep.get("uri")

        logger.info(f"[CALENDAR] Meeting booked successfully → event_id: {event_id} | meet_link: {meet_link}")

        # -------------------------
        # DB LOG (SUCCESS)
        # -------------------------
        insert_communication_log({
            "id": str(uuid.uuid4()),
            "lead_id": lead_id,
            "type": "meeting",
            "status": "success",
            "summary": title,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "event_link": meet_link,
            "created_at": datetime.utcnow().isoformat()
        })

        return {
            "status": "success",
            "event_id": event_id,
            "meet_link": meet_link
        }

    except Exception as e:
        logger.error(f"[CALENDAR] Failed to book meeting → {attendee_email} | error: {e}")

        # -------------------------
        # Log failure
        # -------------------------
        try:
            lead = get_lead_by_email(attendee_email)
            lead_id = lead["id"] if lead else None

            insert_communication_log({
                "id": str(uuid.uuid4()),
                "lead_id": lead_id,
                "type": "meeting",
                "status": "failed",
                "error_message": str(e),
                "created_at": datetime.utcnow().isoformat()
            })
        except Exception:
            pass

        return {
            "status": "error",
            "error_message": str(e)
        }



calendar_tool = FunctionTool(func=book_calendar_event)


# =========================
# TOOL 5: INTERACTION CHECKER
# =========================


def get_recent_communications(
    lead_email: str,
    limit: int = 5,
    tool_context: ToolContext = None
) -> Dict[str, Any]:
    """
    Retrieve recent communication history for a lead.

    Steps:
    1. Resolve lead_id from email
    2. Fetch communication logs
    3. Format for agent consumption
    """

    try:
        # -------------------------
        # Resolve Lead
        # -------------------------
        lead = get_lead_by_email(lead_email)

        if not lead:
            return {
                "status": "failed",
                "error": f"No lead found for email: {lead_email}"
            }

        lead_id = lead["id"]

        # -------------------------
        # Fetch Communications
        # -------------------------
        rows = fetch_communications_by_lead_id(lead_id, limit)

        formatted: List[Dict[str, Any]] = []

        for row in rows:
            record = {
                "type": row.get("type"),
                "status": row.get("status"),
                "created_at": str(row.get("created_at")),
            }

            if row.get("type") == "email":
                record.update({
                    "to_email": row.get("to_email"),
                    "subject": row.get("subject"),
                    "message_id": row.get("message_id"),
                })

            elif row.get("type") == "meeting":
                record.update({
                    "summary": row.get("summary"),
                    "start_time": str(row.get("start_time")),
                    "end_time": str(row.get("end_time")),
                    "event_link": row.get("event_link"),
                })

            if row.get("error_message"):
                record["error"] = row.get("error_message")

            formatted.append(record)

        # -------------------------
        # Optional: store context
        # -------------------------
        if tool_context:
            tool_context.state["last_history_lookup"] = {
                "lead_email": lead_email,
                "lead_id": lead_id,
                "result_count": len(formatted)
            }

        return {
            "status": "success",
            "lead": {
                "id": lead_id,
                "email": lead.get("email"),
                "name": lead.get("name"),
                "company": lead.get("company"),
                "status": lead.get("status")
            },
            "count": len(formatted),
            "data": formatted
        }

    except Exception as e:
        logger.error(f"History tool failed: {e}")

        return {
            "status": "failed",
            "error": str(e)
        }


history_tool = FunctionTool(func=get_recent_communications)

# ============================================================

# NEW IMPORTS FOR V2 OUTREACH BACKEND

# Add these imports near the top of tools/tool.py

# ============================================================



# ============================================================

# TOOL 6: SEARCH LEADS TOOL

# ============================================================

# PURPOSE:

# - Search leads from BigQuery

# - Used by UI when user asks to find leads

# - Returns structured lead data

# ============================================================

async def search_leads_function(
    industries: List[str],
    job_roles: List[str],
    company_size: str = None,
    geography: str = None,
    limit: int = 20,
    tool_context: ToolContext = None
) -> dict:

    try:

        missing_fields = []

        if not industries:
            missing_fields.append("target industries")

        if not job_roles:
            missing_fields.append("target job roles")

        

        if missing_fields:

            logger.warning(
                f"[SEARCH LEADS] Missing fields -> {missing_fields}"
            )

            return {
                "status": "missing_information",
                "missing_fields": missing_fields,
                "message": (
                    f"Missing required targeting information: "
                    f"{', '.join(missing_fields)}"
                )
            }

        logger.info(
            f"[SEARCH LEADS] industries={industries} roles={job_roles}"
        )
        limit = min(limit, 100)

        leads = search_leads(
            industries=industries,
            job_roles=job_roles,
            company_size=company_size,
            geography=geography,
            limit=limit
        )

        formatted = []

        for lead in leads:

            enriching = (
                lead.get("company_summary") is None
            )
            why_this_lead = []

            if (
            lead.get("industry") and
            lead.get("industry").lower() in
            [i.lower() for i in industries]
        ):
                why_this_lead.append(
                    f"Matches target industry: {lead.get('industry')}"
                )

           
            lead_role = lead.get("job_role") or ""

            if lead_role.lower() in [r.lower() for r in job_roles]:
                why_this_lead.append(
                    f"Relevant decision-maker role: {lead_role}"
                )

            if company_size and lead.get("company_size"):
                why_this_lead.append(
                    f"Company size fit: {lead.get('company_size')}"
                )


            tech_stack = lead.get("tech_stack") or []

            if tech_stack:
                why_this_lead.append(
                    "Technology stack information available"
                )
            if not why_this_lead:
                why_this_lead.append(
                    "Matches your targeting criteria"
                )

            formatted.append({
                "id": lead.get("id"),
                "name": lead.get("name"),
                "email": lead.get("email"),
                "phone": lead.get("phone"),
                "company": lead.get("company"),
                "job_role": lead.get("job_role"),
                "designation": lead.get("designation"),
                "industry": lead.get("industry"),
                "company_size": lead.get("company_size"),
                "geography": lead.get("geography"),
                "linkedin_url": lead.get("linkedin_url"),
                "company_summary": lead.get("company_summary"),
                "why_this_lead": why_this_lead,
                "tech_stack": lead.get("tech_stack"),
                "lead_status": lead.get("lead_status"),
                "enriching": enriching
            })

        industry_text = ", ".join(industries)
        role_text = ", ".join(job_roles)

        criteria = f"{role_text} in {industry_text}"

        if geography:
            criteria += f", {geography}"

        if company_size:
            criteria += f", company size {company_size}"

        # Overlay per-user status + save search
        if leads and tool_context:
            user_id = tool_context.state.get("user_id")
            if user_id:
                from utils.bq_helper import get_user_lead_statuses, save_lead_search
                lead_ids = [l.get("id") for l in leads if l.get("id")]
                user_statuses = get_user_lead_statuses(user_id, lead_ids)
                for f in formatted:
                    f["lead_status"] = user_statuses.get(f["id"], "new")
                save_lead_search(
                    user_id=user_id,
                    lead_ids=lead_ids,
                    criteria=criteria
                )

        return {
            "status": "success",
            "total_count": len(formatted),
            "criteria": criteria,
            "leads": formatted
        }

    except Exception as e:

        logger.exception(
            "[SEARCH LEADS ERROR]"
        )

        return {
            "status": "error",
            "error": str(e)
        }

# ============================================================
# TOOL 7A: AI PERSONALIZED EMAIL GENERATOR (ONE GEMINI CALL)
# ============================================================

async def generate_personalized_emails(
    leads: List[Dict],
    sender_product: str,
    sender_name: str,
    sender_company: str
) -> List[Dict]:
    from google import genai
    genai_client = genai.Client()

    # Enrich leads missing company_summary by scraping
    for lead in leads:
        if not lead.get("company_summary") and lead.get("company_website"):
            try:
                logger.info(f"[BULK] Scraping missing data for {lead.get('company')}")
                scrape_result = await scrape_tool(lead["company_website"])
                pages = scrape_result.get("pages", {})
                lead["company_summary"] = " ".join(pages.values())[:3000]
            except Exception as scrape_err:
                logger.warning(f"[BULK] Scrape failed for {lead.get('company')}: {scrape_err}")

    # Build lead data
    leads_data = []
    for i, lead in enumerate(leads):
        tech_stack_str = lead.get('tech_stack', '')
        if isinstance(tech_stack_str, str):
            try:
                tech_stack_str = json.loads(tech_stack_str) if tech_stack_str else []
            except:
                tech_stack_str = []
        if isinstance(tech_stack_str, list):
            tech_stack_str = ", ".join(tech_stack_str) if tech_stack_str else "Not available"
        
        leads_data.append(
            f"""Lead {i+1}:
Name: {lead.get('name', '')}
Designation: {lead.get('designation', lead.get('job_role', ''))}
Company: {lead.get('company', '')}
Company Summary: {lead.get('company_summary', 'Not available')}
Tech Stack: {tech_stack_str}
Email: {lead.get('email', '')}"""
        )

    leads_text = "\n\n".join(leads_data)

    prompt = f"""You are writing B2B sales emails. Your sender sells: {sender_product}

Generate ONE unique personalized email for EACH lead below.

CRITICAL RULES:
1. Reference their company's SPECIFIC details from Company Summary
2. Reference their Tech Stack when relevant (if they use Salesforce, mention it; if they use React, mention frontend)
3. Tailor the angle based on their designation:
   - CTO/VP Engineering → technical benefits, integration, scalability
   - VP Sales/Head of Sales → revenue impact, pipeline acceleration
   - Founder/CEO → growth, competitive advantage, ROI
   - Marketing Head → lead generation, conversion optimization
4. Each email MUST be different - use different company facts for each one
5. Keep emails under 120 words
6. Plain text only, no markdown
7. Sign with: "Best,\\n{sender_name}"

Return ONLY valid JSON array (no markdown, no backticks):
[
  {{"lead_email": "email1@company.com", "subject": "subject here", "body": "email body here"}},
  {{"lead_email": "email2@company.com", "subject": "subject here", "body": "email body here"}}
]

LEADS DATA:
{leads_text}

Return only the JSON array with {len(leads)} emails. No other text."""

    try:
        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        text = response.text.strip()
        
        # Remove markdown code blocks if present
        if "```" in text:
            # Extract content between first ``` and last ```
            parts = text.split("```")
            if len(parts) >= 3:
                text = parts[1]
                if text.startswith("json"):
                    text = text[4:]
        
        text = text.strip()
        
        # Log the raw response for debugging
        logger.info(f"[PERSONALIZE] Raw Gemini response length: {len(text)}")
        logger.info(f"[PERSONALIZE] First 200 chars: {text[:200]}")
        
        # Parse JSON
        emails = json.loads(text)
        
        # Validate structure
        if not isinstance(emails, list):
            raise ValueError("Response is not a list")
        
        if len(emails) != len(leads):
            logger.warning(f"[PERSONALIZE] Generated {len(emails)} emails but expected {len(leads)}")
        
        # Validate each email has required fields
        for email in emails:
            if not all(k in email for k in ["lead_email", "subject", "body"]):
                raise ValueError(f"Email missing required fields: {email}")
        
        logger.info(f"[PERSONALIZE SUCCESS] Generated {len(emails)} personalized emails")
        return emails
        
    except json.JSONDecodeError as e:
        logger.error(f"[PERSONALIZE EMAILS] JSON parse failed: {e}")
        logger.error(f"[PERSONALIZE EMAILS] Raw text (first 1000 chars): {text[:1000]}")
        
        # Fallback: return template emails
        logger.warning("[PERSONALIZE] Using fallback template emails")
        fallback = []
        for lead in leads:
            company = lead.get('company', 'your company')
            name = lead.get('name', '')
            fallback.append({
                "lead_email": lead.get("email", ""),
                "subject": f"Quick intro — {sender_company}",
                "body": f"Hi {name},\n\nI noticed {company} and wanted to reach out.\n\n{sender_product}\n\nWould love to connect.\n\nBest,\n{sender_name}"
            })
        return fallback
    
    except Exception as e:
        logger.exception(f"[PERSONALIZE EMAILS] Unexpected error: {e}")
        # Return same fallback
        fallback = []
        for lead in leads:
            company = lead.get('company', 'your company')
            name = lead.get('name', '')
            fallback.append({
                "lead_email": lead.get("email", ""),
                "subject": f"Quick intro — {sender_company}",
                "body": f"Hi {name},\n\nI noticed {company} and wanted to reach out.\n\n{sender_product}\n\nWould love to connect.\n\nBest,\n{sender_name}"
            })
        return fallback


# ============================================================

# TOOL 7: BULK OUTREACH TOOL

# ============================================================

# PURPOSE:

# - Send personalized emails to multiple leads

# - Update campaign + lead tracking

# - Log outbound emails in BigQuery

# ============================================================

async def bulk_outreach_function(
lead_ids: List[str],
email_subject: str,
email_body: str,
campaign_id: str,
user_id: str,
tool_context: ToolContext = None
) -> dict:


    sent = 0
    failed = 0
    details = []

    try:

        logger.info(
            f"[BULK OUTREACH] Sending to {len(lead_ids)} leads"
        )

        service = build_gmail_service()

        # ====================================================
        # FETCH ALL LEADS FIRST
        # ====================================================
        all_leads = []
        for lead_id in lead_ids:
            lead = get_lead_by_id(lead_id)
            if lead:
                all_leads.append(lead)

        # ====================================================
        # GENERATE PERSONALIZED EMAILS IN ONE GEMINI CALL
        # ====================================================
        sender_name = user_id  # fallback
        sender_company = ""
        sender_product = email_body  # use passed body as product hint

        try:
            personalized_emails = await generate_personalized_emails(
                leads=all_leads,
                sender_product=sender_product,
                sender_name=sender_name,
                sender_company=sender_company
            )
            # Map email → personalized content
            email_map = {
                e["lead_email"]: e
                for e in personalized_emails
            }
        except Exception as gen_err:
            logger.warning(
                f"[BULK OUTREACH] AI generation failed, using template: {gen_err}"
            )
            email_map = {}

        for lead in all_leads:
            lead_id = lead.get("id")
            try:
                # Use AI personalized or fallback to template
                personalized = email_map.get(lead.get("email"), {})
                personalized_body = personalized.get(
                    "body",
                    email_body
                    .replace("[Lead Name]", lead.get("name", ""))
                    .replace("[Company]", lead.get("company", ""))
                )
                email_subject = personalized.get("subject", email_subject)

                message = MIMEText(
                    format_email_as_html(personalized_body),
                    "html"
                )

                message["to"] = lead.get("email")
                message["subject"] = email_subject

                raw_message = base64.urlsafe_b64encode(
                    message.as_bytes()
                ).decode()

                sent_message = (
                    service.users()
                    .messages()
                    .send(
                        userId="me",
                        body={"raw": raw_message}
                    )
                    .execute()
                )

                message_id = sent_message.get("id")

                # ====================================================
                # LOG EMAIL TO BIGQUERY
                # ====================================================

                insert_communication_log_v2({
                    "id": str(uuid.uuid4()),
                    "lead_id": lead_id,
                    "campaign_id": campaign_id,
                    "user_id": user_id,
                    "type": "email",
                    "direction": "outbound",
                    "status": "success",
                    "to_email": lead.get("email"),
                    "subject": email_subject,
                    "body": personalized_body,
                    "message_id": message_id,
                    "followup_number": 0,
                    "created_at": datetime.utcnow().isoformat()
                })

                # ====================================================
                # UPDATE LEAD STATUS + FOLLOWUP
                # ====================================================

                next_followup = (
                    datetime.utcnow() + timedelta(days=3)
                )

                update_lead_after_email(
                    lead_id=lead_id,
                    campaign_id=campaign_id,
                    next_followup=next_followup
                )

                # ====================================================
                # UPDATE CAMPAIGN METRICS
                # ====================================================

                update_campaign_stats(
                    campaign_id=campaign_id,
                    field="emails_sent",
                    increment=1
                )

                sent += 1

                details.append({
                    "lead_id": lead_id,
                    "email": lead.get("email"),
                    "status": "sent",
                    "message_id": message_id
                })

                logger.info(
                    f"[BULK OUTREACH] Sent -> {lead.get('email')}"
                )

            except Exception as inner_error:

                failed += 1

                logger.exception(
                    f"[BULK OUTREACH ERROR] {lead_id}"
                )

                details.append({
                    "lead_id": lead_id,
                    "status": "failed",
                    "error": str(inner_error)
                })

        return {
            "status": "success",
            "sent": sent,
            "failed": failed,
            "details": details
        }

    except Exception as e:

        logger.exception(
            "[BULK OUTREACH FATAL ERROR]"
        )

        return {
            "status": "error",
            "error": str(e)
        }


# ============================================================

# TOOL 8: CLASSIFY REPLY TOOL

# ============================================================

# PURPOSE:

# - Analyze incoming lead replies

# - Classify intent using Gemini

# - Update lead status automatically

# - Log inbound reply to communication_logs

# ============================================================

async def classify_reply_function(
    lead_email: str,
    reply_text: str,
    classification: str,      # ← agent passes this
    confidence: float,        # ← agent passes this
    reasoning: str,           # ← agent passes this
    tool_context: ToolContext = None
) -> dict:

    try:
        lead = get_lead_by_email(lead_email)
        if not lead:
            return {"status": "error", "error": "Lead not found"}

        status_map = {
            "POSITIVE": "replied",
            "NEUTRAL": "replied",
            "NEGATIVE": "closed",
            "QUESTION": "contacted",
            "UNCLEAR": "contacted"
        }
        new_status = status_map.get(classification, "contacted")

        update_lead_status(lead_id=lead.get("id"), status=new_status)

        insert_communication_log_v2({
            "id": str(uuid.uuid4()),
            "lead_id": lead.get("id"),
            "type": "reply",
            "direction": "inbound",
            "status": "success",
            "to_email": lead_email,
            "reply_text": reply_text,
            "reply_classification": classification,
            "reply_confidence": confidence,
            "summary": reasoning,
            "created_at": datetime.utcnow().isoformat()
        })

        return {
            "status": "success",
            "lead_email": lead_email,
            "classification": classification,
            "action_taken": f"Lead status updated to {new_status}"
        }

    except Exception as e:
        logger.exception("[CLASSIFY REPLY ERROR]")
        return {"status": "error", "error": str(e)}


# ============================================================

# REGISTER FUNCTION TOOLS

# ============================================================

search_leads_tool = FunctionTool(
    func=search_leads_function
)

bulk_outreach_tool = FunctionTool(
    func=bulk_outreach_function
)

classify_reply_tool = FunctionTool(
    func=classify_reply_function
)


# ============================================================
# ADD THESE IMPORTS IN tools/tool.py
# ============================================================

from utils.bq_helper import (
    create_campaign,
    save_followup_config
)

import uuid
from datetime import datetime


# ============================================================
# TOOL 9: CREATE CAMPAIGN TOOL
# ============================================================

async def create_campaign_function(
    user_id: str,
    name: str,
    target_criteria: dict,
    lead_ids: List[str],
    tool_context: ToolContext = None
) -> dict:

    try:

        logger.info(
            f"[CREATE CAMPAIGN] {name}"
        )

        campaign_id = str(uuid.uuid4())

        campaign = {
            "campaign_id": campaign_id,
            "user_id": user_id,
            "name": name,
            "target_criteria": target_criteria,
            "status": "draft",
            "lead_count": len(lead_ids),
            "lead_ids": lead_ids,
            "emails_sent": 0,
            "replies_received": 0,
            "meetings_booked": 0,
            "completed_steps": 0,
            "created_at": datetime.utcnow().isoformat()
        }

        create_campaign(campaign)

        logger.info(
            f"[CREATE CAMPAIGN SUCCESS] {campaign_id}"
        )

        return {
            "status": "success",
            "campaign_id": campaign_id,
            "campaign": campaign
        }

    except Exception as e:

        logger.exception(
            "[CREATE CAMPAIGN ERROR]"
        )

        return {
            "status": "error",
            "error": str(e)
        }


# ============================================================
# TOOL 10: SAVE FOLLOWUP CONFIG TOOL
# ============================================================

async def save_followup_config_function(
    user_id: str,
    campaign_id: str,
    followup_1_days: int = 3,
    followup_2_days: int = 7,
    followup_3_days: int = 14,
    max_followups: int = 3,
    llm_recommended: bool = False,
    tool_context: ToolContext = None
) -> dict:

    try:

        logger.info(
            f"[SAVE FOLLOWUP CONFIG] campaign={campaign_id}"
        )

        config_id = str(uuid.uuid4())

        config = {
            "config_id": config_id,
            "user_id": user_id,
            "campaign_id": campaign_id,
            "followup_1_days": followup_1_days,
            "followup_2_days": followup_2_days,
            "followup_3_days": followup_3_days,
            "max_followups": max_followups,
            "llm_recommended": llm_recommended,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        save_followup_config(config)

        logger.info(
            f"[SAVE FOLLOWUP CONFIG SUCCESS] {config_id}"
        )

        return {
            "status": "success",
            "config_id": config_id,
            "config": config
        }

    except Exception as e:

        logger.exception(
            "[SAVE FOLLOWUP CONFIG ERROR]"
        )

        return {
            "status": "error",
            "error": str(e)
        }


# ============================================================
# REGISTER FUNCTION TOOLS
# ============================================================

create_campaign_tool = FunctionTool(
    func=create_campaign_function
)
save_followup_config_tool = FunctionTool(
    func=save_followup_config_function
)


# =========================
# EXPORT ALL TOOLS
# =========================

ALL_TOOLS = [
    scrape_tool,
    tech_tool,
    gmail_tool,
    calendar_tool,
    history_tool,
    search_leads_tool,
    bulk_outreach_tool,
    classify_reply_tool,
    create_campaign_tool,
    save_followup_config_tool
]


# ALL_TOOLS = [
# scrape_tool,
# tech_tool,
# gmail_tool,
# calendar_tool,
# history_tool,
# search_leads_tool,
# bulk_outreach_tool,
# classify_reply_tool
# ]



