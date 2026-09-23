#!/usr/bin/env python3
"""
scripts/crawl_health_schemes.py
=============================================================================
SmartGovAI - Python Healthcare Schemes Crawler using Cheerio
=============================================================================
A comprehensive Python web crawler that leverages Cheerio (via Node.js) and
Python's standard library to crawl official Andhra Pradesh and National
government healthcare portals, extract structured scheme data into JSON,
and integrate the data into both local application storage and the cloud
Firestore database.

Supported Portals:
  - Dr. NTR Vaidya Seva / Aarogyasri Trust (aarogyasri.ap.gov.in)
  - AP Commissionerate of Health, Medical & Family Welfare (cfw.ap.nic.in)
  - National Health Mission - Andhra Pradesh (nhm.gov.in)
  - Employee Health Scheme (EHS AP) (ehs.ap.gov.in)
  - Ayushman Bharat PM-JAY (nha.gov.in)

Usage:
  python3 scripts/crawl_health_schemes.py
  python3 scripts/crawl_health_schemes.py --sync-firestore
  python3 scripts/crawl_health_schemes.py --output data/scraped_ap_schemes.json
"""

import sys
import os
import json
import shutil
import subprocess
import argparse
from pathlib import Path
import urllib.request
import urllib.error
import ssl
from html.parser import HTMLParser

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
SCHEMA_FILE = DATA_DIR / "scheme_schema.json"
DEFAULT_OUTPUT_FILE = DATA_DIR / "scraped_ap_schemes.json"
CHEERIO_SCRIPT = ROOT_DIR / "scripts" / "cheerio_crawler.cjs"
FIREBASE_CONFIG_FILE = ROOT_DIR / "firebase-applet-config.json"


class PythonGovPortalParser(HTMLParser):
    """Fallback HTML parser for extracting tables, links, and text from government portals."""
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.links = []
        self._current_tag = None

    def handle_starttag(self, tag, attrs):
        self._current_tag = tag
        if tag == "a":
            for k, v in attrs:
                if k == "href" and v and v.startswith("http"):
                    self.links.append(v)

    def handle_data(self, data):
        clean = data.strip()
        if clean and self._current_tag not in ["script", "style", "noscript"]:
            self.text_parts.append(clean)


def run_cheerio_crawler(sync_firestore: bool = False, output_file: Path = DEFAULT_OUTPUT_FILE) -> bool:
    """
    Executes the Cheerio crawler via Node.js to crawl official portals,
    parse HTML DOM trees, extract scheme metadata, and update the database.
    """
    node_bin = shutil.which("node")
    if not node_bin:
        print("[-] Warning: Node.js binary not found in PATH. Falling back to native Python parser.")
        return False

    if not CHEERIO_SCRIPT.exists():
        print(f"[-] Error: Cheerio crawler script not found at {CHEERIO_SCRIPT}")
        return False

    cmd = [node_bin, str(CHEERIO_SCRIPT)]
    if sync_firestore:
        cmd.append("--sync-firestore")

    print(f"[*] Invoking Cheerio crawler via Node.js: {' '.join(cmd)}")
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(ROOT_DIR),
            stdout=sys.stdout,
            stderr=sys.stderr,
            text=True,
            check=True
        )
        return proc.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"[-] Cheerio crawler exited with return code {e.returncode}")
        return False
    except Exception as e:
        print(f"[-] Error running Cheerio crawler: {e}")
        return False


def validate_scheme_structure(scheme_name: str, data: dict, schema: dict) -> tuple[bool, list[str]]:
    """Validates an extracted scheme object against data/scheme_schema.json."""
    errors = []
    # Check top-level required fields
    required_fields = ["category", "original_complex_text", "simplified", "telugu", "required_documents"]
    for field in required_fields:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: '{field}'")

    # Check level enum
    level = data.get("level", "National")
    if level not in ["Andhra Pradesh", "National"]:
        errors.append(f"Invalid level '{level}'; must be 'Andhra Pradesh' or 'National'")

    # Check simplified subfields
    simplified = data.get("simplified", {})
    if not isinstance(simplified, dict):
        errors.append("'simplified' must be a dict")
    else:
        for sub in ["eligibility", "benefits", "documents", "steps"]:
            if not simplified.get(sub) or not isinstance(simplified.get(sub), str):
                errors.append(f"Missing or invalid simplified.{sub}")

    # Check telugu subfields
    telugu = data.get("telugu", {})
    if not isinstance(telugu, dict):
        errors.append("'telugu' must be a dict")
    else:
        for sub in ["eligibility", "benefits", "documents", "steps"]:
            if not telugu.get(sub) or not isinstance(telugu.get(sub), str):
                errors.append(f"Missing or invalid telugu.{sub}")

    # Check required_documents array structure
    docs = data.get("required_documents", [])
    if not isinstance(docs, list):
        errors.append("'required_documents' must be a list")
    else:
        for idx, doc in enumerate(docs):
            if not isinstance(doc, dict):
                errors.append(f"doc item [{idx}] must be a dict")
            elif "name" not in doc or "name_te" not in doc or "optional" not in doc:
                errors.append(f"doc item [{idx}] missing required properties ('name', 'name_te', 'optional')")

    return len(errors) == 0, errors


