import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { initials } from '../../lib/format';

export function Card({
  children,
  pad,
  hover,
  className,
  style,
}: {
  children: ReactNode;
  pad?: boolean;
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={['card', pad ? 'card-pad' : '', hover ? 'card-hover' : '', className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div className="stack-sm">
        {eyebrow ? <div>{eyebrow}</div> : null}
        <h1 style={{ fontSize: 'clamp(1.5rem, 1.2rem + 1.2vw, 2.1rem)' }}>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="row wrap">{actions}</div> : null}
    </div>
  );
}

export function SectionHead({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {description ? <p className="muted small mt-1">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'offer' | 'request' | 'gold' | 'muted' | 'danger' | 'warning' | 'outline';
}) {
  const toneClass = tone === 'default' ? '' : `badge-${tone}`;
  return <span className={`badge ${toneClass}`}>{children}</span>;
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span className={size === 'lg' ? 'avatar avatar-lg' : 'avatar'} aria-hidden="true">
      {initials(name) || '؟'}
    </span>
  );
}

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  label = 'تصفية',
}: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  label?: string;
}) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={value === item.key}
          className={value === item.key ? 'tab active' : 'tab'}
          onClick={() => onChange(item.key)}
        >
          {item.label}
          {item.count !== undefined ? <span className="count">{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let index = start; index <= end; index += 1) pages.push(index);

  return (
    <nav className="pagination" aria-label="تصفح الصفحات">
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="الصفحة السابقة"
      >
        <ChevronRight size={18} />
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          className={item === page ? 'page-btn active' : 'page-btn'}
          onClick={() => onChange(item)}
          aria-current={item === page ? 'page' : undefined}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="الصفحة التالية"
      >
        <ChevronLeft size={18} />
      </button>
    </nav>
  );
}

export function StatCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" aria-hidden="true">
        {icon}
      </div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
