import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createInferenceApp } from './app.js';

const model = JSON.parse(
  await readFile(new URL('./artifacts/priority-model.json', import.meta.url), 'utf8'),
);
const app = createInferenceApp(model);
const server = app.listen(Number(process.env.INFERENCE_PORT || 8001), '127.0.0.1', () => {
  console.log(
    `Gymnasyum inference listening on ${server.address().port} (${model.modelVersion}; synthetic training)`,
  );
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
