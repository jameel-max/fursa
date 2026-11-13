import { Link, useLocation } from 'react-router-dom';
import { Home, Leaf, MessageSquare, PlusCircle, User, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  const items = [
    { to: '/', label: 'الرئيسية', icon: Home },
    { to: '/market', label: 'السوق', icon: Store },
    {
      to: user ? '/dashboard/listings/new' : '/login',
      label: 'أضف إعلان',
      icon: PlusCircle,
    },
    { to: user ? '/dashboard/messages' : '/login', label: 'الرسائل', icon: MessageSquare },
    { to: user ? '/dashboard' : '/login', label: user ? 'حسابي' : 'دخول', icon: user ? User : Leaf },
  ];

  return (
    <nav className="bottom-nav" aria-label="التنقل السريع">
      {items.map((item) => {
        const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link key={item.label} to={item.to} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
            <Icon size={21} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
