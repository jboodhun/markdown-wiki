import express from 'express';
import { findContentByWikiTarget, getContentRootInfo, getContentTree, listContent } from '../lib/contentFiles.js';

const router = express.Router();

router.get('/tree', (req, res) => {
  res.json(getContentTree());
});

router.get('/root', (req, res) => {
  res.json(getContentRootInfo());
});

router.get('/wiki/:target', (req, res) => {
  const item = findContentByWikiTarget(req.params.target);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  res.json(item);
});

router.get('/', (req, res) => {
  const item = listContent(req.query.path || '');
  if (!item) return res.status(404).json({ error: 'Content not found' });
  res.json(item);
});

export default router;
