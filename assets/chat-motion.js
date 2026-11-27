(function () {
  'use strict';

  // Port of app/mobile/src/alisa/{clips,mood,AlisaStage}.
  const REACTIONS = new Map([
    ['nod', { plan: 'waist', file: 'waist-nod', fadeMs: 0 }],
    ['listen', { plan: 'portrait', file: 'portrait-listen', fadeMs: 0 }],
    ['talkCalm', { plan: 'portrait', file: 'portrait-talk-calm', fadeMs: 0 }],
    ['talkLively', { plan: 'portrait', file: 'portrait-talk-lively', fadeMs: 0 }],
    ['think', { plan: 'portrait', file: 'portrait-think', fadeMs: 0 }],
    ['read', { plan: 'portrait', file: 'portrait-read', fadeMs: 0 }],
    ['smile', { plan: 'portrait', file: 'portrait-smile', fadeMs: 0 }],
    ['laugh', { plan: 'portrait', file: 'portrait-laugh', fadeMs: 0 }],
    ['smirk', { plan: 'portrait', file: 'portrait-smirk', fadeMs: 0 }],
    ['eyeroll', { plan: 'portrait', file: 'portrait-eyeroll', fadeMs: 0 }],
    ['surprise', { plan: 'portrait', file: 'portrait-surprise', fadeMs: 0 }],
    ['shy', { plan: 'portrait', file: 'portrait-shy', fadeMs: 0 }],
    ['sympathy', { plan: 'portrait', file: 'portrait-sympathy', fadeMs: 0 }],
    ['wink', { plan: 'portrait', file: 'portrait-wink', fadeMs: 0 }],
    ['yawn', { plan: 'portrait', file: 'portrait-yawn', fadeMs: 0 }],
    ['wave', { plan: 'waist', file: 'waist-wave', fadeMs: 0 }],
    ['shrug', { plan: 'waist', file: 'waist-shrug', fadeMs: 0 }],
    ['laughCover', { plan: 'waist', file: 'waist-laugh-cover', fadeMs: 0 }],
    ['thinkChin', { plan: 'waist', file: 'waist-think-chin', fadeMs: 0 }],
    ['crossArms', { plan: 'waist', file: 'waist-cross-arms', fadeMs: 0 }],
    ['heart', { plan: 'waist', file: 'waist-heart', fadeMs: 0 }],
    ['noYes', { plan: 'waist', file: 'waist-no-yes', fadeMs: 0 }],
    ['pout', { plan: 'waist', file: 'waist-pout', fadeMs: 0 }],
    ['hair', { plan: 'waist', file: 'waist-hair', fadeMs: 0 }],
    ['spin', { plan: 'full', file: 'full-spin', fadeMs: 0 }],
    ['jump', { plan: 'full', file: 'full-jump', fadeMs: 0 }],
    ['bored', { plan: 'full', file: 'full-bored', fadeMs: 0 }],
  ]);
  const IDLE = { waist: 'waist-idle', portrait: 'portrait-idle2', full: 'full-idle' };
  const TRANSITIONS = {
    waist: { portrait: 'waist-to-portrait', full: 'waist-to-full' },
    portrait: { waist: 'portrait-to-waist' },
    full: { waist: 'full-to-waist' },
  };
  const BY_STICKER = new Map(Object.entries(
  {
    ору: "laugh",
    шок: "surprise",
    ехидно: "smirk",
    смущена: "shy",
    умоляю: "pout",
    обнимаю: "sympathy",
    возмущена: "crossArms",
    сплю: "yawn",
    но_зачем: "eyeroll",
    очень_необычно: "eyeroll",
    чай: "think",
    вот_такие_дела: "shrug",
    пингвин: "shrug",
    ыыыффф: "bored",
    котенок_рыцарь: "noYes",
    возьми_телефон: "pout",
    муся_это_ты: "think",
    лучшая_я: "spin",
  }
  ));
  const RULES =
  [
    [/зева|сонн|спать хочу|спокойной ночи|сладких снов|😴|🥱|\byawn\w*\b|\b(?:going to sleep|so tired|good night|sweet dreams)\b/iu, "yawn"],
    [/кружусь|покружил|верчусь/iu, "spin"],
    [/прыга|подпрыг|ура+(?![а-яё])|🎉|🥳/iu, "jump"],
    [/люблю тебя|обожаю тебя|❤️|❤|💕|💗|💖|😘|сердечк/iu, "heart"],
    [/подмигива|😉/iu, "wink"],
    [/машу|привет+(?![а-яё])|приветик|хай(?![а-яё])|пока-пока|до завтра|👋|\b(?:hello|hey|hi|bye|see you tomorrow)\b/iu, "wave"],
    [/ахах|хаха|хахах|ржу|ору(?![а-яё])|смеюсь|😂|🤣|\b(?:ha(?:ha)+|lol+|lmao|laughing)\b/iu, "laugh"],
    [/хихи|прикрываю рот|хихика/iu, "laughCover"],
    [/обижа|обиделась|дуюсь|надулась|хмф|😒/iu, "pout"],
    [/скрещиваю руки|возмущ|ну знаешь|😤|😠/iu, "crossArms"],
    [/закатываю глаза|🙄|ну конечно(?![а-яё])|ага, конечно/iu, "eyeroll"],
    [/жесть|офиг|ого+(?![а-яё])|вау|серьёзно\?|серьезно\?|не может быть|😱|😮|😳|\b(?:wow|no way|omg|really\?)/iu, "surprise"],
    [/смущ|краснею|🙈|☺️|🥰/iu, "shy"],
    [/жаль|сочувств|обнима|бедн|держись|мне так жаль|🫂|🥺|\b(?:sorry to hear|hugs?|that sounds rough)\b/iu, "sympathy"],
    [/хм+(?![а-яё])|дума[юе]|не знаю|сложно сказать|🤔|\b(?:hmm+|let me think|not sure)\b/iu, "thinkChin"],
    [/пожима|ну такое|без понятия|🤷/iu, "shrug"],
    [/поправляю волосы|убираю прядь|заправляю/iu, "hair"],
    [/скучн|скука|скучаю|😮‍💨|\b(?:i miss you|so bored)\b/iu, "bored"],
    [/читаю|прочитала|пишут|в отзывах/iu, "read"],
    [/😏|ну-ну|хитр/iu, "smirk"],
    [/нет\.{0,3}\s*(ну\s*)?ладно|ладно,? уговорил|ну ладно/iu, "noYes"],
    [/[😊🙂😄😁]|рада(?![а-яё])|мило|приятно|\b(?:smiles?|glad to see you)\b/iu, "smile"],
  ];

  function matchReaction(items, last, stickerName) {
    const candidates = [];
    for (const item of items) {
      if (item.kind === 'sticker') candidates.push(BY_STICKER.get(stickerName(item.name)));
    }
    for (const kind of ['action', 'text']) {
      for (const item of items) {
        if (item.kind === kind) candidates.push(RULES.find(([pattern]) => pattern.test(item.text))?.[1]);
      }
    }
    return candidates.find(reaction => reaction && reaction !== last) ?? null;
  }

  function fallbackReaction(items, last, random) {
    const length = items.reduce((sum, item) => sum + (item.kind === 'text' ? item.text.length : 0), 0);
    const pool = length > 120 ? ['talkLively', 'talkCalm'] : length > 40 ? ['talkCalm', 'nod', 'smile'] : ['nod', 'smile'];
    const choices = pool.filter(reaction => reaction !== last);
    return choices[Math.floor(random() * choices.length)] ?? 'nod';
  }

  function createMood(react, stickerName, random = Math.random, canInitiate = () => true) {
    const silence = ['hair', 'bored', 'yawn'];
    let silenceIndex = 0;
    let silenceTimer;
    let fallbackTimer;
    let last = null;
    let batch = [];
    let hit = false;

    function play(reaction, inReply = true) {
      last = reaction;
      react(reaction, inReply);
    }

    function activity() {
      clearTimeout(silenceTimer);
      if (canInitiate()) {
        silenceTimer = setTimeout(() => {
          if (canInitiate()) play(silence[silenceIndex++ % silence.length], false);
        }, 90000);
      }
    }

    function show(part, hint) {
      batch.push(part);
      const reaction = REACTIONS.has(hint) ? hint : matchReaction([part], last, stickerName);
      if (reaction) {
        hit = true;
        play(reaction);
      }
      clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(() => {
        if (!hit) play(fallbackReaction(batch, last, random));
        batch = [];
        hit = false;
      }, 2500);
      activity();
    }

    function clear() {
      clearTimeout(fallbackTimer);
      batch = [];
      hit = false;
      activity();
    }

    return { show, activity, clear };
  }

  function nextSegment(plan, target, pending, idleCount) {
    const reaction = REACTIONS.get(pending);
    const desired = reaction?.plan ?? target;
    if (desired !== plan) {
      const to = TRANSITIONS[plan][desired] ? desired : 'waist';
      return { kind: 'transition', file: TRANSITIONS[plan][to], plan: to, fadeMs: 0 };
    }
    if (reaction) return { kind: 'reaction', ...reaction, reaction: pending };
    const rare = plan === 'portrait' && idleCount % 4 === 3;
    return { kind: 'idle', file: rare ? 'portrait-idle' : IDLE[plan], plan, fadeMs: 0 };
  }

  function createStage(avatar, playButton) {
    const videos = [...avatar.querySelectorAll('video')];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0;
    let segment = nextSegment('waist', 'waist', null, 0);
    let target = 'waist';
    let replyPlan;
    let pending = null;
    let idleCount = 0;
    let next = null;
    let endedAt = null;
    let fadeUntil = 0;
    let started = false;
    let enabled = true;
    let instant = true;
    let handoffTimer;
    let readyTimer;

    const available = () => enabled && !document.hidden && !motion.matches;
    const visual = (video, opacity, layer, fade) => {
      video.style.transitionDuration = `${fade}ms`;
      video.style.zIndex = layer;
      video.style.opacity = opacity;
    };
    const load = (slot, clip) => {
      const video = videos[slot];
      video.src = `assets/reactions/${clip.file}.mp4`;
    };

    function play() {
      if (!available()) return;
      const slot = current;
      const video = videos[slot];
      void video.play().catch(() => {
        if (available() && slot === current && video.paused && !video.error) playButton.hidden = false;
      });
    }

    function preload() {
      if (!available() || !started || performance.now() < fadeUntil) return;
      const candidate = nextSegment(segment.plan, target, pending, idleCount);
      if (next?.file !== candidate.file) {
        next = candidate;
        load(1 - current, next);
      }
      advance();
    }

    function switchSegment(dissolve) {
      const outgoing = videos[current];
      const incoming = videos[1 - current];
      const fade = dissolve ? 300 : Math.max(segment.fadeMs, next.fadeMs);
      current = 1 - current;
      segment = next;
      next = null;
      endedAt = null;
      if (segment.reaction === pending) pending = null;
      if (segment.kind === 'idle') idleCount++;
      clearTimeout(readyTimer);
      clearTimeout(handoffTimer);
      fadeUntil = fade ? performance.now() + fade + 30 : 0;
      visual(outgoing, fade ? '1' : '0', '1', 0);
      visual(incoming, '0', '2', 0);
      if (fade) incoming.getBoundingClientRect();
      visual(incoming, '1', '2', fade);
      avatar.dataset.segment = segment.file;
      play();
      if (fade) {
        handoffTimer = setTimeout(() => {
          outgoing.pause();
          visual(outgoing, '0', '1', 0);
          preload();
        }, fade + 40);
      } else {
        outgoing.pause();
        preload();
      }
    }

    function advance() {
      if (!available() || !next || performance.now() < fadeUntil) return;
      const ready = videos[1 - current].readyState >= 2;
      if (endedAt !== null) {
        if (ready || performance.now() - endedAt >= 600) switchSegment(false);
      } else if (instant && ready && segment.kind === 'idle' && next.kind !== 'idle') {
        switchSegment(true);
      }
    }

    function end(slot) {
      if (slot !== current || endedAt !== null) return;
      endedAt = performance.now();
      preload();
      clearTimeout(readyTimer);
      if (endedAt !== null) readyTimer = setTimeout(advance, 620);
    }

    videos.forEach((video, slot) => {
      video.addEventListener('loadeddata', advance);
      video.addEventListener('canplay', advance);
      video.addEventListener('ended', () => end(slot));
      video.addEventListener('timeupdate', () => {
        if (video.duration > 0 && video.currentTime >= video.duration - 0.02) end(slot);
      });
      video.addEventListener('playing', () => {
        if (slot !== current || !available()) return;
        playButton.hidden = true;
        if (!video.style.opacity || video.style.opacity === '0') visual(video, '1', '2', 0);
      });
      video.addEventListener('error', () => {
        if (slot !== current || !available()) return;
        // A failed file must leave a usable poster and a way to resume.
        reset();
        playButton.hidden = false;
      });
    });

    function sync() {
      if (!available()) {
        videos.forEach(video => video.pause());
        playButton.hidden = true;
        return;
      }
      if (!started) {
        started = true;
        avatar.dataset.segment = segment.file;
        load(current, segment);
      }
      if (endedAt === null) play();
      preload();
    }

    function reset() {
      clearTimeout(handoffTimer);
      clearTimeout(readyTimer);
      fadeUntil = 0;
      current = 0;
      target = 'waist';
      pending = null;
      idleCount = 0;
      segment = nextSegment(target, target, null, 0);
      next = null;
      endedAt = null;
      started = false;
      delete avatar.dataset.segment;
      videos.forEach(video => {
        video.pause();
        visual(video, '0', '1', 0);
        video.removeAttribute('src');
        video.load();
      });
    }

    playButton.addEventListener('click', sync);
    motion.addEventListener('change', sync);
    return {
      sync,
      reset,
      setEnabled(value) {
        if (enabled === value) return;
        enabled = value;
        if (!enabled) reset();
        sync();
      },
      beginReply() { replyPlan = undefined; },
      setInstant(value) { instant = value; advance(); },
      plan(value) { if (enabled) { target = value; preload(); } },
      react(value, inReply = false) {
        let clip = REACTIONS.get(value);
        if (!clip || !available()) return;
        if (inReply) {
          if (!replyPlan) {
            replyPlan = clip.plan === segment.plan || TRANSITIONS[segment.plan][clip.plan] ? clip.plan : 'waist';
          }
          if (replyPlan === 'waist' && clip.plan === 'portrait' && value === 'laugh') {
            value = 'laughCover';
            clip = REACTIONS.get(value);
          }
          if (clip.plan !== replyPlan) {
            if (replyPlan === 'waist' && target !== replyPlan) {
              pending = null;
              target = replyPlan;
              preload();
            }
            return;
          }
        }
        pending = value;
        target = clip.plan;
        preload();
      },
    };
  }

  const api = { REACTIONS, createMood, createStage, nextSegment };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.AlisaMotion = api;
})();
