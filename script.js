
// ============ TICKER ============
const tickerItems = [
  ['NIFTY', '24,308.50', 0.42], ['BANKNIFTY', '52,140.20', -0.18],
  ['INFY', '1,842.10', -2.31], ['TCS', '4,128.55', 0.86],
  ['RELIANCE', '2,945.00', 1.12], ['HDFCBANK', '1,712.40', 0.24],
  ['ICICIBANK', '1,265.80', -0.34], ['SBIN', '812.45', 1.78],
  ['BRENT', '$82.40', 4.21], ['USDINR', '83.42', 0.08],
];
const tickerEl = document.getElementById('ticker');
const tHtml = tickerItems.map(([s, v, c]) => `
  <span class="ticker-item">
    <span class="sym">${s}</span>
    <span class="val">${v}</span>
    <span class="chg ${c >= 0 ? 'bull' : 'bear'}">${c >= 0 ? '+' : ''}${c.toFixed(2)}%</span>
  </span>`).join('');
tickerEl.innerHTML = tHtml + tHtml;

// ============ THEME ============
const themeToggle = document.getElementById('themeToggle');
const themeIcons = {
  dark: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 3v2.5M12 18.5V21M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3 12h2.5M18.5 12H21M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>
      <circle cx="12" cy="12" r="4.2"/>
    </svg>`,
  light: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20 13.2A7.8 7.8 0 1 1 10.8 4a6.3 6.3 0 0 0 9.2 9.2Z"/>
    </svg>`
};
function syncThemeButton() {
  if (!themeToggle) return;
  const dark = document.documentElement.dataset.theme === 'dark';
  themeToggle.innerHTML = dark ? themeIcons.dark : themeIcons.light;
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}
if (themeToggle) {
  syncThemeButton();
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    syncThemeButton();
  });
}

// ============ EVENT INTELLIGENCE ============
const events = [
  { id: 1, icon: '', type: 'Earnings', title: 'TCS Q2 beats estimates', time: '08:42', dir: 'up', conf: 92, stocks: ['TCS', 'INFY', 'WIPRO'], sector: 'IT Services', desc: 'Revenue +7.6% YoY, margins expand 80bps. Historically, beats of this magnitude drive +2.1% avg next-day move.' },
  { id: 2, icon: '', type: 'Policy', title: 'RBI holds repo at 6.50%', time: '10:15', dir: 'up', conf: 78, stocks: ['HDFCBANK', 'ICICIBANK', 'SBIN'], sector: 'Banking', desc: 'Status-quo with dovish commentary. Rate-sensitive sectors typically rally 0.6% on neutral holds.' },
  { id: 3, icon: '', type: 'Geopolitical', title: 'US-China tariff escalation', time: '11:33', dir: 'down', conf: 84, stocks: ['TATAMOTORS', 'BAJAJ-AUTO'], sector: 'Auto', desc: 'Supply chain pressure. Auto exporters down avg 1.8% in similar past windows.' },
  { id: 4, icon: '', type: 'Commodity', title: 'Brent crude spikes +4.2%', time: '12:08', dir: 'down', conf: 88, stocks: ['ASIANPAINT', 'BERGEPAINT'], sector: 'Paints', desc: 'Input cost shock. Paint stocks historically weaken 2.4% within 3 days of >4% crude moves.' },
  { id: 5, icon: '', type: 'Insider', title: 'Promoter pledge release at Vedanta', time: '14:21', dir: 'up', conf: 71, stocks: ['VEDL'], sector: 'Metals', desc: 'Pledge reduction signals balance-sheet repair. Similar events drove +3.1% avg 5-day reaction.' },
];

const feed = document.getElementById('eventFeed');
const detail = document.getElementById('eventDetail');
let activeId = 1;

function eventBadge(type) {
  const glyphs = {
    Earnings: '<path d="M6 16h12"/><path d="M8 12l3 3 5-7"/>',
    Policy: '<path d="M4 19h16"/><path d="M7 19V8h10v11"/><path d="M10 8V5h4v3"/>',
    Geopolitical: '<circle cx="12" cy="12" r="7"/><path d="M5 12h14"/><path d="M12 5a18 18 0 0 1 0 14"/>',
    Commodity: '<path d="M6 16l4-8 4 5 4-7"/><path d="M5 19h14"/>',
    Insider: '<path d="M4 12c2.4-4 5.2-6 8-6s5.6 2 8 6c-2.4 4-5.2 6-8 6s-5.6-2-8-6Z"/><circle cx="12" cy="12" r="2.5"/>'
  };
  return `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      ${glyphs[type] || glyphs.Insider}
    </svg>`;
}

