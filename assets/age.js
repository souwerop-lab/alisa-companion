(function () {
  const form = document.getElementById('agef'), msg = document.getElementById('msg'), box = document.getElementById('agebox');
  const month = document.getElementById('bm'), year = document.getElementById('by');
  let expiryTimer = 0;

  function syncBlock() {
    clearTimeout(expiryTimer);
    year.max = new Date().getFullYear();
    let remaining = 0;
    try { remaining = +localStorage.getItem('alisa-block') - Date.now(); } catch (err) {}
    const blocked = remaining > 0;
    if (blocked) {
      msg.textContent = 'Alisa is for adults only.';
      expiryTimer = setTimeout(syncBlock, remaining);
    } else if (box.hidden) {
      msg.textContent = '';
    }
    form.hidden = box.hidden = blocked;
    return blocked;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (syncBlock()) return;

    const m = +month.value, y = +year.value, d = new Date();
    const cy = d.getFullYear(), cm = d.getMonth() + 1;
    const validMonth = Number.isInteger(m) && m >= 1 && m <= 12;
    const validYear = Number.isInteger(y) && y >= 1900 && y <= cy;
    const futureMonth = y === cy && m > cm;
    month.setAttribute('aria-invalid', String(!validMonth || futureMonth));
    year.setAttribute('aria-invalid', String(!validYear));
    if (!validMonth || !validYear || futureMonth) {
      msg.textContent = futureMonth ? 'Choose a birth month that has already started.' : 'Enter a valid birth month and a whole year.';
      (!validMonth || futureMonth ? month : year).focus();
      return;
    }

    // Без точного дня пропускаем, только если 18 полных лет гарантированы.
    const adult = y < cy - 18 || (y === cy - 18 && m < cm);
    try {
      if (adult) {
        localStorage.setItem('alisa-18', String(Date.now()));
        const current = new URLSearchParams(location.search);
        const next = new URLSearchParams();
        for (const key of ['mock', 'debug']) if (current.get(key) === '1') next.set(key, '1');
        if (!syncBlock()) location.assign(next.size ? 'chat.html?' + next : 'chat.html');
      } else {
        localStorage.setItem('alisa-block', String(Date.now() + 864e5));
        localStorage.removeItem('alisa-18');
        syncBlock();
      }
    } catch (err) { msg.textContent = 'Your browser blocks storage, so we cannot continue.'; }
  });

  addEventListener('storage', e => { if (e.key === 'alisa-block' || e.key === null) syncBlock(); });
  addEventListener('focus', syncBlock);
  addEventListener('pageshow', syncBlock);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncBlock(); });
  syncBlock();
})();
