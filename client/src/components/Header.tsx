import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  Settings,
  Shield,
  User,
  Wallet,
  X,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Avatar, Badge } from './ui/Surfaces';

const navItems = [
  { to: '/market', label: 'السوق' },
  { to: '/market?type=request', label: 'طلبات الشراء' },
  { to: '/subscription', label: 'الأسعار' },
  { to: '/about', label: 'عن المنصة' },
];

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      setUnreadMessages(0);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const [notifications, conversations] = await Promise.all([
          api<{ unreadCount: number }>('/notifications'),
          api<{ items: Array<{ unreadCount: number }> }>('/messages'),
        ]);
        if (!active) return;
        setUnreadNotifications(notifications.unreadCount);
        setUnreadMessages(conversations.items.reduce((sum, item) => sum + item.unreadCount, 0));
      } catch {
        /* badges are non-critical */
      }
    };
    void load();
    const timer = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user, location.pathname]);

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/market?search=${encodeURIComponent(term)}` : '/market');
  };

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="فُرصة — الصفحة الرئيسية">
          <span className="logo-mark" aria-hidden="true">
            <Leaf size={24} />
          </span>
          <span>
            فُرصة
            <small>سوق زراعي رقمي</small>
          </span>
        </Link>

        <form className="header-search" role="search" onSubmit={onSearch}>
          <label className="sr-only" htmlFor="header-search-input">
            البحث في السوق
          </label>
          <input
            id="header-search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث عن منتج، محصول، أو خدمة…"
          />
          <span className="search-icon" aria-hidden="true">
            <Search size={17} />
          </span>
        </form>

        <nav className="nav-links" aria-label="التنقل الرئيسي">
          {navItems.map((item) => {
            const isRequests = item.to.includes('type=request');
            const isActive = isRequests
              ? location.pathname === '/market' && location.search.includes('type=request')
              : item.to === '/market'
                ? location.pathname === '/market' && !location.search.includes('type=request')
                : location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={isActive ? 'nav-link active' : 'nav-link'} aria-current={isActive ? 'page' : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <Link to="/dashboard/listings/new" className="btn btn-sm hide-sm" style={{ gap: '0.35rem' }}>
                <PlusCircle size={16} /> أضف إعلاناً
              </Link>
              <Link to="/dashboard/notifications" className="icon-btn" aria-label={`الإشعارات (${unreadNotifications} غير مقروء)`}>
                <Bell size={19} />
                {unreadNotifications > 0 ? <span className="dot">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span> : null}
              </Link>
              <div className="menu" ref={menuRef}>
                <button
                  type="button"
                  className="user-trigger"
                  onClick={() => setMenuOpen((value) => !value)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <Avatar name={user.fullName} />
                  <span className="hide-sm" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.fullName}
                  </span>
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
                {menuOpen ? (
                  <div className="menu-panel" role="menu">
                    <div className="menu-head">
                      <div className="strong">{user.fullName}</div>
                      <div className="small muted">{user.phone}</div>
                      {user.role === 'admin' ? (
                        <div className="mt-2">
                          <Badge tone="gold">حساب مشرف</Badge>
                        </div>
                      ) : null}
                    </div>
                    <div className="menu-sep" />
                    <Link className="menu-item" to="/dashboard" role="menuitem">
                      <LayoutDashboard size={17} /> لوحة التحكم
                    </Link>
                    <Link className="menu-item" to="/dashboard/listings" role="menuitem">
                      <Leaf size={17} /> إعلاناتي
                    </Link>
                    <Link className="menu-item" to="/dashboard/offers" role="menuitem">
                      <Settings size={17} /> العروض
                    </Link>
                    <Link className="menu-item" to="/dashboard/messages" role="menuitem">
                      <MessageSquare size={17} /> الرسائل
                      {unreadMessages > 0 ? <span className="badge badge-gold" style={{ marginInlineStart: 'auto' }}>{unreadMessages}</span> : null}
                    </Link>
                    <Link className="menu-item" to="/dashboard/favorites" role="menuitem">
                      <Heart size={17} /> المفضلة
                    </Link>
                    <Link className="menu-item" to="/subscription" role="menuitem">
                      <Wallet size={17} /> الاشتراك
                    </Link>
                    <Link className="menu-item" to="/dashboard/profile" role="menuitem">
                      <User size={17} /> الملف الشخصي
                    </Link>
                    {user.role === 'admin' ? (
                      <>
                        <div className="menu-sep" />
                        <Link className="menu-item" to="/admin" role="menuitem">
                          <Shield size={17} /> لوحة الإدارة
                        </Link>
                      </>
                    ) : null}
                    <div className="menu-sep" />
                    <button type="button" className="menu-item" onClick={onLogout} role="menuitem">
                      <LogOut size={17} /> تسجيل الخروج
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-secondary">
                تسجيل الدخول
              </Link>
              <Link to="/register" className="btn btn-sm hide-sm">
                إنشاء حساب
              </Link>
            </>
          )}
          <button
            type="button"
            className="icon-btn mobile-toggle"
            aria-label={drawerOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((value) => !value)}
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {drawerOpen ? (
        <div className="mobile-drawer">
          <form role="search" onSubmit={onSearch} className="mb-3" style={{ position: 'relative' }}>
            <label className="sr-only" htmlFor="mobile-search-input">
              البحث في السوق
            </label>
            <input
              id="mobile-search-input"
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث في السوق…"
            />
          </form>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="nav-link">
              {item.label}
            </Link>
          ))}
          {!user ? (
            <>
              <Link to="/login" className="nav-link">
                تسجيل الدخول
              </Link>
              <Link to="/register" className="nav-link">
                إنشاء حساب
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="nav-link">
                لوحة التحكم
              </Link>
              <Link to="/dashboard/listings/new" className="nav-link">
                أضف إعلاناً
              </Link>
            </>
          )}
        </div>
      ) : null}
    </header>
  );
}
