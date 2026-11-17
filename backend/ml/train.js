import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  FEATURES,
  CLASSES,
  fitPreprocessor,
  transform,
  probabilities,
  predict,
  seededRandom,
} from './features.js';

export function stratifiedSplit(rows, seed = 42) {
  const random = seededRandom(seed);
  const result = { train: [], validation: [], test: [] };
  for (const label of CLASSES) {
    const group = rows.filter((r) => r.priority === label);
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    const first = Math.floor(group.length * 0.7),
      second = Math.floor(group.length * 0.85);
    result.train.push(...group.slice(0, first));
    result.validation.push(...group.slice(first, second));
    result.test.push(...group.slice(second));
  }
  return result;
}

export function evaluate(rows, classifier) {
  const matrix = CLASSES.map(() => CLASSES.map(() => 0));
  for (const row of rows) matrix[CLASSES.indexOf(row.priority)][CLASSES.indexOf(classifier(row))]++;
  const perClass = Object.fromEntries(
    CLASSES.map((label, i) => {
      const tp = matrix[i][i],
        support = matrix[i].reduce((a, b) => a + b, 0);
      const predicted = matrix.reduce((sum, row) => sum + row[i], 0);
      const precision = predicted ? tp / predicted : 0,
        recall = support ? tp / support : 0;
      return [
        label,
        {
          precision,
          recall,
          f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
          support,
        },
      ];
    }),
  );
  return {
    accuracy: matrix.reduce((sum, row, i) => sum + row[i], 0) / rows.length,
    macroF1: CLASSES.reduce((sum, label) => sum + perClass[label].f1, 0) / CLASSES.length,
    classes: CLASSES,
    confusionMatrix: matrix,
    perClass,
  };
}

export function train(rows, { epochs = 350, learningRate = 0.08, regularization = 0.001 } = {}) {
  const split = stratifiedSplit(rows);
  const preprocessing = fitPreprocessor(split.train);
  const vectors = split.train.map((row) => transform(row, preprocessing));
  const labels = split.train.map((row) => CLASSES.indexOf(row.priority));
  let weights = CLASSES.map(() => Array(vectors[0].length).fill(0));
  let bestWeights,
    bestLoss = Infinity,
    selectedEpoch = 0;
  for (let epoch = 1; epoch <= epochs; epoch++) {
    const gradient = weights.map((row) => row.map(() => 0));
    vectors.forEach((vector, n) => {
      const probs = probabilities(weights, vector);
      for (let c = 0; c < CLASSES.length; c++) {
        const error = probs[c] - Number(labels[n] === c);
        for (let j = 0; j < vector.length; j++) gradient[c][j] += error * vector[j];
      }
    });
    weights = weights.map((row, c) =>
      row.map(
        (w, j) =>
          w - learningRate * (gradient[c][j] / vectors.length + (j ? regularization * w : 0)),
      ),
    );
    if (epoch % 10 === 0 || epoch === epochs) {
      const loss =
        split.validation.reduce(
          (sum, row) =>
            sum -
            Math.log(
              Math.max(
                1e-12,
                probabilities(weights, transform(row, preprocessing))[
                  CLASSES.indexOf(row.priority)
                ],
              ),
            ),
          0,
        ) / split.validation.length;
      if (loss < bestLoss) {
        bestLoss = loss;
        bestWeights = weights.map((row) => [...row]);
        selectedEpoch = epoch;
      }
    }
  }
  return {
    model: {
      algorithm: 'multinomial-logistic-regression',
      syntheticTraining: true,
      features: FEATURES,
      classes: CLASSES,
      preprocessing,
      weights: bestWeights,
    },
    split,
    training: { epochs, selectedEpoch, learningRate, regularization, validationLogLoss: bestLoss },
  };
}

export async function trainArtifact() {
  const raw = await readFile(new URL('./data/synthetic-customers.jsonl', import.meta.url), 'utf8');
  const rows = raw
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  const { model, split, training } = train(rows);
  model.datasetSha256 = createHash('sha256').update(raw).digest('hex');
  model.modelVersion =
    'synthetic-softmax-v1-' +
    createHash('sha256').update(JSON.stringify(model)).digest('hex').slice(0, 12);
  // Import the exact production baseline so the comparison cannot drift.
  const { baselinePriority } = await import('../src/modules/predictions/prediction.service.js');
  const majority = CLASSES.reduce(
    (best, label) =>
      split.train.filter((r) => r.priority === label).length >
      split.train.filter((r) => r.priority === best).length
        ? label
        : best,
    CLASSES[0],
  );
  const report = {
    syntheticOnly: true,
    modelVersion: model.modelVersion,
    datasetSha256: model.datasetSha256,
    splitSeed: 42,
    splitCounts: Object.fromEntries(
      Object.entries(split).map(([key, value]) => [key, value.length]),
    ),
    training,
    scoreMeaning:
      'Probability of the predicted priority class, not renewal likelihood; not calibrated on real data.',
    test: {
      model: evaluate(split.test, (row) => predict(model, row).priority),
      baseline: evaluate(split.test, baselinePriority),
      majority: evaluate(split.test, () => majority),
    },
    limitation:
      'Synthetic policy agreement only. Validate on consented, labeled real data with temporal separation before operational decisions.',
  };
  await mkdir(new URL('./artifacts/', import.meta.url), { recursive: true });
  await writeFile(
    new URL('./artifacts/priority-model.json', import.meta.url),
    JSON.stringify(model, null, 2) + '\n',
  );
  await writeFile(
    new URL('./artifacts/evaluation.json', import.meta.url),
    JSON.stringify(report, null, 2) + '\n',
  );
  return report;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = await trainArtifact();
  console.log(
    JSON.stringify(
      {
        modelVersion: report.modelVersion,
        split: report.splitCounts,
        accuracy: report.test.model.accuracy,
        macroF1: report.test.model.macroF1,
        baselineMacroF1: report.test.baseline.macroF1,
      },
      null,
      2,
    ),
  );
}
