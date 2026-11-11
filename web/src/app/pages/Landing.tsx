import { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Footer, Nav } from '../ui/Layout';
import { CONFIG } from '../lib/config';
import LessonDemo from '../ui/LessonDemo';
import HeroBoard from '../ui/HeroBoard';
import { IcBoard, IcKmzh, IcSend } from '../ui/icons';

const Morph = lazy(() => import('../ui/Morph'));

/* Басты бет: мұғалімге бірнеше секундта түсінікті болуы керек — не береді, қанша тұрады, қалай бастау керек.
   Сандар нақты (materials/, public/lessons.json бойынша), ойдан шығарылған пікір жоқ. */
const fmt = (n: number) => n.toLocaleString('ru-RU');
const M = CONFIG.prices.month, Y = CONFIG.prices.year, SAVE = M * 12 - Y;

const T = {
  kk: {
    lab: '3D зертхана', login: 'Кіру', other: 'Рус',
    eyebrow: 'Физика · 7–11-сынып · ЖМБ және ҚГБ',
    h1: ['Физика сабағы —', 'дайын.'], sub: 'ҚМЖ, презентация, жұмыс парағы және интерактивті тақта бүкіл оқу жылына. Сабаққа дайындық — бірнеше минут.',
    signup: '3 күн тегін бастау', samples: 'Үлгіні тіркелусіз көру',
    trust: ['Тіркелу — 1 минут', 'Карта керек емес', 'ҚТЖ бойынша, күндері сәйкес'],
    stats: [['646', 'сабақтың ҚМЖ-сы'], ['615', 'анимациялы презентация'], ['16', 'интерактивті физикалық модель'], ['6 900+', 'сұрақ пен тест']],
    whyT: 'Бір сайт — сабақтың үш кезеңі',
    why: [
      { k: 'Сабақтан тыс', t: 'Сабаққа дайындық', d: 'Тақырыпты ашасыз: ҚМЖ (Word), презентация (pptx) және жұмыс парағы дайын. ҚМЖ-ға аты-жөніңіз бен сабақ күні өзі жазылады.' },
      { k: 'Сабақ барысы', t: 'Сыныпта — интерактивті тақта', d: 'Бір басумен: анимациялы слайдтар, физикалық модельдер, қалам, таймер, сабақ сценарийі. Интернет үзілсе де ашылады.' },
      { k: 'Телефоннан жауап', t: 'Әр оқушының кері байланысы', d: 'Оқушылар телефоннан тіркелусіз кодпен қосылады. Сұрақ жібересіз — нәтиже бірден тақтада: диаграмма және үздіктер.' },
    ],
    beforeT: 'Бұрын және енді',
    before: [['ҚМЖ-ны кеш бойы жазу', 'Дайын ҚМЖ — тек қарап шығасыз'], ['Слайдты интернеттен іздеу', 'Әр сабаққа анимациялы презентация'], ['«Түсіндіңдер ме?» — болжаммен', 'Әр оқушының жауабы тақтада']],
    priceT: 'Бағасы', priceSub: 'Бір сыныпқа. Тіркелгенде 3 күн барлық сынып тегін.', month: 'айына', year: 'жылына', save: `${fmt(SAVE)} ₸ үнем`,
    inc: ['Әр сабаққа ҚМЖ, презентация (pptx), жұмыс парағы', 'Интерактивті тақта: анимациялы слайдтар, модельдер, таймер', 'Оқушылар телефоннан жауап береді, нәтиже бірден тақтада', 'Интернет үзілсе де тақта ашылады'],
    faqT: 'Жиі қойылатын сұрақтар',
    faq: [
      ['ҚМЖ-ны өзгертуге бола ма?', 'Иә. ҚМЖ Word (docx) форматында жүктеледі, кез келген жерін өзгерте аласыз. Аты-жөніңіз бен ҚТЖ бойынша сабақ күні өзі жазылады.'],
      ['Қай бағдарлама бойынша жасалған?', 'Қолданыстағы оқу бағдарламасы мен ҚТЖ бойынша: 7–9-сынып, 10–11-сынып ЖМБ және ҚГБ (сағат саны бойынша нұсқалар).'],
      ['Интерактивті тақта болмаса ше?', 'Компьютер мен проектор жеткілікті. Презентацияны pptx етіп жүктеп, PowerPoint-те де көрсетуге болады.'],
      ['Оқушылар тіркелуі керек пе?', 'Жоқ. Оқушы телефонмен QR-кодты сканерлейді немесе кодты жазады — сол жеткілікті.'],
      ['Төлем қалай жасалады?', `Kaspi арқылы, әр сыныпқа бөлек: айына ${fmt(M)} ₸ немесе жылына ${fmt(Y)} ₸. Төлем расталған соң жазылым бірден ашылады.`],
    ],
    endT: 'Ертеңгі сабаққа бүгін дайын болыңыз.', endP: 'Тіркеліңіз — 3 күн бойы барлық сыныптың материалдары мен тақта тегін.',
    labT: '3D зертхана.', labP: 'Оқушы тәжірибе жасайды, өлшейді, есеп алады.', labGo: 'Зертхананы ашу',
    q: 'Сұрағыңыз бар ма? WhatsApp', wa: 'WhatsApp', tg: 'Telegram', statsL: 'Сабақтастағы материалдар',
  },
  ru: {
    lab: '3D лаборатория', login: 'Войти', other: 'Қаз',
    eyebrow: 'Физика · 7–11 классы · ЕМН и ОГН',
    h1: ['Урок физики —', 'готов.'], sub: 'ҚМЖ, презентации, рабочие листы и интерактивная доска на весь учебный год. Подготовка к уроку — несколько минут.',
    signup: 'Начать 3 дня бесплатно', samples: 'Образец без регистрации',
    trust: ['Регистрация — 1 минута', 'Без банковской карты', 'По КТП, даты совпадают'],
    stats: [['646', 'уроков с ҚМЖ'], ['615', 'анимированных презентаций'], ['16', 'интерактивных физических моделей'], ['6 900+', 'вопросов и тестов']],
    whyT: 'Один сайт — три этапа урока',
    why: [
      { k: 'Вне урока', t: 'Подготовка к уроку', d: 'Открываете тему: ҚМЖ (Word), презентация (pptx) и рабочий лист готовы. В ҚМЖ автоматически вписываются ваше ФИО и дата урока.' },
      { k: 'На уроке', t: 'В классе — интерактивная доска', d: 'В один клик: анимированные слайды, физические модели, перо, таймер, сценарий урока. Открывается даже без интернета.' },
      { k: 'Ответы с телефона', t: 'Обратная связь от каждого', d: 'Ученики подключаются с телефона по коду без регистрации. Вы отправляете вопрос — результат сразу на доске: диаграмма и лучшие.' },
    ],
    beforeT: 'Было и стало',
    before: [['Писать ҚМЖ весь вечер', 'Готовый ҚМЖ — только просмотреть'], ['Искать слайды в интернете', 'Анимированная презентация к каждому уроку'], ['«Все поняли?» — наугад', 'Ответ каждого ученика на доске']],
    priceT: 'Цена', priceSub: 'За один класс. После регистрации 3 дня все классы бесплатно.', month: 'в месяц', year: 'в год', save: `экономия ${fmt(SAVE)} ₸`,
    inc: ['К каждому уроку ҚМЖ, презентация (pptx), рабочий лист', 'Интерактивная доска: анимированные слайды, модели, таймер', 'Ученики отвечают с телефона, результат сразу на доске', 'Доска открывается даже без интернета'],
    faqT: 'Частые вопросы',
    faq: [
      ['Можно ли редактировать ҚМЖ?', 'Да. ҚМЖ скачивается в формате Word (docx), его можно менять как угодно. ФИО и дата урока по КТП вписываются автоматически.'],
      ['По какой программе?', 'По действующей учебной программе и КТП: 7–9 классы, 10–11 классы ЕМН и ОГН (варианты по количеству часов).'],
      ['А если нет интерактивной доски?', 'Достаточно компьютера и проектора. Презентацию можно скачать в pptx и показывать в PowerPoint.'],
      ['Нужна ли регистрация ученикам?', 'Нет. Ученик сканирует QR-код телефоном или вводит код — этого достаточно.'],
      ['Как оплатить?', `Через Kaspi, отдельно за каждый класс: ${fmt(M)} ₸ в месяц или ${fmt(Y)} ₸ в год. Подписка открывается сразу после подтверждения оплаты.`],
    ],
    endT: 'Будьте готовы к завтрашнему уроку уже сегодня.', endP: 'Зарегистрируйтесь — 3 дня материалы всех классов и доска бесплатно.',
    labT: '3D лаборатория.', labP: 'Ученик ставит опыт, измеряет и получает отчёт.', labGo: 'Открыть лабораторию',
    q: 'Есть вопрос? WhatsApp', wa: 'WhatsApp', tg: 'Telegram', statsL: 'Материалы в Сабақтас',
  },
};

