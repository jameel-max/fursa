import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { RealtimeNotifier } from './RealtimeNotifier';

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.search, location.hash]);
  return null;
}

export function Layout() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        تخطَّ إلى المحتوى الرئيسي
      </a>
      <ScrollToTop />
      <RealtimeNotifier />
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
