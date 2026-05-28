import { useQuery } from '@tanstack/react-query';
import { FileText, Folder } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getContentByWiki, getContentItem } from '../api/content';

export function ContentBrowser() {
  const params = useParams();
  const navigate = useNavigate();
  const wikiTarget = params.target ? decodeURIComponent(params.target) : '';
  const path = params['*'] || '';
  const query = useQuery({
    queryKey: wikiTarget ? ['content', 'wiki', wikiTarget] : ['content', path],
    queryFn: () => wikiTarget ? getContentByWiki(wikiTarget) : getContentItem(path)
  });
  const item = query.data;

  if (query.isLoading) return <div className="text-sm text-muted">Loading content...</div>;
  if (query.isError) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Content not found</h1>
        <button className="text-sm text-[#1f5eff] hover:underline" onClick={() => navigate('/')}>Back to content</button>
      </div>
    );
  }
  if (!item) return null;

  return item.type === 'folder' ? <FolderView item={item} /> : <FileView item={item} />;
}

function FolderView({ item }) {
  const folders = item.children.filter((child) => child.type === 'folder');
  const files = item.children.filter((child) => child.type === 'file');

  return (
    <div className="space-y-5">
      <div>
        <Breadcrumb path={item.path} />
        <h1 className="mt-1 text-3xl font-semibold">{item.path ? titleFromPath(item.path) : 'Content'}</h1>
      </div>
      {item.children.length === 0 ? (
        <p className="text-sm text-muted">No Markdown files found in this folder.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...folders, ...files].map((child) => (
            <Link
              key={child.path}
              to={contentUrl(child)}
              className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-white px-3 py-3 text-sm transition hover:border-[#9bb7ff] hover:shadow-sm"
            >
              {child.type === 'folder' ? <Folder size={17} className="shrink-0 text-[#667085]" /> : <FileText size={17} className="shrink-0 text-[#667085]" />}
              <span className="truncate font-medium">{child.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FileView({ item }) {
  return (
    <article className="space-y-5">
      <div>
        <Breadcrumb path={item.path} />
        <h1 className="mt-6 text-3xl font-semibold">{item.name}</h1>
      </div>
      <div className="prose answer-content max-w-none" dangerouslySetInnerHTML={{ __html: item.html }} />
    </article>
  );
}

function Breadcrumb({ path }) {
  const parts = String(path || '').split('/').filter(Boolean);
  const crumbs = [
    { label: 'Content', to: '/' },
    ...parts.map((part, index) => ({
      label: titleFromSegment(part),
      to: `/${parts.slice(0, index + 1).map(slugify).join('/')}`
    }))
  ];

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {crumbs.map((crumb, index) => (
        <span key={crumb.to} className="inline-flex items-center gap-1">
          {index > 0 && <span aria-hidden="true">/</span>}
          <Link className="rounded-sm hover:text-[#1f5eff] hover:underline focus:outline-none focus:ring-2 focus:ring-[#dbe6ff]" to={crumb.to}>
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function titleFromPath(path) {
  return titleFromSegment(path.split('/').at(-1));
}

function titleFromSegment(segment) {
  return String(segment || '').split(/[-_ ]+/).filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}

function contentUrl(item) {
  return `/${item.slugPath || slugPath(item.path)}`;
}

function slugPath(path) {
  return String(path || '').split('/').map(slugify).filter(Boolean).join('/');
}

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/\.md$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
