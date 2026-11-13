import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoadingBlock } from './ui/Feedback';
import { EmptyState } from './ui/Feedback';
import { Link } from 'react-router-dom';
import { buttonClass } from './ui/Button';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="page container">
        <LoadingBlock label="جارٍ التحقق من الجلسة…" />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="page container">
        <LoadingBlock label="جارٍ التحقق من الصلاحيات…" />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="page container">
        <EmptyState
          icon={<ShieldAlert size={26} />}
          title="لا تملك صلاحية الوصول"
          description="هذه الصفحة مخصصة لمشرفي المنصة فقط."
          action={
            <Link to="/dashboard" className={buttonClass('secondary')}>
              العودة إلى لوحة التحكم
            </Link>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
