import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';

export function Spinner({ light }: { light?: boolean }) {
  return <span className={light ? 'spinner spinner-light' : 'spinner'} aria-hidden="true" />;
}

export function LoadingBlock({ label = 'جارٍ التحميل…' }: { label?: string }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <Loader2 size={28} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
      <span>{label}</span>
    </div>
  );
}

export function Alert({
  kind = 'info',
  children,
  title,
}: {
  kind?: 'info' | 'success' | 'warning' | 'error';
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <AlertCircle size={18} aria-hidden="true" />
      <div>
        {title ? <strong style={{ display: 'block' }}>{title}</strong> : null}
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        {icon ?? <Inbox size={26} />}
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="empty" role="alert">
      <div className="empty-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }} aria-hidden="true">
        <AlertCircle size={26} />
      </div>
      <h3>تعذّر تحميل البيانات</h3>
      <p>{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      ) : null}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 0 }} />
      <div style={{ padding: '1rem', display: 'grid', gap: '0.6rem' }}>
        <div className="skeleton" style={{ height: 18, width: '80%' }} />
        <div className="skeleton" style={{ height: 14, width: '55%' }} />
        <div className="skeleton" style={{ height: 24, width: '40%', marginTop: 8 }} />
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-3">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
