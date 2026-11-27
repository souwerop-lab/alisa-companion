// Кадр 0 общий для всех поворотов. Режим целей и покоя доступен через ?gaze=targets.
(() => {
  const canvas = document.getElementById('gaze');
  const query = new URLSearchParams(location.search);
  if (!canvas || query.has('static')) return;
  const N = 71, STEP = 1000 / 30;
  const POS = [0.58, 0.18], EYE = [1518 / 2816, 612 / 1584];
  const media = matchMedia('(min-width: 900px) and (pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)');
  const start = query.get('gaze') === 'targets' ? startTargets : startHorizontal;
  let engine;
  const syncMode = () => {
    if (media.matches && !engine) engine = start();
    else if (!media.matches && engine) {
      engine();
      engine = null;
    }
  };
  media.addEventListener('change', syncMode);
  syncMode();

  // Общая геометрия cover для WebP, видео и точки между глазами.
  function cover(w, h, iw, ih) {
    const scale = Math.max(w / iw, h / ih), width = iw * scale, height = ih * scale;
    return [(w - width) * POS[0], (h - height) * POS[1], width, height];
  }

  // Растровая сетка canvas не больше выбранного размера материала.
  function resizeCanvas(bounds, rasterWidth) {
    const ratio = Math.min(devicePixelRatio || 1, 2,
      rasterWidth / bounds.width, rasterWidth * 9 / 16 / bounds.height);
    const w = Math.round(bounds.width * ratio), h = Math.round(bounds.height * ratio);
    if (canvas.width === w && canvas.height === h) return false;
    canvas.width = w;
    canvas.height = h;
    return true;
  }

  async function loadFrame(url, signal) {
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error(`Gaze frame HTTP ${response.status}: ${url}`);
        const blob = await response.blob();
        if (signal.aborted) throw signal.reason;
        if (typeof createImageBitmap === 'function') {
          let bitmap;
          try {
            bitmap = await createImageBitmap(blob);
          } catch {
            if (signal.aborted) throw signal.reason;
            // Браузер может отказать в выделении памяти под ImageBitmap.
          }
          if (bitmap) {
            if (!signal.aborted) return bitmap;
            bitmap.close();
            throw signal.reason;
          }
        }
        const objectURL = URL.createObjectURL(blob);
        try {
          const image = new Image();
          image.src = objectURL;
          await image.decode();
          if (signal.aborted) throw signal.reason;
          return image;
        } finally {
          URL.revokeObjectURL(objectURL);
        }
      } catch (error) {
        if (signal.aborted || attempt) throw error;
      }
    }
  }

  // Сдвиги в пикселях изображения 1280 px, по кадрам 01–71.
  // Калиброваны по положению головы отдельно для двух наборов WebP.
  function horizontalOffsets(wide) {
    return wide ? {
      left: [
        -0.572, -0.606, -0.711, -0.748, -0.774, -0.864, -0.957, -1.007, -1.065, -1.146,
        -1.187, -1.241, -1.293, -1.319, -1.346, -1.282, -1.376, -1.292, -1.3, -1.284,
        -1.286, -1.143, -1.079, -0.979, -0.906, -0.678, -0.494, -0.205, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0.096, 0.45, 0.485, 0.518,
        0.519, 0.463, 0.434, 0.406, 0.352, 0.389, 0.317, 0.269, 0.242, 0.212,
        0.263, 0.151, 0.172, 0.125, 0.17, 0.093, 0.1, 0.067, 0.053, 0.063,
        0,
      ],
      right: [
        0.673, 0.909, 1.152, 1.433, 1.699, 1.927, 2.237, 2.453, 2.685, 3.035,
        3.223, 3.613, 3.838, 4.058, 4.226, 4.519, 4.702, 4.846, 4.942, 5.103,
        5.07, 5.209, 5.282, 5.3, 5.319, 5.225, 5.121, 4.864, 4.592, 4.489,
        4.237, 4.105, 3.868, 3.537, 3.172, 2.802, 2.516, 2.278, 2.152, 1.971,
        1.866, 1.794, 1.722, 1.525, 1.342, 1.136, 0.896, 0.678, 0.281, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, -0.014,
        0.015, 0, -0.008, -0.012, 0.021, 0, 0, 0, 0, 0,
        0,
      ]
    } : {
      left: [
        -0.622, -0.624, -0.67, -0.754, -0.808, -0.892, -0.945, -0.982, -1.081, -1.116,
        -1.181, -1.264, -1.312, -1.323, -1.371, -1.328, -1.332, -1.35, -1.314, -1.309,
        -1.306, -1.137, -1.05, -1.023, -0.856, -0.694, -0.445, -0.207, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0.205, 0.474, 0.509, 0.557,
        0.54, 0.481, 0.43, 0.432, 0.467, 0.369, 0.307, 0.292, 0.27, 0.227,
        0.18, 0.228, 0.147, 0.153, 0.148, 0.119, 0.127, 0.177, 0.1, 0.078,
        0,
      ],
      right: [
        0.781, 1.044, 1.237, 1.413, 1.718, 2, 2.161, 2.533, 2.707, 3.059,
        3.185, 3.615, 3.873, 4.081, 4.278, 4.501, 4.61, 4.821, 4.913, 5.048,
        5.099, 5.184, 5.218, 5.312, 5.323, 5.19, 5.105, 4.921, 4.636, 4.548,
        4.251, 4.153, 3.89, 3.568, 3.249, 2.912, 2.582, 2.294, 2.134, 2.095,
        1.942, 1.778, 1.699, 1.558, 1.353, 1.162, 0.918, 0.686, 0.324, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, -0.013, 0.014, 0, 0, 0, 0, 0, 0,
        0,
      ]
    };
  }

  function startHorizontal() {
    const hero = canvas.closest('.h'), portrait = canvas.parentElement.querySelector('img');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const lifetime = new AbortController(), { signal } = lifetime;
    const on = (node, event, callback, options) => node.addEventListener(event, callback, { ...options, signal });
    const wide = innerWidth > 1600, rasterWidth = wide ? 1920 : 1280, suffix = wide ? '' : '-1280';
    const offsets = horizontalOffsets(wide);
    const frames = new Array(2 * N + 1);
    const readyBySide = { left: 0, right: 0 };
    const failed = new Set();
    const debug = query.has('debug') ? { skippedFrames: 0, maxFrameIntervalMs: 0 } : null;
    const sideOf = n => n < 0 ? 'left' : n > 0 ? 'right' : 'base';
    const frameName = n => n ? `${sideOf(n)}-${String(Math.abs(n)).padStart(2, '0')}` : 'base';
    let frame = 0, targetFrame = 0, playableTarget = 0, pointerX = null, centerX, rightEdge;
    let visible = false, decoded = 0, loadError;
    let raf = 0, layoutRaf = 0, lastStep = -Infinity, lastPointerAt = -Infinity, lastMotionPaint;

    function paint() {
      const image = frames[N + frame];
      const iw = image.naturalWidth || image.width, ih = image.naturalHeight || image.height;
      const [x, y, w, h] = cover(canvas.width, canvas.height, iw, ih);
      const shift = frame ? offsets[sideOf(frame)][Math.abs(frame) - 1] : 0;
      const left = x + w * shift / 1280, right = left + w;
      // При сдвиге заполняем открывшийся край ближайшей колонкой фона.
      if (left > 0) ctx.drawImage(image, 0, 0, 1, ih, 0, y, left + 1, h);
      if (right < canvas.width) ctx.drawImage(image, iw - 1, 0, 1, ih, right - 1, y, canvas.width - right + 1, h);
      ctx.drawImage(image, left, y, w, h);
      canvas.hidden = false;
    }

    function update() {
      playableTarget = Math.max(-readyBySide.left, Math.min(readyBySide.right, targetFrame)) || 0;
      if (!frames[N] || !visible || document.hidden || frame === playableTarget) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        lastMotionPaint = undefined;
      } else if (!raf) raf = requestAnimationFrame(tick);
    }

    function tick(now) {
      raf = 0;
      if (now - lastStep + 2 >= STEP) {
        // За один rAF рисуем один соседний кадр, даже после длинной паузы.
        const next = frame + Math.sign(playableTarget - frame);
        if (debug) {
          debug.skippedFrames += Math.abs(next - frame) - 1;
          if (lastMotionPaint !== undefined) {
            debug.maxFrameIntervalMs = Math.max(debug.maxFrameIntervalMs, now - lastMotionPaint);
          }
          lastMotionPaint = now;
        }
        frame = next;
        paint();
        lastStep = now;
      }
      update();
    }

    function setTarget() {
      if (pointerX === null) targetFrame = 0;
      else {
        const dx = pointerX - centerX;
        const span = dx < 0 ? centerX : rightEdge - centerX;
        targetFrame = Math.sign(dx) * Math.min(N, Math.ceil(N * Math.abs(dx) / span)); // курсор справа → кадры right-* (проверено вживую 2026-11-27: со знаком минус смотрела от курсора)
      }
      update();
    }

    function layout() {
      layoutRaf = 0;
      const bounds = portrait.getBoundingClientRect();
      const wasVisible = visible;
      visible = hero.getBoundingClientRect().bottom > 0 && bounds.width > 0 && bounds.height > 0 && scrollY <= innerHeight * 1.05;
      if (resizeCanvas(bounds, rasterWidth)) canvas.hidden = true;
      const [x, , width] = cover(bounds.width, bounds.height, 16, 9);
      rightEdge = innerWidth - 1;
      centerX = Math.max(1, Math.min(rightEdge - 1, bounds.left + x + EYE[0] * width));
      if (frames[N] && visible && !document.hidden && (!wasVisible || canvas.hidden)) paint();
      setTarget();
    }

    function releaseFrames() {
      for (const image of frames) image?.close?.();
      frames.fill(undefined);
    }

    function preload() {
      let index = 0;
      async function worker() {
        while (!signal.aborted && !failed.has('base') && index < frames.length) {
          const i = index++;
          // Сначала base, затем попеременно кадры слева и справа от него.
          const n = i % 2 ? -(i + 1) / 2 : i / 2;
          const side = sideOf(n);
          if (failed.has(side)) continue;
          let image;
          try {
            image = await loadFrame(`assets/gaze/${frameName(n)}${suffix}.webp`, signal);
          } catch (error) {
            if (signal.aborted) return;
            failed.add(side);
            loadError ??= String(error);
            continue;
          }
          if (signal.aborted || failed.has('base')) { image.close?.(); return; }
          frames[N + n] = image;
          decoded++;
          if (n) {
            const sign = Math.sign(n);
            while (readyBySide[side] < N && frames[N + sign * (readyBySide[side] + 1)]) readyBySide[side]++;
          } else if (visible && !document.hidden) paint();
          update();
        }
      }
      for (let i = 0; i < 4; i++) worker();
    }

    const scheduleLayout = () => { if (!layoutRaf) layoutRaf = requestAnimationFrame(layout); };
    const trackPointer = e => {
      if (e.pointerType !== 'mouse' || document.hidden || e.clientX === pointerX) return;
      const now = performance.now();
      // Отдельный поворот из покоя начинается на первом rAF, частые события сохраняют темп.
      if (frame === targetFrame && now - lastPointerAt >= STEP) lastStep = -Infinity;
      lastPointerAt = now;
      pointerX = e.clientX;
      setTarget();
    };
    const resetPointer = () => {
      if (frame === targetFrame) lastStep = -Infinity;
      pointerX = null;
      lastPointerAt = -Infinity;
      setTarget();
    };
    on(window, 'pointerover', trackPointer);
    on(window, 'pointermove', trackPointer, { passive: true });
    on(window, 'pointerout', e => { if (e.pointerType === 'mouse' && !e.relatedTarget) resetPointer(); });
    on(document.documentElement, 'pointerleave', e => { if (e.pointerType === 'mouse') resetPointer(); });
    on(window, 'pointercancel', e => { if (e.pointerType === 'mouse') resetPointer(); });
    on(window, 'blur', resetPointer);
    on(document, 'visibilitychange', () => {
      resetPointer();
      if (!document.hidden) scheduleLayout();
    });
    on(window, 'scroll', scheduleLayout, { passive: true });
    on(window, 'resize', scheduleLayout);
    const resize = new ResizeObserver(scheduleLayout);
    resize.observe(portrait);
    layout();
    preload();

    window.__gaze = {
      state: () => ({
        mode: 'cursor', frame, targetFrame, current: frameName(frame), target: frameName(targetFrame),
        ready: Boolean(frames[N]), complete: decoded === frames.length, decoded,
        ...(loadError && { error: loadError }),
        ...(debug && { readyBySide: { ...readyBySide }, playableTarget: frameName(playableTarget), timing: { ...debug } })
      })
    };

    return () => {
      lifetime.abort();
      resize.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(layoutRaf);
      releaseFrames();
      canvas.hidden = true;
      canvas.width = canvas.height = 0;
      delete window.__gaze;
    };
  }

  function startTargets() {
    const hero = canvas.closest('.h'), portrait = canvas.parentElement.querySelector('img');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const lifetime = new AbortController();
    const on = (node, event, callback, options) => node.addEventListener(event, callback, { ...options, signal: lifetime.signal });

    const LEAVE_MS = 300;
    const IDLE_FPS = 24;
    const DIRS = ['right', 'ne', 'n', 'nw', 'left', 'sw', 's', 'se'];
    const DIAGONALS = new Set(['ne', 'nw', 'se', 'sw']);
    const IDLES = new Set(['c', 'left', 'ne', 'nw', 'se', 'sw', 's']);
    const BIG = innerWidth > 1600, suffix = BIG ? '' : '-1280', idleWidth = BIG ? 1920 : 1280;
    const all = Array.from({ length: N }, (_, i) => i + 1);
    const debug = query.has('debug') ? { skippedFrames: 0, maxFrameIntervalMs: 0 } : null;

    const priority = ['cta', 'say', 'clock', 'age', 'nav', 'logo'];
    const elements = [...document.querySelectorAll('[data-gaze]')];

    const videos = new Map();
    let base, baseRequest, sequence, targets = [], needed = [], pointer, pointerTarget;
    let desired = null, dir = null, frame = 0, still, idle;
    let painted, lastPaintTime, raf = 0, layoutRaf = 0, leaveTimer = 0, leaveAt = 0, centerTimer = 0;
    let turnSign = 0, turnOrigin, turnStart, lastTurnPaint;
    let eyeOnCanvas;
    let loaded = document.readyState === 'complete', background = false, blurred = false, visible = false;
    let idleTask = 0, cancelIdleTask = clearTimeout;

    const clampFrame = value => Math.max(0, Math.min(N, value));
    const active = () => !lifetime.signal.aborted && !document.hidden && !blurred && visible;
    const source = (dir, n) => {
      // У диагоналей в 1920 px нет нечётных кадров. Полная серия в 1280 px даёт все 71 кадр.
      const size = DIAGONALS.has(dir) ? '-1280' : suffix;
      return `assets/gaze/${dir}-${String(n).padStart(2, '0')}${size}.webp`;
    };

    function paint(image, time) {
      if (!active() || !image || (painted === image && lastPaintTime === time) || !canvas.width || !canvas.height) return;
      const iw = image.videoWidth || image.naturalWidth || image.width,
        ih = image.videoHeight || image.naturalHeight || image.height;
      if (!iw || !ih) return;
      ctx.drawImage(image, ...cover(canvas.width, canvas.height, iw, ih));
      painted = image;
      lastPaintTime = time;
      canvas.hidden = false;
    }

    function paintTurn() {
      still = frame ? sequence.frames[frame] : base;
      paint(still);
    }

    function releaseSequence() {
      if (!sequence) return;
      sequence.controller.abort();
      for (const image of sequence.frames) image?.close?.();
      sequence = null;
    }

    // Готовим одно направление целиком в центре и держим его до конца обратного поворота.
    function prepareFrames() {
      if (!loaded || dir || (!background && !desired)) return;
      if (!baseRequest) {
        baseRequest = loadFrame(`assets/gaze/base${suffix}.webp`, lifetime.signal).then(image => {
          if (lifetime.signal.aborted) { image.close?.(); return; }
          base = still = image;
          paint(image);
          update();
        }, () => {});
      }
      const next = desired ?? sequence?.dir ?? needed[0];
      if (!next || sequence?.dir === next) return;
      releaseSequence();
      const pack = { dir: next, frames: [], controller: new AbortController(), count: 0, ready: false };
      sequence = pack;
      const { signal } = pack.controller;
      let index = 1;
      async function worker() {
        while (!signal.aborted && index <= N) {
          const n = index++;
          const image = await loadFrame(source(next, n), signal);
          if (signal.aborted) { image.close?.(); return; }
          pack.frames[n] = image;
          pack.count++;
        }
      }
      Promise.all(Array.from({ length: 4 }, worker)).then(() => {
        if (signal.aborted || sequence !== pack) return;
        pack.ready = true;
        update();
      }, () => {
        if (sequence !== pack) return;
        releaseSequence();
        sequence = { ...pack, frames: [], count: 0, failed: true };
      });
    }

    function prepareIdle(pose) {
      if (!IDLES.has(pose)) return;
      if (videos.has(pose)) return videos.get(pose);
      const video = document.createElement('video');
      const clip = { video, stamp: -1, token: 0, playId: 0, started: false };
      video.className = 'gaze-idle';
      video.setAttribute('aria-hidden', 'true');
      video.defaultMuted = video.muted = video.playsInline = video.loop = true;
      video.preload = 'auto';
      video.addEventListener('playing', () => watchIdle(clip));
      video.addEventListener('waiting', () => cancelVideoFrame(clip));
      video.addEventListener('error', () => {
        clip.failed = true;
        if (clip === idle) { finishIdle(); paint(still); }
      });
      if (pose !== 'c') {
        for (const [key, old] of videos) {
          if (key === 'c') continue;
          releaseVideo(old);
          videos.delete(key);
        }
      }
      videos.set(pose, clip);
      canvas.parentElement.append(video);
      video.src = `assets/idle/idle-${pose}-${idleWidth}.mp4`;
      return clip;
    }

    function cancelVideoFrame(clip) {
      if (!clip.token) return;
      if (clip.video.requestVideoFrameCallback) clip.video.cancelVideoFrameCallback(clip.token);
      else cancelAnimationFrame(clip.token);
      clip.token = 0;
    }

    function watchIdle(clip) {
      const video = clip.video;
      if (idle !== clip || !active() || video.paused || clip.token) return;
      const next = (_, metadata) => {
        clip.token = 0;
        if (idle !== clip || !active() || video.paused) return;
        if (!video.seeking && video.readyState >= 2) {
          clip.stamp = metadata?.mediaTime ?? Math.floor(video.currentTime * IDLE_FPS) / IDLE_FPS;
          paint(video, clip.stamp);
        }
        watchIdle(clip);
      };
      clip.token = video.requestVideoFrameCallback ? video.requestVideoFrameCallback(next) : requestAnimationFrame(next);
    }

    function playIdle(clip) {
      if (!clip || clip.failed || idle) return;
      idle = clip;
      if (clip.started && clip.video.readyState >= 1) clip.video.currentTime = 0;
      clip.started = true;
      resumeIdle(clip);
    }

    function resumeIdle(clip) {
      const playId = ++clip.playId;
      clip.video.play().then(() => {
        if (playId === clip.playId) watchIdle(clip);
      }, () => {
        if (idle !== clip || playId !== clip.playId || !active()) return;
        clip.failed = true;
        finishIdle();
        paint(still);
      });
    }

    function haltIdle(clip) {
      cancelVideoFrame(clip);
      clip.playId++;
      clip.video.pause();
    }

    function releaseVideo(clip) {
      haltIdle(clip);
      clip.video.removeAttribute('src');
      clip.video.load();
      clip.video.remove();
    }

    function finishIdle() {
      const clip = idle;
      idle = null;
      haltIdle(clip);
      clip.stamp = -1;
    }

    function direction() {
      if (!dir) return 0;
      if (dir === desired) return frame < N ? 1 : 0;
      return -1;
    }

    function stopTurn() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      turnSign = 0;
    }

    function holdCenter() {
      if (!centerTimer) centerTimer = setTimeout(() => { centerTimer = 0; update(); }, STEP);
    }

    function tick() {
      raf = 0;
      if (!active()) { stopTurn(); return; }
      const now = performance.now();
      const steps = Math.floor((now - turnStart + 0.001) / STEP);
      const next = clampFrame(turnOrigin + turnSign * steps);
      if (next !== frame) {
        if (debug) {
          debug.skippedFrames += Math.abs(next - frame) - 1;
          if (lastTurnPaint !== undefined) {
            debug.maxFrameIntervalMs = Math.max(debug.maxFrameIntervalMs, now - lastTurnPaint);
          }
          lastTurnPaint = now;
        }
        frame = next;
        paintTurn();
      }
      if (turnSign > 0 ? frame === N : frame === 0) {
        stopTurn();
        if (!frame) {
          dir = null;
          if (desired) holdCenter();
        }
        update();
      } else {
        raf = requestAnimationFrame(tick);
      }
    }

    function update() {
      if (!active()) return;
      if (dir && !frame && dir !== desired) {
        dir = null;
        stopTurn();
      }
      if (!dir) {
        prepareFrames();
        if (!base) return;
        if (!centerTimer && desired && sequence?.dir === desired && sequence.ready) {
          dir = desired;
        } else {
          if (background) {
            const center = prepareIdle('c');
            if (!desired || !centerTimer) playIdle(center);
          }
          return;
        }
      }

      const sign = direction();
      if (!sign) {
        stopTurn();
        playIdle(prepareIdle(dir));
        return;
      }
      if (idle) {
        leaveAt = 0;
        finishIdle();
      }
      if (frame === N && !desired && performance.now() < leaveAt) {
        if (!leaveTimer) leaveTimer = setTimeout(() => { leaveTimer = 0; update(); }, leaveAt - performance.now());
        return;
      }
      if (sign !== turnSign) {
        turnSign = sign;
        turnOrigin = frame;
        turnStart = performance.now() - STEP;
        lastTurnPaint = undefined;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function layout() {
      layoutRaf = 0;
      const bounds = portrait.getBoundingClientRect();
      const heroBottom = hero.getBoundingClientRect().bottom;
      visible = heroBottom > 0 && bounds.width > 0 && bounds.height > 0 && scrollY <= innerHeight * 1.05;
      const inZone = visible && scrollY <= innerHeight * .9;
    if (resizeCanvas(bounds, idleWidth)) painted = null;
      const [x, y, width, height] = cover(bounds.width, bounds.height, 16, 9);
      const eyeX = x + EYE[0] * width, eyeY = y + EYE[1] * height;
      const eye = [bounds.left + eyeX, bounds.top + eyeY];
      eyeOnCanvas = { x: eyeX / bounds.width, y: eyeY / bounds.height };
      targets = [];
      if (inZone) for (const el of elements) {
        const b = el.getBoundingClientRect(), style = getComputedStyle(el);
        if (!b.width || !b.height || b.right <= 0 || b.left >= innerWidth || b.bottom <= 0 || b.top >= innerHeight ||
            style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
        if (el.dataset.gaze === 'say' && [...el.children].every(child => Number(child.style.opacity || 1) === 0)) continue;
        const dx = b.left + b.width / 2 - eye[0], dy = eye[1] - (b.top + b.height / 2);
        if (Math.hypot(dx, dy) < 40) continue;
        const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        targets.push({ el, id: el.dataset.gaze, dir: DIRS[Math.round(angle / 45) % 8] });
      }
      needed = [...new Set([...targets].sort((a, b) => priority.indexOf(a.id) - priority.indexOf(b.id)).map(t => t.dir))];
      const hover = pointer ? document.elementFromPoint(...pointer)?.closest('[data-gaze]') :
        pointer === undefined ? document.querySelector('[data-gaze]:hover') : null;
      const focused = document.activeElement;
      const keyboard = focused?.matches(':focus-visible') ? focused.closest('[data-gaze]') : null;
      const target = targets.find(t => t.el === hover) || targets.find(t => t.el === keyboard);
      const previous = desired;
      desired = target?.dir ?? null;
      if (previous && !desired) leaveAt = performance.now() + LEAVE_MS;
      else if (desired) { clearTimeout(leaveTimer); leaveTimer = leaveAt = 0; }
      if (!active()) {
        suspend();
        return;
      }
      if (idle) {
        if (!painted) {
          if (idle.stamp >= 0 && !idle.video.seeking && idle.video.readyState >= 2) paint(idle.video, idle.stamp);
          else paint(still);
        }
        if (idle.video.paused) resumeIdle(idle);
      } else {
        paint(still);
      }
      update();
    }

    function suspend() {
      stopTurn();
      if (idle) haltIdle(idle);
    }

    const scheduleLayout = () => { if (!layoutRaf) layoutRaf = requestAnimationFrame(layout); };
    const trackPointer = e => {
      if (e.pointerType !== 'mouse') return;
      pointer = [e.clientX, e.clientY];
      const target = e.target.closest?.('[data-gaze]') ?? null;
      if (pointerTarget !== target) {
        pointerTarget = target;
        layout();
      }
    };
    on(document, 'pointerover', trackPointer);
    on(document, 'pointermove', trackPointer, { passive: true });
    on(document.documentElement, 'pointerleave', e => {
      if (e.pointerType !== 'mouse') return;
      pointer = pointerTarget = null;
      layout();
    });
    on(document, 'focusin', scheduleLayout);
    on(document, 'focusout', scheduleLayout);
    on(document, 'animationstart', e => { if (elements.includes(e.target)) scheduleLayout(); });
    on(document, 'animationend', e => { if (elements.includes(e.target)) scheduleLayout(); });
    on(window, 'blur', () => { blurred = true; suspend(); });
    on(window, 'focus', () => { blurred = false; pointer = pointerTarget = undefined; layout(); });
    on(document, 'visibilitychange', () => { if (document.hidden) suspend(); else layout(); });
    on(window, 'scroll', scheduleLayout, { passive: true });
    on(window, 'resize', scheduleLayout);
    const resize = new ResizeObserver(scheduleLayout);
    resize.observe(portrait);
    document.fonts?.ready.then(() => { if (!lifetime.signal.aborted) scheduleLayout(); });

    function afterLoad() {
      loaded = true;
      if ('requestIdleCallback' in window) {
        cancelIdleTask = cancelIdleCallback;
        idleTask = requestIdleCallback(enableBackground, { timeout: 1800 });
      } else idleTask = setTimeout(enableBackground, 300);
      update();
    }
    function enableBackground() {
      background = true;
      layout();
    }
    if (loaded) afterLoad();
    else on(window, 'load', afterLoad, { once: true });
    layout();

    window.__gaze = {
      state: () => ({
        dir, desired, pos: frame, frame, layers: canvas.hidden ? 0 : 1, idle: idle ? 'loop' : null,
        cached: sequence?.count ?? 0, pending: sequence && !sequence.ready && !sequence.failed ? N - sequence.count : 0,
        ready: Object.fromEntries(DIRS.map(dir => [dir, sequence?.dir === dir ? sequence.count : 0])),
        ...(debug && { timing: { ...debug } })
      }),
      targets: () => targets.map(({ id, dir }) => ({ id, dir })),
      needed: () => [...needed],
      eye: () => eyeOnCanvas,
      lists: () => Object.fromEntries(DIRS.map(dir => [dir, [...all]]))
    };

    return () => {
      lifetime.abort();
      resize.disconnect();
      suspend();
      cancelAnimationFrame(layoutRaf);
      cancelIdleTask(idleTask);
      clearTimeout(leaveTimer);
      clearTimeout(centerTimer);
      releaseSequence();
      base?.close?.();
      for (const clip of videos.values()) releaseVideo(clip);
      canvas.hidden = true;
      canvas.width = canvas.height = 0;
      delete window.__gaze;
    };
  }
})();
