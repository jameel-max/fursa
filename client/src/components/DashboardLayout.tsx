import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Bell,
  Heart,
  LayoutDashboard,
  Leaf,
  MessageSquare,
  PlusCircle,
  Shield,
  User,
  Wallet,
  Handshake,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge } from './ui/Surfaces';
import { buttonClass } from './ui/Button';
import { accountStatusLabel } from '../lib/format';

const links = [
  { to: '/dashboard', label: 'نظرة عامة', icon: LayoutDashboard, end: true },
  { to: '/dashboard/listings', label: 'إعلاناتي', icon: Leaf },
  { to: '/dashboard/offers', label: 'العروض', icon: Handshake },
  { to: '/dashboard/messages', label: 'الرسائل', icon: MessageSquare },
  { to: '/dashboard/favorites', label: 'المفضلة', icon: Heart },
  { to: '/dashboard/notifications', label: 'الإشعارات', icon: Bell },
  { to: '/dashboard/profile', label: 'الملف الشخصي', icon: User },
  { to: '/subscription', label: 'الاشتراك', icon: Wallet, external: true },
];

const CREATE_PERMS = ['listings.create_offer', 'listings.create_request', 'listings.create_service'];

export function DashboardLayout() {
  const { user } = useAuth();
  const canCreateListing = Boolean(
    user?.permissions?.some((perm) => perm === '*' || CREATE_PERMS.includes(perm)),
  );

  return (
    <div className="page container">
      <div className="dash-layout">
        <aside className="dash-side" aria-label="قائمة لوحة التحكم">
          {user ? (
            <div className="card-pad" style={{ paddingBottom: '0.75rem' }}>
              <div className="row">
                <Avatar name={user.fullName} />
                <div className="grow">
                  <div className="strong" style={{ lineHeight: 1.3 }}>
                    {user.fullName}
                  </div>
                  <div className="small muted">{user.phone}</div>
                </div>
              </div>
              <div className="row wrap mt-2">
                <Badge tone={user.accountStatus === 'active' ? 'offer' : 'warning'}>
                  {accountStatusLabel[user.accountStatus] ?? user.accountStatus}
                </Badge>
                {user.role === 'admin' ? <Badge tone="gold">مشرف</Badge> : null}
              </div>
            </div>
          ) : null}

          <div className="menu-sep" />

          {links.map((link) => {
            const Icon = link.icon;
            if (link.external) {
              return (
                <Link key={link.to} to={link.to} className="dash-link">
                  <Icon size={18} aria-hidden="true" /> {link.label}
                </Link>
              );
            }
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

          {user?.role === 'admin' ? (
            <Link to="/admin" className="dash-link">
              <Shield size={18} aria-hidden="true" /> لوحة الإدارة
            </Link>
          ) : null}

          <div className="menu-sep" />
          {canCreateListing ? (
            <Link to="/dashboard/listings/new" className={buttonClass('secondary', 'sm', 'btn-block')}>
              <PlusCircle size={16} /> إعلان جديد
            </Link>
          ) : null}
        </aside>

        <div className="stack" style={{ minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
