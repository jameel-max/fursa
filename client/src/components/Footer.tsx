import { Link } from 'react-router-dom';
import { Leaf, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo" style={{ color: '#fff' }}>
              <span className="logo-mark" aria-hidden="true" style={{ background: 'rgba(255,255,255,0.14)' }}>
                <Leaf size={24} />
              </span>
              <span>
                فُرصة
                <small style={{ color: '#b9cdb4' }}>سوق زراعي رقمي</small>
              </span>
            </Link>
            <p>
              منصة أردنية تربط المزارعين والتجار ومقدمي الخدمات الزراعية بعروض وطلبات واضحة، لتسهيل الوصول إلى السوق
              وبناء شراكات موثوقة.
            </p>
          </div>

          <div className="footer-col">
            <h4>السوق</h4>
            <ul>
              <li>
                <Link to="/market">جميع العروض</Link>
              </li>
              <li>
                <Link to="/market?type=offer">عروض البيع</Link>
              </li>
              <li>
                <Link to="/market?type=request">طلبات الشراء</Link>
              </li>
              <li>
                <Link to="/market?sort=newest">أحدث الإعلانات</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>الحساب</h4>
            <ul>
              <li>
                <Link to="/register">إنشاء حساب</Link>
              </li>
              <li>
                <Link to="/login">تسجيل الدخول</Link>
              </li>
              <li>
                <Link to="/subscription">خطط الاشتراك</Link>
              </li>
              <li>
                <Link to="/dashboard">لوحة التحكم</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>المنصة</h4>
            <ul>
              <li>
                <Link to="/about">عن فُرصة</Link>
              </li>
              <li>
                <Link to="/about#how">كيف تعمل المنصة</Link>
              </li>
              <li>
                <Link to="/about#terms">الشروط والأحكام</Link>
              </li>
              <li>
                <Link to="/about#privacy">سياسة الخصوصية</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} منصة فُرصة. جميع الحقوق محفوظة.</span>
          <span className="row wrap" style={{ gap: '1.25rem' }}>
            <span className="row" style={{ gap: '0.35rem' }}>
              <MapPin size={14} /> عمّان، الأردن
            </span>
            <span className="row" style={{ gap: '0.35rem' }}>
              <Phone size={14} /> 0790000000
            </span>
            <span className="row" style={{ gap: '0.35rem' }}>
              <Mail size={14} /> info@fursa.jo
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
