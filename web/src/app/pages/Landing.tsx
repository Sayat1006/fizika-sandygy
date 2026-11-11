import { Suspense, lazy, useEffect, useState } from 'react';
import LessonDemo from '../ui/LessonDemo';
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
    priceT: 'Бағасы', priceSub: 'Бір сыныпқа. Тіркелгенде 3 күн бәрі тегін.', month: 'айына', year: 'жылына', inc: ['Әр сабаққа ҚМЖ, презентация (pptx), жұмыс парағы', 'Интерактивті тақта: анимациялы слайдтар, таймер, сценарий', 'Оқушылар телефоннан жауап береді, нәтиже бірден тақтада', 'Интернет үзілсе де тақта ашылады'],
  },
  ru: {
    lab: '3D лаборатория', login: 'Войти', other: 'Қаз', eyebrow: 'Физика · 7–11 классы',
    h1: 'Урок физики — готов.', sub: 'ҚМЖ, презентации, рабочие листы и интерактивная доска. Первые 3 дня бесплатно.',
    signup: 'Начать 3 дня бесплатно', samples: 'Посмотреть образец',
    labT: '3D лаборатория.', labP: 'Ученик ставит опыт, измеряет и получает отчёт.', labGo: 'Открыть лабораторию',
    wa: 'WhatsApp', tg: 'Telegram',
    priceT: 'Цена', priceSub: 'За один класс. После регистрации 3 дня всё бесплатно.', month: 'в месяц', year: 'в год', inc: ['К каждому уроку ҚМЖ, презентация (pptx), рабочий лист', 'Интерактивная доска: анимированные слайды, таймер, сценарий', 'Ученики отвечают с телефона, результат сразу на доске', 'Доска открывается даже без интернета'],
  },
};

/** 3D көрініс (three.js, ~740 КБ) бет жүктеліп болған соң ғана, баяу интернетте/үнемдеу режимінде мүлде жүктелмейді */
function useIdle() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (c?.saveData || /2g/.test(c?.effectiveType || '')) return;
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(() => setOk(true), { timeout: 2500 }) : window.setTimeout(() => setOk(true), 1200);
    return () => { if (!w.requestIdleCallback) clearTimeout(id); };
  }, []);
  return ok;
}

export default function Landing() {
  const idle = useIdle();
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
            {idle && <Suspense fallback={null}><Morph className="hero__canvas" /></Suspense>}
          </div>
        </section>

        <LessonDemo lang={lang} />

        <section className="price" aria-label={t.priceT}>
          <h2 className="t-title">{t.priceT}</h2>
          <p className="t-sub">{t.priceSub}</p>
          <div className="price__cards">
            <div className="price__card"><b className="tabular">{CONFIG.prices.month.toLocaleString('ru-RU')} ₸</b><span>{t.month}</span></div>
            <div className="price__card price__card--y"><b className="tabular">{CONFIG.prices.year.toLocaleString('ru-RU')} ₸</b><span>{t.year}</span></div>
          </div>
          <ul className="price__inc">{t.inc.map((x) => <li key={x}>{x}</li>)}</ul>
          <Link className="btn btn--lg btn--primary" to="/app?signup">{t.signup}</Link>
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
