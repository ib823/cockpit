import type { ParsedTable } from './excelPaste';
import type { GanttTask, WeekBucket, ResourceWeekAlloc } from '@/types/gantt';

const DAY_MS = 86400000;
const EXCEL_BASE_MS = Date.UTC(1899, 11, 30);
const WEEK_RE = /^W(\d{1,4})$/i;

function isNumber(s?: string){ return s!=null && /^-?\d+(\.\d+)?$/.test(String(s).trim()); }
function toIso(d: Date){ return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0,10); }
function slug(s: string){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,64); }
function parseDate(s?: string): string|undefined {
  if (!s) return;
  const t = String(s).trim();
  if (isNumber(t)) { const ms = EXCEL_BASE_MS + Number(t)*DAY_MS; return toIso(new Date(ms)); }
  const m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m){ const [_,dd,mm,yy]=m; const y=(+yy<100?2000+ +yy:+yy); return toIso(new Date(Date.UTC(y,+mm-1,+dd))); }
  const d = new Date(t); return isNaN(+d)?undefined:toIso(d);
}

export function getWeekColumns(headers: string[]){
  return headers
    .map((h,i)=>({h,i,m:h.match(WEEK_RE)}))
    .filter(x=>x.m)
    .sort((a,b)=>Number(a.m![1]) - Number(b.m![1]));
}

export function buildWeekCalendar(projectStartISO: string, firstW: number, lastW: number): WeekBucket[] {
  // Align projectStartISO to Monday
  const start = new Date(projectStartISO+'T00:00:00Z');
  const dow = start.getUTCDay(); // Sun=0
  const shift = (dow===1?0:(dow===0?-6:1-dow));
  start.setUTCDate(start.getUTCDate()+shift);

  const weeks: WeekBucket[] = [];
  for (let w = firstW; w <= lastW; w++) {
    const offset = (w - firstW) * 7 * DAY_MS;
    const ws = new Date(start.getTime() + offset);
    const we = new Date(ws.getTime() + 6*DAY_MS);
    weeks.push({ w, startISO: toIso(ws), endISO: toIso(we) });
  }
  return weeks;
}

export function parseTasksSection(tbl: ParsedTable) {
  const H = tbl.headers;
  const nameIx = H.findIndex(h => /task\s*name|task|activity/i.test(h));
  const sIx    = H.findIndex(h => /start/i.test(h));
  const eIx    = H.findIndex(h => /end/i.test(h));
  const dIx    = H.findIndex(h => /duration/i.test(h));

  if (nameIx < 0) throw new Error('Task Name column not found');

  const weekCols = getWeekColumns(H);
  if (!weekCols.length) throw new Error('Week columns (Wn) not found');

  const tasks: GanttTask[] = [];
  const flagged: Record<number, string[]> = {};

  let minStart: string | undefined;
  tbl.rows.forEach((r, i) => {
    const name = (r[nameIx]||'').trim(); if (!name) return;
    const start = parseDate(r[sIx]); const end = parseDate(r[eIx]);
    const dur = isNumber(r[dIx]) ? Math.max(0, Math.round(+r[dIx])) : undefined;
    if (start && (!minStart || start < minStart)) minStart = start;
    const id = slug(name);
    tasks.push({ id, name, start, end, durationDays: dur, parentId: null });

    weekCols.forEach(({i:ix, m}) => {
      const token = (r[ix]||'').toString().trim();
      const active = token === 'X' || token === 'x' || token === '1' || token.toLowerCase() === 'true';
      if (active) {
        const w = Number(m![1]);
        (flagged[w] ||= []).push(id);
      }
    });
  });

  const firstW = Number(weekCols[0].m![1]);
  const lastW  = Number(weekCols[weekCols.length-1].m![1]);
  const weeks = buildWeekCalendar(minStart || new Date().toISOString().slice(0,10), firstW, lastW);

  const activeByWeek: Record<number, string> = {};
  weeks.forEach(({ w, startISO, endISO }) => {
    if (flagged[w]?.length) { activeByWeek[w] = flagged[w][0]; return; }
    // fallback by date overlap
    const pick = tasks.find(t => {
      const s = t.start || startISO; const e = t.end || endISO;
      return s <= endISO && e >= startISO;
    });
    if (pick) activeByWeek[w] = pick.id;
  });

  // continuity check
  for (let w = firstW; w <= lastW; w++) {
    if (!weeks.find(x => x.w === w)) throw new Error('Week headers are not continuous');
  }

  return { tasks, weeks, activeByWeek, firstW, lastW };
}

export type ResourceMap = {
  role?: string; rank?: string; company?: string; resourceName?: string;
  start?: string; end?: string; total?: string; // header names
};

export function parseResourcesSection(tbl: ParsedTable, map: ResourceMap, weeks: WeekBucket[], activeByWeek: Record<number,string>, filterByDates=true) {
  const H = tbl.headers;
  const ix = (h?: string) => (h ? H.indexOf(h) : -1);
  const get = (row: string[], h?: string) => (h && ix(h) >= 0 ? row[ix(h)] : undefined);

  const weekCols = getWeekColumns(H);
  if (!weekCols.length) throw new Error('Resource week columns (Wn) not found');

  const out: ResourceWeekAlloc[] = [];
  tbl.rows.forEach((r) => {
    const roleName = (get(r, 'Role') || get(r, map.role) || '').trim();
    if (!roleName) return;
    const rank = (get(r, 'Rank') || get(r, map.rank) || '').trim() || undefined;
    const company = (get(r, 'Company') || get(r, map.company) || '').trim() || undefined;
    const resourceName = (get(r, 'Resource Name') || get(r, map.resourceName) || '').trim() || undefined;

    const startISO = parseDate(get(r, 'Start Date') || get(r, map.start));
    const endISO   = parseDate(get(r, 'End Date')   || get(r, map.end));

    weekCols.forEach(({ i: cix, m }) => {
      const v = r[cix];
      const md = Number(v || 0);
      if (!isFinite(md) || md <= 0) return;
      const w = Number(m![1]);
      const wk = weeks.find(x => x.w === w); if (!wk) return;

      if (filterByDates && (startISO || endISO)) {
        const s = startISO || wk.startISO; const e = endISO || wk.endISO;
        if (wk.endISO < s || wk.startISO > e) return;
      }

      const taskId = activeByWeek[w];
      if (!taskId) return;
      out.push({
        id: `${slug(roleName)}-${slug(resourceName||'res')}-w${w}`,
        roleName,
        rank, company, resourceName,
        week: w, weekStart: wk.startISO, mandays: md, taskId,
      });
    });
  });
  return out;
}
