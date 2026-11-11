import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from '../lib/account';
import { sb } from '../lib/data';
import { setMode, useMode, type Mode } from '../lib/mode';
import { Mark } from './icons';

export function Brand() {
  return <Link className="brand" to="/"><Mark />Сабақтас</Link>;
}

/** Жоғарғы жолақ: сол жақта белгі, оң жақта беттің өз әрекеттері */
export function Nav({ plain, children }: { plain?: boolean; children?: ReactNode }) {
  return (
    <header className={`nav${plain ? ' nav--plain' : ''}`}>
      <div className="container nav__in">
        <Brand />
        <ModeSwitch />
        <div className="nav__right">{children}</div>
      </div>
    </header>
  );
}

/** «Сабақтан тыс | Сабақ барысы»: бүкіл сайттың режимі. «Сабақ барысы» таңдалса — кабинетке (бүгінгі сабақтар) */
export function ModeSwitch() {
  const mode = useMode();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const go = (m: Mode, e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMode(m, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, () => { if (m === 'class' && pathname !== '/app') nav('/app'); });
  };
  return (
    <div className={`mswitch mswitch--${mode}`} role="radiogroup" aria-label="Сайт режимі">
      <i className="mswitch__thumb" aria-hidden />
      <button type="button" role="radio" aria-checked={mode === 'prep'} onClick={(e) => go('prep', e)}><span className="mswitch__l">Сабақтан тыс</span><span className="mswitch__s">Дайындық</span></button>
      <button type="button" role="radio" aria-checked={mode === 'class'} onClick={(e) => go('class', e)}><span className="mswitch__l">Сабақ барысы</span><span className="mswitch__s">Сабақ</span></button>
    </div>
  );
}

/** Кабинеттің жоғарғы жолағы: кім кірді, әкімші сілтемесі, шығу */
export function AccountNav() {
  const { session, profile } = useAccount();
  const nav = useNavigate();
  if (!session) return <Nav />;
  return (
    <Nav>
      <span className="nav__who">{profile?.full_name || session.user.email}</span>
      {profile?.is_admin && <Link className="nav__link" to="/admin">Әкімші</Link>}
      <button className="btn btn--sm btn--outline" type="button" onClick={async () => { await sb.auth.signOut(); nav('/app'); }}>Шығу</button>
    </Nav>
  );
}

export function Footer({ children }: { children?: ReactNode }) {
  return (
    <footer className="footer">
      <div className="container footer__in">
        <span>© 2026 Сабақтас</span>
        <nav>
          {children}
          <a href="/lab">3D зертхана</a>
          <Link to="/oferta">Оферта</Link>
          <Link to="/privacy">Құпиялылық</Link>
        </nav>
      </div>
    </footer>
  );
}
