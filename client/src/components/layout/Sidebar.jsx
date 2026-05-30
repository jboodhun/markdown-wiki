import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronDown, ChevronRight, FileText, Folder, Menu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getContentRoot, getContentTree } from '../../api/content';
import { Button } from '../ui/primitives';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: tree = [] } = useQuery({
    queryKey: ['content', 'tree'],
    queryFn: getContentTree,
    refetchInterval: 1000,
    refetchIntervalInBackground: true
  });
  const { data: root = { name: 'Content' } } = useQuery({
    queryKey: ['content', 'root'],
    queryFn: getContentRoot
  });

  const go = (path) => navigate(path);

  return (
    <aside className={`${collapsed ? 'w-[76px]' : 'w-[320px]'} fixed inset-y-0 left-0 z-30 border-r border-border bg-white transition-all`}>
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setCollapsed(!collapsed)}><Menu size={18} /></Button>
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <BookOpen className="text-[#1f5eff]" size={24} />
            {!collapsed && <strong className="truncate text-base">Markdown Wiki</strong>}
          </Link>
        </div>
        {!collapsed && <ContentTree tree={tree} rootName={root.name} location={location} onNavigate={go} />}
      </div>
    </aside>
  );
}

function ContentTree({ tree, rootName, location, onNavigate }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const selectedPath = useMemo(() => decodeURIComponent(location.pathname.replace(/^\/+/, '').replace(/^wiki\/.*/, '')), [location.pathname]);
  const rootActive = location.pathname === '/';

  useEffect(() => {
    if (!selectedPath) return;
    const folders = selectedPath.split('/').map((_, index, parts) => parts.slice(0, index + 1).join('/'));
    setExpanded((current) => new Set([...current, ...folders.filter(Boolean)]));
  }, [selectedPath]);

  const toggleFolder = (path) => {
    setExpanded((current) => {
      const next = new Set(current);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
    onNavigate(path ? `/${path}` : '/');
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto border-t border-border pt-3">
      <button
        className={`mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold uppercase transition ${rootActive ? 'bg-[#edf4ff] text-[#1f5eff]' : 'text-muted hover:bg-[#f2f5f9]'}`}
        onClick={() => onNavigate('/')}
      >
        <Folder size={15} />
        <span className="truncate">{rootName}</span>
      </button>
      <div className="space-y-1">
        {tree.map((node) => (
          <ContentTreeNode
            key={node.path}
            node={node}
            expanded={expanded}
            selectedPath={selectedPath}
            onToggleFolder={toggleFolder}
            onOpenFile={(path) => onNavigate(`/${path}`)}
          />
        ))}
      </div>
    </div>
  );
}

function ContentTreeNode({ node, expanded, selectedPath, onToggleFolder, onOpenFile, depth = 0 }) {
  const isFolder = node.type === 'folder';
  const nodePath = node.slugPath || slugPath(node.path);
  const isExpanded = expanded.has(nodePath);
  const isActive = selectedPath === nodePath;
  const indent = { paddingLeft: `${8 + depth * 14}px` };

  if (!isFolder) {
    return (
      <button
        className={`flex w-full min-w-0 items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition ${isActive ? 'bg-[#edf4ff] text-[#1f5eff]' : 'text-[#475467] hover:bg-[#f2f5f9]'}`}
        style={indent}
        onClick={() => onOpenFile(nodePath)}
      >
        <FileText size={14} className="shrink-0 text-muted" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        className={`flex w-full min-w-0 items-center gap-1 rounded-md py-1.5 pr-2 text-left text-sm transition ${isActive ? 'bg-[#edf4ff] text-[#1f5eff]' : 'text-[#475467] hover:bg-[#f2f5f9]'}`}
        style={indent}
        onClick={() => onToggleFolder(nodePath)}
      >
        {isExpanded ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
        <Folder size={14} className="shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
      {isExpanded && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <ContentTreeNode
              key={child.path}
              node={child}
              expanded={expanded}
              selectedPath={selectedPath}
              onToggleFolder={onToggleFolder}
              onOpenFile={onOpenFile}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function slugPath(path) {
  return String(path || '').split('/').map(slugify).filter(Boolean).join('/');
}

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/\.md$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
