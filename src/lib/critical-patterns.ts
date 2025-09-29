
// Critical Business Complexity Patterns for SAP Estimation
// These patterns capture the REAL effort drivers that matter

export const CRITICAL_PATTERNS = {
  // ORGANIZATIONAL COMPLEXITY - Can multiply effort 3-30x
  legal_entities: [
    /\b(\d+)\s*(?:legal\s*entit|company\s*code|subsidiary|subsidiar|group\s*compan)/gi,
    /\b(?:operate|have|manage|across|spanning)\s*(\d+)\s*(?:entities|companies|subsidiaries)/gi,
    /\b(\d+)\s*(?:different|separate|distinct)\s*(?:legal|company|entity)/gi,
    /\bmulti-entity\s*\((\d+)\)/gi
  ],

  locations: [
    /\b(\d+)\s*(cawangan|pejabat|kilang|lokasi)/gi,
    /\b(\d+)\s*(?:plant|location|site|branch|office|warehouse|DC|distribution\s*center|factory|outlet|store)/gi,
    /\b(?:operate\s*in|presence\s*in|across)\s*(\d+)\s*(?:location|site|facility|country|region)/gi,
    /\bmulti-site\s*\((\d+)\)/gi,
    /\b(\d+)\s*(?:plant|location|site|branch|office|warehouse|DC|distribution\s*(?:center|centre)|factory|outlet|store|cawangan|pejabat|kilang)\b/gi,

  ],

  business_units: [
    /\b(\d+)\s*(?:business\s*unit|BU|division|department|profit\s*center|cost\s*center)/gi,
    /\b(?:across|spanning)\s*(\d+)\s*(?:BU|business\s*unit|division)/gi,
    /\b(\d+)\s*(?:separate|different|distinct)\s*(?:P&L|profit\s*center)/gi
  ],

  data_volume: [
    /\b(\d+[KMB]?)\s*(?:transaction|invoice|order|PO|SO|document)s?\s*(?:per|\/)\s*(?:day|month|year)/gi,
    /\b(\d+[KMB]?)\s*(?:daily|monthly|yearly)\s*(?:transaction|invoice|order)/gi,
    /\b(\d+[KMB]?)\s*(?:SKU|material|product|item|customer|vendor|supplier)/gi,
    /\b(\d+[KMB]?)\s*(?:active|total)\s*(?:SKU|material|product|customer|vendor)/gi,
    /\b(\d+)\s*(?:year|month)s?\s*(?:of\s*)?(?:historical|legacy|past)\s*data/gi,
    /\bmigrate\s*(\d+)\s*(?:year|month)s?\s*(?:of\s*)?data/gi
  ],

  users: [
    /\b(\d+)\s*(?:user|seat|license|concurrent\s*user|named\s*user|pekerja|kakitangan|staff)\b/gi,  // Added Malay terms
    /\b(?:for|support|serve|untuk)\s*(\d+)\s*(?:user|employee|staff|pekerja)\b/gi,
    /\b(\d+)\s*(?:power|key|super)\s*user/gi,
    /\b(\d+)\s*(?:casual|occasional|read-only)\s*user/gi
  ],

  currencies: [
    /\b(\d+)\s*(?:currency|currencies)/gi,
    /\bmulti-currency\s*\((\d+)\)/gi,
    /\b(?:operate|transact|deal)\s*in\s*(\d+)\s*(?:currency|currencies)/gi,
    /\b(?:MYR|SGD|USD|EUR|GBP|JPY|CNY|THB|IDR|PHP|VND|INR)(?:\s*[,&]\s*(?:MYR|SGD|USD|EUR|GBP|JPY|CNY|THB|IDR|PHP|VND|INR))+/gi
  ],

  languages: [
    /\b(\d+)\s*(?:language|languages)/gi,
    /\bmulti-language\s*\((\d+)\)/gi,
    /\b(?:support|require)\s*(\d+)\s*language/gi,
    /\b(?:English|Malay|Chinese|Tamil|Thai|Vietnamese|Indonesian|Filipino)(?:\s*[,&]\s*(?:English|Malay|Chinese|Tamil|Thai|Vietnamese|Indonesian|Filipino))+/gi
  ],

  legacy_systems: [
    /\b(\d+)\s*(?:legacy|existing|current)\s*(?:system|application|platform)/gi,
    /\b(?:replace|migrate\s*from|consolidate)\s*(\d+)\s*(?:system|application)/gi,
    /\b(?:from|currently\s*using)\s*(\d+)\s*(?:different|separate)\s*(?:system|ERP|platform)/gi,
    /\bconsolidate\s*from\s*(\d+)\s*(?:instance|system)/gi
  ]
};

