import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const projectRoot = path.resolve(serverDir, '..');
const defaultContentRoot = path.join(projectRoot, 'content');

dotenv.config({ path: path.join(projectRoot, '.env') });

export const contentRoot = resolveContentRoot(process.env.CONTENT_DIR || process.env.MARKDOWN_CONTENT_DIR);
export const contentRootName = path.basename(contentRoot) || 'Content';

function resolveContentRoot(value) {
  if (!value || !String(value).trim()) return defaultContentRoot;
  const expanded = expandHome(String(value).trim());
  return path.resolve(projectRoot, expanded);
}

function expandHome(value) {
  if (value === '~') return process.env.HOME || value;
  if (value.startsWith('~/')) return path.join(process.env.HOME || '~', value.slice(2));
  return value;
}
