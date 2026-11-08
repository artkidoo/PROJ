import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!admin.apps.length) admin.initializeApp();
const db = getFirestore('ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38');

async function main() {
  const dryRun = process.env.DRY_RUN !== 'false';
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'EXECUTE'}`);
  const snap = await db.collection('clientProjects').get();
  const affected: string[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    if (Object.prototype.hasOwnProperty.call(data, 'internalNotes')) {
      affected.push(d.id);
      if (!dryRun) {
        await d.ref.update({ internalNotes: FieldValue.delete() });
      }
    }
  }
  console.log(`Total clientProjects inspected: ${snap.size}`);
  console.log(`Affected documents: ${affected.length}`);
  affected.forEach(id => console.log(' -', id));
  console.log(dryRun ? 'No changes made (dry run).' : 'Migration complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });
