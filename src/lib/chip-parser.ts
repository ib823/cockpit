import { Chip } from "@/types/core";
import { CRITICAL_PATTERNS, extractNumericValue, EFFORT_IMPACT_RULES } from "@/lib/critical-patterns";

/* =================================================================================
 * Chip Types
 * ================================================================================= */
export type ChipKind =
  | "country"
  | "state"
  | "city"
  | "company"
  | "employees"
  | "revenue"
  | "budget"
  | "modules"
  | "timeline"
  | "priority"
  | "integration"
  | "compliance"
  | "industry"
  | "contact_email"
  | "contact_phone"
  | "website"
  | "document_type"
  | "keyword"
  | "legal_entities"     // CRITICAL: drives GL setup effort
  | "locations"          // CRITICAL: drives logistics complexity
  | "currencies"         // CRITICAL: drives finance complexity
  | "data_volume"        // CRITICAL: drives migration effort
  | "users"              // CRITICAL: drives training/licensing
  | "languages"          // CRITICAL: drives localization
  | "business_units"     // CRITICAL: drives reporting complexity
  | "legacy_systems";

export type ParsedValue = {
  value: string | number;
  unit?: string;
  [key: string]: any;
};

/* =================================================================================
 * Vocabulary (SEA-focused, practical breadth)
 * ================================================================================= */
const VOCAB = {
  CURRENCY_SYMS: [
    "RM", "MYR", "SGD", "S\\$", "USD", "US\\$", "EUR", "€", "GBP", "£", "JPY", "¥", "CNY", "RMB",
    "AUD", "NZD", "IDR", "Rp", "VND", "₫", "THB", "฿", "PHP", "₱", "INR", "₹", "AED", "SAR",
  ].join("|"),

  // k/m/b + mn/bn + South-Asia lakh/crore + MY/ID 'juta/bilion'
  MULTIPLIERS: [
    "k", "thousand", "tsd",
    "m", "mn", "mil", "million", "juta",
    "b", "bn", "billion", "bilion", "biliun",
    "lakh", "lac", "crore", "cr"
  ].join("|"),

  MONTHS: [
    "jan(?:uary)?", "feb(?:ruary)?", "mar(?:ch)?", "apr(?:il)?", "may", "jun(?:e)?", "jul(?:y)?",
    "aug(?:ust)?", "sep(?:t(?:ember)?)?", "oct(?:ober)?", "nov(?:ember)?", "dec(?:ember)?",
  ].join("|"),

  REL_TIMES: [
    "eod", "eow", "eom", "eoy",
    "end of (?:the )?(?:day|week|month|quarter|year)",
    "by (?:the )?(?:day|week|month|quarter|year) end",
    "within(?: the next)? \\d+ (?:day|week|month|quarter|year)s?",
    "next (?:day|week|month|quarter|year)",
    "in \\d+ (?:day|week|month|quarter|year)s?",
    "asap", "immediately", "no later than"
  ].join("|"),

  COUNTRIES: [
    "malaysia", "singapore", "vietnam", "thailand", "indonesia", "philippines", "brunei", "cambodia",
    "laos", "myanmar", "china", "japan", "korea", "india", "australia", "new zealand",
    "united\\s*states|usa|us", "united\\s*kingdom|uk", "germany", "france", "italy", "spain",
    "netherlands", "switzerland", "uae", "saudi arabia"
  ].join("|"),

  // Malaysia states + key territories
  STATES_MY: [
    "selangor", "johor", "perak", "sabah", "sarawak", "kedah", "kelantan", "terengganu", "pahang",
    "melaka|malacca", "negeri sembilan", "perlis", "penang|pulau pinang",
    "kuala lumpur", "putrajaya", "labuan"
  ].join("|"),

  // Common MY cities (short list to avoid noise)
  CITIES_MY: [
    "subang jaya", "shah alam", "petaling jaya", "george town", "butterworth", "ipoh",
    "seremban", "melaka|malacca city", "kota bharu", "alor setar", "kuala terengganu",
    "kuantan", "kuching", "miri", "kota kinabalu", "sandakan", "johor bahru", "klang"
  ].join("|"),

  // SAP tokens
  SAP_MODULE_TOKENS: [
    // Core ERP
    "fi", "co", "fico", "mm", "sd", "pp", "qm", "pm", "ps", "im", "le", "wm", "ewm", "tm", "apo", "ibp",
    "sistem\\s*kewangan|sistem\\s*hr|sistem\\s*inventori|sistem\\s*pengeluaran",
    // Finance Detail
    "aa", "ap", "ar", "gl", "cm", "trm|treasury", "bpc", "grc",
    // HR
    "hcm", "sf|successfactors|employee central|ec payroll|payroll",
    // Analytics / Platform
    "sac|sap analytics cloud", "bobj|businessobjects", "bw|bw\\/4hana", "bex",
    "btp|cpi|integration suite|cloud integration|api management|event mesh",
    // LoB / Cloud
    "ariba", "concur", "fieldglass", "drc|einvoice|e-document|edocument|my\\s*invois",
    
    "gts", "emd", "s\\/4hana|s4hana|sap\\s*ecc|r\\/3",
  ].join("|"),

  // Integrations / data platforms (expanded)
  SYSTEMS: [
    "salesforce", "oracle", "microsoft", "workday", "netsuite", "zendesk", "servicenow",
    "dynamics\\s*(?:365)?|d365", "power\\s*bi", "tableau", "qlik", "snowflake", "databricks",
    "redshift", "bigquery", "shopify", "magento", "bigcommerce", "stripe", "adyen",
    "payp(al|ment)?", "xero", "quickbooks", "jira", "github", "gitlab", "bitbucket",
    "okta", "auth0", "keycloak", "key\\s*vault", "vault"
  ].join("|"),

  // Industries (wider set with SEA relevance)
  INDUSTRIES: [
    "manufactur(?:e|ing)", "retail|e-?commerce|ecommerce", "health(?:care)?|pharma|hospital",
    "bank(?:ing)?|financial services|finserv|fintech", "insurance|takaful", "telco|telecom(?:munications)?",
    "oil\\s*&?\\s*gas|energy|utilities", "transport|logistics|shipping", "fmcg|consumer goods",
    "government|public sector", "education|university|school", "automotive|auto",
    "construction|engineering|property|real\\s*estate", "plantation|palm\\s*oil",
    "semiconductor|electronics", "mining", "aviation|airline", "port|maritime"
  ].join("|"),

  DOC_TYPES: [
    "rfi", "rfp", "rfq", "eoi", "tor", "sow", "msa", "nda", "po", "loi", "loa"
  ].join("|"),
};

