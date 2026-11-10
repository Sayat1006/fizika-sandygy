import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useT } from './lib/i18n';
import { useApp, type Lang } from './lib/store';
import Home from './pages/Home';
import { LabDetail, Labs } from './pages/Labs';
import Topics from './pages/Topics';

const ExperimentPage = lazy(() => import('./features/experiment/ExperimentPage'));
const My = lazy(() => import('./pages/My'));
const Results = lazy(() => import('./pages/Results'));
const Teacher = lazy(() => import('./pages/Teacher'));
const Guide = lazy(() => import('./pages/Guide'));

const NAV = [
  { to: '/', key: 'nav.home', icon: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { to: '/labs', key: 'nav.labs', icon: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3' },
  { to: '/topics', key: 'nav.topics', icon: 'M4 5h16M4 12h16M4 19h10' },
  { to: '/my', key: 'nav.my', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0' },
  { to: '/results', key: 'nav.results', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { to: '/teacher', key: 'nav.teacher', icon: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5' },
  { to: '/guide', key: 'nav.guide', icon: 'M12 17v.01M12 14a3 3 0 1 0-3-3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z' },
];

function Shell() {
  const t = useT();
  const theme = useApp((s) => s.theme);
  const lang = useApp((s) => s.lang);
  const textScale = useApp((s) => s.textScale);
  const setTheme = useApp((s) => s.setTheme);
  const setLang = useApp((s) => s.setLang);
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.fontSize = `${textScale * 100}%`;
    document.documentElement.lang = lang;
  }, [theme, textScale, lang]);
  useEffect(() => {
    if (!pathname.startsWith('/experiments')) window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <>
      <a className="skip" href="#main">Негізгі мазмұнға өту</a>
      <header className="topbar no-print">
        <NavLink to="/" className="brand" aria-label="PHYSICS LAB 3D — басты бет">
          <svg viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="8" fill="var(--accent)" /><circle cx="16" cy="16" r="3" fill="#fff" /><ellipse cx="16" cy="16" rx="11" ry="4.5" fill="none" stroke="#fff" strokeWidth="1.6" transform="rotate(-30 16 16)" /><ellipse cx="16" cy="16" rx="11" ry="4.5" fill="none" stroke="#fff" strokeWidth="1.6" transform="rotate(30 16 16)" /></svg>
          <span>PHYSICS LAB <b>3D</b></span>
        </NavLink>
        <nav className="mainnav" aria-label="Негізгі навигация">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}>
              <svg viewBox="0 0 24 24" aria-hidden><path d={n.icon} /></svg>
              <span>{t(n.key)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="tools">
          <a className="back" href="/" title="Сабақтас сайтына оралу">← Сабақтас</a>
          <select aria-label="Тіл / Язык / Language" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="kk">ҚАЗ</option>
            <option value="ru">РУС</option>
            <option value="en">ENG</option>
          </select>
          <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t(theme === 'dark' ? 'theme.light' : 'theme.dark')} title={t(theme === 'dark' ? 'theme.light' : 'theme.dark')}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>
      <main id="main">
        <Suspense fallback={<div className="page narrow"><p className="empty">Жүктелуде…</p></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/labs" element={<Labs />} />
            <Route path="/labs/:id" element={<LabDetail />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/experiments/:id" element={<ExperimentPage />} />
            <Route path="/my" element={<My />} />
            <Route path="/results" element={<Results />} />
            <Route path="/teacher" element={<Teacher />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="*" element={<div className="page narrow"><h1>Бет табылмады</h1><p><NavLink to="/">Басты бетке оралу</NavLink></p></div>} />
          </Routes>
        </Suspense>
      </main>
      <footer className="site-footer no-print">
        <span>PHYSICS LAB 3D — {t('tagline')} · <a href="/">Сабақтас</a></span>
        <span>Жергілікті демо режим: деректер осы құрылғыда сақталады.</span>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Shell />
    </BrowserRouter>
  );
}
