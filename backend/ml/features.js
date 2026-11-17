export const FEATURES = [
  'visits30Days',
  'daysSinceLastVisit',
  'attendanceRatio',
  'reschedules',
  'noResponses',
  'responseRatio',
  'remainingSessions',
  'daysToExpiry',
];
export const CLASSES = ['low', 'medium', 'high'];

export function fitPreprocessor(rows) {
  const medians = FEATURES.map((key) => {
    const values = rows
      .map((row) => row[key])
      .filter((value) => value !== null)
      .sort((a, b) => a - b);
    return values.length ? values[Math.floor(values.length / 2)] : 0;
  });
  const vectors = rows.map((row) => FEATURES.map((key, i) => row[key] ?? medians[i]));
  const means = FEATURES.map((_, i) => vectors.reduce((sum, row) => sum + row[i], 0) / rows.length);
  const scales = means.map(
    (mean, i) =>
      Math.sqrt(vectors.reduce((sum, row) => sum + (row[i] - mean) ** 2, 0) / rows.length) || 1,
  );
  return { medians, means, scales };
}

export function transform(row, preprocessing) {
  const { medians, means, scales } = preprocessing;
  return [
    1,
    ...FEATURES.map((key, i) => ((row[key] ?? medians[i]) - means[i]) / scales[i]),
    ...FEATURES.map((key) => (row[key] === null ? 1 : 0)),
  ];
}

export function probabilities(weights, vector) {
  const logits = weights.map((row) => row.reduce((sum, weight, i) => sum + weight * vector[i], 0));
  const max = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((value) => value / sum);
}

export function predict(model, row) {
  const values = probabilities(model.weights, transform(row, model.preprocessing));
  const index = values.indexOf(Math.max(...values));
  return {
    customerId: row.customerId,
    priority: CLASSES[index],
    score: values[index],
    probabilities: Object.fromEntries(CLASSES.map((name, i) => [name, values[i]])),
  };
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