/* =================================================================================
 * Patterns
 * ================================================================================= */
const CHIP_PATTERNS: Partial<Record<ChipKind, RegExp[]>> = {
  country: [new RegExp(`\\b(${VOCAB.COUNTRIES})\\b`, "gi")],
  state:   [new RegExp(`\\b(${VOCAB.STATES_MY})\\b`, "gi")],
  city:    [new RegExp(`\\b(${VOCAB.CITIES_MY})\\b`, "gi")],

  company: [
    // Common legal suffixes (MY/SG/global)
    /\b([A-Z][\w&'.-]+(?:\s+[A-Z][\w&'.-]+)*\s+(?:Sdn\s*Bhd|Berhad|Bhd|Pte\s*Ltd|Ltd|LLC|Inc|GmbH|SA|SAS|PLC|LLP))\b/g,
    // Two+ capitalized words followed by "Berhad"/"Group"/"Holdings" etc.
    /\b([A-Z][\w&'.-]+(?:\s+[A-Z][\w&'.-]+){1,4}\s+(?:Berhad|Group|Holdings|Corporation|Company))\b/g,
  ],

  employees: [
    /\b(\d{1,3}(?:[,.]\d{3})+|\d+(?:\.\d+)?\s*k)\s*(?:employees?|staff|pax|kakitangan|pekerja|headcount|hc|f(?:ull)?t(?:ime)?e(?:quivalent)?s?|users?|workforce)\b/gi,
    /\b(?:headcount|hc|fte|employees?)\s*[:~\-]?\s*(\d{1,3}(?:[,.]\d{3})+|\d+(?:\.\d+)?\s*k)\b/gi,
    /\b(?:about|around|approx(?:\\.|imately)?)\s+(\d{1,3}(?:[,.]\d{3})+|\d+(?:\.\d+)?\s*k)\s+(?:staff|employees|users?)\b/gi
  ],

  revenue: [
    // [CUR]? number [mult]? [label]
    new RegExp(`\\b(?:(${VOCAB.CURRENCY_SYMS})\\s*)?(\\d{1,3}(?:[,.]\\d{3})*|\\d+(?:\\.\\d+)?)\\s*(${VOCAB.MULTIPLIERS})?\\s*(?:revenue|turnover|sales|gmv|arr|perolehan|hasil|pendapatan)\\b`, "gi"),
    // [label] : [CUR]? number [mult]?
    new RegExp(`\\b(?:revenue|turnover|sales|gmv|arr|perolehan|hasil|pendapatan)\\s*[:~\\-]?\\s*(?:(${VOCAB.CURRENCY_SYMS})\\s*)?(\\d{1,3}(?:[,.]\\d{3})*|\\d+(?:\\.\\d+)?)\\s*(${VOCAB.MULTIPLIERS})?\\b`, "gi"),
    // number [mult]? [CUR] (e.g., "1.2 bn USD revenue")
    new RegExp(`\\b(\\d{1,3}(?:[,.]\\d{3})*|\\d+(?:\\.\\d+)?)\\s*(${VOCAB.MULTIPLIERS})\\s*(${VOCAB.CURRENCY_SYMS})\\b.*?(?:revenue|turnover|sales|gmv|arr)`, "gi"),
  ],

  budget: [
    // budget / capex / opex / allocation with money
    new RegExp(`\\b(?:budget|capex|opex|allocation|estimated\\s*cost|cost\\s*estimate)\\s*[:~\\-]?\\s*(?:(${VOCAB.CURRENCY_SYMS})\\s*)?(\\d{1,3}(?:[,.]\\d{3})*|\\d+(?:\\.\\d+)?)\\s*(${VOCAB.MULTIPLIERS})?\\b`, "gi"),
  ],

  modules: [
    new RegExp(`\\b(${VOCAB.SAP_MODULE_TOKENS})\\b(?:\\s*(?:module|system|process|package|scope\\s*item|solution))?`, "gi"),
    /\b(?:finance|financial|accounting|supply\s+chain|scm|procurement|hr|human\s+(?:resources?|capital))\s+(?:module|system|process|package|solution)?\b/gi,
    // SAP Best Practice scope item codes like 1GA, J45, BBN, etc.
    /\b(?:scope\s*(?:item|id|code)?\s*[:\-]?\s*)?([A-Z]\d{2,3})\b/gi
  ],

  timeline: [
    /\b(?:go-?live|target(?:ed)?|launch|deploy(?:ment)?|roll-?out)\s*(?:for|by|on|in|around)?\s*(Q[1-4]\s*'?\d{2,4}|\d{4}\s*Q[1-4])\b/gi,
    /\b(Q[1-4]\s*'?\d{2,4}|\d{4}\s*Q[1-4]|H[12]\s*'?\d{2,4}|FY\s*'?\d{2,4})\b/gi,
    new RegExp(`\\b(?:by|on|in|around|no\\s*later\\s*than)\\s*(?:(${VOCAB.MONTHS})\\s*'?\\d{2,4}|\\d{1,2}[\\/.-]\\d{1,2}[\\/.-]\\d{2,4})\\b`, "gi"),
    new RegExp(`\\b(${VOCAB.REL_TIMES})\\b`, "gi"),
    /\b(?:tbd|to be determined|to be decided)\b/gi
  ],

  priority: [
    /\b(?:asap|urgent|high\\s*priority|critical|must-?have|nice-?to-?have|mandatory|optional)\b/gi,
  ],

  integration: [
    new RegExp(`\\b(?:integrat(?:e|ion)|connect|interface|sync|hook|bridge|plug-?in)\\s*(?:to|with|into|via)?\\s*(${VOCAB.SYSTEMS}|[A-Z][\\w\\-.&/ ]{2,60})`, "gi"),
    new RegExp(`\\b(${VOCAB.SYSTEMS})\\b`, "gi"),
    /\b(?:api|odata|soap|rest|webhook|sftp|edi|kafka|mqtt|event\\s*mesh)\b/gi,
  ],

  compliance: [
    /\b(?:e-?invoice|e-?invoicing|einvoice|e-inv|my\s*invois|myinvois|peppol|e-?tax|e-faktur|efaktur|zatca|fatoora|vat|sst|gst|sales\s*tax|service\s*tax|lhdn|iras|hmrc|ato|birs?)\b/gi,
    /\b(drc|e-?document|e-document|einv\s*portal|myinvois\s*portal|pdpa|iso\\s*27001|soc\\s*2|pci(?:-?dss)?)\b/gi,
  ],

  industry: [
    new RegExp(`\\b(${VOCAB.INDUSTRIES})\\b(?:\\s*(?:company|industry|sector|background))?`, "gi"),
  ],

  contact_email: [
    // Simplified but robust email
    /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi
  ],

  contact_phone: [
    // E.164 or local MY formats (01X/03) with separators
    /\b(\+?\d{1,3}[\s-]?)?(?:0\d{1,2}|\d{2,3})[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g
  ],

  website: [
    // Domains / URLs
    /\b((?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]{1,63}\.[a-z.]{2,10}(?:\/[^\s]*)?)\b/gi
  ],

  document_type: [
    new RegExp(`\\b(${VOCAB.DOC_TYPES})\\b`, "gi")
  ],

  keyword: [], // filled by fallback collector
};

/* =================================================================================
 * Parser Entrypoint
 * ================================================================================= */
export function parseRFPText(text: string): Chip[] {
  const chips: Chip[] = [];
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>(); // de-dup raw-span
  // capture unseen capitalized multi-word phrases as keywords (fallback)
  const fallbackKeywords: { i: number; raw: string; start: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    for (const [kind, patterns] of Object.entries(CHIP_PATTERNS)) {
      for (const pattern of patterns) {
        for (const match of line.matchAll(pattern)) {
          const raw = match[0];
          const start = match.index ?? 0;
          const key = `${i}:${start}:${raw}`;

          if (seen.has(key)) continue;

          // integration verb → capture target system (group 1)
          if (kind === "integration" && /integrat|connect|interface|sync|hook|bridge|plug/i.test(raw)) {
            const target = (match[1] || "").trim();
            if (target) {
              const chip = createChip("integration", target, `Line ${i + 1}`, line, match);
              if (chip && !isDuplicate(chips, chip)) {
                chips.push(chip);
                seen.add(key);
              }
              continue;
            }
          }

          const chip = createChip(kind as ChipKind, raw, `Line ${i + 1}`, line, match);
          if (chip && !isDuplicate(chips, chip)) {
            chips.push(chip);
            seen.add(key);
          }
        }
      }
    }

    // Fallback keyword collector: Proper nouns / acronyms not already captured
    // e.g., "Permodalan Nasional Berhad", "PLUS Malaysia", "PNB", "ABeam"
    for (const kw of line.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}|[A-Z]{2,8})\b/g)) {
      const raw = kw[0];
      const start = kw.index ?? 0;
      const key = `${i}:${start}:${raw}`;
      if (seen.has(key)) continue;
      // skip single generic words
      if (/^(The|And|For|With|From|This|That|These|Those)$/i.test(raw)) continue;
      // if not already matched by other kinds, treat as keyword
      fallbackKeywords.push({ i, raw, start });
    }
  }

  // push fallback keywords last (lower confidence)
  for (const { i, raw, start } of fallbackKeywords) {
    const line = lines[i];
    const match = { 0: raw, index: start } as unknown as RegExpMatchArray;
    const chip = createChip("keyword", raw, `Line ${i + 1}`, line, match);
    if (chip && !isDuplicate(chips, chip)) chips.push(chip);
  }

  return chips;
}

