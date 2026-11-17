import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CLASSES, seededRandom } from './features.js';

export function generateDataset(size = 6000, seed = 20261117) {
  const random = seededRandom(seed);
  const integer = (min, max) => min + Math.floor(random() * (max - min + 1));
  const ratio = () => Math.round(random() * 1000) / 1000;
  return Array.from({ length: size }, (_, i) => {
    const visits = integer(0, 24);
    const days = visits ? integer(0, 29) : integer(30, 120);
    const expiry = integer(-14, 90);
    const attendance = ratio();
    const response = ratio();
    const noResponses = integer(0, 6);
    const reschedules = integer(0, 8);
    const remaining = integer(0, 30);
    // An explicit hypothetical labeling policy, with noise, NOT observed outcomes.
    const risk =
      1.15 * (days / 30) +
      1.6 * ((14 - expiry) / 30) +
      1.2 * (1 - attendance) +
      0.8 * (1 - response) +
      0.2 * noResponses +
      0.1 * reschedules -
      0.035 * visits -
      0.025 * remaining +
      (random() - 0.5) * 1.4;
    const priority = risk > 2.8 ? 'high' : risk > 0.6 ? 'medium' : 'low';
    return {
      customerId: `synthetic-${String(i + 1).padStart(6, '0')}`,
      visits30Days: visits,
      daysSinceLastVisit: random() < 0.08 ? null : days,
      attendanceRatio: random() < 0.1 ? null : attendance,
      reschedules,
      noResponses,
      responseRatio: random() < 0.15 ? null : response,
      remainingSessions: random() < 0.12 ? null : remaining,
      daysToExpiry: random() < 0.12 ? null : expiry,
      priority,
    };
  });
}

export async function writeDataset(directory = new URL('./data/', import.meta.url)) {
  const rows = generateDataset();
  await mkdir(directory, { recursive: true });
  await writeFile(
    new URL('synthetic-customers.jsonl', directory),
    rows.map((row) => JSON.stringify(row)).join('\n') + '\n',
  );
  const metadata = {
    synthetic: true,
    seed: 20261117,
    rows: rows.length,
    classCounts: Object.fromEntries(
      CLASSES.map((c) => [c, rows.filter((r) => r.priority === c).length]),
    ),
    labelPolicy:
      'Hypothetical engagement/expiry urgency + uniform noise; missing values introduced after labeling.',
    limitations:
      'No real customer data or observed renewal labels. Metrics only measure agreement with the synthetic policy.',
  };
  await writeFile(new URL('metadata.json', directory), JSON.stringify(metadata, null, 2) + '\n');
  return metadata;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(await writeDataset());
