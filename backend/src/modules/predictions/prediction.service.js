import PredictionRepositories from './prediction.repository.js';

const BASELINE_VERSION = 'baseline-rule-v1';
const PRIORITIES = ['low', 'medium', 'high'];

/**
 * Aturan sederhana yang sudah dipakai aplikasi sebelum ada model.
 *
 * Tetap dipertahankan sebagai pembanding resmi: research question menuntut
 * model dibandingkan dengan cara sederhana, bukan dengan tebakan acak. Juga
 * dipakai saat inference API tidak tersedia, agar daftar kerja tetap terurut.
 */
export const baselinePriority = (features) => {
  const expiring = features.daysToExpiry;
  const idle = features.daysSinceLastVisit;

  if (
    (expiring !== null && expiring <= 3) ||
    (idle !== null && idle >= 30) ||
    features.noResponses >= 2
  ) {
    return 'high';
  }
  if (
    (expiring !== null && expiring <= 14) ||
    (idle !== null && idle >= 14) ||
    features.noResponses === 1 ||
    features.visits30Days <= 1
  ) {
    return 'medium';
  }
  return 'low';
};

const baselineFor = (rows) =>
  rows.map((features) => ({
    customerId: features.customerId,
    priority: baselinePriority(features),
    score: null,
    modelVersion: BASELINE_VERSION,
    source: 'baseline',
    features,
  }));

/**
 * Memanggil inference API. Mengembalikan null bila layanan tidak dikonfigurasi,
 * gagal, lewat batas waktu, atau menjawab di luar kontrak; pemanggil lalu
 * memakai baseline.
 */
const askModel = async (rows) => {
  const endpoint = process.env.INFERENCE_API_URL;
  if (!endpoint) return null;

  const timeout = Number(process.env.INFERENCE_TIMEOUT_MS || 2000);

  try {
    const httpResponse = await fetch(new URL('/predict', endpoint), {
      method: 'POST',
      signal: AbortSignal.timeout(timeout),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customers: rows }),
    });
    if (!httpResponse.ok) return null;

    const payload = await httpResponse.json();
    const predictions = payload?.predictions;
    if (!Array.isArray(predictions) || predictions.length !== rows.length) return null;

    const byCustomer = new Map(rows.map((features) => [features.customerId, features]));
    const accepted = [];

    for (const prediction of predictions) {
      const features = byCustomer.get(prediction?.customerId);
      // Jawaban di luar kontrak tidak dipakai sebagian. Satu baris salah membuat
      // seluruh batch jatuh ke baseline, agar daftar kerja tidak bercampur.
      if (!features || !PRIORITIES.includes(prediction.priority)) return null;

      const score = typeof prediction.score === 'number' ? prediction.score : null;
      if (score !== null && (score < 0 || score > 1)) return null;

      accepted.push({
        customerId: prediction.customerId,
        priority: prediction.priority,
        score,
        modelVersion: String(payload.modelVersion || 'model-unversioned').slice(0, 60),
        source: 'model',
        features,
      });
    }

    return accepted;
  } catch {
    return null;
  }
};

/**
 * Memberi prioritas kepada seluruh pelanggan aktif yang boleh dihubungi, lalu
 * mencatat hasilnya. Dipanggil siklus penjadwal saat kandidat disiapkan.
 */
const classifyActiveCustomers = async (client) => {
  const features = await PredictionRepositories.collectFeatures(client);
  if (!features.length) return { count: 0, source: null };

  const predictions = (await askModel(features)) || baselineFor(features);
  await PredictionRepositories.saveLogs(client, predictions);
  return { count: predictions.length, source: predictions[0].source };
};

const PredictionServices = { classifyActiveCustomers, baselinePriority };
export default PredictionServices;
