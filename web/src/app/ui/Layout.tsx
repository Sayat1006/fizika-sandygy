import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from '../lib/account';
import { sb } from '../lib/data';
import { CONFIG } from '../lib/config';
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
  const { session, ready } = useAccount();
  const nav = useNavigate();
  const { pathname } = useLocation();
  // кірмеген келушіге сайт әрқашан әдеттегі (ақ) түрде
  useEffect(() => { if (ready) document.documentElement.dataset.mode = session ? mode : 'prep'; }, [session, ready, mode]);
  const go = (m: Mode, e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMode(m, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, () => { if (m === 'class' && pathname !== '/app') nav('/app'); });
  };
  if (!session) return null; // жаңа келушіге түсініксіз — тек кірген мұғалімге
  return (
    <div className={`mswitch mswitch--${mode}`} role="radiogroup" aria-label="Сайт режимі">
      <i className="mswitch__thumb" aria-hidden />
      <button type="button" role="radio" aria-checked={mode === 'prep'} onClick={(e) => go('prep', e)}><span className="mswitch__l">Сабақтан тыс</span><span className="mswitch__s">Дайындық</span></button>
      <button type="button" role="radio" aria-checked={mode === 'class'} onClick={(e) => go('class', e)}><span className="mswitch__l">Сабақ барысы</span><span className="mswitch__s">Сабақ</span></button>
    </div>
  );
}

/** Кабинеттің парақшаларын кез келген беттен ашу (Cabinet.tsx тыңдайды) */
export type SheetId = 'subscribe' | 'classes' | 'tg' | 'profile';
export function openSheet(id: SheetId) {
  try { sessionStorage.setItem('fs-sheet', id); } catch { /* */ }
  window.dispatchEvent(new Event('fs-sheet'));
}

/** Кабинеттің жоғарғы жолағы: режим ауыстырғышы және профиль мәзірі (жазылым, сыныптар, Telegram, профиль, шығу) */
export function AccountNav() {
  const { session, profile } = useAccount();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const f = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', f); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('pointerdown', f); document.removeEventListener('keydown', k); };
  }, [open]);
  if (!session) return <Nav />;
  const name = profile?.full_name || session.user.email || '';
  const go = (id: SheetId) => { setOpen(false); openSheet(id); if (pathname !== '/app') nav('/app'); };
  return (
    <Nav>
      <div className="umenu" ref={box}>
        <button type="button" className="umenu__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="umenu__av" aria-hidden>{(name.split(' ')[1] || name)[0]?.toUpperCase()}</span><span className="umenu__name">{name}</span><i className="umenu__chev" aria-hidden />
        </button>
        {open && (
          <div className="umenu__list" role="menu">
            <button role="menuitem" type="button" onClick={() => go('subscribe')}>Жазылым</button>
            <button role="menuitem" type="button" onClick={() => go('classes')}>Менің сыныптарым</button>
            {CONFIG.telegramBot && <button role="menuitem" type="button" onClick={() => go('tg')}>Telegram</button>}
            <button role="menuitem" type="button" onClick={() => go('profile')}>Профиль</button>
            {profile?.is_admin && <Link role="menuitem" to="/admin" onClick={() => setOpen(false)}>Әкімші</Link>}
            <hr />
            <button role="menuitem" type="button" className="umenu__out" onClick={async () => { setOpen(false); await sb.auth.signOut(); nav('/app'); }}>Шығу</button>
          </div>
        )}
      </div>
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
