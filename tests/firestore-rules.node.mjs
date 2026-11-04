import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { deleteDoc, deleteField, doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

test('Firestore requires the admin claim and retains each existing checklist item', async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-smartgov',
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
  const proof = { name: 'ID', optional: false };
  const note = { name: 'Referral', optional: true };
  try {
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'schemes/one'), { required_documents: [proof, note] });
      await setDoc(doc(context.firestore(), 'schemes/legacy'), { name: 'Legacy' });
      await setDoc(doc(context.firestore(), 'feedback/private'), { notes: 'private' });
    });
    const guest = env.unauthenticatedContext().firestore();
    const member = env.authenticatedContext('member').firestore();
    const admin = env.authenticatedContext('catalog-admin', { admin: true }).firestore();
    await assertSucceeds(getDoc(doc(guest, 'schemes/one')));
    await assertFails(getDoc(doc(guest, 'feedback/private')));
    await assertFails(setDoc(doc(guest, 'feedback/new'), { notes: 'no' }));
    await assertFails(setDoc(doc(guest, 'schemes/new'), { required_documents: [] }));
    await assertFails(updateDoc(doc(member, 'schemes/one'), { required_documents: [proof, note, 'Extra'] }));
    await assertFails(updateDoc(doc(admin, 'schemes/one'), { required_documents: [] }));
    await assertFails(updateDoc(doc(admin, 'schemes/one'), { required_documents: [proof, 'Different'] }));
    await assertFails(updateDoc(doc(admin, 'schemes/one'), { required_documents: deleteField() }));
    await assertFails(updateDoc(doc(admin, 'schemes/one'), { required_documents: null }));
    await assertFails(deleteDoc(doc(admin, 'schemes/one')));
    await assertFails(setDoc(doc(admin, 'schemes/bad'), { required_documents: 'text' }));
    await assertSucceeds(updateDoc(doc(admin, 'schemes/one'), { required_documents: [proof, note, 'Extra'] }));
    await assertSucceeds(updateDoc(doc(admin, 'schemes/one'), { summary: 'Updated' }));
    await assertSucceeds(updateDoc(doc(admin, 'schemes/legacy'), { required_documents: [proof] }));
    await assertSucceeds(getDoc(doc(admin, 'feedback/private')));
  } finally {
    await env.cleanup();
  }
});
