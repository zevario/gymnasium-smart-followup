import app from './pilot-app.js';
import pool from './database/pool.js';
import { startLifecycle } from './modules/pilot/pilot.lifecycle.js';

const port = Number(process.env.PILOT_PORT || 3001);
const server = app.listen(port, process.env.PILOT_HOST || '127.0.0.1', () =>
  console.log('Gymnasyum pilot listening on ' + server.address().port),
);
const stopLifecycle = startLifecycle();
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () =>
    server.close(async () => {
      stopLifecycle();
      await pool.end();
      process.exit(0);
    }),
  );
