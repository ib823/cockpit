export type ParsedTable = { headers: string[]; rows: string[][] };

export function detectDelimiter(text: string): string {
  const tab = (text.match(/\t/g) || []).length;
  const comma = (text.match(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/g) || []).length;
  return tab > comma ? '\t' : ',';
}

export function parseTabular(input: string): ParsedTable {
  const delim = detectDelimiter(input);
  const lines = input.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim().length);
  const rows = lines.map(line => {
    if (delim === '\t') return line.split('\t');
    const out: string[] = []; let cur = '', inQ = false;
    for (let i=0;i<line.length;i++){ const ch=line[i];
      if (ch === '"'){ if(inQ && line[i+1] === '"'){cur+='"'; i++;} else inQ=!inQ; }
      else if (ch === ',' && !inQ){ out.push(cur); cur=''; }
      else cur+=ch;
    }
    out.push(cur); return out;
  });
  const headers = (rows.shift()||[]).map(h => (h||'').trim());
  return { headers, rows: rows.map(r => r.map(c => (c||'').trim())) };
}
