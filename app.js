const API_URL = 'https://gratitude-oc5d.onrender.com/api';
let token = localStorage.getItem('authToken');
let currentUser = null;

// Check if user is logged in
if (token && token !== 'null' && token !== 'undefined') {
  verifyToken();
} else {
  showAuthPage();
}

async function verifyToken() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      currentUser = await res.json();
      showJournalPage();
      loadHistoryFromServer(); // Load entries from MongoDB
    } else {
      localStorage.removeItem('authToken');
      showAuthPage();
    }
  } catch (err) {
    console.error('Token verification failed:', err);
    showAuthPage();
  }
}

function showAuthPage() {
  document.getElementById('authContainer').style.display = 'flex';
  const page = document.querySelector('.page');
  if (page) page.style.display = 'none';
}

function showJournalPage() {
  document.getElementById('authContainer').style.display = 'none';
  const page = document.querySelector('.page');
  if (page) page.style.display = 'block';
}

// Handle Sign Up / Login
document.getElementById('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  // Flexible check for "Sign Up" vs "Login" regardless of exact whitespace
  const isSignUp = document.getElementById('authTitle').textContent.trim().toLowerCase() === 'sign up';
  const endpoint = isSignUp ? 'signup' : 'login';

  try {
    const res = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', token);
      showJournalPage();
      loadHistoryFromServer();
    } else {
      // Handles single error strings as well as express-validator array messages
      const errorMsg = data.error || data.message || (data.errors && data.errors[0]?.msg) || 'Authentication failed';
      alert('Error: ' + errorMsg);
    }
  } catch (err) {
    console.error('Auth request error:', err);
    alert('Connection error: ' + err.message);
  }
});

// Toggle between Sign Up and Login modes
document.getElementById('authToggle').addEventListener('click', (e) => {
  e.preventDefault();
  const title = document.getElementById('authTitle');
  const submitBtn = document.querySelector('#authForm button');
  const toggleText = document.getElementById('authToggle');

  if (title.textContent.trim().toLowerCase() === 'sign up') {
    title.textContent = 'Login';
    submitBtn.textContent = 'Login';
    toggleText.innerHTML = 'Need an account? <a href="#">Sign up</a>';
  } else {
    title.textContent = 'Sign Up';
    submitBtn.textContent = 'Sign Up';
    toggleText.innerHTML = 'Already have an account? <a href="#">Log in</a>';
  }
});

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
    if (promptTextEls[i]) promptTextEls[i].textContent = p.text;
    if (gratitudeInputs[i]) gratitudeInputs[i].placeholder = p.placeholder;
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
  if (starsRow) starsRow.appendChild(div);
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

if (datePicker) {
  datePicker.max = TODAY_KEY;
  datePicker.value = selectedDate;
}

function currentValues() {
  return inputs.map(i => i ? i.value : '');
}

function updateBanner(values, dateStr) {
  if (!banner || !bannerText) return;
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
  if (!headline || !dateLabel) return;
  if (dateStr === TODAY_KEY) {
    headline.textContent = 'Three good things';
    dateLabel.textContent = formatDateLabel(dateStr);
    if (todayJumpBtn) todayJumpBtn.style.display = 'none';
    if (saveBtn) saveBtn.textContent = "Save today's gratitude";
  } else {
    headline.textContent = 'Looking back';
    dateLabel.textContent = formatDateLabel(dateStr);
    if (todayJumpBtn) todayJumpBtn.style.display = 'inline-block';
    if (saveBtn) saveBtn.textContent = "Save this day's gratitude";
  }
  if (nextDayBtn) nextDayBtn.disabled = dateStr >= TODAY_KEY;
}

// ---------- Storage (persistent, per-user) ----------