export const parseChips = parseRFPText;

/* =================================================================================
 * Helpers
 * ================================================================================= */
function createChip(
  kind: ChipKind,
  raw: string,
  location: string,
  context: string,
  match: RegExpMatchArray
): Chip | null {
  const rawTrim = raw.trim();

  const STOP = new Set([
    "require", "requires", "required", "need", "needs", "must",
    "system", "process", "specification", "specifications",
  ]);
  if (STOP.has(rawTrim.toLowerCase())) return null;

  const parsed = parseValue(kind, rawTrim, match);
  if (parsed == null || parsed.value == null || parsed.value === "") return null;

  return {
    id: generateId(),
    kind,
    raw: rawTrim,
    parsed,
    source: (location as any) || 'paste',
    evidence: {
      snippet: safeSnippet(context, match.index ?? 0, raw.length),
      context: context.slice(0, 300),
      confidence: calculateConfidence(kind, parsed, rawTrim),
    },
    meta: (kind === "integration" && /peppol/i.test(rawTrim))
      ? { notes: ['Peppol can be "compliance" or "integration" depending on context.'] }
      : undefined,
    validated: false,
  } as any;
}

function parseValue(kind: ChipKind, raw: string, match: RegExpMatchArray): ParsedValue {
  switch (kind) {
    case "country": return { value: normalizeCountry(raw) };
    case "state":   return { value: titleCase(raw.replace(/\s+/g, " ")) };
    case "city":    return { value: titleCase(raw.replace(/\s+/g, " ")) };

    case "company": {
      return { value: raw.replace(/\s+/g, " ").trim() };
    }

    case "employees": {
      const token = (match[1] ?? raw).match(/\d{1,3}(?:[.,]\d{3})+|\d+(?:\.\d+)?\s*[kK]?|\d+/)?.[0] ?? "";
      return { value: toNumberWithFlexibleMultiplier(token), unit: "employees" };
    }

    case "revenue":
    case "budget": {
      // groups: [cur?, number, mult?] or [number, mult, cur] in the third pattern
      const g1 = match[1] || raw.match(new RegExp(VOCAB.CURRENCY_SYMS, "i"))?.[0] || "MYR";
      // ensure we pick the first numeric-looking group
      const numStr = (match[2] || raw.match(/\d{1,3}(?:[.,]\d{3})*|\d+(?:\.\d+)?/)?.[0] || "0").replace(/,/g, "").replace(/\s/g, "");
      const mult = (match[3] || "").toLowerCase();
      let value = parseFloat(numStr) * multiplierToNumber(mult);
      const unit = normalizeCurrency(g1);
      return { value, unit };
    }

    case "modules": {
      const n = raw.toLowerCase();
      // scope item code like 1GA, J45 etc.
      const scope = n.match(/\b([A-Z]\d{2,3})\b/i)?.[1];
      if (scope) return { value: scope.toUpperCase(), unit: "scope-item" };
      return { value: normalizeSapModule(raw) };
    }

    case "timeline": {
      const v = raw.trim();
      // Normalize variants
      const q = v.match(/\bQ([1-4])\s*'?(\d{2,4})\b/i);
      if (q) return { value: `Q${q[1]} ${normalizeYear(q[2])}`, unit: "quarter" };
      const q2 = v.match(/\b(\d{4})\s*Q([1-4])\b/i);
      if (q2) return { value: `Q${q2[2]} ${q2[1]}`, unit: "quarter" };
      const h = v.match(/\bH([12])\s*'?(\d{2,4})\b/i);
      if (h) return { value: `H${h[1]} ${normalizeYear(h[2])}`, unit: "half" };
      const fy = v.match(/\bFY\s*'?(\d{2,4})\b/i);
      if (fy) return { value: `FY ${normalizeYear(fy[1])}`, unit: "fiscal-year" };
      const mdY = v.match(/\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/);
      if (mdY) return { value: mdY[1], unit: "date" };
      const monY = v.match(new RegExp(`\\b(${VOCAB.MONTHS})\\s*'?\\d{2,4}\\b`, "i"));
      if (monY) return { value: titleCase(monY[0]), unit: "month-year" };
      if (/\b(?:tbd|to be determined|to be decided)\b/i.test(v)) return { value: "TBD", unit: "relative" };
      // relative phrases
      const rel = v.match(new RegExp(`\\b(${VOCAB.REL_TIMES})\\b`, "i"));
      if (rel) return { value: rel[1], unit: "relative" };
      return { value: v };
    }

    case "priority": {
      return { value: normalizePriority(raw) };
    }

    case "integration": {
      const cleaned = raw.replace(/\b(via|with|to|into)\b/gi, "").trim();
      return { value: cleaned };
    }

    case "compliance": {
      return { value: normalizeComplianceTerm(raw) };
    }

    case "industry": {
      return { value: titleCase(raw.replace(/\s*(company|industry|sector|background)/i, "")) };
    }

    case "contact_email": {
      return { value: raw.toLowerCase() };
    }

    case "contact_phone": {
      return { value: normalizePhone(raw) };
    }

    case "website": {
      return { value: normalizeWebsite(raw) };
    }

    case "document_type": {
      return { value: raw.toUpperCase() };
    }

    default:
      return { value: raw.trim() };
  }
}

function calculateConfidence(kind: ChipKind, parsed: ParsedValue, raw: string): number {
  switch (kind) {
    case "country": case "state": case "city": case "company":
    case "contact_email": case "contact_phone": case "website":
    case "document_type":
      return 0.98;
    case "employees": return (typeof parsed.value === 'number' && parsed.value > 0) ? 0.92 : 0.7;
    case "revenue": case "budget": return (typeof parsed.value === 'number' && parsed.value > 0) ? 0.9 : 0.7;
    case "modules": return 0.9;
    case "timeline": return parsed.unit && parsed.unit !== "relative" ? 0.9 : 0.78;
    case "priority": return 0.88;
    case "integration": return /\b(api|odata|soap|rest|webhook|sftp|edi|kafka|mqtt|event\s*mesh)\b/i.test(raw) ? 0.92 : 0.85;
    case "compliance": return 0.95;
    case "industry": return 0.9;
    default: return 0.7;
  }
}

function isDuplicate(chips: any[], newer: any): boolean {
  const key = (c: any) => `${c.kind || c.type}::${String(c.parsed?.value || c.value).toLowerCase()}::${c.parsed?.unit || ""}`;
  const newKey = key(newer);
  return chips.some((c) => key(c) === newKey);
}

function generateId(): string {
  return `chip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function safeSnippet(line: string, start: number, len: number, pad = 40): string {
  const s = Math.max(0, start - pad);
  const e = Math.min(line.length, start + len + pad);
  return `...${line.slice(s, e)}...`;
}

/* =================================================================================
 * Normalizers
 * ================================================================================= */
function normalizeYear(y: string) {
  if (y.length === 2) {
    const yr = parseInt(y, 10);
    return (yr >= 70 ? 1900 + yr : 2000 + yr).toString();
  }
  return y;
}

function toNumberWithFlexibleMultiplier(token: string): number {
  if (!token) return 0;
  const clean = token.replace(/,/g, "").trim().toLowerCase();
  // Simple k/m/b suffix (e.g., 2.5k)
  if (/[kmb]$/.test(clean)) return parseFloat(clean.slice(0, -1)) * multiplierToNumber(clean.slice(-1));
  return parseFloat(clean);
}

function multiplierToNumber(mult: string): number {
  const m = (mult || "").toLowerCase().trim();
  if (m.startsWith("k") || m.startsWith("th")) return 1_000;
  if (m.startsWith("m") || m === "mn" || m === "mil" || m === "million" || m.startsWith("ju")) return 1_000_000;
  if (m.startsWith("b") || m === "bn" || m.startsWith("bili")) return 1_000_000_000;
  if (m.startsWith("lac") || m.startsWith("lakh")) return 100_000;
  if (m.startsWith("cr") || m.startsWith("crore")) return 10_000_000;
  return 1;
}

function normalizeCurrency(cur: string): string {
  const c = cur.toUpperCase().replace("$", "D");
  const map: Record<string, string> = {
    RM: "MYR", "S$": "SGD", USD: "USD", EUR: "EUR", "€": "EUR", GBP: "GBP", "£": "GBP",
    "¥": "JPY", JPY: "JPY", "₫": "VND", VND: "VND", "฿": "THB", THB: "THB",
    "₱": "PHP", PHP: "PHP", "₹": "INR", INR: "INR", RP: "IDR", IDR: "IDR",
    AED: "AED", SAR: "SAR", AUD: "AUD", NZD: "NZD", CNY: "CNY", RMB: "CNY"
  };
  return map[c] || c;
}

function normalizeCountry(raw: string) {
  const n = raw.toLowerCase();
  if (/\b(us|usa|united\s*states)\b/.test(n)) return "United States";
  if (/\buk|united\s*kingdom\b/.test(n)) return "United Kingdom";
  return titleCase(raw);
}

const MODULE_ALIASES: Record<string, string> = {
  "fico": "FI/CO", "fi": "FI", "co": "CO", "mm": "MM/Procurement", "sd": "SD", "pp": "PP",
  "qm": "QM", "pm": "PM", "ewm": "EWM", "tm": "TM", "ibp": "IBP",
  "hcm": "HCM/SuccessFactors", "sf": "HCM/SuccessFactors", "successfactors": "HCM/SuccessFactors",
  "human resources": "HCM/SuccessFactors", "human capital": "HCM/SuccessFactors",
  "sac": "SAC", "sap analytics cloud": "SAC",
  "btp": "SAP BTP / Integration", "cpi": "SAP BTP / Integration", "integration suite": "SAP BTP / Integration",
  "api management": "SAP BTP / Integration", "event mesh": "SAP BTP / Integration",
  "gts": "GTS", "drc": "DRC / e-Invoice", "e-invoice": "DRC / e-Invoice", "my invois": "DRC / e-Invoice",
  "s/4hana": "ERP Platform", "s4hana": "ERP Platform", "ecc": "ERP Platform", "r/3": "ERP Platform",
  "finance": "Finance", "financial": "Finance", "accounting": "Finance",
  "supply chain": "Supply Chain", "scm": "Supply Chain", "procurement": "MM/Procurement", "ariba": "MM/Procurement",
  "hr": "HR"
};

function normalizeSapModule(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [alias, canonical] of Object.entries(MODULE_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }
  return titleCase(raw.replace(/\s*(module|system|process|package|scope\s*item|solution)/i, ""));
}

function normalizeComplianceTerm(raw: string): string {
  const low = raw.toLowerCase();
  if (/(my\s*invois|lhdn)/.test(low)) return "LHDN / MyInvois (MY)";
  if (/peppol/.test(low)) return "Peppol";
  if (/zatca|fatoora/.test(low)) return "ZATCA (KSA)";
  if (/e-?faktur|efaktur/.test(low)) return "e-Faktur (ID)";
  if (/\bgst\b/.test(low)) return "GST";
  if (/\bsst\b/.test(low)) return "SST";
  if (/pdpa/.test(low)) return "PDPA";
  if (/iso\s*27001/.test(low)) return "ISO 27001";
  if (/soc\s*2/.test(low)) return "SOC 2";
  if (/pci-?dss/.test(low)) return "PCI DSS";
  if (/e-?invoice|e-?invoicing|e-?tax|e-?document/.test(low)) return "e-Invoice / e-Document";
  return raw.toUpperCase();
}

function normalizePriority(raw: string): string {
  const r = raw.toLowerCase();
  if (/asap|immediately|urgent|critical|high\s*priority/.test(r)) return "High";
  if (/must-?have|mandatory/.test(r)) return "Must-have";
  if (/nice-?to-?have|optional/.test(r)) return "Nice-to-have";
  return titleCase(raw);
}

function normalizePhone(raw: string): string {
  // keep digits + leading '+', collapse separators
  const d = raw.replace(/[^\d+]/g, "");
  return d.replace(/(\+\d{1,3})(\d)/, "$1 $2");
}

function normalizeWebsite(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/+$/, "");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

/* =================================================================================
 * Summary / Gaps (same API; you can extend if you want)
 * ================================================================================= */
export function summarizeChips(chips: any[]): Partial<Record<ChipKind, any[]>> {
  return chips.reduce((acc: any, chip: any) => {
    const kind = chip.kind || chip.type;
    (acc[kind] ??= []).push(chip);
    return acc;
  }, {} as Partial<Record<ChipKind, any[]>>);
}

export function identifyGaps(chips: Chip[]): string[] {
  const gaps: string[] = [];
  const s = summarizeChips(chips);
  if (!s.country?.length) gaps.push("Missing country/region information");
  if (!s.state?.length && !s.city?.length) gaps.push("Missing state/city information");
  if (!s.employees?.length) gaps.push("Missing employee/FTE/headcount");
  if (!s.modules?.length) gaps.push("Missing SAP module requirements");
  if (!s.timeline?.length) gaps.push("Missing timeline or go-live date");
  if (!s.industry?.length) gaps.push("Missing industry/sector");
  if (!s.revenue?.length) gaps.push("Missing revenue/turnover/ARR/GMV");
  // budget/priority/contact not forced
  return gaps;
}