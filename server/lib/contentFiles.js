import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import hljs from 'highlight.js';
import { marked } from 'marked';

const serverDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const contentRoot = path.resolve(serverDir, '../content');

const ignoredNames = new Set(['.DS_Store', '.obsidian', 'media']);

const renderer = new marked.Renderer();

renderer.code = function codeRenderer(code, language) {
  const text = typeof code === 'object' && code !== null ? code.text : code;
  const tokenLanguage = typeof code === 'object' && code !== null ? code.lang : language;
  const lang = typeof tokenLanguage === 'string' && hljs.getLanguage(tokenLanguage) ? tokenLanguage : 'plaintext';
  const highlighted = hljs.highlight(String(text || ''), { language: lang }).value;
  return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
};

renderer.link = function linkRenderer(href, title, text) {
  const token = typeof href === 'object' && href !== null ? href : null;
  const url = token ? token.href : href;
  const label = token?.tokens ? this.parser.parseInline(token.tokens) : (token ? token.text : text);
  const linkTitle = token ? token.title : title;
  const attrs = [
    `href="${escapeHtmlAttribute(normalizeHref(url))}"`,
    linkTitle ? `title="${escapeHtmlAttribute(linkTitle)}"` : '',
    isExternalLink(url) ? 'target="_blank" rel="noopener noreferrer"' : ''
  ].filter(Boolean).join(' ');
  return `<a ${attrs}>${label}</a>`;
};

const highlightExtension = {
  name: 'highlight',
  level: 'inline',
  start(src) {
    return src.indexOf('==');
  },
  tokenizer(src) {
    const match = /^==(?=\S)([\s\S]*?\S)==(?![=])/.exec(src);
    if (!match) return undefined;
    return { type: 'highlight', raw: match[0], text: match[1] };
  },
  renderer(token) {
    return `<mark>${marked.parseInline(token.text)}</mark>`;
  }
};

const wikiImageExtension = {
  name: 'wikiimage',
  level: 'inline',
  start(src) {
    return src.indexOf('![[');
  },
  tokenizer(src) {
    const match = /^!\[\[([^\]\n]+)\]\]/.exec(src);
    if (!match) return undefined;
    const [target, ...options] = match[1].split('|').map((part) => part.trim());
    if (!target) return undefined;
    const width = options.find((option) => isImageWidth(option));
    const alt = options.find((option) => option && option !== width) || target;
    return { type: 'wikiimage', raw: match[0], target, alt, width };
  },
  renderer(token) {
    const attrs = [
      `src="${mediaUrl(token.target)}"`,
      `alt="${escapeHtmlAttribute(token.alt)}"`,
      token.width ? `width="${escapeHtmlAttribute(normalizeImageWidth(token.width))}"` : ''
    ].filter(Boolean).join(' ');
    return `<img ${attrs}>`;
  }
};

const wikiLinkExtension = {
  name: 'wikilink',
  level: 'inline',
  start(src) {
    return src.indexOf('[[');
  },
  tokenizer(src) {
    const match = /^\[\[([^\]\n]+)\]\]/.exec(src);
    if (!match) return undefined;
    const [target, label = target] = match[1].split('|').map((part) => part.trim());
    if (!target) return undefined;
    return { type: 'wikilink', raw: match[0], target, label };
  },
  renderer(token) {
    return `<a href="/content/wiki/${encodeURIComponent(token.target)}">${marked.parseInline(token.label)}</a>`;
  }
};

marked.use({ extensions: [highlightExtension, wikiImageExtension, wikiLinkExtension] });
marked.setOptions({ renderer, gfm: true, breaks: false });

export function getContentTree() {
  ensureContentRoot();
  const root = buildTree(contentRoot, '');
  return root.children;
}

export function listContent(pathValue = '') {
  const target = resolveContentPath(pathValue);
  if (!fs.existsSync(target)) return null;

  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    const node = buildTree(target, normalizePath(pathValue));
    return {
      type: 'folder',
      path: normalizePath(pathValue),
      name: node.name,
      children: node.children
    };
  }

  if (!stat.isFile() || path.extname(target).toLowerCase() !== '.md') return null;
  return readContentFile(target);
}

