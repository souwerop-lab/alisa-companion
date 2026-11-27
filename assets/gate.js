// Возрастной экран сайта.
(function () {
  function allowed() {
    try {
      const blockUntil = +localStorage.getItem('alisa-block');
      const confirmed = localStorage.getItem('alisa-18');
      // Учитываем подтверждения из старой версии и срок последнего отказа.
      return blockUntil <= Date.now() && (confirmed === '1' ? !blockUntil : +confirmed > 1 && +confirmed >= blockUntil);
    } catch (err) {
      return false;
    }
  }
  window.alisaAgeAllowed = allowed;
  function check() {
    const current = new URLSearchParams(location.search);
    const next = new URLSearchParams();
    for (const key of ['mock', 'debug']) if (current.get(key) === '1') next.set(key, '1');
    if (!allowed()) location.replace(next.size ? 'age.html?' + next : 'age.html');
  }
  addEventListener('storage', e => { if (e.key === 'alisa-block' || e.key === 'alisa-18' || e.key === null) check(); });
  addEventListener('focus', check);
  addEventListener('pageshow', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  check();
})();
