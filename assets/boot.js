document.documentElement.classList.add('js');
if (matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('static')) document.documentElement.classList.add('rm');
