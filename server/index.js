import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { initDb } from './db/init.js';
import { contentRoot } from './lib/contentConfig.js';
import content from './routes/content.js';

initDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/media', express.static(path.join(contentRoot, 'media')));

app.use('/api/content', content);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const port = process.env.PORT || 3020;
app.listen(port, () => {
  console.log(`Markdown Wiki API listening on http://localhost:${port}`);
  console.log(`Serving Markdown content from ${contentRoot}`);
});