function renderFeed() {
  feed.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
      <span class="micro-label">Event Stream · Today</span>
      <span class="micro-label" style="color:var(--accent);"><span class="dot pulse"></span> 5 active</span>
    </div>
  ` + events.map(e => `
    <button class="event-item ${e.id === activeId ? 'active' : ''}" data-id="${e.id}">
        <div class="event-item-head">
          <div class="event-ico ${e.dir}" aria-hidden="true">${eventBadge(e.type)}</div>
        <div style="flex:1;min-width:0;">
          <div class="event-meta">
            <span>${e.type}</span><span>·</span><span>${e.time}</span>
            <span class="conf numeric">${e.conf}% conf</span>
          </div>
          <div class="event-title">${e.title}</div>
          <div class="event-stocks">${e.stocks.map(s => `<span class="chip">${s}</span>`).join('')}</div>
        </div>
      </div>
    </button>
  `).join('');
  feed.querySelectorAll('.event-item').forEach(el => {
    el.addEventListener('click', () => {
      activeId = +el.dataset.id;
      renderFeed(); renderDetail();
    });
  });
}

function renderDetail() {
  const e = events.find(x => x.id === activeId);
  const isUp = e.dir === 'up';
  const moveColor = isUp ? 'bull' : 'bear';
  const move = isUp ? '+1.8%' : '-2.4%';
  const timeline = [['T+0', 35], ['T+1d', 62], ['T+3d', 78], ['T+5d', 84], ['T+20d', 71]];
  detail.innerHTML = `
    <div class="detail-head">
      <span class="tag ${isUp ? 'tag-bull' : 'tag-bear'}">${isUp ? 'Bullish' : 'Bearish'}</span>
      <span class="micro-label">${e.sector}</span>
    </div>
    <div class="detail-title">${e.title}</div>
    <div class="detail-desc">${e.desc}</div>
    <div class="detail-stats">
      <div class="detail-stat"><div class="micro-label">Expected Move</div><div class="detail-stat-val numeric ${moveColor}">${move}</div></div>
      <div class="detail-stat"><div class="micro-label">Confidence</div><div class="detail-stat-val numeric">${e.conf}%</div></div>
      <div class="detail-stat"><div class="micro-label">Sample Size</div><div class="detail-stat-val numeric">32</div></div>
    </div>
    <div class="micro-label" style="margin-bottom:10px;">Reaction Timeline</div>
    ${timeline.map(([t, v]) => `
      <div class="timeline-row">
        <span class="t-label">${t}</span>
        <div class="bar"><div class="bar-fill ${moveColor}" style="width:${v}%"></div></div>
        <span class="t-val">${v}%</span>
      </div>`).join('')}
  `;
}
renderFeed(); renderDetail();

// ============ SCENARIO CHIPS ============
const scenarios = ['Infosys cuts FY25 guidance', 'RBI surprise rate hike', 'Crude spikes above $90', 'US Fed hawkish pivot'];
const chipsEl = document.getElementById('scenarioChips');
const scenarioInput = document.getElementById('scenarioInput');
let activeScenario = 0;
function renderChips() {
  chipsEl.innerHTML = scenarios.map((s, i) =>
    `<button class="scenario-chip ${i === activeScenario ? 'active' : ''}" data-i="${i}">${s}</button>`
  ).join('');
  chipsEl.querySelectorAll('.scenario-chip').forEach(c => c.addEventListener('click', () => {
    activeScenario = +c.dataset.i;
    scenarioInput.value = scenarios[activeScenario];
    renderChips();
    renderReactionState(activeScenario);
  }));
}
renderChips();

// ============ REACTION CHART ============
const reactionPresets = [
  {
    subtitle: 'T-5 to T+15 trading days · indexed to 100',
    stats: ['-7.4%', '-9.1%', '-6.8%', '-14.2%', '47 days'],
    current: [100, 100.6, 101.4, 101.1, 100.2, 99.3, 97.8, 96.5, 95.7, 95.2, 95.9, 96.4, 95.6, 94.2, 93.1, 92.2, 91.6, 91.9, 92.4, 93.1, 93.8],
    avg: [100, 100.2, 100.4, 100.7, 100.9, 101.1, 99.8, 98.9, 98.1, 97.4, 96.8, 96.1, 95.5, 95.0, 94.5, 94.1, 93.8, 93.4, 93.1, 92.9, 92.6],
    eventLabel: 'Event',
  },
  {
    subtitle: 'RBI surprise rate hike · indexed to 100',
    stats: ['-1.8%', '-3.4%', '-2.2%', '-6.1%', '18 days'],
    current: [100, 100.4, 100.8, 101.1, 100.7, 100.2, 99.5, 98.7, 98.2, 98.5, 98.9, 99.1, 98.8, 98.2, 97.9, 97.6, 97.8, 98.1, 98.4, 98.6, 98.9],
    avg: [100, 100.1, 100.2, 100.3, 100.4, 100.4, 99.9, 99.4, 99, 98.7, 98.4, 98.1, 97.8, 97.6, 97.4, 97.2, 97.1, 97, 96.9, 96.8, 96.7],
    eventLabel: 'Policy',
  },
  {
    subtitle: 'Crude spikes above $90 · indexed to 100',
    stats: ['-4.6%', '-6.8%', '-5.2%', '-11.3%', '29 days'],
    current: [100, 100.8, 101.6, 102.1, 101.9, 101.2, 100.4, 99.8, 98.9, 98.1, 97.4, 97, 97.5, 98.2, 98.9, 99.1, 98.7, 98.2, 97.8, 97.5, 97.2],
    avg: [100, 100.1, 100.2, 100.3, 100.2, 100, 99.8, 99.5, 99.2, 98.9, 98.6, 98.3, 98.1, 97.9, 97.7, 97.6, 97.5, 97.4, 97.3, 97.2, 97.1],
    eventLabel: 'Commodity',
  },
  {
    subtitle: 'US Fed hawkish pivot · indexed to 100',
    stats: ['-2.9%', '-4.7%', '-3.9%', '-9.0%', '24 days'],
    current: [100, 100.3, 100.5, 100.2, 99.8, 99.1, 98.3, 97.4, 96.8, 96.1, 95.7, 95.9, 96.4, 96.1, 95.4, 94.9, 94.6, 94.3, 94.6, 94.8, 95.1],
    avg: [100, 100.1, 100.2, 100.3, 100.3, 100, 99.6, 99.2, 98.8, 98.4, 98.1, 97.8, 97.5, 97.2, 97, 96.8, 96.6, 96.4, 96.2, 96.1, 96],
    eventLabel: 'Macro',
  },
];

function buildCandles(closes) {
  return closes.map((close, i) => {
    const prev = i === 0 ? close : closes[i - 1];
    const wave = Math.sin(i * 0.8) * 0.28 + Math.cos(i * 0.43) * 0.12;
    const open = prev + wave;
    const spread = 0.5 + (i % 3) * 0.15;
    const high = Math.max(open, close) + spread + (i % 2) * 0.12;
    const low = Math.min(open, close) - spread - ((i + 1) % 2) * 0.08;
    return { open, high, low, close };
  });
}

function buildReactionChart(preset) {
  const svg = document.getElementById('reactionChart');
  const w = 800, h = 280, pad = { l: 40, r: 20, t: 20, b: 30 };
  const innerW = w - pad.l - pad.r, innerH = h - pad.t - pad.b;

  const candles = buildCandles(preset.current);
  const points = candles.map((c, i) => [i, c.close]);
  const avgPoints = preset.avg.map((v, i) => [i, v]);
  const allVals = candles.flatMap(c => [c.open, c.high, c.low, c.close]).concat(avgPoints.map(p => p[1]));
  const minV = Math.min(...allVals) - 1, maxV = Math.max(...allVals) + 1;
  const sx = i => pad.l + (i / 20) * innerW;
  const sy = v => pad.t + (1 - (v - minV) / (maxV - minV)) * innerH;

  const pathFor = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0])},${sy(p[1])}`).join(' ');

  // grid
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (i / 4) * innerH;
    grid += `<line x1="${pad.l}" y1="${y}" x2="${w - pad.r}" y2="${y}" stroke="#E5DED2" stroke-width="1"/>`;
  }
  // event line
  const eventX = sx(5);
  grid += `<line x1="${eventX}" y1="${pad.t}" x2="${eventX}" y2="${h - pad.b}" stroke="#8A8478" stroke-width="1" stroke-dasharray="3 3"/>`;
  grid += `<text x="${eventX + 4}" y="${pad.t + 12}" fill="#8A8478" font-size="10" font-family="monospace">${preset.eventLabel}</text>`;

  const candleStep = innerW / 20;
  const candleWidth = Math.max(5, candleStep * 0.52);
  const candlesSvg = candles.map((c, i) => {
    const x = sx(i);
    const color = c.close >= c.open ? '#2F9E64' : '#D94B3D';
    const bodyY = sy(Math.max(c.open, c.close));
    const bodyH = Math.max(1.5, Math.abs(sy(c.open) - sy(c.close)));
    const wick = `
      <line x1="${x}" y1="${sy(c.high)}" x2="${x}" y2="${sy(c.low)}" stroke="${color}" stroke-width="1.6" stroke-linecap="round" />
    `;
    const body = `
      <rect x="${x - candleWidth / 2}" y="${bodyY}" width="${candleWidth}" height="${bodyH}" rx="2" fill="${color}" opacity="0.86" />
    `;
    return wick + body;
  }).join('');

  svg.innerHTML = `
    <defs>
      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FF6B47" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#D94B3D" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${pathFor(points)}" fill="none" stroke="#FF6B47" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${pathFor(avgPoints)}" fill="none" stroke="#D94B3D" stroke-width="1.6" stroke-dasharray="5 3"/>
    <g opacity="0.95">${candlesSvg}</g>
  `;
}

