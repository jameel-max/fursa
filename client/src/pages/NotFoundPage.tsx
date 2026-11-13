import { Link } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';
import { buttonClass } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';

export function NotFoundPage() {
  return (
    <div className="page container">
      <EmptyState
        icon={<Compass size={28} />}
        title="الصفحة غير موجودة"
        description="الرابط الذي تحاول الوصول إليه غير صحيح أو تم نقل الصفحة. يمكنك العودة إلى الرئيسية أو تصفح السوق."
        action={
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <Link to="/" className={buttonClass('secondary')}>
              <Home size={16} /> الصفحة الرئيسية
            </Link>
            <Link to="/market" className={buttonClass()}>
              <Search size={16} /> تصفح السوق
            </Link>
          </div>
        }
      />
    </div>
  );
}
