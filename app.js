/* Muay Thai training log.
 * Reads the markdown files at runtime and renders a hash-routed single-page app.
 * The markdown files are the source of truth - nothing here writes to them. */
(() => {
  'use strict';

  // ---------- Constants ----------

  const STATUSES = ['Seen', 'Drilling', 'Clean on pads', 'Usable in sparring'];

  const CATEGORIES = [
    { key: 'stance', label: 'Stance & movement', match: /stance|movement|footwork/ },
    { key: 'punches', label: 'Punches', match: /punch/ },
    { key: 'kicks', label: 'Kicks', match: /kick/ },
    { key: 'knees', label: 'Knees', match: /knee/ },
    { key: 'elbows', label: 'Elbows', match: /elbow/ },
    { key: 'defence', label: 'Defence', match: /defen[cs]e/ },
    { key: 'clinch', label: 'Clinch', match: /clinch/ },
    { key: 'combos', label: 'Combos', match: /combo/ },
  ];

  const SECTIONS = {
    lesson: { label: 'Lesson', icon: 'book' },
    conditioning: { label: 'Conditioning', icon: 'activity' },
    body: { label: 'Body', icon: 'heart' },
    notes: { label: 'My notes', icon: 'pen' },
    words: { label: 'New words', icon: 'message' },
    next: { label: 'Next time', icon: 'listChecks' },
  };

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON = MONTHS.map((m) => m.slice(0, 3));
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const WD = WEEKDAYS.map((d) => d.slice(0, 3));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- Icons (Lucide, 1.75 stroke) ----------

  const ICONS = {
    arrowUpRight: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-7.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    listChecks: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    move: '<path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    flag: '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    dumbbell: '<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>',
    timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
  };

  const icon = (name, size = 20, sw = 1.75) =>
    `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;

  // ---------- Text helpers ----------

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);

  // "->" in notes becomes a real arrow when displayed. The files are not changed.
  const arrows = (s) => String(s).replace(/(^|\s)->(?=\s|$)/g, '$1→');

  const clean = (raw) => String(raw || '').replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '');

  const fold = (s) =>
    String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();

  const stripMd = (s) => String(s || '').replace(/\*\*|__|\*|_|`/g, '').trim();

  const hasMarked = () => typeof window.marked !== 'undefined' && typeof window.marked.parse === 'function';

  let markedReady = false;
  function setupMarked() {
    if (markedReady || !hasMarked()) return;
    // Raw HTML in the notes is shown as text, never injected.
    window.marked.use({
      gfm: true,
      breaks: false,
      renderer: {
        html(token) {
          return esc(typeof token === 'string' ? token : token && token.text);
        },
      },
    });
    markedReady = true;
  }

  // Minimal fallback if the CDN script did not load.
  function fallbackInline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>');
  }

  function fallbackBlock(text) {
    const out = [];
    let list = null;
    let para = [];
    const flushPara = () => { if (para.length) { out.push(`<p>${fallbackInline(para.join(' '))}</p>`); para = []; } };
    const flushList = () => { if (list) { out.push(`<ul>${list.map((li) => `<li>${fallbackInline(li)}</li>`).join('')}</ul>`); list = null; } };
    text.split('\n').forEach((line) => {
      const m = line.match(/^\s*[-*+]\s+(.*)$/);
      if (m) { flushPara(); (list = list || []).push(m[1]); }
      else if (!line.trim()) { flushPara(); flushList(); }
      else if (list && /^\s{2,}/.test(line)) list[list.length - 1] += ' ' + line.trim();
      else { flushList(); para.push(line.trim()); }
    });
    flushPara();
    flushList();
    return out.join('');
  }

  function md(text) {
    const src = arrows(String(text || '').trim());
    if (!src) return '';
    setupMarked();
    const html = markedReady ? window.marked.parse(src) : fallbackBlock(src);
    return markAskCoach(html);
  }

  function mdInline(text) {
    const src = arrows(String(text || '').trim());
    if (!src) return '';
    setupMarked();
    return markedReady ? window.marked.parseInline(src) : fallbackInline(src);
  }

  const ASK_RE = /^(ask|check with) the coach$/i;
  const askTag = () => `<span class="tag-ask">${icon('message', 12, 2.25)}Ask coach</span>`;

  // Lines marked "-> **Ask the coach**" / "-> **Check with the coach**" get a lime tag.
  function markAskCoach(html) {
    if (!/the coach/i.test(html)) return html;
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    tpl.content.querySelectorAll('li, p').forEach((el) => {
      if (el.querySelector('li, p')) return;
      const hit = [...el.querySelectorAll('strong')].some((s) => ASK_RE.test(s.textContent.trim()));
      if (hit) {
        el.classList.add('ask-line');
        el.insertAdjacentHTML('afterbegin', askTag());
      }
    });
    return tpl.innerHTML;
  }

  // ---------- Dates ----------

  const pad = (n) => String(n).padStart(2, '0');
  const parseISO = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const daysBetween = (a, b) => Math.round((b - a) / 864e5);
  const mondayOf = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fmtLong = (d) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const fmtShort = (d) => `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
  const fmtDate = (d) => `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
  const fmtISO = (s, f = fmtDate) => { const d = parseISO(s); return d ? f(d) : ''; };

  // ---------- Markdown structure parsing ----------

  const ADDED_BY_RE = /added by (?:pi liang|claude)/i;
  const MARKER_RE = /^\s*\*\*([^*]+?)\*\*\s*(?:\*\(([^)]*)\)\*|_\(([^)]*)\)_)?\s*$/;
  const isBlank = (lines) => !lines.some((l) => l.trim());

  // Split a block into parts at lines that are only a bold label, e.g.
  // **From class** or **How it works** *(added by Pi Liang)*.
  // Older notes say "added by Claude" - both mark Pi Liang's part.
  function splitParts(lines) {
    const parts = [];
    let cur = { label: '', note: '', kind: 'plain', lines: [] };
    const push = () => { if (!isBlank(cur.lines)) parts.push(cur); };
    for (const line of lines) {
      const m = line.match(MARKER_RE);
      if (m) {
        push();
        const label = m[1].trim().replace(/:$/, '');
        const note = (m[2] || m[3] || '').trim();
        const kind = ADDED_BY_RE.test(note) ? 'pi' : /from class/i.test(label) ? 'coach' : 'plain';
        const extra = note.replace(ADDED_BY_RE, '').replace(/^[\s\-–—,:;]+/, '').trim();
        cur = { label, note, extra, kind, lines: [] };
      } else {
        cur.lines.push(line);
      }
    }
    push();
    return parts;
  }

  function splitRow(line) {
    let s = line.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split('|').map((c) => c.trim());
  }

  function parseTable(lines) {
    const rows = lines.filter((l) => /^\s*\|/.test(l)).map(splitRow);
    if (rows.length < 1) return { head: [], rows: [] };
    const head = rows[0].map((h) => stripMd(h).toLowerCase());
    const body = rows.slice(1).filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
    return { head, rows: body };
  }

  const colIndex = (head, re) => head.findIndex((h) => re.test(h));

  function listItems(lines) {
    const items = [];
    for (const l of lines) {
      const m = l.match(/^\s*[-*+]\s+(.*)$/);
      if (m) items.push(m[1].trim());
      else if (l.trim() && items.length && /^\s{2,}\S/.test(l)) items[items.length - 1] += ' ' + l.trim();
    }
    return items.filter(Boolean);
  }

  function sectionKind(title) {
    const t = title.toLowerCase();
    if (/^lesson/.test(t)) return 'lesson';
    if (/condition/.test(t)) return 'conditioning';
    if (/^body/.test(t)) return 'body';
    if (/my notes?/.test(t)) return 'notes';
    if (/new words?|vocab/.test(t)) return 'words';
    if (/next time/.test(t)) return 'next';
    return 'other';
  }

  function parseSession(raw) {
    const lines = clean(raw).split('\n');
    const doc = { title: '', pre: [], sections: [] };
    let sec = null;
    let tech = null;
    for (const line of lines) {
      let m;
      if ((m = line.match(/^#\s+(.+?)\s*$/))) { doc.title = m[1]; continue; }
      if ((m = line.match(/^##\s+(.+?)\s*$/))) {
        sec = { title: m[1].trim(), kind: sectionKind(m[1]), lines: [], techniques: [] };
        doc.sections.push(sec);
        tech = null;
        continue;
      }
      if ((m = line.match(/^###\s+(.+?)\s*$/)) && sec) {
        tech = { title: m[1].trim(), lines: [] };
        sec.techniques.push(tech);
        continue;
      }
      if (/^\s*-{3,}\s*$|^\s*\*{3,}\s*$|^\s*_{3,}\s*$/.test(line)) continue;
      (tech ? tech.lines : sec ? sec.lines : doc.pre).push(line);
    }

    // Preamble: intro text, the Class line, and optional labelled paragraphs.
    const paras = [];
    let buf = [];
    for (const l of doc.pre) {
      if (!l.trim()) { if (buf.length) paras.push(buf); buf = []; } else buf.push(l);
    }
    if (buf.length) paras.push(buf);

    doc.classLine = '';
    doc.intro = [];
    doc.legends = [];
    for (const p of paras) {
      const first = p[0];
      const cls = first.match(/^\s*\*\*Class:?\*\*:?\s*(.*)$/i);
      if (cls) { doc.classLine = [cls[1], ...p.slice(1)].join(' ').trim(); continue; }
      const lab = first.match(/^\s*\*\*([^*]+?)\*\*\s*(.*)$/);
      if (lab) {
        const rest = p.slice(1).join(' ');
        const items = [...rest.matchAll(/(\d+)\s+([^\d-][^-]*?)(?=\s+-\s+\d|\s*$)/g)].map((x) => ({ n: x[1], name: x[2].trim().replace(/^./, (c) => c.toUpperCase()) }));
        if (items.length >= 3) {
          doc.legends.push({ title: lab[1].replace(/:$/, ''), note: lab[2].replace(/^[(]|[):]+$/g, '').replace(/\)$/, '').trim(), items });
          continue;
        }
      }
      doc.intro.push(p.join('\n'));
    }

    for (const s of doc.sections) {
      s.parts = splitParts(s.lines);
      s.techniques.forEach((t) => { t.parts = splitParts(t.lines); });
      if (s.kind === 'words') s.words = parseWordsTable(s.lines);
      if (s.kind === 'next' || s.kind === 'notes') s.items = listItems(s.lines);
      s.hasContent = s.kind === 'words' ? s.words.length > 0 : s.techniques.length > 0 || !isBlank(s.lines);
    }
    return doc;
  }

  function parseWordsTable(lines) {
    const { head, rows } = parseTable(lines);
    if (!head.length) return [];
    let iSaid = colIndex(head, /said|mine|my word/);
    let iTerm = colIndex(head, /standard|term/);
    let iNote = colIndex(head, /note/);
    const iEx = colIndex(head, /example|sentence/);
    if (iSaid < 0) iSaid = 0;
    if (iTerm < 0) iTerm = 1;
    return rows
      .map((r) => {
        const term = r[iTerm] || '';
        const bold = term.match(/\*\*(.+?)\*\*/);
        const main = bold ? bold[1].trim() : stripMd(term);
        const extra = bold ? term.replace(bold[0], '').trim() : '';
        return {
          said: r[iSaid] || '',
          term,
          main: stripMd(main),
          extra,
          note: iNote >= 0 ? r[iNote] || '' : '',
          example: iEx >= 0 ? (r[iEx] || '').trim() : '',
        };
      })
      .filter((w) => w.main || w.said);
  }

  function categoryFor(title) {
    const t = title.toLowerCase();
    return CATEGORIES.find((c) => c.match.test(t)) || { key: 'other', label: title, match: null };
  }

  function parseTechniques(raw) {
    const groups = [];
    let g = null;
    for (const line of clean(raw).split('\n')) {
      const m = line.match(/^##\s+(.+?)\s*$/);
      if (m) { g = { title: m[1], lines: [] }; groups.push(g); }
      else if (g) g.lines.push(line);
    }
    const techniques = [];
    const thai = [];
    const catsPresent = [];
    for (const grp of groups) {
      if (/words to know|thai words|glossary/i.test(grp.title)) {
        for (const l of grp.lines) {
          const m = l.match(/^\s*[-*]\s+\*\*(.+?)\*\*\s*[-–—:]\s*(.+)$/);
          if (m) thai.push({ term: m[1].trim(), meaning: m[2].trim() });
        }
        continue;
      }
      const { head, rows } = parseTable(grp.lines);
      if (!head.length) continue;
      const cat = categoryFor(grp.title);
      const iName = Math.max(0, colIndex(head, /technique|combo|name|drill/));
      const iThai = colIndex(head, /thai/);
      const iStatus = colIndex(head, /status/);
      const iFirst = colIndex(head, /first/);
      const iUpd = colIndex(head, /updated|last/);
      const iCue = colIndex(head, /cue/);
      const cell = (r, i) => (i >= 0 ? (r[i] || '').trim() : '');
      let count = 0;
      for (const r of rows) {
        const name = stripMd(cell(r, iName));
        if (!name) continue;
        const status = stripMd(cell(r, iStatus));
        const statusIdx = STATUSES.findIndex((s) => s.toLowerCase() === status.toLowerCase());
        const info = splitTitle(name);
        techniques.push({
          id: `t${techniques.length}`,
          name,
          short: info.name,
          sub: info.sub,
          num: info.num,
          thai: stripMd(cell(r, iThai)),
          status: statusIdx >= 0 ? STATUSES[statusIdx] : status,
          statusIdx,
          first: cell(r, iFirst),
          updated: cell(r, iUpd),
          cue: cell(r, iCue),
          cat,
        });
        count++;
      }
      if (count && !catsPresent.some((c) => c.key === cat.key && c.label === cat.label)) catsPresent.push(cat);
    }
    return { techniques, thai, categories: catsPresent };
  }

  function parseGoals(raw) {
    const out = [];
    let inMilestones = false;
    for (const line of clean(raw).split('\n')) {
      const h = line.match(/^##\s+(.+)$/);
      if (h) { inMilestones = /milestone/i.test(h[1]); continue; }
      if (!inMilestones) continue;
      const m = line.match(/^\s*[-*]\s+\[( |x|X)\]\s*(.*)$/);
      if (!m || !m[2].trim()) continue;
      const text = m[2].trim();
      const d = text.match(/^(.*?)\s+[-–—]\s+(\d{4}-\d{2}-\d{2})\s*$/);
      out.push({ done: m[1].toLowerCase() === 'x', text: d ? d[1] : text, date: d ? d[2] : '' });
    }
    return out;
  }

  // ---------- Technique name matching ----------

  // "1 - Jab (lead straight, left hand)" -> { num: 1, name: "Jab", sub: "lead straight, left hand" }
  function splitTitle(title) {
    let t = String(title).trim();
    let num = null;
    const n = t.match(/^(\d+)\s*[-–—.:)]\s*(?!\d)(.+)$/); // not "1-2 (jab-cross)"
    if (n) { num = n[1]; t = n[2]; }
    let sub = '';
    const p = t.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (p) { t = p[1]; sub = p[2]; }
    else if (!num) {
      const d = t.match(/^(.+?)\s+[-–—]\s+(.+)$/);
      if (d) { t = d[1]; sub = d[2]; }
    }
    return { num, name: t.trim(), sub: sub.trim() };
  }

  const normName = (s) =>
    fold(s).replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

  function namesMatch(a, b) {
    const x = normName(a);
    const y = normName(b);
    if (!x || !y) return false;
    if (x === y) return true;
    // Prefix matches need a real word: "guard" ~ "guard and defence basics",
    // but "1 2" (the 1-2 combo) must not match "1 2 3".
    const [short, long] = x.length <= y.length ? [x, y] : [y, x];
    if (/[a-z]/.test(short) && long.startsWith(short + ' ')) return true;
    const fx = x.split(' ')[0];
    const fy = y.split(' ')[0];
    return !/^\d+$/.test(fx) && fx.length > 3 && fx === fy;
  }

  // An exact name match wins over a loose one ("1-2-3 (...)" must not land on "1-2").
  const findTechnique = (title) =>
    state.techniques.find((t) => normName(t.name) === normName(title)) ||
    state.techniques.find((t) => namesMatch(t.name, title)) ||
    null;

  function techInfo(title) {
    const info = splitTitle(title);
    const match = findTechnique(title);
    let cat = match ? match.cat.key : info.num ? 'punches' : 'other';
    if (!CATEGORIES.some((c) => c.key === cat)) cat = 'other';
    return { ...info, title, match, cat };
  }

  function techIcon(info) {
    const n = `${info.name} ${info.title || ''}`.toLowerCase();
    if (/guard|defen|block|parry/.test(n)) return 'shield';
    if (info.cat === 'stance' || /stance|foot|step/.test(n)) return 'move';
    if (info.cat === 'combos') return 'layers';
    return 'zap';
  }

  const badge = (info, extraClass = '') =>
    info.num
      ? `<span class="tech-badge is-num ${extraClass}" aria-hidden="true">${esc(info.num)}</span>`
      : `<span class="tech-badge ${extraClass}" aria-hidden="true">${icon(techIcon(info), 18)}</span>`;

  // ---------- State ----------

  const state = {
    loaded: false,
    startDate: null,
    sessions: [],
    techniques: [],
    categories: [],
    thai: [],
    milestones: [],
    failed: { index: false, techniques: false, goals: false, drills: false },
    calMonth: null,
    techFilter: 'all',
    drills: [],
    drillFilter: 'active',
    wordsMode: 'list',
    wordsQuery: '',
    flash: { i: 0, order: null, revealed: false },
  };

  async function fetchText(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res.text();
  }

  async function load() {
    let index = null;
    try {
      index = JSON.parse(await fetchText('data/sessions.json'));
    } catch (e) {
      state.failed.index = true;
      console.warn('Could not load data/sessions.json', e);
    }

    const list = index && Array.isArray(index.sessions) ? index.sessions.filter((s) => s && parseISO(s.date)) : [];
    state.startDate = index && parseISO(index.startDate) ? index.startDate : null;

    const [sessions, techText, goalsText, drillsText] = await Promise.all([
      Promise.all(
        list.map(async (s) => {
          let doc = null;
          try {
            doc = parseSession(await fetchText(s.file || `sessions/${s.date}.md`));
          } catch (e) {
            console.warn('Could not load session', s.date, e);
          }
          return { ...s, dateObj: parseISO(s.date), doc };
        })
      ),
      fetchText('techniques.md').catch(() => { state.failed.techniques = true; return ''; }),
      fetchText('goals.md').catch(() => { state.failed.goals = true; return ''; }),
      fetchText('drills.md').catch(() => { state.failed.drills = true; return ''; }),
    ]);

    try {
      const parsed = parseTechniques(techText);
      state.techniques = parsed.techniques;
      state.categories = parsed.categories;
      state.thai = parsed.thai;
    } catch (e) {
      console.warn('Could not parse techniques.md', e);
    }
    try {
      state.milestones = parseGoals(goalsText);
    } catch (e) {
      console.warn('Could not parse goals.md', e);
    }
    try {
      state.drills = parseDrills(drillsText).map((d) => {
        const links = drillLinks(d);
        return { ...d, links, techIds: new Set(links.flatMap((l) => l.techs.map((t) => t.id))) };
      });
    } catch (e) {
      console.warn('Could not parse drills.md', e);
    }

    sessions.sort((a, b) => a.dateObj - b.dateObj);
    sessions.forEach((s, i) => {
      if (!Number.isFinite(+s.day) || +s.day < 1) s.day = i + 1;
      s.lesson = s.doc ? s.doc.sections.find((x) => x.kind === 'lesson') : null;
      s.techs = s.lesson ? s.lesson.techniques.map((t) => techInfo(t.title)) : [];
      const sec = (k) => (s.doc ? s.doc.sections.find((x) => x.kind === k && x.hasContent) : null);
      s.notes = sec('notes');
      s.words = sec('words');
      s.next = sec('next');
    });
    state.sessions = sessions;
    if (!state.startDate && sessions.length) state.startDate = sessions[0].date;
    state.loaded = true;
  }

  // ---------- Shared pieces ----------

  const sessionByDate = (iso) => state.sessions.find((s) => s.date === iso);
  const latestSession = () => state.sessions[state.sessions.length - 1] || null;

  const emptyState = (title, text, ic = 'sparkles', cls = '') =>
    `<div class="empty ${cls}"><span class="empty-icon">${icon(ic, 24)}</span><p class="empty-title">${esc(title)}</p>${text ? `<p class="empty-text">${esc(text)}</p>` : ''}</div>`;

  const glow = '<div class="glow" aria-hidden="true"></div>';

  function techChips(s, max = 4) {
    if (!s.techs.length) return '';
    const shown = s.techs.slice(0, max);
    const more = s.techs.length - shown.length;
    return `<div class="chips">${shown
      .map((t) => `<span class="chip-sm tint-${t.cat}">${t.num ? `<span class="chip-n">${esc(t.num)}</span>` : ''}${esc(t.name)}</span>`)
      .join('')}${more > 0 ? `<span class="chip-sm more">+${more}</span>` : ''}</div>`;
  }

  function todoRow(item) {
    let text = item;
    let ask = false;
    const m = text.match(/^\s*\**\s*(ask|check with) the coach\s*\**\s*[:\-–—]\s*(.*)$/i);
    if (m) { ask = true; text = m[2]; text = text.charAt(0).toUpperCase() + text.slice(1); }
    return `<li><span class="todo-box" aria-hidden="true"></span><div class="todo-text">${ask ? askTag() : ''}${mdInline(text)}</div></li>`;
  }

  function weekInfo() {
    const t = today();
    const mon = mondayOf(t);
    const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
    const sun = days[6];
    const inWeek = state.sessions.filter((s) => s.dateObj >= mon && s.dateObj <= sun);
    return { t, mon, sun, days, inWeek };
  }

  // ---------- Screens: Home ----------

  function renderHome() {
    const t = today();
    const sessions = state.sessions;
    const start = parseISO(state.startDate);
    const latest = latestSession();

    if (!start) {
      return `<section class="screen">${glow}
        <header class="hero">
          <div class="hero-top"><span class="eyebrow"><span class="dot"></span>Muay Thai</span><span class="hero-date">${esc(fmtShort(t))}</span></div>
          <h1 class="hero-title is-text">Nothing here yet</h1>
          <p class="hero-sub">Your training log starts with the first session.</p>
        </header>
        ${emptyState('Nothing here yet', 'Log your first class and it will show up here.', 'flame')}
        ${milestonesBlock()}
      </section>`;
    }

    const dayN = Math.max(1, daysBetween(start, t) + 1);
    const { days, inWeek, mon, sun } = weekInfo();
    const learned = state.techniques.filter((x) => x.statusIdx >= 0).length;
    const dates = new Set(sessions.map((s) => s.date));

    const week = days
      .map((d) => {
        const iso = toISO(d);
        const trained = dates.has(iso);
        const isToday = iso === toISO(t);
        const cls = `wday${trained ? ' is-trained' : ''}${isToday ? ' is-today' : ''}${d > t ? ' is-future' : ''}`;
        const label = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${trained ? ', trained' : ''}${isToday ? ', today' : ''}`;
        const inner = `<span class="wday-name">${WD[d.getDay()]}</span><span class="wday-num">${d.getDate()}</span>`;
        return trained
          ? `<a class="${cls}" href="#/session/${iso}" role="listitem" aria-label="${esc(label)}">${inner}</a>`
          : `<div class="${cls}" role="listitem" aria-label="${esc(label)}">${inner}</div>`;
      })
      .join('');

    const weekHint = inWeek.length
      ? ''
      : `<p class="hint">${icon('flame', 16)}<span>No sessions yet this week.${latest ? ` Last one: ${esc(fmtShort(latest.dateObj))}.` : ''}</span></p>`;

    const weekRange = mon.getMonth() === sun.getMonth()
      ? `${mon.getDate()} - ${sun.getDate()} ${MON[sun.getMonth()]}`
      : `${mon.getDate()} ${MON[mon.getMonth()]} - ${sun.getDate()} ${MON[sun.getMonth()]}`;

    return `<section class="screen">${glow}
      <header class="hero">
        <div class="hero-top">
          <span class="eyebrow"><span class="dot"></span>Muay Thai</span>
          <span class="hero-date">${esc(fmtShort(t))}</span>
        </div>
        <h1 class="hero-title${dayN >= 100 ? ' is-long' : ''}"><span class="num">${dayN}</span> ${dayN === 1 ? 'day' : 'days'} in</h1>
        <p class="hero-sub"><strong>Session ${sessions.length}</strong><span class="sep"></span><span>Started ${esc(fmtShort(start))}</span></p>
      </header>

      <section class="card stats" aria-label="Stats">
        <div class="stat"><span class="stat-num">${sessions.length}</span><span class="stat-label">Sessions</span></div>
        <div class="stat"><span class="stat-num">${inWeek.length}</span><span class="stat-label">This week</span></div>
        <div class="stat"><span class="stat-num">${learned}</span><span class="stat-label">Techniques learned</span></div>
      </section>

      <section class="block" aria-labelledby="h-week">
        <div class="block-head"><h2 id="h-week">This week</h2><span class="meta">${esc(weekRange)}</span></div>
        <div class="week" role="list">${week}</div>
        ${weekHint}
      </section>

      <section class="block" aria-labelledby="h-latest">
        <div class="block-head"><h2 id="h-latest">Latest session</h2>${sessions.length > 1 ? '<a class="text-btn" href="#/sessions">See all</a>' : ''}</div>
        ${latest ? latestCard(latest) : emptyState('Nothing here yet', 'Your latest session will show up here.', 'calendar')}
        ${drillsHomeCard()}
      </section>

      ${nextTimeCard(latest)}

      ${milestonesBlock()}
    </section>`;
  }

  function latestCard(s) {
    return `<a class="card latest" href="#/session/${esc(s.date)}" aria-label="Open Day ${esc(s.day)}, ${esc(fmtLong(s.dateObj))}">
      <div class="card-top">
        <div class="card-top-left"><span class="day-badge">Day ${esc(s.day)}</span><span class="card-date">${esc(fmtShort(s.dateObj))}</span></div>
        <span class="arrow-btn" aria-hidden="true">${icon('arrowUpRight', 20)}</span>
      </div>
      ${s.summary ? `<p class="card-summary">${esc(s.summary)}</p>` : ''}
      ${techChips(s)}
    </a>`;
  }

  function nextTimeCard(s) {
    const items = s && s.next ? s.next.items || [] : [];
    const body = items.length
      ? `<ul class="todo">${items.map((x) => todoRow(x)).join('')}</ul>`
      : s && s.next
        ? `<div class="prose">${md(s.next.lines.join('\n'))}</div>`
        : emptyState('Nothing here yet', 'Focus points from your latest session will show up here.', 'listChecks');
    return `<section class="block" aria-labelledby="h-next">
      <div class="card dark">
        <div class="dark-head">
          <h2 id="h-next" class="dark-title"><span class="icon-dot">${icon('target', 18)}</span>Next time</h2>
          ${s ? `<span class="dark-meta">From Day ${esc(s.day)}</span>` : ''}
        </div>
        ${body}
      </div>
    </section>`;
  }

  function milestonesBlock() {
    const ms = state.milestones;
    if (!ms.length) {
      return `<section class="block" aria-labelledby="h-ms">
        <div class="block-head"><h2 id="h-ms">Milestones</h2></div>
        ${emptyState('Nothing here yet', 'Milestones from goals.md will show up here.', 'flag')}
      </section>`;
    }
    const done = ms.filter((m) => m.done).length;
    const pct = Math.round((done / ms.length) * 100);
    return `<section class="block" aria-labelledby="h-ms">
      <div class="block-head"><h2 id="h-ms">Milestones</h2></div>
      <div class="card">
        <div class="progress-row">
          <span class="progress-num">${done}<small> / ${ms.length} done</small></span>
          <span class="meta">${pct}%</span>
        </div>
        <div class="progress" role="progressbar" aria-label="Milestones done" aria-valuemin="0" aria-valuemax="${ms.length}" aria-valuenow="${done}"><span style="width:${Math.max(pct, 2)}%"></span></div>
        <ul class="milestones">
          ${ms
            .map(
              (m) => `<li>
                <span class="check${m.done ? ' done' : ''}" aria-hidden="true">${m.done ? icon('check', 16, 2.5) : ''}</span>
                <span class="ms-text ${m.done ? 'done-text' : 'todo-text-m'}">${mdInline(m.text)}<span class="sr-only">${m.done ? ' - done' : ' - not yet'}</span></span>
                ${m.date ? `<span class="ms-date">${esc(fmtISO(m.date))}</span>` : ''}
              </li>`
            )
            .join('')}
        </ul>
      </div>
    </section>`;
  }

  // ---------- Screens: Sessions ----------

  function renderSessions() {
    const sessions = state.sessions;
    const t = today();
    if (!state.calMonth) {
      const latest = latestSession();
      state.calMonth = new Date(t.getFullYear(), t.getMonth(), 1);
      if (latest && !sessions.some((s) => s.dateObj.getMonth() === t.getMonth() && s.dateObj.getFullYear() === t.getFullYear())) {
        state.calMonth = new Date(latest.dateObj.getFullYear(), latest.dateObj.getMonth(), 1);
      }
    }
    const first = sessions[0];
    const sub = sessions.length
      ? `<strong>${sessions.length} session${sessions.length === 1 ? '' : 's'}</strong><span class="sep"></span><span>Since ${esc(fmtShort(first.dateObj))}</span>`
      : '<span>No sessions logged yet</span>';

    const list = sessions.length
      ? `<div class="session-list">${[...sessions].reverse().map(sessionCard).join('')}</div>`
      : emptyState('Nothing here yet', 'Sessions appear here after each class is logged.', 'calendar');

    return `<section class="screen">${glow}
      <header class="hero">
        <div class="hero-top"><span class="eyebrow"><span class="dot"></span>Training log</span></div>
        <h1 class="hero-title is-text">Sessions</h1>
        <p class="hero-sub">${sub}</p>
      </header>
      <div id="cal">${calendarCard()}</div>
      <section class="block" aria-labelledby="h-all">
        <div class="block-head"><h2 id="h-all">All sessions</h2><span class="meta">Newest first</span></div>
        ${list}
      </section>
    </section>`;
  }

  function calendarCard() {
    const m = state.calMonth;
    const t = today();
    const year = m.getFullYear();
    const month = m.getMonth();
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysIn = new Date(year, month + 1, 0).getDate();
    const byDate = new Map(state.sessions.map((s) => [s.date, s]));
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push('<span class="cal-cell" aria-hidden="true"></span>');
    let count = 0;
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(year, month, d);
      const iso = toISO(date);
      const s = byDate.get(iso);
      const isToday = iso === toISO(t);
      const cls = `cal-day${s ? ' is-trained' : ''}${isToday ? ' is-today' : ''}${date < t ? ' is-past' : ''}`;
      if (s) {
        count++;
        cells.push(`<a class="cal-cell" href="#/session/${iso}" aria-label="Day ${esc(s.day)}, ${esc(fmtLong(date))}${isToday ? ', today' : ''}"><span class="${cls}">${d}</span></a>`);
      } else {
        cells.push(`<span class="cal-cell"><span class="${cls}"${isToday ? ' aria-current="date"' : ''}>${d}</span></span>`);
      }
    }
    const foot = count
      ? `<span>${count} session${count === 1 ? '' : 's'} in ${MONTHS[month]}</span>`
      : `<span>No sessions in ${MONTHS[month]}</span>`;
    return `<section class="card dark cal-card" aria-labelledby="cal-title">
      <div class="cal-head">
        <h2 class="cal-title" id="cal-title" aria-live="polite">${MONTHS[month]} ${year}</h2>
        <div class="cal-nav">
          <button type="button" data-action="cal-prev" aria-label="Previous month">${icon('chevronLeft', 20)}</button>
          <button type="button" data-action="cal-next" aria-label="Next month">${icon('chevronRight', 20)}</button>
        </div>
      </div>
      <div class="cal-grid">
        ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span class="cal-wd" aria-hidden="true">${d}</span>`).join('')}
        ${cells.join('')}
      </div>
      <div class="cal-foot">${foot}<span class="legend" aria-hidden="true"><span><i class="l-trained"></i>Trained</span><span><i class="l-today"></i>Today</span></span></div>
    </section>`;
  }

  function sessionCard(s) {
    const flags = [];
    if (s.notes) flags.push(`<span class="has-icon notes">${icon('pen', 14)}My notes</span>`);
    if (s.words) flags.push(`<span class="has-icon words">${icon('message', 14)}${s.words.words.length} new word${s.words.words.length === 1 ? '' : 's'}</span>`);
    return `<a class="card session-card" href="#/session/${esc(s.date)}" aria-label="Open Day ${esc(s.day)}, ${esc(fmtLong(s.dateObj))}">
      <div class="card-top">
        <div><span class="day-big">Day ${esc(s.day)}</span><span class="card-date">${esc(fmtLong(s.dateObj))}</span></div>
        <span class="arrow-btn" aria-hidden="true">${icon('arrowUpRight', 20)}</span>
      </div>
      ${s.summary ? `<p class="card-summary">${esc(s.summary)}</p>` : ''}
      ${techChips(s)}
      ${flags.length ? `<div class="card-foot">${flags.join('')}</div>` : ''}
    </a>`;
  }

  // ---------- Screens: Session detail ----------

  function renderDetail(iso) {
    const s = sessionByDate(iso);
    const back = `<a class="icon-btn ghost" href="#/sessions" aria-label="Back to sessions">${icon('chevronLeft', 22)}</a>`;
    if (!s || !s.doc) {
      const d = parseISO(iso);
      return `<section class="screen">${glow}
        <header class="hero detail-hero">
          <div class="hero-top">${back}</div>
          <h1 class="hero-title is-text">${s ? `Day ${esc(s.day)}` : 'Nothing here yet'}</h1>
          ${d ? `<p class="detail-date">${esc(fmtLong(d))}</p>` : ''}
        </header>
        ${emptyState('Nothing here yet', s ? 'This session file could not be loaded. Try again in a moment.' : 'There is no session logged for this date.', 'calendar')}
      </section>`;
    }

    const doc = s.doc;
    const secs = doc.sections.filter((x) => x.hasContent);
    const chips = secs
      .map((x) => {
        const label = x.kind !== 'other' ? SECTIONS[x.kind].label : x.title;
        return `<button type="button" class="chip" data-action="scroll-to" data-target="sec-${secId(x)}">${esc(label)}</button>`;
      })
      .join('');

    const idx = state.sessions.indexOf(s);
    const prev = state.sessions[idx - 1];
    const next = state.sessions[idx + 1];

    return `<section class="screen detail">${glow}
      <header class="hero detail-hero">
        <div class="hero-top">${back}<span class="eyebrow"><span class="dot"></span>Session</span></div>
        <h1 class="hero-title">Day <span class="num">${esc(s.day)}</span></h1>
        <p class="detail-date">${esc(fmtLong(s.dateObj))}</p>
        ${doc.classLine ? `<div class="class-line"><span class="k">Class</span><p>${mdInline(doc.classLine)}</p></div>` : ''}
        ${doc.intro.map((p) => `<div class="intro prose">${md(p)}</div>`).join('')}
      </header>

      ${doc.legends.map(legendCard).join('')}

      ${secs.length ? `<nav class="chipbar" aria-label="Jump to section"><div class="chipbar-scroll">${chips}</div></nav>` : ''}

      ${secs.length ? secs.map((x) => renderSection(x)).join('') : emptyState('Nothing here yet', 'This session has no notes yet.', 'book')}

      ${prev || next ? `<nav class="detail-nav" aria-label="Other sessions">
        ${prev ? `<a href="#/session/${esc(prev.date)}"><small>Previous</small><strong>Day ${esc(prev.day)}</strong></a>` : ''}
        ${next ? `<a class="next" href="#/session/${esc(next.date)}"><small>Next</small><strong>Day ${esc(next.day)}</strong></a>` : ''}
      </nav>` : ''}
    </section>`;
  }

  const secId = (x) => (x.kind !== 'other' ? x.kind : normName(x.title).replace(/\s+/g, '-') || 'section');

  function legendCard(l) {
    return `<section class="card legend-card" aria-label="${esc(l.title)}">
      <p class="lc-title">${esc(l.title)}${l.note ? `<span>${esc(l.note)}</span>` : ''}</p>
      <div class="punch-grid">${l.items.map((i) => `<span class="punch"><b>${esc(i.n)}</b><span>${esc(i.name)}</span></span>`).join('')}</div>
    </section>`;
  }

  function secHead(x, extra = '') {
    const meta = x.kind !== 'other' ? SECTIONS[x.kind] : { label: x.title, icon: 'book' };
    return `<div class="dsec-head"><h2 class="dsec-title" id="h-${secId(x)}"><span class="ic">${icon(meta.icon, 18)}</span>${esc(meta.label)}</h2>${extra}</div>`;
  }

  function renderPart(p) {
    const body = `<div class="prose">${md(p.lines.join('\n'))}</div>`;
    if (p.kind === 'pi') {
      return `<div class="panel panel-pi">
        <div class="panel-head"><span class="panel-label">${esc(p.label)}</span><span class="tag-pi">${icon('sparkles', 12, 2)}Added by Pi Liang</span></div>
        ${p.extra ? `<p class="panel-note">${esc(p.extra.charAt(0).toUpperCase() + p.extra.slice(1))}</p>` : ''}
        ${body}
      </div>`;
    }
    if (p.kind === 'coach') {
      return `<div class="panel panel-coach"><div class="panel-head"><span class="panel-label">${esc(p.label)}</span></div>${body}</div>`;
    }
    if (p.label) {
      return `<div class="panel panel-plain"><div class="panel-head"><span class="panel-label">${esc(p.label)}</span></div>${body}</div>`;
    }
    return `<div class="panel panel-plain">${body}</div>`;
  }

  function renderSection(x) {
    const id = `sec-${secId(x)}`;
    const labelled = `aria-labelledby="h-${secId(x)}"`;

    if (x.kind === 'lesson') {
      const intro = x.parts.length ? `<div class="lesson-intro prose">${md(x.lines.join('\n'))}</div>` : '';
      const items = x.techniques
        .map((t, i) => {
          const info = techInfo(t.title);
          const pid = `tp-${i}`;
          return `<article class="tech tint-${info.cat}">
            <h3 class="tech-h"><button type="button" class="tech-toggle" data-action="toggle-tech" aria-expanded="false" aria-controls="${pid}">
              ${badge(info)}
              <span class="tech-names"><span class="tech-name">${esc(info.name)}</span>${info.sub ? `<span class="tech-sub">${esc(info.sub)}</span>` : ''}</span>
              <span class="tech-chev" aria-hidden="true">${icon('chevronDown', 18)}</span>
            </button></h3>
            <div class="tech-panel" id="${pid}" role="region" aria-label="${esc(info.name)}" inert>
              <div class="tech-inner"><div class="tech-parts">${t.parts.length ? t.parts.map(renderPart).join('') : emptyState('Nothing here yet', '', 'book', 'inline')}</div></div>
            </div>
          </article>`;
        })
        .join('');
      const n = x.techniques.length;
      const extra = n > 1 ? `<button type="button" class="text-btn" data-action="expand-all" aria-pressed="false">Expand all</button>` : '';
      return `<section class="dsec" id="${id}" ${labelled}>
        ${secHead(x, extra)}
        ${intro}
        ${n ? `<div class="tech-list">${items}</div>` : `<div class="card prose">${md(x.lines.join('\n'))}</div>`}
      </section>`;
    }

    if (x.kind === 'notes') {
      const items = x.items || [];
      const body = items.length
        ? `<ul class="notes-list">${items.map((i) => `<li>${mdInline(i)}</li>`).join('')}</ul>`
        : `<div class="prose">${md(x.lines.join('\n'))}</div>`;
      return `<section class="dsec" id="${id}" ${labelled}>
        ${secHead(x)}
        <div class="card notes-card"><span class="quote-mark" aria-hidden="true">“</span>${body}<p class="notes-sign">In my own words</p></div>
      </section>`;
    }

    if (x.kind === 'words') {
      return `<section class="dsec" id="${id}" ${labelled}>
        ${secHead(x, `<span class="meta">${x.words.length} word${x.words.length === 1 ? '' : 's'}</span>`)}
        <div class="card"><ul class="nw-list">${x.words
          .map(
            (w) => `<li>
              <p class="nw-line"><span class="nw-said">${mdInline(w.said)}</span><span class="nw-arrow" aria-label="becomes">→</span><span class="nw-term">${mdInline(w.term)}</span></p>
              ${w.note ? `<p class="nw-note">${mdInline(w.note)}</p>` : ''}
              ${exampleLine(w.example, w.main)}
            </li>`
          )
          .join('')}</ul></div>
      </section>`;
    }

    if (x.kind === 'next') {
      const items = x.items || [];
      return `<section class="dsec" id="${id}" ${labelled}>
        ${secHead(x)}
        <div class="card">${items.length ? `<ul class="todo light-todo">${items.map((i) => todoRow(i)).join('')}</ul>` : `<div class="prose">${md(x.lines.join('\n'))}</div>`}</div>
      </section>`;
    }

    // Conditioning, Body and anything else: white card; Pi Liang's parts get the lavender panel.
    return `<section class="dsec" id="${id}" ${labelled}>
      ${secHead(x)}
      <div class="card white-card-parts">${x.parts
        .map((p) => (p.kind === 'pi' ? renderPart(p) : `${p.label ? `<p class="panel-label">${esc(p.label)}</p>` : ''}<div class="prose">${md(p.lines.join('\n'))}</div>`))
        .join('')}</div>
    </section>`;
  }

  // ---------- Screens: Techniques ----------

  function renderTechniques() {
    const all = state.techniques;
    const learned = all.filter((t) => t.statusIdx >= 0);
    const upcoming = all.length - learned.length;
    const counts = STATUSES.map((_, i) => all.filter((t) => t.statusIdx === i).length);

    const header = `<header class="hero">
      <div class="hero-top"><span class="eyebrow"><span class="dot"></span>Library</span></div>
      <h1 class="hero-title is-text">Techniques</h1>
      <p class="hero-sub">${all.length ? `<strong>${learned.length} learned</strong>${upcoming ? `<span class="sep"></span><span>${upcoming} not taught yet</span>` : ''}` : '<span>Everything the coach has taught</span>'}</p>
    </header>`;

    if (!all.length) {
      return `<section class="screen">${glow}${header}${emptyState('Nothing here yet', 'Techniques appear here once they are added to techniques.md.', 'target')}</section>`;
    }

    const summary = `<section class="card dark status-card" aria-label="Status summary">
      <div class="status-top">
        <div><div class="status-total">${learned.length}</div><div class="status-total-label">Techniques learned</div></div>
        ${upcoming ? `<span class="upnext">${upcoming} up next</span>` : ''}
      </div>
      <div class="status-bar" aria-hidden="true">${counts.map((c, i) => `<span class="s${i}${c ? '' : ' is-zero'}" style="flex-grow:${c || 0.0001}"></span>`).join('')}</div>
      <ul class="status-legend">${STATUSES.map((s, i) => `<li><span class="st-dot s${i}" aria-hidden="true"></span><span>${s}</span><b>${counts[i]}</b></li>`).join('')}</ul>
    </section>`;

    const filters = [{ key: 'all', label: 'All', n: all.length }]
      .concat(CATEGORIES.filter((c) => all.some((t) => t.cat.key === c.key)).map((c) => ({ key: c.key, label: c.label, n: all.filter((t) => t.cat.key === c.key).length })))
      .concat(state.categories.filter((c) => c.key === 'other').map((c) => ({ key: `other:${c.label}`, label: c.label, n: all.filter((t) => t.cat.label === c.label && t.cat.key === 'other').length })));

    if (!filters.some((f) => f.key === state.techFilter)) state.techFilter = 'all';

    return `<section class="screen">${glow}${header}
      ${summary}
      <section class="block" aria-labelledby="h-tlist">
        <div class="block-head"><h2 id="h-tlist">All techniques</h2></div>
        <div class="filters" role="group" aria-label="Filter by category">${filters
          .map((f) => `<button type="button" class="chip" data-action="filter" data-key="${esc(f.key)}" aria-pressed="${state.techFilter === f.key}">${esc(f.label)}<span class="chip-count">${f.n}</span></button>`)
          .join('')}</div>
        <div id="tgrid">${techGrid()}</div>
      </section>
    </section>`;
  }

  function techGrid() {
    const f = state.techFilter;
    const list = state.techniques.filter((t) =>
      f === 'all' ? true : f.startsWith('other:') ? t.cat.key === 'other' && t.cat.label === f.slice(6) : t.cat.key === f
    );
    if (!list.length) return emptyState('Nothing here yet', 'No techniques in this category yet.', 'target');
    return `<div class="tgrid">${list
      .map((t) => {
        const info = { num: t.num, name: t.short, title: t.name, cat: t.cat.key };
        const dots = [0, 1, 2, 3].map((i) => `<i${i <= t.statusIdx ? ' class="on"' : ''}></i>`).join('');
        const statusText = t.statusIdx >= 0 ? t.status : t.status || 'Not taught yet';
        return `<button type="button" class="tcard tint-${CATEGORIES.some((c) => c.key === t.cat.key) ? t.cat.key : 'other'}${t.statusIdx < 0 ? ' is-untaught' : ''}" data-action="open-tech" data-id="${t.id}" aria-haspopup="dialog" aria-label="${esc(t.name)}, ${esc(statusText)}">
          <span class="card-top">${badge(info)}<span class="arrow-btn light" aria-hidden="true">${icon('arrowUpRight', 18)}</span></span>
          <span class="tcard-name">${esc(t.short)}</span>
          ${t.sub ? `<span class="tcard-sub">${esc(t.sub)}</span>` : ''}
          ${t.thai ? `<span class="tcard-thai">${esc(t.thai)}</span>` : ''}
          <span class="tcard-foot">
            <span class="status-pill${t.statusIdx < 0 ? ' is-none' : ''}">${esc(statusText)}</span>
            <span class="dots" aria-hidden="true">${dots}</span>
          </span>
        </button>`;
      })
      .join('')}</div>`;
  }

  function sessionsFor(t) {
    return state.sessions.filter(
      (s) => s.techs.some((x) => namesMatch(t.name, x.title)) || (t.first && s.date === t.first) || (t.updated && s.date === t.updated && s.techs.length === 0)
    );
  }

  function techSheet(t) {
    const info = { num: t.num, name: t.short, title: t.name, cat: t.cat.key };
    const tint = CATEGORIES.some((c) => c.key === t.cat.key) ? t.cat.key : 'other';
    const sessions = sessionsFor(t);
    const drills = drillsFor(t);
    const ladder = STATUSES.map((s, i) => `<li class="${i < t.statusIdx ? 'on' : ''}${i === t.statusIdx ? ' current' : ''}">${s}${i === t.statusIdx ? '<span class="sr-only"> (current)</span>' : ''}</li>`).join('');
    return `<div class="sheet-hero">
        <div class="card-top">
          <span class="sheet-tags">${t.num ? badge(info) : ''}<span class="sheet-cat tint-${tint}">${esc(t.cat.label)}</span></span>
          <button type="button" class="icon-btn sheet-close" data-action="close-sheet" aria-label="Close">${icon('x', 20)}</button>
        </div>
        <h2 class="sheet-title" id="sheet-title">${t.num ? `<span class="sr-only">${esc(t.num)} - </span>` : ''}${esc(t.short)}</h2>
        ${t.sub ? `<p class="sheet-thai" style="font-style:normal">${esc(t.sub)}</p>` : ''}
        ${t.thai ? `<p class="sheet-thai">${esc(t.thai)}</p>` : ''}
        <ol class="ladder" aria-label="Status: ${esc(t.status || 'Not taught yet')}">${ladder}</ol>
      </div>
      <div class="cue-card"><p class="k">Key cue</p><p class="v">${t.cue ? mdInline(t.cue) : 'Nothing here yet'}</p></div>
      <div class="facts">
        <div><p class="k">First taught</p><p class="v">${t.first ? esc(fmtISO(t.first) || t.first) : '-'}</p></div>
        <div><p class="k">Last updated</p><p class="v">${t.updated ? esc(fmtISO(t.updated) || t.updated) : '-'}</p></div>
      </div>
      ${drills.length ? `<div class="block">
        <div class="block-head"><h3 class="dsec-title" style="font-size:var(--fs-h3)">Home drill${drills.length === 1 ? '' : 's'}</h3><span class="meta">${drills.length}</span></div>
        <ul class="link-list">${drills
          .map((d) => `<li><a class="link-row drill-link" href="#/drills/${d.id}"><span class="dl-icon" aria-hidden="true">${icon('dumbbell', 18)}</span><span class="lr-text"><strong>${esc(d.title)}</strong>${d.fixes ? `<span>${mdInline(d.fixes)}</span>` : ''}</span><span class="arrow-btn" aria-hidden="true">${icon('arrowUpRight', 18)}</span></a></li>`)
          .join('')}</ul>
      </div>` : ''}
      <div class="block">
        <div class="block-head"><h3 class="dsec-title" style="font-size:var(--fs-h3)">Sessions</h3><span class="meta">${sessions.length}</span></div>
        ${sessions.length
          ? `<ul class="link-list">${sessions
              .map(
                (s) => `<li><a class="link-row" href="#/session/${esc(s.date)}"><span class="lr-text"><strong>Day ${esc(s.day)}</strong><span>${esc(fmtLong(s.dateObj))}</span></span><span class="arrow-btn" aria-hidden="true">${icon('arrowUpRight', 18)}</span></a></li>`
              )
              .join('')}</ul>`
          : emptyState('Nothing here yet', t.statusIdx < 0 ? 'Not taught yet. It will link here once a session covers it.' : 'No session mentions this yet.', 'calendar')}
      </div>`;
  }

  // ---------- Drills ----------

  const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'drill';
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  // drills.md: one "## Drill name" per drill, then "- **Label:** value" bullets and a
  // numbered list under "How". Parsed by label, so order doesn't matter and missing
  // fields are fine.
  function parseDrills(raw) {
    const found = [];
    let d = null;
    let field = null;
    for (const line of clean(raw).split('\n')) {
      const h = line.match(/^##\s+(.+?)\s*$/);
      if (h) { d = { title: h[1], fields: {}, steps: [] }; found.push(d); field = null; continue; }
      if (!d) continue;
      const f = line.match(/^\s*[-*]\s+\*\*([^*]+?)\*\*\s*:?\s*(.*)$/);
      if (f) { field = f[1].replace(/:\s*$/, '').trim().toLowerCase(); d.fields[field] = f[2].trim(); continue; }
      const step = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (step && field && /^(how|steps?)/.test(field)) { d.steps.push(step[1].trim()); continue; }
      if (line.trim() && field && /^\s{2,}\S/.test(line)) {
        if (d.steps.length && /^(how|steps?)/.test(field)) d.steps[d.steps.length - 1] += ' ' + line.trim();
        else d.fields[field] = `${d.fields[field]} ${line.trim()}`.trim();
      }
    }
    const used = new Set();
    return found.map((x) => {
      const get = (re) => { const k = Object.keys(x.fields).find((key) => re.test(key)); return k ? x.fields[k] : ''; };
      const from = get(/^from/);
      const dayM = from.match(/day\s*(\d+)/i);
      const how = get(/^(how|steps?)/);
      let id = slug(x.title);
      while (used.has(id)) id += '-2';
      used.add(id);
      return {
        id,
        title: x.title,
        fixes: get(/^fix/),
        cue: get(/cue/),
        techText: get(/^technique/),
        date: (from.match(/\d{4}-\d{2}-\d{2}/) || [])[0] || '',
        day: dayM ? dayM[1] : '',
        status: /fixed/i.test(get(/^status/)) ? 'fixed' : 'active',
        dose: get(/^dose/),
        steps: x.steps.length ? x.steps : how ? [how] : [],
      };
    });
  }

  // "1 - Jab, 2 - Cross" -> technique rows; "all punches" -> every row in that category.
  function drillLinks(d) {
    return d.techText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label) => {
        const all = label.match(/^all\s+(.+)$/i);
        const cat = all ? CATEGORIES.find((c) => c.match.test(all[1].toLowerCase())) : null;
        if (cat) return { kind: 'cat', label: label.charAt(0).toUpperCase() + label.slice(1), cat, techs: state.techniques.filter((t) => t.cat.key === cat.key) };
        const t = findTechnique(label);
        return t ? { kind: 'tech', label, tech: t, techs: [t] } : { kind: 'text', label, techs: [] };
      });
  }

  // "Done today" ticks: { drillId: ['YYYY-MM-DD', ...] } in localStorage. If storage is
  // blocked, ticks still work for this visit.
  const DONE_KEY = 'muay-thai-log:drills-done';
  let doneCache = null;

  function doneMap() {
    if (!doneCache) {
      try { doneCache = JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); } catch (e) { doneCache = {}; }
      if (!doneCache || typeof doneCache !== 'object' || Array.isArray(doneCache)) doneCache = {};
    }
    return doneCache;
  }

  const doneDates = (id) => (Array.isArray(doneMap()[id]) ? doneMap()[id] : []);
  const isDoneToday = (id) => doneDates(id).includes(toISO(today()));

  function toggleDone(id) {
    const t = toISO(today());
    const was = isDoneToday(id);
    const list = doneDates(id).filter((x) => x !== t);
    if (!was) list.push(t);
    doneMap()[id] = list.sort();
    try { localStorage.setItem(DONE_KEY, JSON.stringify(doneMap())); } catch (e) { /* storage blocked - keep it for this visit */ }
  }

  const activeDrills = () => state.drills.filter((d) => d.status === 'active');
  const drillsFor = (t) => activeDrills().filter((d) => d.techIds.has(t.id));

  function renderDrills(focusId) {
    const all = state.drills;
    const active = activeDrills();
    const fixed = all.length - active.length;
    const focus = focusId ? all.find((d) => d.id === focusId) : null;
    if (focus && state.drillFilter !== 'all' && state.drillFilter !== focus.status) state.drillFilter = 'all';

    const header = `<header class="hero">
      <div class="hero-top"><span class="eyebrow"><span class="dot"></span>Practice</span></div>
      <h1 class="hero-title is-text">Home drills</h1>
      <p class="hero-sub">${all.length ? `<strong>${plural(active.length, 'active drill')}</strong>${fixed ? `<span class="sep"></span><span>${fixed} fixed</span>` : ''}` : '<span>Short drills that fix what the coach corrects</span>'}</p>
    </header>`;

    if (!all.length) {
      return `<section class="screen">${glow}${header}${emptyState('Nothing here yet', 'Home drills for the mistakes your coach corrects will show up here.', 'dumbbell')}</section>`;
    }

    const filters = [
      { key: 'active', label: 'Active', n: active.length },
      { key: 'fixed', label: 'Fixed', n: fixed },
      { key: 'all', label: 'All', n: all.length },
    ];

    return `<section class="screen">${glow}${header}
      <div id="drill-today">${drillToday()}</div>
      <section class="block" aria-labelledby="h-drills">
        <div class="block-head"><h2 id="h-drills">Drills</h2><span class="meta">Tick when done</span></div>
        <div class="filters" role="group" aria-label="Filter drills">${filters
          .map((f) => `<button type="button" class="chip" data-action="drill-filter" data-key="${f.key}" aria-pressed="${state.drillFilter === f.key}">${f.label}<span class="chip-count">${f.n}</span></button>`)
          .join('')}</div>
        <div id="drill-list">${drillList()}</div>
      </section>
    </section>`;
  }

  // Near-black summary card: how many active drills are ticked today.
  function drillToday() {
    const active = activeDrills();
    if (!active.length) return '';
    const done = active.filter((d) => isDoneToday(d.id)).length;
    return `<section class="card dark drill-today" aria-label="Today: ${done} of ${active.length} drills done">
      <div class="dt-row">
        <div><span class="dt-num">${done}<small> / ${active.length}</small></span><span class="dt-label">done today</span></div>
        <span class="dt-dots" aria-hidden="true">${active.map((d) => `<i${isDoneToday(d.id) ? ' class="on"' : ''}></i>`).join('')}</span>
      </div>
      <p class="dt-hint">${done === active.length ? 'All done for today. Rest well.' : 'A few minutes a day stops a mistake becoming a habit.'}</p>
    </section>`;
  }

  function drillList() {
    const f = state.drillFilter;
    const list = state.drills.filter((d) => f === 'all' || d.status === f);
    if (!list.length) {
      return f === 'fixed'
        ? emptyState('No fixed drills yet', 'A drill moves here once your coach stops correcting that mistake.', 'check')
        : emptyState('Nothing to practise', 'Every drill is marked fixed. New ones appear when the coach corrects something.', 'dumbbell');
    }
    return `<div class="drill-list">${list.map(drillCard).join('')}</div>`;
  }

  function drillCard(d) {
    const isActive = d.status === 'active';
    const done = isActive && isDoneToday(d.id);
    const days = doneDates(d.id).length;
    const session = d.date ? sessionByDate(d.date) : null;
    const chips = d.links.map((l) => {
      if (l.kind === 'tech') {
        const t = l.tech;
        return `<button type="button" class="chip-sm chip-tap tint-${CATEGORIES.some((c) => c.key === t.cat.key) ? t.cat.key : 'other'}" data-action="open-tech" data-id="${t.id}" aria-haspopup="dialog">${t.num ? `<span class="chip-n">${esc(t.num)}</span>` : ''}${esc(t.short)}</button>`;
      }
      if (l.kind === 'cat') return `<button type="button" class="chip-sm chip-tap tint-${l.cat.key}" data-action="go-category" data-key="${l.cat.key}">${esc(l.label)}</button>`;
      return `<span class="chip-sm">${esc(l.label)}</span>`;
    });
    if (d.day || d.date) {
      const label = d.day ? `Day ${d.day}` : fmtISO(d.date);
      chips.push(session
        ? `<a class="chip-sm chip-tap chip-day" href="#/session/${esc(session.date)}" aria-label="From ${esc(label)}">${icon('calendar', 13, 2)}${esc(label)}</a>`
        : `<span class="chip-sm chip-day">${icon('calendar', 13, 2)}${esc(label)}</span>`);
    }
    const foot = isActive || days
      ? `<p class="drill-foot">${icon('flame', 15)}<span>${days ? `Practised ${plural(days, 'day')}` : 'Not practised yet'}</span>${done ? '<span class="sep"></span><strong>Done today</strong>' : ''}</p>`
      : '';
    return `<article class="card drill${isActive ? '' : ' is-fixed'}" id="drill-${d.id}" aria-labelledby="dn-${d.id}">
      <div class="drill-top">
        <div class="drill-heading">
          <p class="drill-name" id="dn-${d.id}">${esc(d.title)}</p>
          ${d.fixes ? `<h3 class="drill-fixes"><span class="sr-only">Fixes: </span>${mdInline(d.fixes)}</h3>` : ''}
        </div>
        ${isActive
          ? `<button type="button" class="done-btn${done ? ' is-done' : ''}" data-action="drill-done" data-id="${d.id}" aria-pressed="${done}" aria-label="Done today: ${esc(d.title)}">${icon('check', 22, 2.5)}</button>`
          : `<span class="fixed-badge">${icon('check', 14, 2.5)}Fixed</span>`}
      </div>
      ${chips.length ? `<div class="chips drill-chips">${chips.join('')}</div>` : ''}
      ${d.cue ? `<div class="drill-cue"><p class="panel-label">Coach's cue</p><p class="drill-cue-text">${mdInline(d.cue)}</p></div>` : ''}
      ${d.dose ? `<p class="drill-dose">${icon('timer', 16)}<span><b>Dose</b> ${mdInline(d.dose)}</span></p>` : ''}
      ${d.steps.length ? `<div class="drill-how">
        <button type="button" class="how-toggle" data-action="toggle-how" aria-expanded="false" aria-controls="how-${d.id}">
          <span class="how-label">How to do it</span><span class="meta">${plural(d.steps.length, 'step')}</span>
          <span class="tech-chev" aria-hidden="true">${icon('chevronDown', 18)}</span>
        </button>
        <div class="how-panel" id="how-${d.id}" inert><div class="how-inner"><ol class="how-steps">${d.steps.map((s) => `<li>${mdInline(s)}</li>`).join('')}</ol></div></div>
      </div>` : ''}
      ${foot}
    </article>`;
  }

  // Compact Home card: how many drills to practise and how many are ticked today.
  function drillsHomeCard() {
    const active = activeDrills();
    if (!active.length) return '';
    const done = active.filter((d) => isDoneToday(d.id)).length;
    const sub = done ? `${done} of ${active.length} done today` : 'None done yet today';
    return `<a class="card drills-home" href="#/drills" aria-label="Home drills: ${plural(active.length, 'drill')} to practise, ${sub}">
      <span class="dh-icon" aria-hidden="true">${icon('dumbbell', 22)}</span>
      <span class="dh-text"><strong>${plural(active.length, 'drill')} to practise</strong><span>${sub}</span></span>
      <span class="arrow-btn" aria-hidden="true">${icon('arrowUpRight', 20)}</span>
    </a>`;
  }

  // ---------- Screens: Words ----------

  function allWords() {
    const map = new Map();
    for (const s of state.sessions) {
      if (!s.words) continue;
      for (const w of s.words.words) {
        const key = fold(w.main).replace(/\s+/g, ' ').trim();
        if (!key || map.has(key)) continue;
        map.set(key, { ...w, session: s });
      }
    }
    return [...map.values()].sort((a, b) => a.main.localeCompare(b.main, 'en', { sensitivity: 'base' }));
  }

  function renderWords() {
    const words = allWords();
    const sessionsWith = new Set(words.map((w) => w.session.date)).size;
    const header = `<header class="hero">
      <div class="hero-top"><span class="eyebrow"><span class="dot"></span>Vocabulary</span></div>
      <h1 class="hero-title is-text">Words</h1>
      <p class="hero-sub">${words.length ? `<strong>${words.length} word${words.length === 1 ? '' : 's'}</strong><span class="sep"></span><span>from ${sessionsWith} session${sessionsWith === 1 ? '' : 's'}</span>` : '<span>Standard terms for the things I describe</span>'}</p>
    </header>`;

    if (!words.length) {
      return `<section class="screen">${glow}${header}${emptyState('Nothing here yet', 'New words from your sessions will collect here.', 'message')}${thaiCard()}</section>`;
    }

    return `<section class="screen">${glow}${header}
      <div class="segmented" role="group" aria-label="View">
        <button type="button" data-action="words-mode" data-mode="list" aria-pressed="${state.wordsMode === 'list'}">${icon('list', 18)}List</button>
        <button type="button" data-action="words-mode" data-mode="flash" aria-pressed="${state.wordsMode === 'flash'}">${icon('layers', 18)}Flashcards</button>
      </div>
      <div id="words-body">${state.wordsMode === 'flash' ? flashView(words) : wordsListView(words)}</div>
    </section>`;
  }

  function wordsListView(words) {
    return `<div class="search" role="search">
        ${icon('search', 20)}
        <label class="sr-only" for="word-search">Search words</label>
        <input id="word-search" type="search" placeholder="Search words..." autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(state.wordsQuery)}">
        <button type="button" class="clear" data-action="clear-search" aria-label="Clear search"${state.wordsQuery ? '' : ' hidden'}>${icon('x', 18)}</button>
      </div>
      <div id="word-results">${wordResults(words)}</div>
      ${thaiCard()}`;
  }

  // Pattern for the standard term inside an example sentence. "load / load up" matches
  // either part (longest first); "the" also matches "your", and plurals are allowed,
  // so "roll the shoulder" finds "Roll your shoulder".
  const FILLER = /^(the|your|my|a|an)$/i;
  const IRREGULAR = { foot: 'f(?:oo|ee)t' };
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function termPattern(main) {
    const alts = String(main || '')
      .split(/\s*\/\s*/)
      .map((x) => x.trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .map((part) =>
        part
          .split(/\s+/)
          .map((w) => (FILLER.test(w) ? '(?:the|your|my|his|her|their|a|an)' : IRREGULAR[w.toLowerCase()] || `${escRe(w)}(?:e?s)?`))
          .join('\\s+')
      );
    return alts.length ? new RegExp(`\\b(?:${alts.join('|')})\\b`, 'gi') : null;
  }

  // "Example" line under a word: the standard term in bold, search hits marked.
  // Spans only, so it can sit inside the flashcard button.
  function exampleLine(example, main, q = '') {
    const text = String(example || '').trim();
    if (!text) return '';
    let body = '';
    if (/[*_`]/.test(text)) {
      body = mdInline(text); // already formatted by hand in the notes
    } else {
      const n = text.length;
      const term = new Uint8Array(n);
      const hit = new Uint8Array(n);
      const re = termPattern(main);
      if (re) for (const m of text.matchAll(re)) term.fill(1, m.index, m.index + m[0].length);
      const f = fold(text);
      if (q && f.length === n) {
        for (let i = f.indexOf(q); i >= 0; i = f.indexOf(q, i + q.length)) hit.fill(1, i, i + q.length);
      }
      for (let i = 0; i < n; ) {
        let j = i;
        while (j < n && term[j] === term[i] && hit[j] === hit[i]) j++;
        let seg = esc(text.slice(i, j));
        if (hit[i]) seg = `<mark>${seg}</mark>`;
        if (term[i]) seg = `<strong>${seg}</strong>`;
        body += seg;
        i = j;
      }
    }
    return `<span class="example"><span class="ex-label">Example</span><span class="ex-text">${body}</span></span>`;
  }

  function highlight(text, q) {
    const safe = esc(text);
    if (!q) return safe;
    const f = fold(text);
    const i = f.indexOf(q);
    if (i < 0 || f.length !== text.length) return safe;
    return `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + q.length))}</mark>${esc(text.slice(i + q.length))}`;
  }

  function wordResults(words) {
    const q = fold(state.wordsQuery.trim());
    const list = q ? words.filter((w) => fold(`${stripMd(w.said)} ${stripMd(w.term)} ${stripMd(w.note)} ${stripMd(w.example)}`).includes(q)) : words;
    if (!list.length) {
      return `<div class="card words-card">${emptyState('No matches', `Nothing matches “${state.wordsQuery.trim()}”. Try a shorter word.`, 'search', 'inline')}</div>`;
    }
    return `<p class="sr-only" aria-live="polite">${list.length} word${list.length === 1 ? '' : 's'}</p>
      <div class="card words-card"><ul class="word-list">${list
        .map(
          (w) => `<li class="word-row">
            <div class="word-main">
              <p class="word-term"><strong>${highlight(w.main, q)}</strong>${w.extra ? ` <span class="word-extra">${mdInline(w.extra)}</span>` : ''}</p>
              <a class="day-pill" href="#/session/${esc(w.session.date)}" aria-label="First used on Day ${esc(w.session.day)}">Day ${esc(w.session.day)}</a>
            </div>
            ${w.said ? `<p class="word-said"><span class="lbl">I said</span>${highlight(stripMd(w.said), q)}</p>` : ''}
            ${w.note ? `<p class="word-note">${mdInline(w.note)}</p>` : ''}
            ${exampleLine(w.example, w.main, q)}
          </li>`
        )
        .join('')}</ul></div>`;
  }

  function thaiCard() {
    if (!state.thai.length) return '';
    return `<section class="block" aria-labelledby="h-thai">
      <div class="card dark">
        <div class="dark-head"><h2 id="h-thai" class="dark-title"><span class="icon-dot">${icon('sparkles', 18)}</span>Thai words to know</h2></div>
        <ul class="thai-list">${state.thai.map((w) => `<li><b lang="th-Latn">${esc(w.term)}</b><span>${esc(w.meaning)}</span></li>`).join('')}</ul>
      </div>
    </section>`;
  }

  function flashOrder(words) {
    const f = state.flash;
    if (!f.order || f.order.length !== words.length) { f.order = words.map((_, i) => i); f.i = 0; }
    return f.order;
  }

  function flashView(words) {
    const order = flashOrder(words);
    const f = state.flash;
    const w = words[order[f.i]];
    return `<div class="flash-wrap">
      <button type="button" class="flash${f.revealed ? ' is-revealed' : ''}" data-action="flip" aria-label="${f.revealed ? 'Show what I said' : 'Reveal the standard term'}">
        <span class="flash-face flash-front"${f.revealed ? ' aria-hidden="true"' : ''}>
          <span class="flash-kicker"><span>I said</span><span>Day ${esc(w.session.day)}</span></span>
          <span class="flash-text">${esc(stripMd(w.said) || '?')}</span>
          <span class="flash-hint">${icon('eye', 16)}Tap to reveal</span>
        </span>
        <span class="flash-face flash-back"${f.revealed ? '' : ' aria-hidden="true"'}>
          <span class="flash-kicker"><span>Standard term</span><span>${icon('rotate', 16)}</span></span>
          <span class="flash-text">${esc(w.main)}</span>
          ${w.extra ? `<span class="flash-extra">${mdInline(w.extra)}</span>` : ''}
          ${w.note ? `<span class="flash-note">${mdInline(w.note)}</span>` : ''}
          ${exampleLine(w.example, w.main)}
        </span>
      </button>
      <div class="flash-controls">
        <button type="button" class="icon-btn" data-action="flash-prev" aria-label="Previous card"${f.i === 0 ? ' disabled' : ''}>${icon('chevronLeft', 22)}</button>
        <span class="flash-count" aria-live="polite">${f.i + 1} <small>/ ${order.length}</small></span>
        <button type="button" class="icon-btn" data-action="flash-next" aria-label="Next card"${f.i >= order.length - 1 ? ' disabled' : ''}>${icon('chevronRight', 22)}</button>
      </div>
      <div style="display:flex;justify-content:center"><button type="button" class="pill-btn" data-action="shuffle">${icon('shuffle', 18)}Shuffle</button></div>
    </div>`;
  }

  // ---------- Router ----------

  const view = document.getElementById('view');
  let currentRoute = '';
  let spyObserver = null;

  function parseRoute() {
    const h = (location.hash || '#/').replace(/^#/, '');
    const m = h.match(/^\/session\/(\d{4}-\d{2}-\d{2})\/?$/);
    if (m) return { name: 'session', tab: 'sessions', arg: m[1] };
    if (/^\/sessions\/?$/.test(h)) return { name: 'sessions', tab: 'sessions' };
    if (/^\/techniques\/?$/.test(h)) return { name: 'techniques', tab: 'techniques' };
    if (/^\/words\/?$/.test(h)) return { name: 'words', tab: 'words' };
    const dr = h.match(/^\/drills(?:\/([a-z0-9-]+))?\/?$/);
    if (dr) return { name: 'drills', tab: 'drills', arg: dr[1] };
    return { name: 'home', tab: 'home' };
  }

  const TITLES = { home: 'Home', sessions: 'Sessions', techniques: 'Techniques', drills: 'Drills', words: 'Words' };

  function render() {
    if (!state.loaded) return;
    closeSheet(true);
    const r = parseRoute();
    const key = `${r.name}:${r.arg || ''}`;
    const changed = key !== currentRoute;
    currentRoute = key;

    let html;
    try {
      if (r.name === 'session') html = renderDetail(r.arg);
      else if (r.name === 'sessions') html = renderSessions();
      else if (r.name === 'techniques') html = renderTechniques();
      else if (r.name === 'words') html = renderWords();
      else if (r.name === 'drills') html = renderDrills(r.arg);
      else html = renderHome();
    } catch (e) {
      console.warn('Render failed', e);
      html = `<section class="screen">${glow}<header class="hero"><div class="hero-top"><span class="eyebrow"><span class="dot"></span>Muay Thai</span></div><h1 class="hero-title is-text">Nothing here yet</h1></header>${emptyState('Nothing here yet', 'Something in the notes could not be read. The rest of the log is still here.', 'book')}</section>`;
    }
    view.innerHTML = html;

    document.querySelectorAll('.tab').forEach((a) => {
      if (a.dataset.tab === r.tab) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    const s = r.name === 'session' ? sessionByDate(r.arg) : null;
    document.title = `${s ? `Day ${s.day}` : TITLES[r.name] || 'Home'} · Muay Thai Log`;

    if (changed) window.scrollTo(0, 0);
    if (r.name === 'drills' && r.arg) focusDrill(r.arg);
    if (r.name === 'session') setupScrollSpy();
  }

  // Highlight the chip for the section in view, and pin the bar style once stuck.
  function setupScrollSpy() {
    if (spyObserver) spyObserver.disconnect();
    const bar = view.querySelector('.chipbar');
    if (!bar) return;
    const sections = [...view.querySelectorAll('.dsec')];
    const chips = [...bar.querySelectorAll('.chip')];
    const setActive = (id) => {
      chips.forEach((c) => {
        const on = c.dataset.target === id;
        c.classList.toggle('is-active', on);
        if (on) {
          c.setAttribute('aria-current', 'true');
          const sc = bar.querySelector('.chipbar-scroll');
          const left = c.offsetLeft - (sc.clientWidth - c.offsetWidth) / 2;
          sc.scrollTo({ left, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        } else c.removeAttribute('aria-current');
      });
    };
    const onScroll = () => {
      const stickTop = parseFloat(getComputedStyle(bar).top) || 0;
      bar.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= stickTop + 0.5);
      let current = sections[0] ? sections[0].id : '';
      for (const sec of sections) if (sec.getBoundingClientRect().top <= stickTop + 120) current = sec.id;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && sections.length) current = sections[sections.length - 1].id;
      if (current !== bar.dataset.active) { bar.dataset.active = current; setActive(current); }
    };
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; if (document.body.contains(bar)) onScroll(); });
    };
    window.removeEventListener('scroll', window.__spy || (() => {}));
    window.__spy = handler;
    window.addEventListener('scroll', handler, { passive: true });
    onScroll();
  }

  // ---------- Bottom sheet ----------

  const sheetLayer = document.getElementById('sheet');
  const sheetBody = document.getElementById('sheet-body');
  let sheetReturn = null;
  let sheetTimer = null;

  function openSheet(html, trigger) {
    clearTimeout(sheetTimer);
    sheetReturn = trigger || null;
    sheetBody.innerHTML = html;
    sheetBody.scrollTop = 0;
    sheetLayer.hidden = false;
    document.body.classList.add('sheet-open');
    view.setAttribute('inert', '');
    document.querySelector('.tabbar').setAttribute('inert', '');
    requestAnimationFrame(() => {
      sheetLayer.classList.add('is-open');
      const btn = sheetBody.querySelector('.sheet-close');
      if (btn) btn.focus({ preventScroll: true });
    });
  }

  function closeSheet(immediate = false) {
    if (sheetLayer.hidden) return;
    sheetLayer.classList.remove('is-open');
    document.body.classList.remove('sheet-open');
    view.removeAttribute('inert');
    document.querySelector('.tabbar').removeAttribute('inert');
    const done = () => { sheetLayer.hidden = true; sheetBody.innerHTML = ''; };
    if (immediate || reduceMotion.matches) done();
    else sheetTimer = setTimeout(done, 260);
    if (!immediate && sheetReturn && document.body.contains(sheetReturn)) sheetReturn.focus({ preventScroll: true });
    sheetReturn = null;
  }

  // ---------- Events ----------

  function toggleTech(btn, force) {
    const art = btn.closest('.tech');
    const open = force !== undefined ? force : btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    art.classList.toggle('open', open);
    const panel = art.querySelector('.tech-panel');
    if (open) panel.removeAttribute('inert');
    else panel.setAttribute('inert', '');
  }

  // Jump to a drill from a technique sheet or link: scroll it into view and ring it.
  function focusDrill(id) {
    const card = document.getElementById(`drill-${id}`);
    if (!card) return;
    card.classList.add('is-focus');
    const top = card.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top, behavior: 'auto' });
  }

  function toggleHow(btn, force) {
    const box = btn.closest('.drill-how');
    const open = force !== undefined ? force : btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    box.classList.toggle('open', open);
    const panel = box.querySelector('.how-panel');
    if (open) panel.removeAttribute('inert');
    else panel.setAttribute('inert', '');
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;

    if (a === 'toggle-tech') {
      toggleTech(el);
      const all = view.querySelector('[data-action="expand-all"]');
      if (all) {
        const btns = [...view.querySelectorAll('.tech-toggle')];
        const allOpen = btns.every((b) => b.getAttribute('aria-expanded') === 'true');
        all.textContent = allOpen ? 'Collapse all' : 'Expand all';
        all.setAttribute('aria-pressed', String(allOpen));
      }
    } else if (a === 'expand-all') {
      const open = el.getAttribute('aria-pressed') !== 'true';
      view.querySelectorAll('.tech-toggle').forEach((b) => toggleTech(b, open));
      el.setAttribute('aria-pressed', String(open));
      el.textContent = open ? 'Collapse all' : 'Expand all';
    } else if (a === 'scroll-to') {
      const target = document.getElementById(el.dataset.target);
      if (target) {
        const bar = view.querySelector('.chipbar');
        const offset = bar ? bar.offsetHeight + parseFloat(getComputedStyle(bar).top) + 8 : 72;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        const h = target.querySelector('h2');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      }
    } else if (a === 'cal-prev' || a === 'cal-next') {
      const m = state.calMonth;
      state.calMonth = new Date(m.getFullYear(), m.getMonth() + (a === 'cal-next' ? 1 : -1), 1);
      const holder = document.getElementById('cal');
      holder.innerHTML = calendarCard();
      const again = holder.querySelector(`[data-action="${a}"]`);
      if (again) again.focus();
    } else if (a === 'filter') {
      state.techFilter = el.dataset.key;
      view.querySelectorAll('[data-action="filter"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      document.getElementById('tgrid').innerHTML = techGrid();
    } else if (a === 'drill-filter') {
      state.drillFilter = el.dataset.key;
      view.querySelectorAll('[data-action="drill-filter"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      document.getElementById('drill-list').innerHTML = drillList();
    } else if (a === 'drill-done') {
      const id = el.dataset.id;
      toggleDone(id);
      const card = document.getElementById(`drill-${id}`);
      const d = state.drills.find((x) => x.id === id);
      if (card && d) {
        const wasOpen = card.querySelector('.drill-how.open');
        card.outerHTML = drillCard(d);
        const fresh = document.getElementById(`drill-${id}`);
        if (wasOpen) toggleHow(fresh.querySelector('.how-toggle'), true);
        fresh.querySelector('.done-btn').focus({ preventScroll: true });
      }
      const today = document.getElementById('drill-today');
      if (today) today.innerHTML = drillToday();
    } else if (a === 'toggle-how') {
      toggleHow(el);
    } else if (a === 'go-category') {
      state.techFilter = el.dataset.key;
      location.hash = '#/techniques';
    } else if (a === 'open-tech') {
      const t = state.techniques.find((x) => x.id === el.dataset.id);
      if (t) openSheet(techSheet(t), el);
    } else if (a === 'close-sheet') {
      closeSheet();
    } else if (a === 'words-mode') {
      if (state.wordsMode === el.dataset.mode) return;
      state.wordsMode = el.dataset.mode;
      state.flash.revealed = false;
      view.querySelectorAll('[data-action="words-mode"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      document.getElementById('words-body').innerHTML = state.wordsMode === 'flash' ? flashView(allWords()) : wordsListView(allWords());
    } else if (a === 'clear-search') {
      state.wordsQuery = '';
      const input = document.getElementById('word-search');
      input.value = '';
      el.hidden = true;
      document.getElementById('word-results').innerHTML = wordResults(allWords());
      input.focus();
    } else if (a === 'flip' || a === 'flash-prev' || a === 'flash-next' || a === 'shuffle') {
      const f = state.flash;
      const words = allWords();
      if (a === 'flip') f.revealed = !f.revealed;
      if (a === 'flash-prev' && f.i > 0) { f.i--; f.revealed = false; }
      if (a === 'flash-next' && f.i < words.length - 1) { f.i++; f.revealed = false; }
      if (a === 'shuffle') {
        const o = words.map((_, i) => i);
        for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
        f.order = o; f.i = 0; f.revealed = false;
      }
      if (a === 'flip') {
        // Toggle in place so the transition runs and focus stays on the card.
        el.classList.toggle('is-revealed', f.revealed);
        el.setAttribute('aria-label', f.revealed ? 'Show what I said' : 'Reveal the standard term');
        const [front, back] = el.querySelectorAll('.flash-face');
        (f.revealed ? back : front).removeAttribute('aria-hidden');
        (f.revealed ? front : back).setAttribute('aria-hidden', 'true');
        return;
      }
      document.getElementById('words-body').innerHTML = flashView(words);
      const focusSel = a === 'shuffle' ? '[data-action="shuffle"]' : `[data-action="${a}"]`;
      const next = document.querySelector(`${focusSel}:not([disabled])`) || document.querySelector('[data-action="flip"]');
      if (next) next.focus();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id !== 'word-search') return;
    state.wordsQuery = e.target.value;
    const clear = view.querySelector('[data-action="clear-search"]');
    if (clear) clear.hidden = !state.wordsQuery;
    document.getElementById('word-results').innerHTML = wordResults(allWords());
  });

  document.addEventListener('keydown', (e) => {
    if (!sheetLayer.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
      if (e.key === 'Tab') {
        const f = [...sheetLayer.querySelectorAll('a[href], button:not([disabled])')];
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });

  sheetLayer.addEventListener('click', (e) => {
    if (e.target.closest('a[href^="#/"]')) closeSheet(true);
  });

  window.addEventListener('hashchange', render);

  // ---------- Start ----------

  load()
    .catch((e) => { console.warn('Load failed', e); state.loaded = true; })
    .then(render);
})();