function renderReactionState(index) {
  const preset = reactionPresets[index] || reactionPresets[0];
  const subtitle = document.getElementById('reactionSubtitle');
  const stats = document.getElementById('scenarioStats');
  if (subtitle) subtitle.textContent = preset.subtitle;
  if (stats) {
    const rows = stats.querySelectorAll('.stat-num');
    preset.stats.forEach((v, i) => { if (rows[i]) rows[i].textContent = v; });
  }
  buildReactionChart(preset);
}
renderReactionState(activeScenario);

// ============ EARNINGS ============
const earnings = [
  { ticker: 'RELIANCE', sector: 'Energy', date: 'Oct 14', countdown: 86400 * 2, eps: 24.8, range: '23.1 – 26.2', surprise: 64, move: 3.2, dir: 'up', hitRate: 71 },
  { ticker: 'HDFCBANK', sector: 'Banking', date: 'Oct 16', countdown: 86400 * 4, eps: 22.4, range: '21.8 – 23.0', surprise: 58, move: 2.1, dir: 'up', hitRate: 82 },
  { ticker: 'INFY', sector: 'IT', date: 'Oct 17', countdown: 86400 * 5, eps: 18.6, range: '17.9 – 19.3', surprise: 42, move: 4.8, dir: 'down', hitRate: 64 },
  { ticker: 'TCS', sector: 'IT', date: 'Oct 11', countdown: 86400 * 1, eps: 32.1, range: '31.4 – 32.8', surprise: 78, move: 2.6, dir: 'up', hitRate: 88 },
];