/** 3D көрініс (three.js, ~740 КБ) бет жүктеліп болған соң ғана; баяу интернетте/үнемдеу режимінде мүлде жүктелмейді */
function useIdle() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (c?.saveData || /2g/.test(c?.effectiveType || '')) return;
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(() => setOk(true), { timeout: 3000 }) : window.setTimeout(() => setOk(true), 1500);
    return () => { if (!w.requestIdleCallback) clearTimeout(id); };
  }, []);
  return ok;
}

const ICONS = [IcKmzh, IcBoard, IcSend];

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

      <main>
        <section className="lp-hero container">
          <div className="lp-hero__text">
            <p className="lp-eyebrow rise">{t.eyebrow}</p>
            <h1 className="t-display rise rise-1">{t.h1[0]}<br />{t.h1[1]}</h1>
            <p className="t-sub lp-hero__sub rise rise-2">{t.sub}</p>
            <div className="lp-hero__cta rise rise-3">
              <Link className="btn btn--lg btn--primary" to="/app?signup">{t.signup}</Link>
              <Link className="link link--more" to="/samples">{t.samples}</Link>
            </div>
            <ul className="lp-trust rise rise-4">{t.trust.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="lp-hero__vis rise rise-3"><HeroBoard lang={lang} /></div>
        </section>

        <section className="lp-stats container" aria-label={t.statsL}>
          {t.stats.map(([n, l]) => <div key={l}><b className="tabular">{n}</b><span>{l}</span></div>)}
        </section>

        <section className="lp-why container">
          <h2 className="t-title">{t.whyT}</h2>
          <div className="lp-why__grid">
            {t.why.map((x, k) => {
              const Ic = ICONS[k];
              return (
                <article key={x.t} className="lp-card">
                  <span className="lp-card__ic"><Ic /></span>
                  <small>{x.k}</small>
                  <h3>{x.t}</h3>
                  <p>{x.d}</p>
                </article>
              );
            })}
          </div>
        </section>

        <div className="container"><LessonDemo lang={lang} /></div>

        <section className="lp-before container">
          <h2 className="t-title">{t.beforeT}</h2>
          <div className="lp-before__rows">
            {t.before.map(([a, b]) => <div key={a} className="lp-before__row"><s>{a}</s><i aria-hidden>→</i><b>{b}</b></div>)}
          </div>
        </section>

        <section className="lp-price container" aria-label={t.priceT}>
          <h2 className="t-title">{t.priceT}</h2>
          <p className="t-sub">{t.priceSub}</p>
          <div className="lp-price__cards">
            <div className="lp-price__card"><b className="tabular">{fmt(M)} ₸</b><span>{t.month}</span></div>
            <div className="lp-price__card lp-price__card--y"><em>{t.save}</em><b className="tabular">{fmt(Y)} ₸</b><span>{t.year}</span></div>
          </div>
          <ul className="lp-check">{t.inc.map((x) => <li key={x}>{x}</li>)}</ul>
          <Link className="btn btn--lg btn--primary" to="/app?signup">{t.signup}</Link>
        </section>

        <section className="lp-faq container">
          <h2 className="t-title">{t.faqT}</h2>
          <div className="lp-faq__list">
            {t.faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </section>

        <section className="container">
          <a className="labband" href="/lab">
            <div className="labband__vis" aria-hidden>{idle && <Suspense fallback={null}><Morph className="hero__canvas" /></Suspense>}</div>
            <h2 className="t-title">{t.labT}</h2>
            <p className="t-sub">{t.labP}</p>
            <span className="link link--more">{t.labGo}</span>
          </a>
        </section>

        <section className="lp-end container">
          <h2 className="t-title">{t.endT}</h2>
          <p className="t-sub">{t.endP}</p>
          <div className="lp-hero__cta">
            <Link className="btn btn--lg btn--primary" to="/app?signup">{t.signup}</Link>
            <a className="link link--more" href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noopener">{t.q}</a>
          </div>
        </section>
      </main>

      <Footer>
        <a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noopener">{t.wa}</a>
        <a href={`https://t.me/${CONFIG.telegram}`} target="_blank" rel="noopener">{t.tg}</a>
      </Footer>
    </div>
  );
}