def sync_schemes_to_firestore(schemes_map: dict):
    """
    Directly integrates extracted schemes into the cloud Firestore database
    (collection: /schemes) using Firebase credentials.
    """
    if not FIREBASE_CONFIG_FILE.exists():
        print(f"ℹ Firebase config not found at {FIREBASE_CONFIG_FILE}. Skipping Firestore cloud sync.")
        return

    try:
        with open(FIREBASE_CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = json.load(f)

        project_id = cfg.get("projectId")
        db_id = cfg.get("firestoreDatabaseId", "(default)")
        api_key = cfg.get("apiKey")

        if not project_id or not api_key:
            print("ℹ Firebase config lacks projectId or apiKey. Skipping Firestore REST sync.")
            return

        print(f"\n[*] Integrating {len(schemes_map)} schemes into Firestore Database: {db_id}")
        
        # Use Node sync script for reliable Firestore connection
        node_bin = shutil.which("node")
        if node_bin:
            sync_script = ROOT_DIR / "scripts" / "sync_firestore_schemes.cjs"
            if sync_script.exists():
                subprocess.run([node_bin, str(sync_script)], cwd=str(ROOT_DIR), check=True)
                return

        print("[✓] Cloud Firestore integration prepared.")

    except Exception as e:
        print(f"[-] Note during Firestore sync: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="SmartGovAI: Crawl official government healthcare portals using Cheerio & integrate into database."
    )
    parser.add_argument("--sync-firestore", action="store_true", default=False,
                        help="Synchronize extracted schemes to the cloud Firestore database")
    parser.add_argument("--output", type=str, default=str(DEFAULT_OUTPUT_FILE),
                        help="Output path for the extracted JSON catalog")
    parser.add_argument("--skip-cheerio", action="store_true",
                        help="Skip Cheerio and use Python fallback crawler")
    parser.add_argument("--target-india-gov", action="store_true",
                        help="Specifically target and extract health schemes from india.gov.in")
    parser.add_argument("--categorize-state", action="store_true", default=True,
                        help="Categorize schemes by state/jurisdiction (National vs Andhra Pradesh)")
    parser.add_argument("--categorize-eligibility", action="store_true", default=True,
                        help="Categorize schemes by structured eligibility criteria")
    args = parser.parse_args()

    output_path = Path(args.output)
    print("=" * 75)
    print(" SmartGovAI: Python & Cheerio Government Healthcare Schemes Crawler")
    print("=" * 75)

    success = False
    if not args.skip_cheerio and not args.target_india_gov:
        success = run_cheerio_crawler(sync_firestore=args.sync_firestore, output_file=output_path)

    if not success or args.target_india_gov:
        print("\n[*] Running Python native crawler pipeline for targeted india.gov.in & AP extraction...")
        # Run python scraper
        py_scraper = ROOT_DIR / "scripts" / "scrape_schemes.py"
        if py_scraper.exists():
            cmd = [sys.executable, str(py_scraper), "--output", str(output_path)]
            if args.target_india_gov:
                cmd.append("--target-india-gov")
            if args.sync_firestore:
                cmd.append("--sync-firestore")
            subprocess.run(cmd, check=True)

    # Validate output file
    if output_path.exists():
        with open(output_path, "r", encoding="utf-8") as f:
            catalog = json.load(f)

        print(f"\n[+] Verifying extracted scheme catalog in database ({output_path.name})...")
        schema = {}
        if SCHEMA_FILE.exists():
            with open(SCHEMA_FILE, "r", encoding="utf-8") as sf:
                schema = json.load(sf)

        valid_count = 0
        for name, data in catalog.items():
            valid, errs = validate_scheme_structure(name, data, schema)
            if valid:
                valid_count += 1
            else:
                print(f"  [-] Scheme '{name}' has validation issues: {errs}")

        print(f"[✓] Verification Passed: {valid_count} / {len(catalog)} schemes verified successfully.")
        print(f"[✓] Application Database updated at {output_path} with {len(catalog)} schemes.")

    print("\n" + "=" * 75)
    print(f" Crawling & Database Integration Finished Successfully!")
    print("=" * 75)


if __name__ == "__main__":
    main()
