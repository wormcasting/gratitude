  // ---------- Starfield background ----------
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor((canvas.width * canvas.height) / 9000);
    stars = Array.from({length: count}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.7,
      r: Math.random() * 1.3 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.005
    }));
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function drawStars(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const twinkle = reduceMotion ? 0.6 : 0.4 + 0.6 * Math.abs(Math.sin(s.phase + t * s.speed));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 250, 235, ${twinkle * 0.8})`;
      ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(drawStars);
  }
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(drawStars);

  // ---------- Date helpers ----------
  function keyFromDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function todayKey() {
    return keyFromDate(new Date());
  }
  function dateFromDateStr(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function formatDateLabel(dateStr) {
    const dt = dateFromDateStr(dateStr);
    return dt.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function addDays(dateStr, delta) {
    const dt = dateFromDateStr(dateStr);
    dt.setDate(dt.getDate() + delta);
    return keyFromDate(dt);
  }

  const TODAY_KEY = todayKey();
  let selectedDate = TODAY_KEY;

  // ---------- Rotating, specific gratitude prompts ----------
  const PROMPT_POOL = [
    { text: "What made your day a little better?", placeholder: "Something you did or others …" },
    { text: "What's one small moment today you'd like to live again?", placeholder: "A moment worth replaying…" },
    { text: "What was hard today that you're still, somehow, grateful for?", placeholder: "Something that stretched you…" },
    { text: "What's something you saw, heard, tasted, or felt today that you appreciated?", placeholder: "A sensory detail, however small…" },
    { text: "What's something that worked or existed today that you'd miss if it were gone?", placeholder: "Something easy to take for granted…" }
  ];

  function dayIndex(dateStr) {
    const dt = dateFromDateStr(dateStr);
    const epoch = new Date(2024, 0, 1);
    return Math.floor((dt - epoch) / 86400000);
  }

  function getPromptsForDate(dateStr) {
    const n = PROMPT_POOL.length;
    const start = ((dayIndex(dateStr) * 2) % n + n) % n;
    return [0, 1, 2].map(i => PROMPT_POOL[(start + i) % n]);
  }

  const promptTextEls = [document.getElementById('promptText0'), document.getElementById('promptText1'), document.getElementById('promptText2')];
  const gratitudeInputs = [document.getElementById('g0'), document.getElementById('g1'), document.getElementById('g2')];

  function applyPromptsForDate(dateStr) {
    const prompts = getPromptsForDate(dateStr);
    prompts.forEach((p, i) => {
      promptTextEls[i].textContent = p.text;
      gratitudeInputs[i].placeholder = p.placeholder;
    });
  }

  // ---------- Star indicator icons ----------
  const starsRow = document.getElementById('starsRow');
  function starSVG(filled) {
    return `<svg viewBox="0 0 24 24">
      <path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.7l-6.1 3.3 1.5-6.8L2.2 9.5l6.9-.7z"
        fill="${filled ? 'var(--gold)' : 'none'}"
        stroke="${filled ? 'var(--gold)' : 'var(--star-off)'}"
        stroke-width="1.6" stroke-linejoin="round"/>
    </svg>`;
  }
  const starEls = [0,1,2,3].map(i => {
    const div = document.createElement('div');
    div.className = 'star';
    div.dataset.idx = i;
    starsRow.appendChild(div);
    return div;
  });
  function renderStars(values) {
    starEls.forEach((el, i) => {
      const filled = !!(values[i] && values[i].trim());
      el.innerHTML = starSVG(filled);
      el.classList.toggle('filled', filled);
      el.classList.toggle('pulse', !filled);
    });
  }
  renderStars(['', '', '', '']);

  // ---------- Elements ----------
  const inputs = [document.getElementById('g0'), document.getElementById('g1'), document.getElementById('g2'), document.getElementById('g3')];
  const saveBtn = document.getElementById('saveBtn');
  const saveMsg = document.getElementById('saveMsg');
  const banner = document.getElementById('banner');
  const bannerText = document.getElementById('bannerText');
  const headline = document.getElementById('headline');
  const dateLabel = document.getElementById('dateLabel');
  const datePicker = document.getElementById('datePicker');
  const prevDayBtn = document.getElementById('prevDay');
  const nextDayBtn = document.getElementById('nextDay');
  const todayJumpBtn = document.getElementById('todayJump');

  datePicker.max = TODAY_KEY;
  datePicker.value = selectedDate;

  function currentValues() {
    return inputs.map(i => i.value);
  }

  function updateBanner(values, dateStr) {
    const filledCount = values.filter(v => v.trim()).length;
    const dayWord = dateStr === TODAY_KEY ? 'today' : 'this day';
    if (filledCount === 4) {
      banner.style.display = 'none';
    } else if (filledCount === 0) {
      banner.style.display = 'flex';
      bannerText.textContent = dateStr === TODAY_KEY
        ? "You haven't noted anything for today yet. Take a minute before the day slips away."
        : "Nothing noted for this day yet. Go ahead and fill it in from memory.";
    } else {
      banner.style.display = 'flex';
      bannerText.textContent = `You've noted ${filledCount} of 4 for ${dayWord}. A couple more, when you're ready.`;
    }
  }

  function updateHeaderForDate(dateStr) {
    if (dateStr === TODAY_KEY) {
      headline.textContent = 'Three good things';
      dateLabel.textContent = formatDateLabel(dateStr);
      todayJumpBtn.style.display = 'none';
      saveBtn.textContent = "Save today's gratitude";
    } else {
      headline.textContent = 'Looking back';
      dateLabel.textContent = formatDateLabel(dateStr);
      todayJumpBtn.style.display = 'inline-block';
      saveBtn.textContent = "Save this day's gratitude";
    }
    nextDayBtn.disabled = dateStr >= TODAY_KEY;
  }

  // ---------- Storage (persistent, per-user) ----------
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function getEntry(dateStr) {
    try {
      const res = localStorage.getItem(`gratitude:${dateStr}`);
      if (res) {
        const data = JSON.parse(res);
        return data.items || ['', '', '', ''];
      }
    } catch (e) {
      // no entry for this date yet
    }
    return ['', '', '', ''];
  }

  async function trySetEntry(dateStr, values) {
    try {
      const payload = JSON.stringify({
        items: values,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem(`gratitude:${dateStr}`, payload);
      return true;
    } catch (e) {
      throw new Error('Storage write failed: ' + e.message);
    }
  }

  async function setEntry(dateStr, values) {
    if (!window.localStorage) {
      throw new Error('localStorage is not available in this environment.');
    }
    try {
      return await trySetEntry(dateStr, values);
    } catch (firstErr) {
      await wait(600);
      try {
        return await trySetEntry(dateStr, values);
      } catch (secondErr) {
        const message = (secondErr && secondErr.message) || (firstErr && firstErr.message) || 'Unknown storage error.';
        throw new Error(message);
      }
    }
  }

  async function listEntryKeys() {
    try {
      return Object.keys(localStorage).filter(k => k.startsWith('gratitude:'));
    } catch (e) {
      return [];
    }
  }

  // ---------- History + streak ----------
  function computeStreak(dateStrs) {
    const set = new Set(dateStrs);
    let streak = 0;
    let cursor = new Date();
    while (true) {
      const key = keyFromDate(cursor);
      if (set.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  let historyEntries = [];

  function highlightActiveHistoryEntry() {
    document.querySelectorAll('.entry').forEach(el => {
      el.classList.toggle('active', el.dataset.date === selectedDate);
    });
  }

  async function loadHistory() {
    const listEl = document.getElementById('historyList');
    const streakEl = document.getElementById('streakLabel');
    try {
      const keys = await listEntryKeys();
      keys.sort().reverse();

      if (keys.length === 0) {
        listEl.innerHTML = '<div class="empty-history">Your reflections will appear here once you save your first one.</div>';
        streakEl.textContent = '';
        historyEntries = [];
        return;
      }

      const entries = [];
      for (const key of keys.slice(0, 14)) {
        const dateStr = key.replace('gratitude:', '');
        const raw = await getEntry(dateStr);
        const gratitudeItems = raw.slice(0, 3).filter(v => v && v.trim());
        const winItem = (raw[3] || '').trim();
        entries.push({ dateStr, gratitudeItems, winItem });
      }
      historyEntries = entries;

      listEl.innerHTML = entries.map(e => `
        <div class="entry" data-date="${e.dateStr}">
          <div class="entry-date">${formatDateLabel(e.dateStr)}</div>
          <ul>
            ${e.gratitudeItems.map(i => `<li>${escapeHTML(i)}</li>`).join('')}
            ${e.winItem ? `<li class="win-item">＋ ${escapeHTML(e.winItem)}</li>` : ''}
          </ul>
        </div>`).join('') || '<div class="empty-history">No entries yet.</div>';

      listEl.querySelectorAll('.entry').forEach(el => {
        el.addEventListener('click', () => goToDate(el.dataset.date));
      });
      highlightActiveHistoryEntry();

      const dateStrs = keys.map(k => k.replace('gratitude:', ''));
      const streak = computeStreak(dateStrs);
      streakEl.textContent = streak > 0 ? `${streak} day${streak === 1 ? '' : 's'} in a row` : '';
    } catch (e) {
      listEl.innerHTML = '<div class="empty-history">Could not load past entries.</div>';
    }
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  // ---------- Navigation & Page Loading ----------
  async function loadEntryForDate(dateStr) {
    selectedDate = dateStr;
    datePicker.value = dateStr;
    updateHeaderForDate(dateStr);
    applyPromptsForDate(dateStr);

    const values = await getEntry(dateStr);
    inputs.forEach((input, i) => {
      input.value = values[i] || '';
      autoGrow(input);
    });

    renderStars(values);
    updateBanner(values, dateStr);
    highlightActiveHistoryEntry();
  }

  function goToDate(dateStr) {
    loadEntryForDate(dateStr);
  }

  // ---------- Dynamic Input & Event Listeners ----------
  inputs.forEach(el => {
    el.addEventListener('input', () => {
      autoGrow(el);
      const vals = currentValues();
      renderStars(vals);
      updateBanner(vals, selectedDate);
    });
  });

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveMsg.textContent = 'Saving...';
    try {
      await setEntry(selectedDate, currentValues());
      saveMsg.textContent = 'Saved successfully!';
      await loadHistory();
      setTimeout(() => { saveMsg.textContent = ''; }, 3000);
    } catch (err) {
      saveMsg.textContent = 'Error saving entry. Please try again.';
      console.error(err);
    } finally {
      saveBtn.disabled = false;
    }
  });

  prevDayBtn.addEventListener('click', () => {
    loadEntryForDate(addDays(selectedDate, -1));
  });

  nextDayBtn.addEventListener('click', () => {
    if (selectedDate < TODAY_KEY) {
      loadEntryForDate(addDays(selectedDate, 1));
    }
  });

  todayJumpBtn.addEventListener('click', () => {
    loadEntryForDate(TODAY_KEY);
  });

  datePicker.addEventListener('change', (e) => {
    if (e.target.value) {
      loadEntryForDate(e.target.value);
    }
  });

  // ---------- Inspirational quote ----------
  const LIFE_QUOTES = [
    { text: "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do. So throw off the bowlines. Sail away from the safe harbor. Catch the trade winds in your sails. Explore. Dream. Discover.", author: "Mark Twain" },
    { text: "We are products of our past, but we don't have to be prisoners of it.", author: "Rick Warren" },
    { text: "You can waste your lives drawing lines. Or you can live your life crossing them.", author: "Shonda Rhimes" },
    { text: "You are the one that possesses the keys to your being. You carry the passport to your own happiness.", author: "Diane von Furstenberg" },
    { text: "When you get into a tight place and everything goes against you… never give up then, for that is just the place and time that the tide will turn.", author: "Harriet Beecher Stowe" },
    { text: "Accept responsibility for your life. Know that it is you who will get you where you want to go, no one else.", author: "Les Brown" },
    { text: "Once we believe in ourselves, we can risk curiosity, wonder, spontaneous delight, or any experience that reveals the human spirit.", author: "e.e. cummings" },
    { text: "If you don't make the time to work on creating the life you want, you're eventually going to be forced to spend a lot of time dealing with a life you don't want.", author: "Kevin Ngo" },
    { text: "It is never too late to be who you might have been.", author: "George Eliot" },
    { text: "The way I see it, if you want the rainbow, you gotta put up with the rain.", author: "Dolly Parton" }
  ];

  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  const quoteRefresh = document.getElementById('quoteRefresh');
  let lastQuoteIdx = -1;

  function showRandomQuote() {
    let idx = Math.floor(Math.random() * LIFE_QUOTES.length);
    if (LIFE_QUOTES.length > 1 && idx === lastQuoteIdx) {
      idx = (idx + 1) % LIFE_QUOTES.length;
    }
    lastQuoteIdx = idx;
    const q = LIFE_QUOTES[idx];
    quoteText.textContent = `"${q.text}"`;
    quoteAuthor.textContent = `— ${q.author}`;
  }
  quoteRefresh.addEventListener('click', showRandomQuote);
  showRandomQuote();

  // ---------- Init ----------
  (async () => {
    await loadEntryForDate(selectedDate);
    await loadHistory();
  })();


  // Export saved data to a JSON file (localStorage-focused).
document.getElementById('export-btn').addEventListener('click', () => {
  const preferredKey = 'gratitudes'; // change to your localStorage key if different
  let data;

  const raw = localStorage.getItem(preferredKey);
  if (raw !== null) {
    try { data = JSON.parse(raw); }
    catch (e) { data = raw; }
  } else {
    // fallback: export all localStorage entries as an object
    data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      try { data[k] = JSON.parse(v); } catch (_) { data[k] = v; }
    }
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gratitude-export.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});