function fmtCountdown(s) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const eGrid = document.getElementById('earningsGrid');
function renderEarnings() {
  eGrid.innerHTML = earnings.map(e => `
    <div class="earnings-card">
      <div class="ec-head">
        <div>
          <div class="ec-ticker">${e.ticker}</div>
          <div class="ec-sector">${e.sector}</div>
        </div>
        <div>
          <div class="ec-date">${e.date}</div>
          <div class="ec-countdown" data-cd="${e.ticker}">${fmtCountdown(e.countdown)}</div>
        </div>
      </div>
      <div class="ec-grid">
        <div class="ec-cell">
          <div class="mini-label">EPS Forecast</div>
          <div class="mini-val numeric">₹${e.eps}</div>
          <div class="mini-label numeric" style="margin-top:2px;">${e.range}</div>
        </div>
        <div class="ec-cell">
          <div class="mini-label">Implied Move</div>
          <div class="mini-val numeric ${e.dir === 'up' ? 'bull' : 'bear'}">±${e.move}%</div>
          <div class="mini-label" style="margin-top:2px;">options-implied</div>
        </div>
      </div>
      <div class="ec-bars">
        <div>
          <div class="ec-bar-head"><span class="micro-label">Surprise Probability</span><span class="numeric">${e.surprise}%</span></div>
          <div class="bar"><div class="bar-fill accent" style="width:${e.surprise}%"></div></div>
        </div>
        <div>
          <div class="ec-bar-head"><span class="micro-label">Historical Hit Rate</span><span class="numeric">${e.hitRate}%</span></div>
          <div class="bar"><div class="bar-fill bull" style="width:${e.hitRate}%"></div></div>
        </div>
      </div>
    </div>
  `).join('');
}
renderEarnings();

