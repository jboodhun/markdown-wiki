import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { initDb } from './db/init.js';
import content from './routes/content.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.resolve(serverDir, '../content');

initDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/media', express.static(path.join(contentDir, 'media')));

app.use('/api/content', content);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const port = process.env.PORT || 3020;
app.listen(port, () => {
  console.log(`Markdown Wiki API listening on http://localhost:${port}`);
});
