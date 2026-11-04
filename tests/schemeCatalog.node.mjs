import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadLocalSchemeCatalog, mergeSchemeRecords } from '../services/schemeCatalog.js';

test('the committed V2 master loads 137 schemes and preserves all 128 checklists', () => {
  const records = Object.values(loadLocalSchemeCatalog(fileURLToPath(new URL('../data/', import.meta.url))));
  assert.equal(records.length, 137);
  assert.equal(records.filter(row => row.required_documents?.length).length, 128);
});

test('a partial update preserves populated nested fields and accepts false and zero', () => {
  const baseline = { required_documents: ['ID'], benefits: { amount: 50, cashless: true }, simplified: { eligibility: 'Rule', steps: 'Apply' } };
  const patch = { required_documents: [], benefits: { amount: 0, cashless: false }, simplified: { steps: 'Apply online', eligibility: ' ' } };
  assert.deepEqual(mergeSchemeRecords(baseline, patch), {
    required_documents: ['ID'], benefits: { amount: 0, cashless: false }, simplified: { eligibility: 'Rule', steps: 'Apply online' }
  });
  assert.deepEqual(mergeSchemeRecords(baseline, { simplified: 'Flat text' }).simplified, baseline.simplified);
});

test('a scraper export cannot enter the catalog or shadow an administrator patch', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scheme-catalog-'));
  try {
    const write = (name, value) => writeFileSync(join(dir, name), JSON.stringify(value));
    const master = { category: 'Health', simplified: { eligibility: 'Keep' }, required_documents: ['ID'] };
    write('national_and_ap_schemes.json', { Example: master });
    write('scraped_india_gov_schemes.json', { Example: { category: 'Other' }, Unreviewed: master });
    write('custom_schemes.json', { Example: { required_documents: [], simplified: { steps: 'New steps' } } });
    const catalog = loadLocalSchemeCatalog(dir);
    assert.deepEqual(Object.keys(catalog), ['Example']);
    assert.deepEqual(catalog.Example, { ...master, simplified: { eligibility: 'Keep', steps: 'New steps' } });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Firestore writes retry the same field merge against the latest snapshot', async () => {
  const { writeSchemePatch } = await import('../services/schemeCatalog.js');
  const ref = {};
  const states = [
    { required_documents: ['ID'], benefits: { cashless: true } },
    { required_documents: ['ID', 'Proof'], benefits: { cashless: false } }
  ];
  const transact = async callback => {
    let written;
    for (const data of states) {
      await callback({
        get: async reference => { assert.equal(reference, ref); return { data: () => data }; },
        set: (reference, value) => { assert.equal(reference, ref); written = value; }
      });
    }
    return written;
  };
  assert.deepEqual(await writeSchemePatch(ref, { required_documents: [], benefits: { amount: 0 }, unused: null }, transact), {
    required_documents: ['ID', 'Proof'], benefits: { cashless: false, amount: 0 }
  });
});