setInterval(() => {
  earnings.forEach(e => {
    e.countdown = Math.max(0, e.countdown - 1);
    const el = document.querySelector(`[data-cd="${e.ticker}"]`);
    if (el) el.textContent = fmtCountdown(e.countdown);
  });
}, 1000);

// ============ HEATMAP ============
const heatmap = document.getElementById('heatmap');
const sectors = ['IT', 'Banks', 'Energy', 'Auto', 'Pharma', 'FMCG', 'Metals'];
let heatHTML = sectors.map(s => `<div class="heat-label">${s}</div>`).join('');
for (let i = 0; i < 28; i++) {
  const intensity = Math.abs(Math.sin(i * 0.7));
  const isBull = (i + Math.floor(i / 7)) % 2 === 0;
  const bg = isBull
    ? `rgba(47,158,100,${intensity * 0.55 + 0.1})`
    : `rgba(217,75,61,${intensity * 0.55 + 0.1})`;
  heatHTML += `<div class="heat" style="background:${bg}"></div>`;
}
heatmap.innerHTML = heatHTML;

// ============ STOCK INTEL GRID ============
const intelData = [
  { l: 'Event Exposure', items: [['Oil prices', 'high'], ['Refining spreads', 'high'], ['Telecom tariffs', 'medium']] },
  { l: 'Macro Sensitivity', items: [['USDINR β', '+0.42'], ['Crude β', '+0.68'], ['Yields β', '-0.21']] },
  { l: 'Insider Activity', items: [['Promoter pledge', '0%'], ['Net buys 90d', '+0.8M'], ['MF holding', '4.2%']] },
  { l: 'Sentiment Trend', items: [['News tone', '+0.34'], ['Analyst Δ', '↑ 2 upgr'], ['Social vol', '+18%']] },
  { l: 'Volatility Profile', items: [['IV percentile', '42%'], ['Realized 30d', '18.4%'], ['Skew', '-0.12']] },
  { l: 'Sector Position', items: [['Energy rank', '1/14'], ['Mom score', '78'], ['Quality', '82']] },
  { l: 'Earnings Forecast', items: [['EPS est', '₹24.8'], ['Surprise prob', '64%'], ['Implied move', '±3.2%']] },
  { l: 'Event Reactions', items: [['Crude +5%', '+1.4%'], ['Rate hike', '-0.8%'], ['Tax change', '+0.2%']] },
];
document.getElementById('intelGrid').innerHTML = intelData.map(c => `
  <div class="intel-cell">
    <div class="intel-label">${c.l}</div>
    ${c.items.map(([k, v]) => `<div class="intel-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
  </div>
`).join('');

// ============ MARKET CALENDAR ============
const calendarMonth = { year: 2026, month: 5, label: 'June 2026' };
const calendarEvents = new Map([
  [2, { tone: 'bull', title: 'RELIANCE Q2', note: 'after market' }],
  [4, { tone: 'accent', title: 'MediCore IPO', note: 'subscription opens' }],
  [6, { tone: 'bear', title: 'INFY board meet', note: 'guidance review' }],
  [9, { tone: 'bull', title: 'HDFCBANK results', note: 'pre-open' }],
  [13, { tone: 'accent', title: 'RBI minutes', note: 'market close' }],
  [18, { tone: 'bull', title: 'TCS Q2', note: 'press call' }],
  [24, { tone: 'bear', title: 'Board update', note: 'capital allocation' }],
  [27, { tone: 'accent', title: 'IPO closes', note: 'final day' }],
]);
const weekdayEl = document.getElementById('calendarWeekdays');
const calEl = document.getElementById('marketCalendar');
if (weekdayEl) {
  weekdayEl.innerHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    .map(d => `<div class="calendar-weekday">${d}</div>`).join('');
}
if (calEl) {
  const first = new Date(calendarMonth.year, calendarMonth.month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
  const prevDays = new Date(calendarMonth.year, calendarMonth.month, 0).getDate();
  const cells = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, muted: true, label: 'prev' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, muted: false, today: d === 5, event: calendarEvents.get(d) || null });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - daysInMonth - startOffset + 1, muted: true, label: 'next' });
  }

  calEl.innerHTML = cells.map(cell => {
    const event = cell.event;
    return `
      <article class="calendar-cell ${cell.muted ? 'muted' : ''} ${cell.today ? 'today' : ''}">
        <div class="calendar-cell-head">
          <span class="calendar-day">${cell.day}</span>
          ${event ? `<span class="calendar-mark ${event.tone}"></span>` : ''}
        </div>
        ${event ? `
          <div class="calendar-event">${event.title}</div>
          <div class="calendar-event-sub">${event.note}</div>
        ` : `<div class="calendar-empty">&nbsp;</div>`}
      </article>
    `;
  }).join('');
}

// ============ PATTERNS ============
const patterns = [
  { trigger: 'Chinese stimulus announced', outcome: 'Indian steel stocks rally', prob: 78, sample: 32, dir: 'up' },
  { trigger: 'Brent crude spikes >4%', outcome: 'Paint companies weaken', prob: 71, sample: 41, dir: 'down' },
  { trigger: 'US tech guides weak', outcome: 'Indian IT underperforms', prob: 84, sample: 28, dir: 'down' },
  { trigger: 'Monsoon above normal', outcome: 'Rural FMCG outperforms', prob: 68, sample: 22, dir: 'up' },
  { trigger: 'Fed hawkish surprise', outcome: 'Bank Nifty weakens 5d', prob: 73, sample: 36, dir: 'down' },
  { trigger: 'RBI rate cut surprise', outcome: 'NBFCs rally 3d', prob: 81, sample: 19, dir: 'up' },
];
document.getElementById('patternsGrid').innerHTML = patterns.map(p => `
  <div class="pattern-card">
    <div class="pat-tag">When</div>
    <div class="pat-text">${p.trigger}</div>
    <div class="pat-divider"></div>
    <div class="pat-tag">Then</div>
    <div class="pat-text ${p.dir === 'up' ? 'bull' : 'bear'}">${p.outcome}</div>
    <div class="pat-foot">
      <span>Probability · <span class="numeric" style="color:var(--ink);">${p.prob}%</span></span>
      <span>n = ${p.sample}</span>
    </div>
    <div class="pat-bar"><div class="bar-fill ${p.dir === 'up' ? 'bull' : 'bear'}" style="width:${p.prob}%"></div></div>
  </div>
`).join('');

// ============ WAITLIST ============
const form = document.getElementById('waitlistForm');
const btn = document.getElementById('submitBtn');
const msg = document.getElementById('formMsg');
const emailInput = document.getElementById('emailInput');
const companyInput = document.getElementById('companyInput');
const toastHost = document.createElement('div');
toastHost.className = 'toast-host';
document.body.appendChild(toastHost);

function setWaitlistMsg(text, state) {
  msg.textContent = text;
  msg.className = state ? `form-msg ${state}` : 'form-msg';
}

function showToast(text) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = text;
  toastHost.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('in'));
  setTimeout(() => {
    toast.classList.remove('in');
    setTimeout(() => toast.remove(), 220);
  }, 2800);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const company = companyInput?.value.trim() || '';
  if (!email) return setWaitlistMsg('Add an email address first.', 'error');
  btn.disabled = true; btn.textContent = 'Joining…';
  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        company,
        source: 'landing',
        page: location.pathname,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setWaitlistMsg(data.error || 'Request failed. Please try again.', 'error');
      return;
    }

    btn.textContent = '✓ Joined';
    setWaitlistMsg(data.message || "You're on the list. We'll be in touch.", 'success');
    showToast('You are on the list. We will notify you when app is ready.');
    emailInput.value = '';
    if (companyInput) companyInput.value = '';
  } catch (err) {
    if (location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      const local = JSON.parse(localStorage.getItem('kascade_waitlist') || '[]');
      local.push({ email, createdAt: new Date().toISOString(), source: 'landing' });
      localStorage.setItem('kascade_waitlist', JSON.stringify(local));
      btn.textContent = '✓ Saved';
      setWaitlistMsg('Saved locally. Run via Vercel or connect the API to persist entries.', 'success');
    } else {
      setWaitlistMsg('Network error. Please try again in a moment.', 'error');
    }
  } finally {
    btn.disabled = false;
  }
});

// ============ FADE-IN ON SCROLL ============
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.1 });
document.querySelectorAll('.card, .widget, .pattern-card, .earnings-card, .event-item').forEach(el => {
  el.classList.add('fade-in'); io.observe(el);
});

// ============ REACTION CHART PLAYBACK (simple, client-side) ============
function setupReactionPlayback() {
  const svg = document.getElementById('reactionChart');
  if (!svg) return;
  // ensure parent can position overlay
  const parent = svg.parentElement;
  parent.style.position = parent.style.position || 'relative';
  const overlay = document.createElement('div');
  overlay.className = 'chart-overlay';
  const btn = document.createElement('button'); btn.className = 'play-btn'; btn.textContent = 'Play';
  overlay.appendChild(btn);
  parent.appendChild(overlay);

  const ns = 'http://www.w3.org/2000/svg';
  const playLine = document.createElementNS(ns, 'line');
  playLine.setAttribute('id', 'playLine');
  playLine.setAttribute('y1', '0'); playLine.setAttribute('y2', '280');
  playLine.setAttribute('class', 'chart-line');
  svg.appendChild(playLine);

  const bounds = svg.viewBox.baseVal; const width = bounds.width || 800;
  let running = false; let px = 0; let raf;
  function step() {
    px = (px + 3) % width;
    playLine.setAttribute('x1', px); playLine.setAttribute('x2', px);
    raf = requestAnimationFrame(step);
  }
  btn.addEventListener('click', () => {
    running = !running; btn.classList.toggle('playing', running); btn.textContent = running ? 'Pause' : 'Play';
    if (running) { raf = requestAnimationFrame(step); } else { cancelAnimationFrame(raf); }
  });
}
setupReactionPlayback();

const heroDemoBtn = document.getElementById('heroDemoBtn');
if (heroDemoBtn) {
  heroDemoBtn.addEventListener('click', () => {
    const lookup = document.getElementById('lookup');
    const playBtn = document.querySelector('.play-btn');
    lookup?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      if (playBtn && playBtn.textContent === 'Play') playBtn.click();
    }, 350);
  });
}

// ============ HERO EFFECTS ============
function setupHeroEffects() {
  const hero = document.querySelector('.hero');
  const panel = document.getElementById('heroPanel');
  const sparks = document.querySelector('.hero-sparks');

  if (panel) {
    panel.addEventListener('pointermove', (e) => {
      const rect = panel.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      panel.style.setProperty('--glow-x', `${x.toFixed(2)}%`);
      panel.style.setProperty('--glow-y', `${y.toFixed(2)}%`);
    });
    panel.addEventListener('pointerleave', () => {
      panel.style.setProperty('--glow-x', '50%');
      panel.style.setProperty('--glow-y', '50%');
    });
  }

  if (hero && sparks) {
    hero.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const count = 7;
      for (let i = 0; i < count; i++) {
        const spark = document.createElement('span');
        spark.className = 'hero-spark';
        const angle = (Math.PI * 2 * i) / count;
        const distance = 14 + Math.random() * 18;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.setProperty('--dx', `${dx.toFixed(1)}px`);
        spark.style.setProperty('--dy', `${dy.toFixed(1)}px`);
        spark.style.setProperty('--rot', `${(angle * 180 / Math.PI).toFixed(1)}deg`);
        spark.style.setProperty('--len', `${12 + Math.random() * 14}px`);
        sparks.appendChild(spark);
        setTimeout(() => spark.remove(), 520);
      }
    });
  }
}
setupHeroEffects();

// ============ SHARED COMPONENT TREATMENT ============
document.querySelectorAll('.card, .panel, .event-detail, .stock-terminal, .calendar-shell, .waitlist-form, .pattern-card, .earnings-card, .widget').forEach(el => {
  el.classList.add('surface-panel');
});
