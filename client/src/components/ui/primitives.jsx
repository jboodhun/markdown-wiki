import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
  const variants = {
    primary: 'bg-[#1f5eff] text-white hover:bg-[#184bd1]',
    secondary: 'bg-white text-ink border border-border hover:bg-[#f3f6fb]',
    ghost: 'bg-transparent text-ink hover:bg-[#eef2f7]',
    danger: 'bg-[#dc2626] text-white hover:bg-[#b91c1c]'
  };
  const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', icon: 'h-9 w-9 p-0' };
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:opacity-50', variants[variant], sizes[size], className)} {...props} />;
}

export function Card({ className, ...props }) {
  return <div className={cn('rounded-lg border border-border bg-white shadow-sm', className)} {...props} />;
}

export function Input({ className, ...props }) {
  return <input className={cn('h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#dbe6ff]', className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn('w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[#1f5eff] focus:ring-2 focus:ring-[#dbe6ff]', className)} {...props} />;
}

export function Badge({ className, style, ...props }) {
  return <span className={cn('inline-flex items-center rounded-full border border-transparent bg-[#eef2f7] px-2 py-0.5 text-xs font-medium text-[#344054]', className)} style={style} {...props} />;
}

export function Select({ className, children, ...props }) {
  return <select className={cn('h-10 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-[#1f5eff]', className)} {...props}>{children}</select>;
}

export function Checkbox({ checked, onCheckedChange, className, ...props }) {
  return <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onCheckedChange?.(event.target.checked)} className={cn('h-4 w-4 rounded border-border accent-[#1f5eff]', className)} {...props} />;
}

export function Tabs({ tabs, value, onChange }) {
  return <div className="inline-flex rounded-md border border-border bg-white p-1">{tabs.map((tab) => <button key={tab.value} onClick={() => onChange(tab.value)} className={cn('rounded px-3 py-1.5 text-sm transition', value === tab.value ? 'bg-[#172033] text-white' : 'text-muted hover:bg-[#eef2f7]')}>{tab.label}</button>)}</div>;
}

export function Sheet({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/20" onClick={() => onOpenChange(false)}>
      <aside className="ml-auto h-full w-full max-w-[520px] overflow-auto bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <button className="absolute right-4 top-4 rounded p-1 hover:bg-[#eef2f7]" onClick={() => onOpenChange(false)}><X size={18} /></button>
        {children}
      </aside>
    </div>
  );
}
