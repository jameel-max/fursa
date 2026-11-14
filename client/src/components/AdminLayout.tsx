import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Leaf,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui/Surfaces';

const links = [
  { to: '/admin', label: 'نظرة عامة', icon: BarChart3, end: true },
  { to: '/admin/users', label: 'المستخدمون', icon: Users },
  { to: '/admin/listings', label: 'الإعلانات', icon: Leaf },
  { to: '/admin/ads', label: 'إعلانات المنصة', icon: Megaphone },
  { to: '/admin/subscriptions', label: 'الاشتراكات', icon: CreditCard },
  { to: '/admin/settings', label: 'إعدادات المنصة', icon: Settings },
];

export function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="page container">
      <div className="dash-layout">
        <aside className="dash-side" aria-label="قائمة لوحة الإدارة">
          <div className="card-pad" style={{ paddingBottom: '0.75rem' }}>
            <div className="row">
              <Avatar name={user?.fullName ?? 'مشرف'} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="strong" style={{ lineHeight: 1.3 }}>
                  {user?.fullName ?? 'مشرف المنصة'}
                </div>
                <div className="small row" style={{ gap: '0.3rem', color: 'var(--green-700)' }}>
                  <ShieldCheck size={13} /> لوحة الإدارة
                </div>
              </div>
            </div>
          </div>

          <div className="menu-sep" />

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'dash-link active' : 'dash-link')}
              >
                <Icon size={18} aria-hidden="true" /> {link.label}
              </NavLink>
            );
          })}

          <div className="menu-sep" />
          <Link to="/dashboard" className="dash-link">
            <LayoutDashboard size={18} aria-hidden="true" /> لوحة المستخدم
          </Link>
          <Link to="/" className="dash-link">
            <ArrowRight size={18} aria-hidden="true" /> العودة للموقع
          </Link>
        </aside>

        <div className="stack" style={{ minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
