import { useApp, type Lang } from './store';

/** Интерфейстің негізгі элементтерінің аудармасы. Тәжірибе мазмұны — қазақ тілінде. */
const DICT: Record<string, Record<Lang, string>> = {
  'nav.home': { kk: 'Басты бет', ru: 'Главная', en: 'Home' },
  'nav.labs': { kk: 'Зертханалар', ru: 'Лаборатории', en: 'Laboratories' },
  'nav.topics': { kk: 'Пән тақырыптары', ru: 'Темы предмета', en: 'Curriculum' },
  'nav.my': { kk: 'Менің тәжірибелерім', ru: 'Мои опыты', en: 'My experiments' },
  'nav.results': { kk: 'Нәтижелерім', ru: 'Мои результаты', en: 'Results' },
  'nav.teacher': { kk: 'Мұғалім кабинеті', ru: 'Кабинет учителя', en: 'Teacher' },
  'nav.guide': { kk: 'Нұсқаулық', ru: 'Руководство', en: 'Guide' },
  'tagline': { kk: 'Физиканы оқыма. Тәжірибе арқылы түсін!', ru: 'Не учи физику. Пойми её через опыт!', en: 'Don’t memorise physics. Understand it by experiment!' },
  'hero.title': { kk: 'Физика әлемін тәжірибе арқылы зертте.', ru: 'Исследуй мир физики через эксперимент.', en: 'Explore the world of physics through experiment.' },
  'hero.text': {
    kk: '7–11 сыныптарға арналған интерактивті виртуалды зертхана. Эксперимент жүргіз, өлше, есепте және физикалық заңдылықтарды өз көзіңмен бақыла.',
    ru: 'Интерактивная виртуальная лаборатория для 7–11 классов. Проводи эксперименты, измеряй, вычисляй и наблюдай физические законы своими глазами.',
    en: 'An interactive virtual laboratory for grades 7–11. Run experiments, measure, calculate and observe the laws of physics with your own eyes.',
  },
  'cta.start': { kk: 'Зертхананы бастау', ru: 'Начать лабораторию', en: 'Start the lab' },
  'cta.features': { kk: 'Мүмкіндіктерді көру', ru: 'Смотреть возможности', en: 'See features' },
  'theme.dark': { kk: 'Қараңғы режим', ru: 'Тёмная тема', en: 'Dark mode' },
  'theme.light': { kk: 'Жарық режим', ru: 'Светлая тема', en: 'Light mode' },
};

export function useT() {
  const lang = useApp((s) => s.lang);
  return (key: string) => DICT[key]?.[lang] ?? DICT[key]?.kk ?? key;
}
