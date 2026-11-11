import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { AccountProvider } from './lib/account';
import { ToastProvider } from './ui/kit';
import { Footer, Nav } from './ui/Layout';
import Landing from './pages/Landing';

/* Бір қосымша: басты бет, кабинет, тақта, үлгілер, құжаттар, әкімші. 3D зертхана — бөлек кіру нүктесі (/lab). */
const Cabinet = lazy(() => import('./pages/cabinet/Cabinet'));
const Board = lazy(() => import('./pages/Board'));
const Samples = lazy(() => import('./pages/Samples'));
const Legal = lazy(() => import('./pages/Legal'));
const Admin = lazy(() => import('./pages/Admin'));

const TITLES: Record<string, string> = { '/': 'Сабақтас', '/app': 'Кабинет · Сабақтас', '/samples': 'Тегін үлгілер · Сабақтас', '/admin': 'Әкімші · Сабақтас' };

function Titles() {
  const { pathname } = useLocation();
  useEffect(() => { if (TITLES[pathname]) document.title = TITLES[pathname]; }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="shell">
      <Nav />
      <main className="container notfound">
        <h1 className="t-title">Бет табылмады</h1>
        <p className="t-muted">Сілтеме ескірген немесе қате терілген болуы мүмкін.</p>
        <Link className="btn btn--primary" to="/">Басты бет</Link>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AccountProvider>
          <Titles />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<Cabinet />} />
              <Route path="/board" element={<Board />} />
              <Route path="/samples" element={<Samples />} />
              <Route path="/oferta" element={<Legal doc="oferta" />} />
              <Route path="/privacy" element={<Legal doc="privacy" />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AccountProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
