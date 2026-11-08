/* ===== Сайттың баптаулары: байланыс деректерін осы жерде өзгертіңіз ===== */
window.FS_CONFIG = {
  supabaseUrl: 'https://rumnyvcgpswdxjheaeif.supabase.co',
  supabaseKey: 'sb_publishable_l7Xeu0foTUzNVh_-w258nw_42HAgAaw',
  kaspi: '+7 7__ ___ __ __',          // Kaspi Gold номері
  whatsapp: '77000000000',            // WhatsApp: тек цифрлар
  whatsappShow: '+7 7__ ___ __ __',
  telegram: 'username',               // Telegram логині, @ белгісіз
  prices: { month: 1490, year: 9990 }, // бір сынып үшін, ₸ (дерекқордағы plan_price функциясымен бірдей болуы керек)
  googleLogin: false,                 // Supabase-те Google провайдері қосылған соң true етіңіз
  telegramBot: 'impulse_edu_bot',                  // хабарлама боты, мысалы 'fizika_sandygy_bot' (@ белгісіз)
  siteUrl: 'https://sabaqtas-kz.vercel.app'
};

/* Сабақтың ашылу ережесі: ҚТЖ бойынша осы аптаның сабақтары (дүйсенбі–жексенбі).
   Сенбі мен жексенбіде келесі аптаның сабақтары да ашылады (алдын ала дайындалу үшін).
   Бұл функция api/download.js ішіндегі ережемен бірдей. */
window.FS_WEEK = function (now) {
  const t = new Date((now || Date.now()) + 5 * 3600 * 1000); // Қазақстан уақыты, UTC+5
  const today = t.toISOString().slice(0, 10);
  const dow = (t.getUTCDay() + 6) % 7; // 0 = дүйсенбі
  const mon = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - dow));
  const end = new Date(mon.getTime() + (dow >= 5 ? 13 : 6) * 86400000);
  return { today, from: mon.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
};