export const MALAY_PATTERNS = {
  locations: [
    /\b(\d+)\s+(cawangan|pejabat|kilang|lokasi)/gi,
  ],
  employees: [
    /\b(\d+)\s+(pekerja|kakitangan)/gi,
  ]
};

export function extractNumericValue(text: string): number {
  const cleanText = text.replace(/,/g, '');
  const match = cleanText.match(/(\d+(?:\.\d+)?)\s*([KMB])?/i);
  
  if (!match) return 0;
  
  let value = parseFloat(match[1]);
  const multiplier = match[2]?.toUpperCase();
  
  if (multiplier === 'K') value *= 1000;
  if (multiplier === 'M') value *= 1000000;
  if (multiplier === 'B') value *= 1000000000;
  
  return value;
}

export const EFFORT_IMPACT_RULES = {
  legal_entities: {
    low: { max: 1, multiplier: 1.0 },
    medium: { max: 5, multiplier: 1.5 },
    high: { max: 10, multiplier: 2.0 },
    extreme: { max: Infinity, multiplier: 3.0 }
  },
  locations: {
    low: { max: 2, multiplier: 1.0 },
    medium: { max: 5, multiplier: 1.3 },
    high: { max: 10, multiplier: 1.6 },
    extreme: { max: Infinity, multiplier: 2.0 }
  },
  data_volume_transactions_per_day: {
    low: { max: 1000, multiplier: 1.0 },
    medium: { max: 10000, multiplier: 1.3 },
    high: { max: 100000, multiplier: 1.6 },
    extreme: { max: Infinity, multiplier: 2.0 }
  },
  users: {
    low: { max: 50, multiplier: 1.0 },
    medium: { max: 200, multiplier: 1.2 },
    high: { max: 1000, multiplier: 1.4 },
    extreme: { max: Infinity, multiplier: 1.6 }
  },
  legacy_systems: {
    low: { max: 1, multiplier: 1.0 },
    medium: { max: 3, multiplier: 1.3 },
    high: { max: 5, multiplier: 1.6 },
    extreme: { max: Infinity, multiplier: 2.0 }
  }
};

export const MISSING_INFO_ALERTS = {
  legal_entities: {
    severity: 'critical',
    message: 'Missing legal entity count - could be 1 or 20, massive impact on effort',
    default_assumption: 1,
    risk_note: 'Each additional legal entity adds 10-20% effort'
  },
  locations: {
    severity: 'high',
    message: 'Missing location/plant count - affects logistics and master data complexity',
    default_assumption: 1,
    risk_note: 'Multi-location rollouts can double implementation time'
  },
  data_volume: {
    severity: 'high',
    message: 'Missing transaction volumes - affects performance design and migration approach',
    default_assumption: '1000/day',
    risk_note: 'High volumes require architecture changes and longer migration'
  },
  users: {
    severity: 'medium',
    message: 'Missing user count - affects licensing, training, and change management',
    default_assumption: 50,
    risk_note: 'Training effort scales non-linearly with users'
  }
};

export function getSmartAssumptions(industry: string, employees: number, revenue: number): any {
  const assumptions: any = {};
  
  if (industry?.toLowerCase().includes('manufactur')) {
    assumptions.legal_entities = Math.ceil(employees / 500);
    assumptions.locations = Math.ceil(employees / 200);
    assumptions.data_volume_daily = employees * 10;
    assumptions.SKUs = employees * 2;
  }
  else if (industry?.toLowerCase().includes('retail')) {
    assumptions.legal_entities = Math.ceil(revenue / 100000000);
    assumptions.locations = Math.ceil(employees / 50);
    assumptions.data_volume_daily = employees * 50;
    assumptions.SKUs = 10000;
  }
  else {
    assumptions.legal_entities = 1;
    assumptions.locations = Math.ceil(employees / 300);
    assumptions.data_volume_daily = employees * 5;
    assumptions.SKUs = 100;
  }
  
  return assumptions;
}