function trySetEntry(dateStr, values) {
  const payload = {
    items: values.slice(0, 3).filter(v => v !== undefined),
    win: values[3] || '',
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(`gratitude:${dateStr}`, JSON.stringify(payload));
  return true;
}

async function getEntry(dateStr) {
  try {
    const res = localStorage.getItem(`gratitude:${dateStr}`);
    if (res) {
      const data = JSON.parse(res);
      const items = data.items || ['', '', ''];
      return [items[0] || '', items[1] || '', items[2] || '', data.win || ''];
    }
  } catch (e) {
    // fall back to empty
  }
  return ['', '', '', ''];
}

// Main save function mapping values to MongoDB Atlas
async function setEntry(dateStr, values) {
  const itemsArray = values.slice(0, 3).filter(item => item && item.trim() !== '');
  const winVal = values[3] || '';

  // Local sync cache fallback
  trySetEntry(dateStr, values);

  if (!token) return true;

  try {
    const res = await fetch(`${API_URL}/gratitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        date: dateStr,
        items: itemsArray,
        win: winVal
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || errData.message || (errData.errors && errData.errors[0]?.msg) || 'Server error');
    }

    return true;
  } catch (err) {
    console.error('Failed to save to server:', err);
    throw err;
  }
}

async function loadHistoryFromServer() {
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/gratitudes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) return;

    const entries = await res.json();

    // Store server data locally
    entries.forEach(entry => {
      localStorage.setItem(`gratitude:${entry.date}`, JSON.stringify({
        items: entry.items || [],
        win: entry.win || '',
        savedAt: entry.createdAt
      }));
    });

    await loadHistory();
  } catch (err) {
    console.error('Failed to load from server:', err);
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
  if (!listEl) return;

  try {
    const keys = await listEntryKeys();
    keys.sort().reverse();

    if (keys.length === 0) {
      listEl.innerHTML = '<div class="empty-history">Your reflections will appear here once you save your first one.</div>';
      if (streakEl) streakEl.textContent = '';
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
    if (streakEl) {
      streakEl.textContent = streak > 0 ? `${streak} day${streak === 1 ? '' : 's'} in a row` : '';
    }
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
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

// ---------- Navigation & Page Loading ----------
async function loadEntryForDate(dateStr) {
  selectedDate = dateStr;
  if (datePicker) datePicker.value = dateStr;
  updateHeaderForDate(dateStr);
  applyPromptsForDate(dateStr);

  const values = await getEntry(dateStr);
  inputs.forEach((input, i) => {
    if (input) {
      input.value = values[i] || '';
      autoGrow(input);
    }
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
  if (el) {
    el.addEventListener('input', () => {
      autoGrow(el);
      const vals = currentValues();
      renderStars(vals);
      updateBanner(vals, selectedDate);
    });
  }
});

if (saveBtn) {
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    if (saveMsg) saveMsg.textContent = 'Saving...';
    try {
      await setEntry(selectedDate, currentValues());
      if (saveMsg) saveMsg.textContent = 'Saved successfully to MongoDB Atlas!';
      await loadHistory();
      setTimeout(() => { if (saveMsg) saveMsg.textContent = ''; }, 3000);
    } catch (err) {
      if (saveMsg) saveMsg.textContent = 'Error: ' + err.message;
      console.error(err);
    } finally {
      saveBtn.disabled = false;
    }
  });
}

if (prevDayBtn) prevDayBtn.addEventListener('click', () => loadEntryForDate(addDays(selectedDate, -1)));
if (nextDayBtn) nextDayBtn.addEventListener('click', () => { if (selectedDate < TODAY_KEY) loadEntryForDate(addDays(selectedDate, 1)); });
if (todayJumpBtn) todayJumpBtn.addEventListener('click', () => loadEntryForDate(TODAY_KEY));
if (datePicker) datePicker.addEventListener('change', (e) => { if (e.target.value) loadEntryForDate(e.target.value); });

// ---------- Inspirational quote ----------
const LIFE_QUOTES = [
  { text: "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.", author: "Mark Twain" },
  { text: "We are products of our past, but we don't have to be prisoners of it.", author: "Rick Warren" },
  { text: "You can waste your lives drawing lines. Or you can live your life crossing them.", author: "Shonda Rhimes" },
  { text: "You are the one that possesses the keys to your being. You carry the passport to your own happiness.", author: "Diane von Furstenberg" },
  { text: "Accept responsibility for your life. Know that it is you who will get you where you want to go, no one else.", author: "Les Brown" },
  { text: "It is never too late to be who you might have been.", author: "George Eliot" }
];

const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const quoteRefresh = document.getElementById('quoteRefresh');
let lastQuoteIdx = -1;

function showRandomQuote() {
  if (!quoteText || !quoteAuthor) return;
  let idx = Math.floor(Math.random() * LIFE_QUOTES.length);
  if (LIFE_QUOTES.length > 1 && idx === lastQuoteIdx) {
    idx = (idx + 1) % LIFE_QUOTES.length;
  }
  lastQuoteIdx = idx;
  const q = LIFE_QUOTES[idx];
  quoteText.textContent = `"${q.text}"`;
  quoteAuthor.textContent = `— ${q.author}`;
}

if (quoteRefresh) quoteRefresh.addEventListener('click', showRandomQuote);
showRandomQuote();

// ---------- Init ----------
(async () => {
  await loadEntryForDate(selectedDate);
  if (!token) {
    await loadHistory();
  }
})();

// Mobile exporter
const exportBtn = document.getElementById('export-btn');
if (exportBtn) {
  exportBtn.addEventListener('click', async () => {
    let data = { entries: [] };
    
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('gratitude:')) {
        const v = localStorage.getItem(k);
        try { 
          data.entries.push({ date: k.replace('gratitude:', ''), ...JSON.parse(v) }); 
        } catch {}
      }
    }

    const json = JSON.stringify(data, null, 2);
    const filename = 'gratitude-export.json';
    const blob = new Blob([json], { type: 'application/json' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'application/json' })] }) && navigator.share) {
        const file = new File([blob], filename, { type: 'application/json' });
        await navigator.share({
          files: [file],
          title: 'Gratitude export',
          text: 'Your exported gratitude data'
        });
        return;
      }
    } catch (err) {
      console.warn('Web Share failed or was cancelled:', err);
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);

    try {
      if ('download' in a) {
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      } else {
        a.target = '_blank';
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  });
}