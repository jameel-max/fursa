import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAdmin, RequireAuth } from './components/RequireAuth';
import { DashboardLayout } from './components/DashboardLayout';
import { AdminLayout } from './components/AdminLayout';
import { HomePage } from './pages/HomePage';
import { MarketPage } from './pages/MarketPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyPhonePage } from './pages/VerifyPhonePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardHomePage } from './pages/DashboardHomePage';
import { MyListingsPage } from './pages/MyListingsPage';
import { ListingFormPage } from './pages/ListingFormPage';
import { OffersPage } from './pages/OffersPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { AdminAdsPage } from './pages/admin/AdminAdsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminListingsPage } from './pages/admin/AdminListingsPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminSpecialtiesPage } from './pages/admin/AdminSpecialtiesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="market" element={<MarketPage />} />
        <Route path="market/:id" element={<ListingDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route
          path="subscription"
          element={
            <RequireAuth>
              <SubscriptionPage />
            </RequireAuth>
          }
        />

        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardHomePage />} />
          <Route path="listings" element={<MyListingsPage />} />
          <Route path="listings/new" element={<ListingFormPage />} />
          <Route path="listings/:id/edit" element={<ListingFormPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:id" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="ads" element={<AdminAdsPage />} />
          <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="specialties" element={<AdminSpecialtiesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyPhonePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    </Routes>
  );
}
