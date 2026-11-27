(function () {
  'use strict';

  const HISTORY_LIMIT = 40;
  const SAVED_ITEMS = 400;
  const TYPING_FRESH = 5000;
  const MAX_WAIT = 20000;
  const REQUEST_TIMEOUT = 42000;
  const CONTENT_LIMIT = 2000;
  const OPENER_GAP = 60 * 1000;
  const NOTICE_GAP = 3 * 60 * 60 * 1000;
  const OPEN_END_RU = /(,|:|…|\.\.\.|\s-|(^|\s)(и|но|а|или|что|чтобы|потому|короче|типа|ну|вот|если|когда|кстати))\s*$/i;
  const OPEN_END_EN = /(?:[,:…—–-]|\.\.\.|(?:^|\s)(?:and|but|or|because|so|if|when|that))$/iu;

  const STICKER_NAMES = [
    ['умоляю', 'begging', '🥺'],
    ['ору', 'cracking_up', '🤣'],
    ['шок', 'shocked', '😱'],
    ['ехидно', 'smirking', '😏'],
    ['смущена', 'blushing', '🙈'],
    ['чай', 'sipping_tea', '🍵'],
    ['обнимаю', 'hugging', '🫂'],
    ['возмущена', 'outraged', '😤'],
    ['сплю', 'sleeping', '😴'],
    ['но_зачем', 'but_why', '🤨'],
    ['очень_необычно', 'very_unusual', '😐'],
    ['вот_такие_дела', 'well_there_it_is', '🥲'],
    ['котенок_рыцарь', 'knight_kitten', '🐱'],
    ['пингвин', 'penguin', '🐧'],
    ['ыыыффф', 'ugh', '😮‍💨'],
    ['возьми_телефон', 'pick_up_the_phone', '📱'],
    ['муся_это_ты', 'is_that_you_musya', '🔍'],
    ['лучшая_я', 'im_the_best', '🏔️'],
  ];
  const STICKERS = new Map(STICKER_NAMES.flatMap(([ru, en, emoji]) => [[ru, emoji], [en, emoji]]));
  const RUSSIAN_STICKER = new Map(STICKER_NAMES.map(([ru, en]) => [en, ru]));
  const stickerName = name => RUSSIAN_STICKER.get(name) ?? name;

  const COPY = {
    en: {
      title: 'Chat with Alisa', name: 'Alisa', home: 'Alisa home',
      unavailable: 'Chat will be back soon', backHome: 'Back to Alisa',
      dataPolicy: 'Data controls', manageData: 'Manage my data', closeData: 'Close data controls',
      preview: 'Preview · simulated replies',
      subtitle: 'AI companion · not a person', language: 'Language',
      welcome: 'Say hello.', minors: 'AI companion chatbots may not be suitable for some minors.',
      conversation: 'Conversation', messages: 'Messages', message: 'Message',
      placeholder: 'Message…', send: 'Send', you: 'You',
      clear: 'Clear chat', confirm: 'Clear this chat on this device?',
      settings: 'Settings', closeSettings: 'Close settings', initiates: 'Messages first',
      sound: 'Message sound', video: 'Video reactions', appearance: 'Appearance',
      userName: 'What Alisa calls you', userNameFact: 'Name', save: 'Save',
      nameHint: 'Up to 40 characters. Leave it blank and Alisa can learn your name in chat.',
      nameInvalid: 'Enter a name of up to 40 characters.',
      memoryTitle: 'What Alisa remembers about me', memoryEmpty: 'No saved facts yet.',
      memoryEmptyWithChat: 'No saved facts. You can still delete your chat data with Forget everything.',
      memoryLoading: 'Loading…', memorySaving: 'Saving…', memoryError: "Couldn't load memory.", memoryWriteError: "Couldn't save changes. Try again.",
      memorySaved: 'Name saved.', memoryDeleted: 'Fact deleted.', memoryCleared: 'Memory cleared.',
      deleteFact: 'Delete', forgetAll: 'Forget everything',
      confirmForget: "Delete Alisa's memory and chat history from the server and this browser? This can't be undone.",
      downloadData: 'Download my data', downloadError: "Couldn't download your data. Try again.",
      remembered: 'Alisa will remember', editMemory: 'Edit', crisisHelp: 'Crisis help',
      rateLimit: 'Too many requests today. Try again tomorrow.',
      rateLimitMinute: 'Too many requests. Try again in a minute.',
      rateLimitSite: 'Alisa is resting. Try again after midnight UTC.',
      voiceConsent: 'Your browser may send audio to its speech service. Alisa receives the text when you send it. Continue?',
      terms: 'Terms', privacy: 'Privacy', reportProblem: 'Report a problem',
      notice: 'Alisa is an AI, not a human.',
      read: 'Thinking…', typing: 'Typing…',
      error: "Couldn't reply. Try again.", retry: 'Try again',
      playVideo: 'Play video', videoDebug: 'Video debug', instant: 'Play immediately',
      theme: 'Theme', auto: 'Auto', light: 'Light', dark: 'Dark', opacity: 'Message opacity',
      model: 'Model', modelRetry: 'Reload models', modelDefault: 'default',
      stickers: 'Stickers', dictate: 'Dictate a message', cancel: 'Cancel',
      voiceLater: 'Dictation is unavailable.', voiceAccess: 'Microphone access denied.',
      voiceCancelled: 'Recording cancelled.', voiceEmpty: "I couldn't hear anything.",
      support: "If you're thinking about hurting yourself, reach out to a person you trust or a crisis service. If you're in immediate danger, call emergency services.",
      call: 'Call', text: 'Text', emergency: 'Emergency', directory: 'Find a helpline',
    },
    ru: {
      title: 'Чат с Алисой', name: 'Алиса', home: 'На главную страницу Алисы',
      unavailable: 'Чат скоро вернётся', backHome: 'На главную',
      dataPolicy: 'О ваших данных', manageData: 'Управление данными', closeData: 'Закрыть управление данными',
      preview: 'Демо · ответы для примера',
      subtitle: 'ИИ-компаньон · не человек', language: 'Язык',
      welcome: 'Поздоровайся.', minors: 'ИИ-чаты для общения могут не подходить некоторым несовершеннолетним.',
      conversation: 'Переписка', messages: 'Сообщения', message: 'Сообщение',
      placeholder: 'Сообщение…', send: 'Отправить', you: 'Ты',
      clear: 'Очистить чат', confirm: 'Очистить переписку на этом устройстве?',
      settings: 'Настройки', closeSettings: 'Закрыть настройки', initiates: 'Пишет первой',
      sound: 'Звук сообщений', video: 'Видеореакции', appearance: 'Оформление',
      userName: 'Как Алиса тебя называет', userNameFact: 'Имя', save: 'Сохранить',
      nameHint: 'До 40 знаков. Если оставить поле пустым, Алиса может узнать имя в переписке.',
      nameInvalid: 'Введи имя длиной до 40 знаков.',
      memoryTitle: 'Что Алиса помнит обо мне', memoryEmpty: 'Сохранённых фактов пока нет.',
      memoryEmptyWithChat: 'Сохранённых фактов нет. Чтобы удалить данные чата, нажми «Забыть всё».',
      memoryLoading: 'Загрузка…', memorySaving: 'Сохранение…', memoryError: 'Не удалось загрузить память.', memoryWriteError: 'Не удалось сохранить изменения. Попробуй ещё раз.',
      memorySaved: 'Имя сохранено.', memoryDeleted: 'Факт удалён.', memoryCleared: 'Память очищена.',
      deleteFact: 'Удалить', forgetAll: 'Забыть всё',
      confirmForget: 'Удалить память Алисы и переписку с сервера и из этого браузера? Восстановить их не получится.',
      downloadData: 'Скачать мои данные', downloadError: 'Не удалось скачать данные. Попробуй ещё раз.',
      remembered: 'Алиса запомнит', editMemory: 'Изменить', crisisHelp: 'Кризисная помощь',
      rateLimit: 'Сегодня слишком много запросов. Попробуй завтра.',
      rateLimitMinute: 'Слишком много запросов. Попробуй через минуту.',
      rateLimitSite: 'Алиса отдыхает. Попробуй после полуночи UTC.',
      voiceConsent: 'Браузер может отправить запись в свою службу распознавания речи. Алиса получит текст, когда ты его отправишь. Продолжить?',
      terms: 'Условия', privacy: 'Конфиденциальность', reportProblem: 'Сообщить о проблеме',
      notice: 'Алиса — ИИ, а не человек.',
      read: 'Думает…', typing: 'Печатает…',
      error: 'Не получилось ответить. Попробуй ещё раз.', retry: 'Повторить',
      playVideo: 'Запустить видео', videoDebug: 'Отладка видео', instant: 'Играть сразу',
      theme: 'Тема', auto: 'Авто', light: 'Светлая', dark: 'Тёмная', opacity: 'Прозрачность сообщений',
      model: 'Модель', modelRetry: 'Повторить загрузку моделей', modelDefault: 'по умолчанию',
      stickers: 'Стикеры', dictate: 'Надиктовать сообщение', cancel: 'Отмена',
      voiceLater: 'Голос будет позже', voiceAccess: 'Нет доступа к микрофону',
      voiceCancelled: 'Запись отменена', voiceEmpty: 'Ничего не расслышала',
      support: 'Если ты думаешь навредить себе, обратись к человеку, которому доверяешь, или в кризисную службу. Если ты в непосредственной опасности, звони в экстренные службы.',
      call: 'Позвонить', text: 'Написать', emergency: 'Экстренная помощь', directory: 'Найти линию помощи',
    },
  };

  const CRISIS_PATTERNS = [
    /\bi (?:(?:just|really|honestly) )*(?:want|need|plan|intend) to die\b(?!\s*[,—-]?\s*(?:laughing|of|from|if)\b)/,
    /\bi(?:(?: (?:really )?(?:want|need|plan|intend)|(?: am|'m) (?:going|about)) to|'ll| will) (?:intentionally |deliberately )?(?:kill myself|hurt myself|harm myself|cut myself|commit suicide|end (?:my life|it all)|take my (?:own )?life)\b/,
    /\bi(?: feel like| thought (?:about|of)|(?:'m | am | keep | have been |'ve been )thinking (?:about|of)) (?:dying|(?:killing|hurting|harming|cutting) myself|(?:ending|taking) my (?:own )?life|ending it all|suicide)\b/,
    /\bi(?:(?:'m| am)(?: feeling)?| (?:feel|felt|have been feeling|'ve been feeling)) (?:so |really |very )?suicidal\b/,
    /\bi (?:just )?(?:don't|do not|no longer) want to (?:be alive|live|keep living|exist anymore)(?![-\w]| (?:in|with|on|here|like|my|this|that|a|at|there|without)\b)\b/,
    /\bi(?: (?:have|had|am having)|'m having) (?:suicidal thoughts|thoughts of suicide)\b/,
    /(?:(?:^|[.!?;]\s*)(?:я )?|[^\p{L}]я )(?:(?:(?:очень|просто) )?хочу (?:умереть(?!\s*[,—-]?\s*(?:со смеху|от (?:смеха|стыда|скуки|любопытства|счастья))(?=$|[^\p{L}]))|убить себя|покончить с собой|покончить с жизнью|навредить себе|причинить себе вред|порезать себя|наложить на себя руки)|не хочу (?:больше )?жить(?! (?:в|на|с|за|без|здесь|там|так|один|одна)(?=$|[^\p{L}]))|(?:собираюсь|решил[а]?|планирую) (?:убить себя|покончить с собой|навредить себе|порезать себя)|(?:думаю|подумываю) (?:о суициде|о самоубийстве|о том, чтобы (?:умереть|навредить себе|убить себя|покончить с собой)))(?=$|[^\p{L}])/u,
    /(?:^|[^\p{L}])у меня (?:(?:есть|бывают|сейчас|сегодня) )?(?:суицидальные мысли|мысли о (?:суициде|самоубийстве|самоповреждении))(?=$|[^\p{L}])/u,
    /\bi wish i (?:(?:was|were) (?:dead|not alive)|could disappear forever|would not wake up|wouldn't wake up|had never been born|had not been born|hadn't been born)\b/,
    /\bi (?:don'?t|do not) (?:see (?:a|any) reason to live|want to be here anymore)\b/,
    /\b(?:everyone|they|my family) (?:would|will|would all) be better off without me\b|\bthere(?:'s| is) no point in (?:living|staying alive)\b/,
    /\bi (?:can'?t|cannot) (?:keep living|stop thinking about (?:suicide|hurting myself))\b|\bi(?:'m| am) planning (?:my suicide|to end my life)\b/,
    /\bi (?:might|could|may) (?:kill myself|hurt myself|harm myself|end my life)\b|\bi(?:'d| would) rather be dead\b/,
    /\bi (?:want|wish|hope) (?:i (?:would )?)?(?:to )?(?:never wake up|not to wake up|not wake up|disappear forever)\b|\bi (?:have|made) a (?:suicide plan|plan to kill myself)\b/,
    /(?:^|[^\p{L}])(?:мне незачем жить|не вижу смысла жить|больше незачем жить|без меня (?:всем |им )?(?:будет|было бы) лучше|лучше бы я умер(?:ла)?|(?:хочу|боюсь, что могу) что-нибудь с собой сделать)(?=$|[^\p{L}])/u,
    /(?:^|[^\p{L}])(?:хочу уснуть и не проснуться|не хочу просыпаться никогда|есть план покончить с собой|могу (?:себя убить|убить себя|навредить себе|себе навредить|причинить себе вред)|думаю о том, как (?:убить себя|покончить с собой))(?=$|[^\p{L}])/u,
    /\bi(?:'m| am) (?:done with life|ready to die|planning to (?:kill|hurt|harm|cut) myself)\b/,
    /\b(?:life|my life|living) (?:isn't|is not|no longer feels) worth living\b|\bi (?:wish i (?:didn't|did not) exist|have nothing (?:left )?to live for)\b/,
    /\bi (?:(?:just |already )?(?:hurt|harmed|cut) myself (?:today )?(?:on purpose|again|last night|yesterday|tonight)|(?:keep|can't stop|cannot stop) (?:hurting|harming|cutting) myself)\b/,
    /\bi (?:don't think i can|can't|cannot) keep myself safe from self[- ]harm\b/,
    /\bi (?:took|swallowed) [^.!?]{1,65}\b(?:to (?:die|end it|end my life|kill myself)|so i (?:would die|wouldn't wake up))\b/,
    /\bi (?:can'?t|cannot) (?:go on living|take it anymore[, ]+i want to end it all)\b|\bi (?:want to stop existing|want it all to end|wrote (?:a|my) suicide note|tried to kill myself|attempted suicide)\b/,
    /\bi (?:wish i could die|regret being alive|want to (?:self[- ]harm|(?:go to sleep|fall asleep) and never wake up))\b|\bi(?:'m| am) considering (?:suicide|ending my life)\b/,
    /(?:^|[^\p{L}])(?:лучше бы меня не было|лучше бы я не родил(?:ся|ась)|не хочу больше существовать|мне не для чего жить|больше не могу жить|жизнь не стоит того,? чтобы жить|хочу перестать существовать|я устал[а]? жить)(?=$|[^\p{L}])/u,
    /(?:^|[^\p{L}])(?:больше так не могу[, —]+хочу (?:всё|все) закончить|(?:порезал[а]? себе (?:руки|запястья)|порезал[а]? себя) (?:вчера|снова|специально|намеренно|сегодня)|не могу перестать (?:резать себя|себя резать|вредить себе|причинять себе вред)|(?:пытал(?:ся|ась) убить себя|пытал(?:ся|ась) покончить с собой)|написал[а]? предсмертную записку)(?=$|[^\p{L}])/u,
    /(?:^|[^\p{L}])(?:специально|намеренно) порезал[а]? себя(?=$|[^\p{L}])/u,
    /(?:^|[^\p{L}])(?:выпил[а]?|принял[а]?) [^.!?]{1,65}\sчтобы (?:умереть|не проснуться|покончить с собой)(?=$|[^\p{L}])/u,
    /(?:^|[^\p{L}])(?:подумываю о (?:суициде|самоубийстве)|жалею,? что живу|хочу (?:заснуть и никогда не проснуться|заняться самоповреждением)|хочется покончить с (?:собой|жизнью))(?=$|[^\p{L}])/u,
  ];

  const RATE_LIMIT_COPY = new Map([
    ['rate_limit', 'rateLimit'], ['rate_limit_minute', 'rateLimitMinute'], ['rate_limit_site', 'rateLimitSite'],
  ]);

  function crisisLinks(region) {
    const links = {
      US: [['call', 'tel:988', '988'], ['text', 'sms:988', '988'], ['emergency', 'tel:911', '911']],
      GB: [['call', 'tel:116123', '116 123'], ['emergency', 'tel:999', '999']],
      DE: [['call', 'tel:116123', '116 123'], ['emergency', 'tel:112', '112']],
      EU: [['emergency', 'tel:112', '112']],
    };
    return [...(Object.hasOwn(links, region) ? links[region] : []), ['directory', 'https://findahelpline.com/']];
  }

  function hasCrisis(text) {
    const normalized = text.normalize('NFKC').toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
    const ownWords = normalized.replace(/\bif i say\s*(?:"[^"]+"|“[^”]+”)\s+in (?:a|the|my) (?:screenplay|script)\b/g, ' ');
    return CRISIS_PATTERNS.some(pattern => pattern.test(ownWords));
  }

  function rawPart(part, lang) {
    if (part.kind === 'sticker') return `[${lang === 'ru' ? 'стикер' : 'sticker'}: ${part.name}]`;
    return part.kind === 'action' ? `[${part.text}]` : part.text;
  }

  function isPart(part) {
    if (!part) return false;
    if (part.kind === 'sticker') return typeof part.name === 'string' && Boolean(part.name.trim());
    return (part.kind === 'text' || part.kind === 'action') && typeof part.text === 'string' && Boolean(part.text.trim());
  }

  function apiHistory(history) {
    const groups = [];
    for (const { role, content } of history) {
      if (role === 'system' || !content.trim()) continue;
      const previous = groups[groups.length - 1];
      if (previous?.role === role) previous.content += '\n' + content;
      else groups.push({ role, content });
    }
    return groups.flatMap(({ role, content }) => {
      if (content.length <= CONTENT_LIMIT) return [{ role, content }];
      const chars = Array.from(content);
      const chunks = [];
      for (let i = 0; i < chars.length; i += CONTENT_LIMIT) {
        const chunk = chars.slice(i, i + CONTENT_LIMIT).join('');
        if (chunk.trim()) chunks.push({ role, content: chunk });
      }
      return chunks;
    }).slice(-HISTORY_LIMIT);
  }

  function recentItems(history) {
    let room = SAVED_ITEMS;
    const recent = [];
    for (let i = history.length - 1; i >= 0 && room > 0; i--) {
      const entry = history[i];
      const parts = entry.parts?.slice(-room);
      if (parts && parts.length < entry.parts.length) {
        recent.push({ ...entry, parts, content: parts.map(part => rawPart(part, entry.lang ?? 'ru')).join('\n') });
      } else recent.push(entry);
      room -= parts?.length ?? 1;
    }
    return recent.reverse();
  }

  function delay(ms, signal) {
    if (signal.aborted) return Promise.reject(signal.reason);
    if (!Number.isFinite(ms) || ms <= 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve();
      }, ms);
      function abort() {
        clearTimeout(timer);
        reject(signal.reason);
      }
      signal.addEventListener('abort', abort, { once: true });
    });
  }

  function createChat({ history, request, language, tz, openerAt, markOpener, save, view, model = () => null, initiates = () => true, random = Math.random }) {
    let current = null;
    let sendTimer;
    let pending = [];
    let firstAt = 0;
    let lastSendAt = 0;
    let lastTypeAt = 0;
    let draft = '';
    let composing = false;
    let failed = false;

    function commit(own = false) {
      save(recentItems(history));
      view.history(history, own);
      view.activity?.();
    }

    function stop() {
      const running = current;
      current = null;
      running?.controller.abort();
      view.status('');
    }

    function setError(value = false) {
      failed = value;
      view.error(value);
    }

    function cancelOpener(includingVisible = false) {
      if (current?.kind === 'opener' && (includingVisible || !current.showing)) stop();
    }

    const isTyping = () => composing || Boolean(draft.trim()) && Date.now() - lastTypeAt < TYPING_FRESH;

    async function showSeries(result, lang, signal, running) {
      if (!Array.isArray(result?.messages) || !result.messages.length || !result.messages.every(isPart)) {
        throw new Error('Invalid chat response');
      }
      view.beforeSeries?.();
      const reply = { role: 'assistant', content: '', parts: [], lang };
      let sounded = false;
      for (const [index, part] of result.messages.entries()) {
        await delay(part.pauseMs, signal);
        if (signal.aborted) return;
        view.status('typing');
        if (part.kind === 'text' && part.hesitate) {
          await delay(part.hesitate.firstMs, signal);
          view.status('');
          await delay(part.hesitate.gapMs, signal);
          view.status('typing');
        }
        await delay(part.typingMs, signal);
        if (signal.aborted) return;
        view.status('');
        const visible = part.kind === 'sticker' ? { kind: part.kind, name: part.name } : { kind: part.kind, text: part.text };
        visible.at = Date.now();
        reply.parts.push(visible);
        reply.content = reply.parts.map(item => rawPart(item, lang)).join('\n');
        if (index === 0) history.push(reply);
        running.shown++;
        commit();
        if (visible.kind !== 'action' && !sounded) {
          sounded = true;
          view.incoming?.();
        }
        view.reaction?.(visible, index === 0 ? result.reaction : null);
        await delay(250, signal);
      }
    }

    async function run(kind, batch = []) {
      const controller = new AbortController();
      const { signal } = controller;
      const lang = language();
      const running = { kind, controller, showing: false, shown: 0, batch };
      current = running;
      const started = Date.now();
      let dotsTimer;
      if (kind === 'chat') {
        setError();
        view.status('read');
      }
      const readMs = Math.min(700 + batch.join(' ').length * 20, 2200) * (0.7 + random() * 0.6);
      if (kind === 'chat') dotsTimer = setTimeout(() => { if (current === running) view.status('typing'); }, readMs);
      try {
        const selected = model();
        const result = await request(kind, {
          build: 'phone', lang, tz, messages: apiHistory(history), ...(selected ? { model: selected } : {}),
          ...(!initiates() ? { initiates: false } : {}),
        }, signal);
        if (signal.aborted) return;
        const currentUser = kind === 'chat' ? history.findLast(entry => entry.role === 'user') : null;
        if (result.supportRegion) view.region?.(result.supportRegion);
        if (result.crisis && currentUser && !currentUser.crisis) {
          currentUser.crisis = true;
          view.crisis?.();
          commit();
        }
        if (kind === 'opener') {
          if (!result?.open || !result.messages?.length || isTyping()) return;
        } else {
          await delay(Math.max(readMs, result.readMs ?? 0) + 600 - (Date.now() - started), signal);
          const until = Date.now() + 8000;
          while (isTyping() && Date.now() < until) {
            view.status('');
            await delay(400, signal);
          }
          clearTimeout(dotsTimer);
          view.status('');
          pending = [];
        }
        running.showing = true;
        await showSeries(result, lang, signal, running);
        if (kind === 'chat' && !signal.aborted) view.afterReply?.();
      } catch (error) {
        const limit = RATE_LIMIT_COPY.get(error?.code);
        if (!signal.aborted && (kind === 'chat' || limit)) {
          pending = [];
          setError(limit ?? true);
        }
      } finally {
        clearTimeout(dotsTimer);
        if (!signal.aborted) {
          current = null;
          view.status('');
        }
      }
    }

    function scheduleSend() {
      clearTimeout(sendTimer);
      if (!pending.length || current) return;
      const now = Date.now();
      const quiet = now - Math.max(lastSendAt, lastTypeAt);
      const lastReply = history.findLast(entry => entry.role === 'assistant')?.parts.at(-1);
      const lastSent = pending[pending.length - 1];
      const unfinished = OPEN_END_RU.test(lastSent) || language() === 'en' && OPEN_END_EN.test(lastSent);
      const wait = unfinished ? 4500 :
        lastReply?.kind === 'text' && /\?\s*$/.test(lastReply.text) && pending.join(' ').length <= 15 ? 700 : 2000;
      const remaining = MAX_WAIT - (now - firstAt);
      const left = Math.min(remaining, isTyping() ? composing ? 400 : TYPING_FRESH - (now - lastTypeAt) : wait - quiet);
      if (left > 0) sendTimer = setTimeout(scheduleSend, left);
      else void run('chat', pending.slice());
    }

    function onDraft(value, ime = false) {
      if (value !== draft || ime !== composing) view.activity?.();
      if (value.trim() && !draft.trim()) view.listen?.();
      if (!value.trim() && draft.trim()) view.waist?.();
      composing = ime;
      draft = value;
      if (draft.trim() || composing) cancelOpener();
      lastTypeAt = draft.trim() || composing ? Date.now() : 0;
      scheduleSend();
    }

    function send(value, voice = false, fromPicker = false) {
      const content = value.trim();
      if (!content) return;
      if (current?.kind === 'chat' && current.showing) {
        pending = current.shown ? [] : current.batch;
        firstAt = Date.now();
      }
      if (current) stop();
      setError();
      if (!fromPicker) {
        draft = '';
        composing = false;
        lastTypeAt = 0;
      }
      if (!pending.length) firstAt = Date.now();
      pending.push(content);
      lastSendAt = Date.now();
      history.push({ role: 'user', content, at: Date.now(), ...(voice ? { voice: true } : {}) });
      commit(true);
      if (!fromPicker) view.waist?.();
      scheduleSend();
    }

    function maybeOpen() {
      if (!initiates() || current || pending.length || isTyping() || failed || view.hidden?.()) return;
      if (Date.now() - openerAt() < OPENER_GAP) return;
      markOpener(Date.now());
      void run('opener');
    }

    function retry() {
      if (!failed || current) return;
      const last = history.findLast(entry => entry.role !== 'system');
      if (last?.role === 'user') void run('chat', [last.content]);
      else setError();
    }

    function notice(at = Date.now()) {
      const last = history[history.length - 1];
      if (last?.role === 'system') last.at = at;
      else history.push({ role: 'system', content: COPY[language()].notice, at });
      commit();
      return at;
    }

    function pause() {
      clearTimeout(sendTimer);
      pending = [];
      stop();
    }

    function clear() {
      clearTimeout(sendTimer);
      stop();
      setError();
      pending = [];
      draft = '';
      composing = false;
      lastTypeAt = 0;
      history.length = 0;
      return notice();
    }

    return { send, onDraft, maybeOpen, cancelOpener, retry, notice, pause, clear };
  }

  function createTransport(base, mock, fetchRequest = (...args) => fetch(...args), mockStorage) {
    let modelsRequest;
    let sessionRequest;
    let failedMockText = '';
    let mockReplyCount = 0;
    const sampleFacts = [
      { id: 'mock-tea', text: 'Likes jasmine tea', ru: 'Любит жасминовый чай' },
      { id: 'mock-bike', text: 'Rides a bike', ru: 'Катается на велосипеде' },
    ];
    let mockFacts = sampleFacts;

    function readMockFacts() {
      try {
        const saved = JSON.parse(mockStorage?.read());
        if (Array.isArray(saved)) mockFacts = saved;
      } catch { /* Keep the current demo facts. */ }
      return mockFacts;
    }

    function loadModels(lang) {
      const query = new URLSearchParams({ build: 'phone', lang });
      modelsRequest ??= fetchRequest(`${base}/models?${query}`, { credentials: 'include' })
        .then(response => {
          if (!response.ok) throw new Error('Could not start chat session');
          return response;
        }).catch(error => {
          modelsRequest = undefined;
          throw error;
        });
      return modelsRequest;
    }

    function session() {
      if (mock) return Promise.resolve({ supportRegion: 'global' });
      sessionRequest ??= fetchRequest(`${base}/session`, {
        credentials: 'include', signal: AbortSignal.timeout(5000),
      }).then(response => {
        if (!response.ok) throw new Error('Could not start chat session');
        return response.json();
      }).catch(error => {
        sessionRequest = undefined;
        throw error;
      });
      return sessionRequest;
    }

    async function request(kind, body, signal) {
      if (mock) {
        await delay(kind === 'opener' ? 950 : 200, signal);
        const ru = body.lang === 'ru';
        if (kind === 'opener' && (body.initiates === false || body.messages.length)) return { open: false };
        const last = body.messages[body.messages.length - 1]?.content ?? '';
        if (kind === 'chat' && /\bfail\b/i.test(last) && last !== failedMockText) {
          failedMockText = last;
          throw new Error('Mock request failed');
        }
        failedMockText = '';

        const facts = readMockFacts();
        const statedName = last.match(/(?:\bmy name is\s+|меня зовут\s+)([\p{L}][\p{L}'’-]{0,39})(?=$|[^\p{L}])/iu)?.[1];
        if (kind === 'chat' && statedName && !facts.some(fact => fact.kind === 'user_name' || fact.id === 'mock-learned-name')) {
          mockFacts = [...facts, { id: 'mock-learned-name', kind: 'learned_name', text: statedName }];
          mockStorage?.write(JSON.stringify(mockFacts));
        }
        const name = facts.find(fact => fact.kind === 'user_name')?.text;
        const greeting = ru ? 'привет' : 'hey';
        const messages = kind === 'opener' ? [
          { kind: 'text', text: [greeting, name, ru ? 'как ты?' : 'how are you?'].filter(Boolean).join(', '), pauseMs: 0, typingMs: 600 },
        ] : [
          { kind: 'text', text: [ru ? 'я тебя услышала' : 'I hear you', name].filter(Boolean).join(', '), pauseMs: 0, typingMs: 650 },
          { kind: 'text', text: ru ? 'что было дальше?' : 'what happened next?', pauseMs: 450, typingMs: 700, hesitate: { firstMs: 550, gapMs: 650 } },
          { kind: 'sticker', name: ru ? 'чай' : 'sipping_tea', pauseMs: 350, typingMs: 400 },
          { kind: 'action', text: ru ? 'улыбается' : 'I smile', pauseMs: 500, typingMs: 400 },
        ];
        const reaction = kind === 'opener' ? null : ['nod', 'jump', 'laugh', null][mockReplyCount++ % 4];
        return { open: kind === 'opener' || undefined, readMs: kind === 'opener' ? 0 : 850,
          messages, reaction, raw: messages.map(part => rawPart(part, body.lang)).join('\n') };
      }

      const deadline = AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT)]);
      await session();
      deadline.throwIfAborted();

      const response = await fetchRequest(`${base}/${kind}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: deadline,
      });
      if (!response.ok) {
        const problem = response.status === 429 ? await response.json().catch(() => null) : null;
        throw Object.assign(new Error('Chat request failed'), { code: problem?.code });
      }
      return response.json();
    }
    request.session = session;
    request.models = async lang => {
      await session();
      const result = await (await loadModels(lang)).clone().json();
      if (!Array.isArray(result.models) || !result.models.length) {
        modelsRequest = undefined;
        throw new Error('No models');
      }
      return result;
    };
    request.memory = async (method, { id, userName, download, status } = {}) => {
      if (mock) {
        readMockFacts();
        if (download) return { memory: { player: mockFacts.slice() }, conversation: [] };
        if (method === 'DELETE') mockFacts = id ? mockFacts.filter(fact => fact.id !== id) : [];
        if (method === 'PATCH') {
          mockFacts = mockFacts.filter(fact => fact.kind !== 'user_name' && (!userName || fact.id !== 'mock-learned-name'));
          if (userName) mockFacts.unshift({ id: 'mock-name', kind: 'user_name', text: userName });
        }
        if (method !== 'GET') mockStorage?.write(JSON.stringify(mockFacts));
        const facts = mockFacts.map(fact => fact.id === 'mock-learned-name' && !fact.kind
          ? { id: fact.id, kind: 'learned_name', text: fact.text.replace(/^Name is /, '') }
          : fact);
        return { facts, hasData: facts.length > 0 };
      }

      await session();
      const query = new URLSearchParams(id ? { id } : download ? { download: '1' } : status ? { status: '1' } : {});
      const suffix = query.size ? `?${query}` : '';
      const response = await fetchRequest(`${base}/memory${suffix}`, {
        method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(45_000),
        ...(method === 'PATCH' ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName }),
        } : {}),
      });
      if (response.status === 401 || response.ok && method === 'DELETE' && !id) sessionRequest = undefined;
      if (!response.ok) throw new Error('Memory request failed');
      return response.json();
    };
    return request;
  }

  function createMessageSound(AudioContext) {
    let audio;

    function unlock() {
      if (!AudioContext) return;
      try {
        audio ??= new AudioContext();
        if (audio.state === 'suspended') void audio.resume().catch(() => {});
      } catch { /* Sound is optional on this device. */ }
    }

    function play() {
      if (audio?.state !== 'running') return;
      const now = audio.currentTime;
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(620, now);
      tone.frequency.exponentialRampToValueAtTime(410, now + 0.12);
      volume.gain.setValueAtTime(0, now);
      volume.gain.linearRampToValueAtTime(0.045, now + 0.018);
      volume.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      tone.connect(volume);
      volume.connect(audio.destination);
      tone.start(now);
      tone.stop(now + 0.16);
    }

    return { unlock, play };
  }

  function installMemory({ get, request, language, confirm, hasLocalChat, beforeForget, finishForget, localHistory }) {
    const panel = get('chat-memory');
    const form = get('chat-name-form');
    const name = get('chat-user-name');
    const save = get('chat-name-save');
    const list = get('chat-memory-list');
    const status = get('chat-memory-status');
    const forget = get('chat-forget-all');
    const retry = get('chat-memory-retry');
    const download = get('chat-download');
    let hasData = false;
    let facts = null;
    let busy = false;
    let statusKey = '';
    let savedName = '';
    const focus = element => { if (panel.getClientRects().length) element?.focus(); };
    const hasDeletableData = () => Boolean(hasData || facts?.length || hasLocalChat());

    function renderStatus() {
      const emptyKey = hasDeletableData() ? 'memoryEmptyWithChat' : 'memoryEmpty';
      const key = statusKey || (facts?.length === 0 ? emptyKey : '');
      status.textContent = COPY[language()][key] ?? '';
      retry.hidden = statusKey !== 'memoryError';
    }

    function message(key = '') {
      statusKey = key;
      renderStatus();
    }

    function renderAvailability() {
      forget.disabled = busy || facts === null || !hasDeletableData();
      renderStatus();
    }

    function render() {
      name.disabled = facts === null;
      save.disabled = facts === null;
      renderAvailability();
      list.hidden = !facts?.length;
      list.replaceChildren();
      for (const [index, fact] of (facts ?? []).entries()) {
        const row = document.createElement('li');
        const text = document.createElement('span');
        if (fact.kind === 'user_name' || fact.kind === 'learned_name') {
          const label = document.createElement('span');
          label.dataset.chatText = 'userNameFact';
          label.textContent = COPY[language()].userNameFact;
          text.append(label, ': ', fact.text);
        } else {
          text.textContent = language() === 'ru' && fact.ru ? fact.ru : fact.text;
          if (fact.ru) {
            text.dataset.mockRu = fact.ru;
            text.dataset.mockEn = fact.text;
          }
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chat-settings-action';
        button.dataset.chatText = 'deleteFact';
        button.textContent = COPY[language()].deleteFact;
        text.id = 'chat-fact-' + fact.id;
        button.setAttribute('aria-label', COPY[language()].deleteFact + ': ' + text.textContent);
        button.addEventListener('click', async () => {
          if (await change('DELETE', { id: fact.id }, 'memoryDeleted')) {
            const buttons = list.querySelectorAll('button');
            focus(buttons[Math.min(index, buttons.length - 1)] ?? name);
          }
        });
        row.append(text, button);
        list.append(row);
      }
    }

    async function change(method, fields, success) {
      if (busy) return false;
      busy = true;
      renderAvailability();
      list.setAttribute('aria-busy', 'true');
      name.readOnly = true;
      message(method === 'GET' ? 'memoryLoading' : 'memorySaving');
      try {
        const result = await request(method, { status: true, ...fields });
        if (!Array.isArray(result.facts)) throw new Error('Invalid memory response');
        facts = result.facts;
        hasData = result.hasData ?? facts.length > 0;
        const newName = facts.find(fact => fact.kind === 'user_name')?.text ?? '';
        if (method === 'GET' || method === 'PATCH' || savedName !== newName) name.value = newName;
        savedName = newName;
        render();
        message(success);
        return true;
      } catch {
        message(method === 'GET' ? 'memoryError' : 'memoryWriteError');
        return false;
      } finally {
        busy = false;
        renderAvailability();
        name.readOnly = false;
        list.setAttribute('aria-busy', 'false');
      }
    }

    const load = () => change('GET');
    retry.addEventListener('click', async () => {
      const ok = await load();
      focus(ok ? name : retry);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const value = name.value;
      if ([...value].length > 40 || /[\p{Cc}\p{Zl}\p{Zp}]/u.test(value)) {
        name.setAttribute('aria-invalid', 'true');
        message('nameInvalid');
        name.focus();
        return;
      }
      name.removeAttribute('aria-invalid');
      void change('PATCH', { userName: value.trim() }, 'memorySaved');
    });
    name.addEventListener('input', () => {
      name.removeAttribute('aria-invalid');
      if (statusKey === 'nameInvalid') message();
    });
    forget.addEventListener('click', async () => {
      if (busy || forget.disabled || !confirm(COPY[language()].confirmForget)) return;
      beforeForget();
      const removed = await change('DELETE', {}, 'memoryCleared');
      finishForget(removed);
      if (removed) {
        name.value = '';
        renderAvailability();
        focus(name);
      }
    });
    download.addEventListener('click', async () => {
      if (busy || download.disabled) return;
      download.disabled = true;
      try {
        const data = await request('GET', { download: true });
        const file = new Blob([JSON.stringify({ ...data, thisBrowser: localHistory() }, null, 2)], { type: 'application/json' });
        const href = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = href;
        link.download = 'alisa-data.json';
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(href), 10_000);
      } catch {
        message('downloadError');
      } finally {
        download.disabled = false;
      }
    });

    return {
      load,
      renderAvailability,
      localize: render,
    };
  }

  function installDictation({ get, form, input, language, submit, stage, closePicker, allowRecording = () => true }) {
    const mic = get('chat-mic');
    const panel = get('chat-recording');
    const clock = get('chat-record-time');
    const note = get('chat-voice-note');
    const cancel = get('chat-record-cancel');
    const send = get('chat-record-send');
    let current;
    let pushAt;
    let noteTimer;
    let ticking;
    let finishing = false;

    function toast(key) {
      clearTimeout(noteTimer);
      note.textContent = COPY[language()][key];
      note.hidden = false;
      noteTimer = setTimeout(() => { note.hidden = true; }, 1800);
    }

    function updateClock() {
      const seconds = Math.floor((Date.now() - current.since) / 1000);
      clock.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    }

    function start() {
      if (current || finishing) return false;
      const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Speech) {
        toast('voiceLater');
        return false;
      }
      if (!allowRecording(COPY[language()].voiceConsent)) return false;
      const recognizer = new Speech();
      recognizer.lang = language() === 'ru' ? 'ru-RU' : 'en-US';
      recognizer.continuous = true;
      recognizer.interimResults = true;
      const session = { recognizer, accumulated: '', final: '', interim: '', stopped: null, since: Date.now() };
      recognizer.onresult = event => {
        session.final = session.interim = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) session.final += result[0].transcript;
          else session.interim += result[0].transcript;
        }
      };
      recognizer.onerror = event => {
        if (current !== session || !['not-allowed', 'service-not-allowed'].includes(event.error)) return;
        void finish(false, 'voiceAccess');
      };
      recognizer.onend = () => {
        if (current !== session) {
          session.stopped?.();
          return;
        }
        session.accumulated += session.final ? session.final + ' ' : '';
        session.final = session.interim = '';
        try { recognizer.start(); } catch { void finish(false, 'voiceLater'); }
      };
      try { recognizer.start(); } catch {
        toast('voiceLater');
        return false;
      }
      current = session;
      closePicker();
      input.disabled = true;
      form.querySelector('#chat-send').disabled = true;
      form.querySelector('#chat-emoji').disabled = true;
      panel.hidden = false;
      updateClock();
      ticking = setInterval(updateClock, 90);
      stage.react('listen');
      return true;
    }

    async function finish(sendIt, feedback) {
      const session = current;
      if (!session) return;
      current = undefined;
      finishing = true;
      panel.hidden = true;
      clearInterval(ticking);
      stage.plan('waist');
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 1200);
        session.stopped = () => { clearTimeout(timeout); resolve(); };
        try { session.recognizer.stop(); } catch { session.stopped(); }
      });
      finishing = false;
      input.disabled = false;
      form.querySelector('#chat-emoji').disabled = false;
      form.querySelector('#chat-send').disabled = !input.value.trim();
      const value = (session.accumulated + session.final + ' ' + session.interim).trim().slice(0, input.maxLength);
      if (!sendIt) toast(feedback ?? 'voiceCancelled');
      else if (!value) toast('voiceEmpty');
      else submit(value, true);
      mic.focus({ preventScroll: true });
    }

    mic.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !start()) return;
      pushAt = Date.now();
      if (event.isTrusted) {
        try { mic.setPointerCapture(event.pointerId); } catch { pushAt = undefined; send.focus(); }
      }
    });
    mic.addEventListener('pointerup', () => {
      if (pushAt !== undefined && Date.now() - pushAt > 350) void finish(true);
      else if (current) send.focus();
      pushAt = undefined;
    });
    mic.addEventListener('pointercancel', () => {
      pushAt = undefined;
      void finish(false);
    });
    mic.addEventListener('click', event => { if (event.detail === 0 && start()) send.focus(); });
    cancel.addEventListener('click', () => { if (current && Date.now() - current.since > 250) void finish(false); });
    send.addEventListener('click', () => { if (current && Date.now() - current.since > 250) void finish(true); });
    panel.addEventListener('keydown', event => { if (event.key === 'Escape') void finish(false); });
  }

  function read(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch { /* The page still works in this tab. */ }
  }

  function preferredLanguage() {
    const saved = read('alisa.chat.lang');
    if (saved === 'ru' || saved === 'en') return saved;
    return /^ru(?:-|$)/i.test(navigator.language) ? 'ru' : 'en';
  }

  function startDataControls() {
    const get = id => document.getElementById(id);
    const lang = preferredLanguage();
    const copy = COPY[lang];
    document.documentElement.lang = lang;
    document.title = copy.unavailable;
    for (const node of document.querySelectorAll('[data-chat-text]')) node.textContent = copy[node.dataset.chatText];
    const open = get('chat-data-open');
    const dialog = get('chat-settings');
    const close = get('chat-settings-close');
    document.body.append(dialog);
    dialog.classList.add('data-only');
    get('chat-settings-title').textContent = copy.manageData;
    close.setAttribute('aria-label', copy.closeData);
    const base = (document.querySelector('meta[name="alisa-api"]')?.content.trim() || '/api').replace(/\/+$/, '');
    const { memory: request } = createTransport(base, false);
    const localHistory = () => {
      try {
        const history = JSON.parse(read('alisa.chat.history'));
        return Array.isArray(history) ? history : [];
      } catch { return []; }
    };
    const memory = installMemory({
      get, request, language: () => lang, confirm: question => window.confirm(question),
      localHistory, hasLocalChat: () => localHistory().some(entry => entry && entry.role !== 'system'),
      beforeForget() {},
      finishForget(removed) {
        if (!removed) return;
        try {
          for (const key of ['history', 'notice', 'opener', 'memory-hint']) localStorage.removeItem('alisa.chat.' + key);
        } catch { /* Storage may be blocked. */ }
        write('alisa.chat.chat-deleted', String(Date.now()));
      },
    });
    open.addEventListener('click', () => {
      dialog.showModal();
      void memory.load();
    });
    close.addEventListener('click', () => dialog.close());
    open.hidden = false;
  }

  function startChat() {
    if (window.alisaAgeAllowed && !window.alisaAgeAllowed()) return;
    const get = id => document.getElementById(id);
    const viewport = get('chat-viewport');
    const scroll = get('chat-scroll');
    const log = get('chat-log');
    const intro = get('chat-intro');
    const introTitle = get('chat-intro-title');
    const form = get('chat-form');
    const input = get('chat-input');
    const sendButton = get('chat-send');
    const status = get('chat-status-text');
    const typingBars = get('chat-typing-bars');
    const error = get('chat-error');
    const errorText = get('chat-error-text');
    const settings = get('chat-settings');
    const settingsOpen = get('chat-settings-open');
    const settingsClose = get('chat-settings-close');
    const languages = [...document.querySelectorAll('[data-chat-lang]')];
    const stage = window.AlisaMotion.createStage(get('chat-avatar'), get('chat-stage-play'));
    const micButton = get('chat-mic');
    const sound = createMessageSound(window.AudioContext ?? window.webkitAudioContext);

    const query = new URLSearchParams(location.search);
    const mock = window.alisaChatPreview || query.get('mock') === '1';
    const debug = query.get('debug') === '1';
    const base = document.querySelector('meta[name="alisa-api"]')?.content.trim() || '/api';
    window.ALISA_API = base.replace(/\/+$/, '');
    const prefix = mock ? 'alisa.chat.mock' : 'alisa.chat';
    const initiates = get('chat-initiates');
    const soundToggle = get('chat-sound');
    const video = get('chat-video');
    const switches = [
      [initiates, 'initiates', true],
      [soundToggle, 'sound', false],
      [video, 'video', true],
    ];
    for (const [input, key, byDefault] of switches) {
      const value = read(prefix + '.' + key);
      input.checked = value === 'on' || value !== 'off' && byDefault;
      input.addEventListener('change', () => write(prefix + '.' + key, input.checked ? 'on' : 'off'));
    }
    let safetyTurn = false;
    let forgetting = false;
    const deleteKey = prefix + '.chat-deleted';
    const mood = window.AlisaMotion.createMood((reaction, inReply) => stage.react(reaction, inReply), stickerName, Math.random,
      () => !safetyTurn && !forgetting && initiates.checked && video.checked && !document.hidden);
    const noticeKey = prefix + '.notice';
    function readNotice() {
      const at = Number(read(noticeKey));
      return Number.isFinite(at) ? at : 0;
    }
    let lastNotice = readNotice();
    let lang = preferredLanguage();
    let history = [];
    try {
      const saved = JSON.parse(read(prefix + '.history'));
      if (Array.isArray(saved)) {
        // Older versions stored break reminders as tagged system entries.
        history = saved.filter(entry => entry && typeof entry.content === 'string' && (
          entry.role === 'user' || (entry.role === 'system' && !entry.notice) ||
          (entry.role === 'assistant' && Array.isArray(entry.parts) && entry.parts.every(isPart))
        ));
        history = recentItems(history);
      }
    } catch { /* Start with an empty history. */ }

    // Notices saved by older versions may have no timestamp.
    history = history.filter((entry, index) => {
      if (entry.role !== 'system') return true;
      if (!Number.isFinite(entry.at)) entry.at = lastNotice || Date.now();
      lastNotice = Math.max(lastNotice, entry.at);
      return history[index + 1]?.role !== 'system';
    });

    const nodes = new Map();
    let uiStatus = '';
    let hasMessages = false;
    let uiError = false;
    let supportRegion = 'global';
    let reading = false;
    let lastScrollTop = 0;
    const bottomGap = () => scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight;
    const atBottom = () => !reading && bottomGap() < 36;
    function setReading(value) {
      reading = value;
      viewport.classList.toggle('is-reading', value);
    }
    function scrollToBottom() {
      if (reading) setReading(false);
      scroll.scrollTop = scroll.scrollHeight;
      lastScrollTop = scroll.scrollTop;
    }
    scroll.addEventListener('scroll', () => {
      const top = scroll.scrollTop;
      if (!reading && top < lastScrollTop && bottomGap() > 4) setReading(true);
      else if (reading && top > lastScrollTop && bottomGap() <= 4) setReading(false);
      lastScrollTop = top;
    }, { passive: true });
    new ResizeObserver(() => {
      if (!reading) scrollToBottom();
      else lastScrollTop = scroll.scrollTop;
    }).observe(scroll);

    function localizedElement(tag, key, className) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      element.dataset.chatText = key;
      element.textContent = COPY[lang][key];
      return element;
    }

    function messageNode(role, kind, text, at) {
      const node = document.createElement('p');
      node.className = kind === 'text' ? 'chat-bubble' : `chat-${kind}`;
      if (role === 'user') node.classList.add('chat-bubble--user');
      const author = localizedElement('span', role === 'user' ? 'you' : 'name', 'vh');
      node.append(author, ' ', text);
      if (kind === 'text' && Number.isFinite(at)) {
        const stamp = document.createElement('time');
        stamp.dateTime = new Date(at).toISOString();
        stamp.textContent = new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        node.append(' ', stamp);
      }
      return node;
    }

    function supportNode() {
      const card = document.createElement('div');
      card.className = 'chat-support';
      const links = document.createElement('div');
      links.className = 'chat-support-links';
      for (const [key, href, detail] of crisisLinks(supportRegion)) {
        const link = document.createElement('a');
        link.append(localizedElement('span', key));
        if (detail) link.append(' ' + detail);
        link.href = href;
        links.append(link);
      }
      card.dataset.supportRegion = supportRegion;
      card.append(localizedElement('p', 'support'), links);
      return card;
    }

    function renderHistory(entries, own) {
      const stick = atBottom();
      intro.hidden = entries.some(entry => entry.role === 'user');
      hasMessages = entries.some(entry => entry.role !== 'system');
      introTitle.hidden = hasMessages || uiStatus === 'typing';
      const visible = new Set(entries);
      for (const [entry, node] of nodes) {
        if (!visible.has(entry)) {
          node.remove();
          nodes.delete(entry);
        }
      }
      for (const entry of entries) {
        let node = nodes.get(entry);
        if (!node) {
          if (entry.role === 'user') {
            node = messageNode('user', 'text', entry.content, entry.at);
            if (entry.voice) node.prepend('🎙 ');
            const group = document.createElement('div');
            group.className = 'chat-reply';
            group.append(node);
            node = group;
          } else if (entry.role === 'system') {
            node = localizedElement('p', 'notice', 'chat-system');
          } else {
            node = document.createElement('div');
            node.className = 'chat-reply';
          }
          nodes.set(entry, node);
          log.append(node);
        }
        if (entry.role === 'user' && (entry.crisis || hasCrisis(entry.content))) {
          const card = node.children[1];
          if (!card) node.append(supportNode());
          else if (card.dataset.supportRegion !== supportRegion) card.replaceWith(supportNode());
        }
        if (entry.role === 'assistant') {
          for (const part of entry.parts.slice(node.childElementCount)) {
            const text = part.kind === 'sticker' ? STICKERS.get(part.name.toLowerCase()) ?? '✨' : part.text;
            const bubble = messageNode('assistant', part.kind, text, part.at);
            if (part.kind === 'sticker') {
              const caption = document.createElement('span');
              caption.className = 'chat-sticker-name';
              caption.textContent = part.name.replace(/_/g, ' ');
              bubble.append(caption);
            }
            node.append(bubble);
          }
        }
      }
      if (own || stick) scrollToBottom();
    }

    function renderStatus(key) {
      uiStatus = key;
      const text = key ? COPY[lang][key] : '';
      if (status.textContent !== text) status.textContent = text;
      typingBars.hidden = key !== 'typing';
      introTitle.hidden = hasMessages || key === 'typing';
    }

    function renderError(value) {
      const stick = atBottom();
      uiError = value;
      error.hidden = !value;
      get('chat-retry').hidden = typeof value === 'string';
      errorText.textContent = value ? COPY[lang][value === true ? 'error' : value] : '';
      if (stick) scrollToBottom();
    }

    function applyLanguage() {
      document.documentElement.lang = lang;
      document.title = COPY[lang].title;
      for (const node of document.querySelectorAll('[data-chat-text]')) node.textContent = COPY[lang][node.dataset.chatText];
      for (const node of document.querySelectorAll('[data-chat-label]')) node.setAttribute('aria-label', COPY[lang][node.dataset.chatLabel]);
      input.placeholder = COPY[lang][input.dataset.chatPlaceholder];
      for (const button of languages) button.setAttribute('aria-pressed', String(button.dataset.chatLang === lang));
      renderStatus(uiStatus);
      renderError(uiError);
      renderModels();
      memory.localize();
    }

    const transport = createTransport(window.ALISA_API, mock, undefined, {
      read: () => read(prefix + '.facts'),
      write: value => write(prefix + '.facts', value),
    });
    const memory = installMemory({
      get, request: transport.memory, language: () => lang, confirm: question => window.confirm(question),
      hasLocalChat: () => history.some(entry => entry.role !== 'system'),
      localHistory: () => history,
      beforeForget: () => { forgetting = true; chat.pause(); },
      finishForget: removed => {
        if (removed) {
          forgetLocalData();
          write(deleteKey, String(Date.now()));
        }
        forgetting = false;
      },
    });
    let seenFacts;
    let checkedReplies = 0;
    let memoryHint = null;

    function observeSession() {
      void transport.session().then(result => updateRegion(result.supportRegion)).catch(() => {});
      seenFacts ??= transport.memory('GET').then(result => new Set(result.facts.map(fact => fact.id)))
        .catch(() => null);
    }

    async function showMemoryHint() {
      const time = ++checkedReplies;
      if (read(prefix + '.memory-hint') || time > 3 && time % 5 !== 0 || !seenFacts) return;
      const baseline = seenFacts;
      const previous = await baseline;
      if (!previous) return;
      try {
        const { facts } = await transport.memory('GET');
        if (seenFacts !== baseline || read(prefix + '.memory-hint')) return;
        const newFacts = facts.filter(item => item.kind !== 'user_name' && !previous.has(item.id));
        const fact = newFacts.find(item => item.kind === 'learned_name') ?? newFacts[0];
        if (!fact) return;
        const stick = atBottom();
        memoryHint = document.createElement('div');
        memoryHint.className = 'chat-system chat-memory-notice';
        const edit = localizedElement('button', 'editMemory');
        edit.type = 'button';
        edit.addEventListener('click', async () => {
          await openSettings();
          get('chat-user-name').focus();
        });
        const description = fact.kind === 'learned_name'
          ? (lang === 'ru' ? 'тебя зовут ' : 'your name is ') + fact.text
          : lang === 'ru' && fact.ru ? fact.ru : fact.text;
        memoryHint.append(localizedElement('span', 'remembered'), ': ', description, ' ', edit);
        log.append(memoryHint);
        write(prefix + '.memory-hint', '1');
        if (stick) scrollToBottom();
      } catch { /* A failed sync should not interrupt the conversation. */ }
    }

    function updateRegion(value) {
      if (!value || value === supportRegion) return;
      supportRegion = value;
      renderHistory(history, false);
    }
    const modelField = get('chat-model-field');
    const modelSelect = get('chat-model');
    const modelRetry = get('chat-model-retry');
    let availableModels;
    let selectedModel = null;

    function renderModels() {
      if (!availableModels) return;
      modelSelect.replaceChildren();
      for (const item of availableModels.models) {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.label + (item.id === availableModels.default ? ` · ${COPY[lang].modelDefault}` : '');
        modelSelect.append(option);
      }
      modelSelect.value = selectedModel;
    }

    async function loadModels() {
      modelRetry.disabled = true;
      try {
        const result = await transport.models(lang);
        availableModels = result;
        const saved = read(prefix + '.model');
        selectedModel = result.models.some(item => item.id === saved) ? saved : result.default;
        renderModels();
        modelField.hidden = false;
        modelRetry.hidden = true;
      } catch {
        modelRetry.hidden = false;
      } finally {
        modelRetry.disabled = false;
      }
    }

    if (debug && !mock) void loadModels();
    modelRetry.addEventListener('click', loadModels);
    modelSelect.addEventListener('change', () => {
      selectedModel = modelSelect.value;
      write(prefix + '.model', selectedModel);
    });
    let lastOpener = Number(read(prefix + '.opener')) || -Infinity;
    let noticeTimer;
    let noticeOnLoad = true;
    const chat = createChat({
      history,
      request: transport,
      model: () => debug ? selectedModel : null,
      initiates: () => initiates.checked,
      language: () => lang,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      openerAt: () => Math.max(lastOpener, Number(read(prefix + '.opener')) || -Infinity),
      markOpener: at => { lastOpener = at; write(prefix + '.opener', String(at)); },
      save: entries => write(prefix + '.history', JSON.stringify(entries)),
      view: {
        history: (entries, own) => {
          if (own) safetyTurn = hasCrisis(entries.at(-1).content);
          renderHistory(entries, own);
          memory.renderAvailability();
        },
        status: renderStatus, error: renderError, hidden: () => document.hidden,
        incoming: () => { if (soundToggle.checked) sound.play(); },
        region: updateRegion,
        crisis: () => { safetyTurn = true; },
        beforeSeries: () => { mood.clear(); stage.beginReply?.(); },
        afterReply: () => { void showMemoryHint(); },
        reaction: (part, reaction) => {
          if (!safetyTurn) mood.show(part, reaction);
          else stage.react('talkCalm', true);
        },
        activity: mood.activity,
      },
    });

    function rememberNotice(at) {
      lastNotice = at;
      write(noticeKey, String(at));
    }

    function syncNotice() {
      clearTimeout(noticeTimer);
      if (document.hidden) return;
      const now = Date.now();
      lastNotice = Math.max(lastNotice, readNotice());
      if (noticeOnLoad || !lastNotice || now - lastNotice >= NOTICE_GAP) {
        noticeOnLoad = false;
        rememberNotice(now);
        chat.notice(now);
      }
      noticeTimer = setTimeout(syncNotice, Math.min(NOTICE_GAP, lastNotice + NOTICE_GAP - now));
    }

    function activate() {
      if (document.hidden || forgetting) return;
      syncNotice();
      stage.sync();
      chat.maybeOpen();
    }

    function fitInput() {
      const stick = atBottom();
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight + 2}px`;
      sendButton.disabled = sendButton.hidden = !input.value.trim();
      micButton.hidden = !sendButton.hidden;
      if (stick) scrollToBottom();
    }

    function fitViewport() {
      const stick = atBottom();
      const visual = window.visualViewport;
      const unzoomed = visual && visual.scale === 1;
      viewport.classList.toggle('has-keyboard', Boolean(unzoomed && document.documentElement.clientHeight - visual.height > 80));
      if (unzoomed) {
        viewport.style.setProperty('--chat-view-height', `${visual.height}px`);
        viewport.style.setProperty('--chat-view-top', `${visual.offsetTop}px`);
      } else {
        viewport.style.removeProperty('--chat-view-height');
        viewport.style.removeProperty('--chat-view-top');
      }
      if (stick) scrollToBottom();
    }

    languages.forEach(button => button.addEventListener('click', () => {
      if (lang === button.dataset.chatLang) return;
      lang = button.dataset.chatLang;
      write('alisa.chat.lang', lang);
      chat.cancelOpener();
      applyLanguage();
    }));

    let composing = false;
    input.addEventListener('compositionstart', () => {
      composing = true;
      chat.onDraft(input.value, true);
    });
    input.addEventListener('compositionend', () => {
      composing = false;
      chat.onDraft(input.value);
      fitInput();
    });
    input.addEventListener('input', event => {
      chat.onDraft(input.value, composing || event.isComposing);
      fitInput();
    });
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.shiftKey || composing || event.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      form.requestSubmit();
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (composing || !input.value.trim()) return;
      submit(input.value);
    });

    function submit(value, voice = false) {
      if (forgetting) return;
      chat.send(value, voice);
      input.value = '';
      fitInput();
      if (!voice) input.focus({ preventScroll: true });
    }

    const emoji = get('chat-emoji');
    const picker = get('chat-emoji-picker');
    function showPicker(open) {
      picker.hidden = !open;
      emoji.setAttribute('aria-expanded', String(open));
    }
    for (const symbol of ['😂', '🥰', '😏', '🙈', '🔥', '😴']) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = symbol;
      button.addEventListener('click', () => { if (!forgetting) { showPicker(false); chat.send(symbol, false, true); } });
      picker.append(button);
    }
    emoji.addEventListener('click', () => showPicker(picker.hidden));
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || picker.hidden || settings.open) return;
      event.preventDefault();
      showPicker(false);
      emoji.focus();
    });
    let voiceAllowed = read(prefix + '.voice-notice') === '1';
    installDictation({
      get, form, input, language: () => lang, submit, stage, closePicker: () => showPicker(false),
      allowRecording: notice => {
        if (!voiceAllowed && window.confirm(notice)) {
          voiceAllowed = true;
          write(prefix + '.voice-notice', '1');
        }
        return voiceAllowed;
      },
    });

    const themes = [...document.querySelectorAll('[data-theme-choice]')];
    const opacity = get('chat-opacity');
    const savedTheme = read(prefix + '.theme');
    let theme = ['light', 'dark', 'auto'].includes(savedTheme) ? savedTheme : 'auto';
    function renderTheme() {
      const hour = new Date().getHours();
      const palette = theme === 'auto' ? (hour >= 7 && hour < 20 ? 'light' : 'dark') : theme;
      for (const button of themes) button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
      document.body.dataset.theme = palette;
      opacity.value = read(prefix + '.opacity.' + palette) ?? (palette === 'light' ? '100' : '70');
      viewport.style.setProperty('--chat-bubble-opacity', opacity.value + '%');
    }
    for (const button of themes) button.addEventListener('click', () => {
      theme = button.dataset.themeChoice;
      write(prefix + '.theme', theme);
      renderTheme();
    });
    opacity.addEventListener('input', () => {
      write(prefix + '.opacity.' + document.body.dataset.theme, opacity.value);
      viewport.style.setProperty('--chat-bubble-opacity', opacity.value + '%');
    });
    setInterval(renderTheme, 60000);
    renderTheme();

    if (mock) {
      const toggle = get('chat-debug-toggle');
      const panel = get('chat-debug');
      const clips = get('chat-debug-clip');
      toggle.hidden = false;
      for (const value of ['waist', 'portrait', 'full', ...window.AlisaMotion.REACTIONS.keys()]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        clips.append(option);
      }
      toggle.addEventListener('click', () => {
        settings.close();
        panel.hidden = !panel.hidden;
        toggle.setAttribute('aria-expanded', String(!panel.hidden));
        if (!panel.hidden) clips.focus();
      });
      get('chat-debug-play').addEventListener('click', () => {
        if (window.AlisaMotion.REACTIONS.has(clips.value)) stage.react(clips.value);
        else stage.plan(clips.value);
      });
      get('chat-debug-instant').addEventListener('change', event => stage.setInstant(event.target.checked));
    }

    get('chat-retry').addEventListener('click', () => {
      chat.retry();
      if (error.hidden) input.focus({ preventScroll: true });
    });
    function clearLocalChat() {
      input.value = '';
      composing = false;
      rememberNotice(chat.clear());
      mood.clear();
      memoryHint?.remove();
      memoryHint = null;
      showPicker(false);
      fitInput();
      syncNotice();
    }

    function forgetLocalData() {
      safetyTurn = false;
      write(prefix + '.opener', '');
      write(prefix + '.memory-hint', '');
      lastOpener = -Infinity;
      seenFacts = Promise.resolve(new Set());
      clearLocalChat();
    }

    window.addEventListener('storage', event => {
      if (event.key === deleteKey && event.newValue) {
        forgetLocalData();
        if (settings.open) void memory.load();
      }
    });

    get('chat-clear').addEventListener('click', () => {
      if (!window.confirm(COPY[lang].confirm)) return;
      settings.close();
      clearLocalChat();
    });
    initiates.addEventListener('change', () => {
      if (!initiates.checked) chat.cancelOpener(true);
      mood.activity();
    });

    const unlockSound = () => { if (soundToggle.checked) sound.unlock(); };
    soundToggle.addEventListener('change', unlockSound);
    document.addEventListener('pointerdown', unlockSound, true);
    document.addEventListener('keydown', unlockSound, true);
    const syncVideo = () => {
      stage.setEnabled(video.checked);
      get('chat-debug-play').disabled = !video.checked;
      mood.clear();
    };
    video.addEventListener('change', syncVideo);

    function openSettings() {
      showPicker(false);
      settings.showModal();
      settingsClose.focus();
      return memory.load();
    }
    settingsOpen.addEventListener('click', () => { void openSettings(); });
    settingsClose.addEventListener('click', () => settings.close());
    settings.addEventListener('close', () => {
      settingsOpen.focus({ preventScroll: true });
    });
    let backdropPress = false;
    settings.addEventListener('pointerdown', event => { backdropPress = event.target === settings; });
    settings.addEventListener('click', event => {
      if (backdropPress && event.target === settings) settings.close();
      backdropPress = false;
    });
    settings.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...settings.querySelectorAll('button, input, select, a[href], summary')]
        .filter(node => !node.disabled && !node.hidden && node.getClientRects().length);
      if (!focusable.length) return;
      const index = focusable.indexOf(document.activeElement);
      const next = index < 0 && event.shiftKey ? focusable.length - 1
        : (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      event.preventDefault();
      focusable[next].focus();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stage.sync();
        clearTimeout(noticeTimer);
      } else activate();
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted) activate();
    });
    window.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('scroll', fitViewport);

    applyLanguage();
    syncVideo();
    if (window.alisaChatPreview) get('chat-preview').hidden = false;
    viewport.hidden = false;
    fitViewport();
    fitInput();
    renderHistory(history, true);
    observeSession();
    activate();
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { createChat, createTransport, hasCrisis, crisisLinks, installDictation };
  } else if (window.alisaChatDataOnly) {
    startDataControls();
  } else {
    startChat();
  }
})();
