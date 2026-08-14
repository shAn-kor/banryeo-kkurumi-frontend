import { useLayoutEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import CatalogPage from '../pages/CatalogPage';
import CheckoutPage from '../pages/CheckoutPage';
import LikesPage from '../pages/LikesPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import OrdersPage from '../pages/OrdersPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import SignupPage from '../pages/SignupPage';
import { SessionProvider } from '../features/session';
import { AppShell } from '../shared/design';
import './styles.css';

function RouteFocus() {
  const location = useLocation();

  useLayoutEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const focusHeading = () => {
      const heading = main.querySelector<HTMLHeadingElement>('h1');
      if (!heading) return false;
      heading.tabIndex = -1;
      heading.focus();
      return true;
    };
    if (focusHeading()) return;
    const observer = new MutationObserver(() => {
      if (focusHeading()) observer.disconnect();
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname, location.search]);

  return null;
}

function StorefrontRoutes() {
  return (
    <AppShell>
      <RouteFocus />
      <Routes>
        <Route element={<CatalogPage />} path="/" />
        <Route element={<CatalogPage />} path="/products" />
        <Route element={<ProductDetailPage />} path="/products/:productId" />
        <Route element={<SignupPage />} path="/signup" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<LikesPage />} path="/likes" />
        <Route element={<CheckoutPage />} path="/orders/new" />
        <Route element={<OrdersPage />} path="/orders" />
        <Route element={<OrderDetailPage />} path="/orders/:orderId" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider><StorefrontRoutes /></SessionProvider>
    </BrowserRouter>
  );
}
