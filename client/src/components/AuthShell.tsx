import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Handshake, Leaf, ShieldCheck, Sprout } from 'lucide-react';

const defaultBenefits = [
  'حساب موثّق برقم هاتف أردني',
  'عروض وطلبات شراء في مكان واحد',
  'تواصل مباشر وآمن مع الأطراف',
];

export function AuthShell({
  title,
  subtitle,
  asideTitle = 'سوق زراعي يبدأ من الثقة.',
  asideText = 'انضم إلى مزارعين وتجار ومقدمي خدمات نقل ومستلزمات من مختلف محافظات الأردن، وابنِ حضورك الزراعي الرقمي.',
  benefits = defaultBenefits,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  asideTitle?: string;
  asideText?: string;
  benefits?: string[];
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside" aria-label="مزايا منصة فُرصة">
        <Link to="/" className="logo" style={{ color: '#fff' }}>
          <span className="logo-mark" aria-hidden="true" style={{ background: 'rgba(255,255,255,0.16)' }}>
            <Leaf size={24} />
          </span>
          <span>
            فُرصة
            <small style={{ color: '#cfe0c8' }}>سوق زراعي رقمي</small>
          </span>
        </Link>
        <h2>{asideTitle}</h2>
        <p>{asideText}</p>
        <ul className="stack-sm" style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0' }}>
          {benefits.map((benefit) => (
            <li key={benefit} className="row" style={{ color: '#e8f2e5', gap: '0.55rem' }}>
              <BadgeCheck size={18} aria-hidden="true" /> {benefit}
            </li>
          ))}
        </ul>
        <div className="row wrap mt-4" style={{ gap: '0.75rem', color: '#cfe0c8', fontSize: '0.85rem' }}>
          <span className="row" style={{ gap: '0.35rem' }}>
            <ShieldCheck size={16} /> بيانات محمية
          </span>
          <span className="row" style={{ gap: '0.35rem' }}>
            <Handshake size={16} /> تعامل مباشر
          </span>
          <span className="row" style={{ gap: '0.35rem' }}>
            <Sprout size={16} /> قطاع زراعي
          </span>
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-card">
          <h1>{title}</h1>
          {subtitle ? <p className="muted mt-1">{subtitle}</p> : null}
          <div className="mt-4">{children}</div>
          {footer ? <div className="mt-4 center small muted">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
