/* Сабақтас — ортақ қозғалыс қабаты (тәуелділіксіз).
 *  • [data-reveal] элементтері көрінген сәтте жұмсақ көтеріліп шығады; data-reveal="2" — кезек нөмірі.
 *  • [data-swap] мәтіні FSMotion.swap(el, text) арқылы бұлдырап ауысады.
 *  • FSMotion.setTheme('dark' | 'light' | null) — жарық/қараңғы режимді сақтап, барлық бетке қолданады.
 * JS өшірулі немесе қозғалысты азайту қосулы болса — мазмұн бірден көрінеді.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Қолданушы таңдаған жарық/қараңғы режим (басты беттегі ауыстырғыш) барлық бетке қолданылады
  try { var th = localStorage.getItem('fs-theme'); if (th === 'dark' || th === 'light') root.setAttribute('data-theme', th); } catch (_) {}
  function setTheme(t) {
    if (t === 'dark' || t === 'light') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    try { if (t) localStorage.setItem('fs-theme', t); else localStorage.removeItem('fs-theme'); } catch (_) {}
  }
  function isDark() {
    var a = root.getAttribute('data-theme');
    return a ? a === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function reveal() {
    var els = document.querySelectorAll('[data-reveal]:not(.is-in)');
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, order = parseFloat(el.getAttribute('data-reveal')) || 0;
        el.style.transitionDelay = Math.min(order * 70, 420) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /** Мәтінді бұлдырату арқылы ауыстыру (морф әсері). */
  function swap(el, text) {
    if (!el || el.textContent === text) return;
    if (reduce) { el.textContent = text; return; }
    el.classList.add('is-out');
    setTimeout(function () { el.textContent = text; el.classList.remove('is-out'); }, 260);
  }

  root.classList.add('js-motion');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal);
  else reveal();
  window.FSMotion = { reveal: reveal, swap: swap, reduce: reduce, setTheme: setTheme, isDark: isDark };
})();
