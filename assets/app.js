(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  let language;
  try { language = localStorage.getItem('alisa.chat.lang'); } catch { /* Use the browser language. */ }
  if (language === 'ru' || language !== 'en' && /^ru(?:-|$)/i.test(navigator.language)) {
    $$('[data-ru]').forEach(node => {
      node.textContent = node.dataset.ru;
      node.lang = 'ru';
    });
  }
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const staticMode = new URLSearchParams(location.search).has('static');
  let rm = root.classList.contains('rm');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // --vh один раз (и при смене ширины или заметном изменении высоты): панели мобильных браузеров не меняют длину липких блоков.
  // Большая смена высоты (окно, ориентация: больше 18 %: панели браузера дают до ~15 %) пересчитывает первый экран и переписку.
  let lastW = 0, VH = 0;
  function setVh() {
    const h = innerHeight;
    if (innerWidth === lastW && VH && Math.abs(h - VH) / VH < .18) return false;
    lastW = innerWidth; VH = h;
    root.style.setProperty('--vh', h / 100 + 'px');
    return true;
  }
  setVh();

  const hero = $('.h'), ph = $('.ph'), nav = $('nav.top'), main = $('#main');
  const track = $('#track'), msgs = $$('#chat .m:not(.typing)'), typing = $('#typing'), chat = $('#chat');

  // логотип — наверх, адрес без якоря
  $('#logo').addEventListener('click', e => { e.preventDefault(); history.replaceState(null, '', location.pathname + location.search); scrollTo({ top: 0, behavior: rm ? 'auto' : 'smooth' }); });

  // часы (раз в секунду, чтобы минута менялась вовремя)
  const clock = $('#clock'), awake = $('#awake');
  const tick = () => {
    const d = new Date(), h = d.getHours();
    clock.textContent = String(h).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    awake.textContent = (h >= 23 || h < 5) ? 'Alisa is up late too' : 'Alisa is awake';
  };
  tick(); setInterval(tick, 1000);

  // её реплика: точки → текст
  const sayT = $('#sayT'), line = 'you went quiet yesterday.';
  let introTimer = 0, typeTimer = 0;
  if (rm) sayT.textContent = line;
  else introTimer = setTimeout(() => {
    sayT.textContent = '';
    let i = 0; sayT.classList.add('caret');
    typeTimer = setInterval(() => {
      sayT.textContent = line.slice(0, ++i);
      if (i >= line.length) {
        clearInterval(typeTimer);
        introTimer = setTimeout(() => sayT.classList.remove('caret'), 1400);
      }
    }, 55);
  }, 2400);

  // если при крупном тексте первый экран не помещается — он становится обычным блоком, без закрепления
  const fitHero = () => {
    hero.classList.remove('roomy', 'say-below');
    // реплика слева не должна налезать на заголовок: если места нет, она встаёт над заголовком, как на телефоне
    if (innerWidth > 600) {
      const pr = $('.say', hero).cloneNode(true); pr.removeAttribute('data-gaze'); pr.style.cssText = 'visibility:hidden;animation:none;opacity:0';
      pr.querySelector('.t').textContent = line; hero.appendChild(pr);
      const s = pr.getBoundingClientRect(), c0 = $('.c', hero).getBoundingClientRect(); pr.remove();
      const rng = document.createRange(); let left = Infinity;
      ['h1', 'p'].forEach(sel => { rng.selectNodeContents($(sel, hero).firstChild); left = Math.min(left, rng.getBoundingClientRect().left); });
      if (s.right + 16 > left && s.bottom > c0.top && s.top < c0.bottom) hero.classList.add('say-below');
    }
    const c = $('.c', hero).getBoundingClientRect(), k = $('.k.l', hero).getBoundingClientRect(), k2 = $('.k.r', hero).getBoundingClientRect();
    const wide = innerWidth > 600; // на телефоне две служебные строки стоят друг под другом: ширину не проверяем
    const bottom = hero.getBoundingClientRect().top + VH;
    if (c.bottom > k.top - (wide ? 6 : -1) || $('.stores', hero).getBoundingClientRect().bottom > bottom ||
        (wide && (k.right > k2.left - 8 || k2.right > innerWidth || k.width + k2.width > innerWidth - 40))) hero.classList.add('roomy');
  };
  // то же для переписки: не помещается в экран — обычный блок, все сообщения видны
  const fitChat = () => {
    track.classList.remove('flat');
    track.classList.add('done');
    typing.classList.remove('show');
    msgs.forEach(m => m.classList.add('show'));
    const stick = $('.stick', track);
    const height = $('.cols', stick).offsetHeight + parseFloat(getComputedStyle(stick).paddingTop);
    track.classList.toggle('flat', rm || height > VH * .97);
    track.classList.remove('done');
    shown = -1;
  };

  // прокрутка: фото уходит из фокуса, реплика гаснет вместе с ним, у блоков ниже мягкий верхний край
  const sayKids = [...$('.say').children, $('.say2')]; let ticking = false;
  const onScroll = () => {
    ticking = false;
    const k = clamp(scrollY / VH), roomy = hero.classList.contains('roomy');
    const op = k > 0 ? (1 - Math.max(0, k - .2) / .8 * .9) : 1;
    ph.style.filter = (!rm && k > 0) ? `blur(${(k * 16).toFixed(1)}px)` : '';
    ph.style.opacity = k > 0 ? op.toFixed(3) : '';
    sayKids.forEach(e => { e.style.opacity = k > 0 ? Math.max(0, 1 - k * 2.2).toFixed(3) : ''; });
    main.style.setProperty('--mf', clamp(scrollY / 10).toFixed(3));
    hero.style.visibility = (!roomy && scrollY > VH * 1.05) ? 'hidden' : '';
    nav.classList.toggle('solid', scrollY > (roomy ? 8 : VH * .6));
    updateChat();
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  const fit = () => { fitHero(); fitChat(); onScroll(); };
  addEventListener('resize', () => { if (setVh()) fit(); });
  motion.addEventListener('change', () => {
    rm = staticMode || motion.matches;
    root.classList.toggle('rm', rm);
    if (rm) {
      clearTimeout(introTimer);
      clearInterval(typeTimer);
      sayT.textContent = line;
      sayT.classList.remove('caret');
    }
    fit();
  });

  // появление блоков
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .1, rootMargin: '0px 0px -60px 0px' });
  $$('.rv').forEach(el => io.observe(el));

  // 1. переписка: сообщения идут за прокруткой (первые 2 видны сразу, в конце небольшая пауза)
  let shown = -1;
  function updateChat() {
    if (rm || track.classList.contains('flat')) return;
    const r = track.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, r.height - VH));
    const x = 2 + clamp(p / .82) * (msgs.length - 2 + .6), c = Math.min(msgs.length, Math.floor(x)), frac = x - c;
    const state = c * 10 + (frac < .6 && c < msgs.length && msgs[c].classList.contains('a') ? 1 : 0);
    if (state === shown) return; shown = state;
    msgs.forEach((m, i) => m.classList.toggle('show', i < c));
    typing.classList.toggle('show', state % 10 === 1);
    track.classList.toggle('done', c >= msgs.length);
    if (state % 10 === 1) chat.appendChild(typing);
  }

  // 2. карточка памяти (ничего не сохраняется: это пример)
  const saved = $('#saved'), savedT = $('#savedT'); let st;
  const flash = text => { savedT.textContent = text; saved.classList.add('on'); clearTimeout(st); st = setTimeout(() => saved.classList.remove('on'), 2200); };
  const mem = $('#mem');
  $$('input', mem).forEach(i => { i.dataset.def = i.value; });
  mem.addEventListener('input', e => flash('Edited (example)'));
  mem.addEventListener('focusout', e => { const i = e.target; if (i.matches && i.matches('input') && !i.value.trim()) { i.value = i.dataset.def; flash('Restored ' + i.getAttribute('aria-label') + ' (example)'); } });
  mem.addEventListener('click', e => {
    const b = e.target.closest('.forget'); if (!b) return;
    const li = b.closest('li'), input = li.querySelector('input'), name = input.getAttribute('aria-label'), gone = li.classList.toggle('gone');
    b.textContent = gone ? 'Undo' : 'Forget';
    b.setAttribute('aria-label', (gone ? 'Undo forgetting ' : 'Forget ') + name);
    input.disabled = gone;
    flash(gone ? 'Forgot ' + name + ' (example)' : 'Restored ' + name + ' (example)');
  });

  fit();
  if (document.fonts) document.fonts.ready.then(fit);
  if ('ResizeObserver' in window) {
    const resize = new ResizeObserver(() => { setVh(); fit(); });
    [$('.stick h2', track), $('.chat-h', track), $('.c h1', hero)].forEach(el => resize.observe(el));
  }
})();