export function findContentByWikiTarget(target) {
  const clean = String(target || '').trim();
  if (!clean) return null;
  const files = walk(contentRoot).filter((file) => path.extname(file).toLowerCase() === '.md');
  const targetSlug = slugify(clean);
  const targetPath = stripMarkdownExtension(clean).split('/').map(slugify).filter(Boolean).join('/');

  const match = files.find((file) => {
    const relative = relativeContentPath(file);
    const withoutExtension = stripMarkdownExtension(relative);
    return withoutExtension === clean
      || withoutExtension.split('/').map(slugify).join('/') === targetPath
      || slugify(path.basename(file, '.md')) === targetSlug;
  });

  return match ? readContentFile(match) : null;
}

function buildTree(dir, relativeDir) {
  const name = relativeDir ? path.basename(relativeDir) : 'content';
  const node = { type: 'folder', name: titleFromName(name), path: relativeDir, children: [] };
  if (!fs.existsSync(dir)) return node;

  fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !ignoredNames.has(entry.name) && !entry.name.startsWith('.'))
    .forEach((entry) => {
      const full = path.join(dir, entry.name);
      const relative = normalizePath(path.join(relativeDir, entry.name));
      if (entry.isDirectory()) {
        node.children.push(buildTree(full, relative));
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.md') {
        node.children.push({
          type: 'file',
          name: titleFromFile(full),
          path: stripMarkdownExtension(relative)
        });
      }
    });

  sortTree(node);
  return node;
}

function readContentFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const relative = relativeContentPath(file);
  const markdown = parsed.content.trim();
  return {
    type: 'file',
    path: stripMarkdownExtension(relative),
    filePath: relative,
    name: String(parsed.data.title || titleFromFile(file)).trim(),
    frontmatter: parsed.data,
    markdown,
    html: marked.parse(markdown)
  };
}

function resolveContentPath(pathValue) {
  ensureContentRoot();
  const clean = normalizePath(pathValue);
  const resolved = path.resolve(contentRoot, clean);
  if (!resolved.startsWith(contentRoot)) throw new Error('Invalid content path');
  if (fs.existsSync(resolved)) return resolved;
  const markdownPath = `${resolved}.md`;
  if (fs.existsSync(markdownPath)) return markdownPath;
  return resolved;
}

function ensureContentRoot() {
  fs.mkdirSync(contentRoot, { recursive: true });
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !ignoredNames.has(entry.name) && !entry.name.startsWith('.'))
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
}

function sortTree(node) {
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  node.children.filter((child) => child.type === 'folder').forEach(sortTree);
}

function normalizePath(value) {
  return String(value || '').split(/[\\/]/).filter(Boolean).join('/');
}

function relativeContentPath(file) {
  return normalizePath(path.relative(contentRoot, file));
}

function stripMarkdownExtension(value) {
  return String(value || '').replace(/\.md$/i, '');
}

function titleFromFile(file) {
  return path.basename(file, '.md').replace(/^\d+-/, '').split(/[-_ ]+/).filter(Boolean).map(capitalize).join(' ') || 'Untitled';
}

function titleFromName(value) {
  return String(value || '').split(/[-_ ]+/).filter(Boolean).map(capitalize).join(' ') || 'Content';
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : '';
}

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/\.md$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function normalizeHref(value) {
  const href = String(value || '');
  if (isExternalLink(href) || href.startsWith('#') || href.startsWith('/')) return href;
  if (href.toLowerCase().endsWith('.md')) return `/content/${stripMarkdownExtension(href)}`;
  return href;
}

function isExternalLink(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

function mediaUrl(value) {
  return `/media/${String(value || '').split('/').map((part) => encodeURIComponent(part)).join('/')}`;
}

function isImageWidth(value) {
  return /^\d{1,4}(?:px)?$/i.test(String(value || '').trim());
}

function normalizeImageWidth(value) {
  return String(value || '').trim().replace(/px$/i, '');
}

function escapeHtmlAttribute(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}
