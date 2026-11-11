import { Suspense, lazy, useState } from 'react';
import { Link } from 'react-router-dom';
import { Footer, Nav } from '../ui/Layout';
import { CONFIG } from '../lib/config';

const Morph = lazy(() => import('../ui/Morph'));

const T = {
  kk: {
    lab: '3D зертхана', login: 'Кіру', other: 'Рус', eyebrow: 'Физика · 7–11-сынып',
    h1: 'Физика сабағы — дайын.', sub: 'ҚМЖ, презентация, жұмыс парағы және интерактивті тақта. Алғашқы 3 күн тегін.',
    signup: '3 күн тегін бастау', samples: 'Үлгіні көру',
    labT: '3D зертхана.', labP: 'Оқушы тәжірибе жасайды, өлшейді, есеп алады.', labGo: 'Зертхананы ашу',
    wa: 'WhatsApp', tg: 'Telegram',
  },
  ru: {
    lab: '3D лаборатория', login: 'Войти', other: 'Қаз', eyebrow: 'Физика · 7–11 классы',
    h1: 'Урок физики — готов.', sub: 'ҚМЖ, презентации, рабочие листы и интерактивная доска. Первые 3 дня бесплатно.',
    signup: 'Начать 3 дня бесплатно', samples: 'Посмотреть образец',
    labT: '3D лаборатория.', labP: 'Ученик ставит опыт, измеряет и получает отчёт.', labGo: 'Открыть лабораторию',
    wa: 'WhatsApp', tg: 'Telegram',
  },
};

export default function Landing() {
  const [lang, setLang] = useState<'kk' | 'ru'>(() => { try { return localStorage.getItem('fs-lang') === 'ru' ? 'ru' : 'kk'; } catch { return 'kk'; } });
  const t = T[lang];
  const flip = () => { const l = lang === 'kk' ? 'ru' : 'kk'; setLang(l); document.documentElement.lang = l; try { localStorage.setItem('fs-lang', l); } catch { /* жеке режим */ } };
  return (
    <div className="shell landing" lang={lang}>
      <Nav plain>
        <a className="nav__link nav__hide-sm" href="/lab">{t.lab}</a>
        <button className="nav__link" type="button" onClick={flip} aria-label={lang === 'kk' ? 'Русский язык' : 'Қазақ тілі'}>{t.other}</button>
        <Link className="btn btn--sm btn--primary" to="/app">{t.login}</Link>
      </Nav>

      <main className="container">
        <section className="hero">
          <p className="hero__eyebrow rise">{t.eyebrow}</p>
          <h1 className="t-display rise rise-1">{t.h1}</h1>
          <p className="t-sub hero__sub rise rise-2">{t.sub}</p>
          <div className="hero__cta rise rise-3">
            <Link className="btn btn--lg btn--primary" to="/app?signup">{t.signup}</Link>
            <Link className="link link--more" to="/samples">{t.samples}</Link>
          </div>
          <div className="hero__stage rise rise-4">
            <Suspense fallback={null}><Morph className="hero__canvas" /></Suspense>
          </div>
        </section>

        <a className="labband" href="/lab">
          <h2 className="t-title">{t.labT}</h2>
          <p className="t-sub">{t.labP}</p>
          <span className="link link--more">{t.labGo}</span>
        </a>
      </main>

      <Footer>
        <a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noopener">{t.wa}</a>
        <a href={`https://t.me/${CONFIG.telegram}`} target="_blank" rel="noopener">{t.tg}</a>
      </Footer>
    </div>
  );
}
