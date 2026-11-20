/**
 * Local development entry point: starts the DigiVerse API on PORT (3001).
 * On Vercel this file is not used; api/index.js imports ./app.js instead.
 */

import app from './app.js';
import { getDb } from './db/database.js';

const port = Number(process.env.PORT) || 3001;

if (process.env.NODE_ENV !== 'test') {
  getDb()
    .then((db) => {
      app.listen(port, () => {
        console.log(`[Digiverse Server] Running on http://localhost:${port}`);
        console.log(`[Digiverse Server] Database: ${db.describe()}`);
        console.log(`[Digiverse Server] Admin auth endpoint: http://localhost:${port}/api/auth/login`);
      });
    })
    .catch((error) => {
      console.error('[Digiverse Server] Failed to initialize the database:', error);
      process.exit(1);
    });
}

export default app;
