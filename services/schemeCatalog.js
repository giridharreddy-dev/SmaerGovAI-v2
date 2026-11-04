import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function mergeField(existing, incoming) {
  if (incoming == null || (typeof incoming === 'string' && !incoming.trim())) return existing;
  if (Array.isArray(existing) && !Array.isArray(incoming)) return existing;
  if (isRecord(existing) && !isRecord(incoming)) return existing;
  if (Array.isArray(incoming)) return incoming.length ? incoming : existing ?? incoming;
  if (isRecord(incoming)) return mergeSchemeRecords(isRecord(existing) ? existing : {}, incoming);
  return incoming;
}

export function mergeSchemeRecords(existing, incoming) {
  return {
    ...existing,
    ...Object.fromEntries(Object.entries(incoming).map(([key, value]) => [
      key, mergeField(Object.hasOwn(existing, key) ? existing[key] : undefined, value)
    ]))
  };
}

export function loadLocalSchemeCatalog(dataDir) {
  const master = readCatalog(dataDir, 'national_and_ap_schemes.json');
  // Administrator edits are an explicit overlay. Scraper and RAG exports are offline inputs.
  let custom = {};
  try {
    custom = readCatalog(dataDir, 'custom_schemes.json', true);
  } catch (error) {
    console.warn('Ignoring invalid administrator catalog overlay:', error.message);
  }
  const catalog = Object.assign(Object.create(null), master);
  for (const [name, patch] of Object.entries(custom)) {
    if (!isRecord(patch)) continue;
    const previous = Object.hasOwn(master, name) ? master[name] : {};
    const record = mergeSchemeRecords(previous, patch);
    if (record.category && (record.simplified || record.telugu)) {
      catalog[name] = record;
    }
  }
  return catalog;
}

function readCatalog(dataDir, filename, optional = false) {
  try {
    const data = JSON.parse(readFileSync(join(dataDir, filename), 'utf8').replace(/^\uFEFF/, ''));
    if (!isRecord(data)) throw new Error(`Expected scheme records in ${filename}`);
    return data;
  } catch (error) {
    if (optional && error.code === 'ENOENT') return {};
    throw error;
  }
}
