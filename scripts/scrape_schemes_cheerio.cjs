/**
 * scripts/scrape_schemes_cheerio.cjs
 * =============================================================================
 * SmartGovAI - Node.js Cheerio Web Scraper for AP Healthcare Portals
 * =============================================================================
 * Utilizes Cheerio to parse HTML tables, extract scheme eligibility and
 * benefits, and validates against data/scheme_schema.json.
 * 
 * Usage:
 *   node scripts/scrape_schemes_cheerio.cjs
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'scraped_ap_schemes.json');
const SCHEMA_FILE = path.join(DATA_DIR, 'scheme_schema.json');

console.log('='.repeat(70));
console.log('SmartGovAI Node.js Cheerio Web Scraper: AP Welfare Schemes');
console.log('='.repeat(70));

const { crawlHealthSchemes } = require('./cheerio_crawler.cjs');

async function runCheerioScraper() {
  const args = process.argv.slice(2);
  const syncFirestore = args.includes('--sync-firestore') || true;
  await crawlHealthSchemes({ syncFirestore });
}

runCheerioScraper().catch((err) => {
  console.error('Cheerio scraper error:', err);
  process.exit(1);
});
