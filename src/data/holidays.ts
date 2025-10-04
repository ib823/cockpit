// src/data/holidays.ts
export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  region: "MY" | "SG" | "VN" | "TH" | "ID" | "PH";
}

export const HOLIDAYS_2025_2030: Holiday[] = [
  // Malaysia 2025
  { date: "2025-01-01", name: "New Year", region: "MY" },
  { date: "2025-01-25", name: "Chinese New Year", region: "MY" },
  { date: "2025-01-26", name: "Chinese New Year", region: "MY" },
  { date: "2025-03-31", name: "Hari Raya Aidilfitri", region: "MY" },
  { date: "2025-04-01", name: "Hari Raya Aidilfitri", region: "MY" },
  { date: "2025-05-01", name: "Labour Day", region: "MY" },
  { date: "2025-06-07", name: "Hari Raya Aidiladha", region: "MY" },
  { date: "2025-08-31", name: "Merdeka Day", region: "MY" },
  { date: "2025-09-16", name: "Malaysia Day", region: "MY" },
  { date: "2025-10-24", name: "Deepavali", region: "MY" },
  { date: "2025-12-25", name: "Christmas", region: "MY" },

  // Malaysia 2026
  { date: "2026-01-01", name: "New Year", region: "MY" },
  { date: "2026-02-17", name: "Chinese New Year", region: "MY" },
  { date: "2026-02-18", name: "Chinese New Year", region: "MY" },
  { date: "2026-03-20", name: "Hari Raya Aidilfitri", region: "MY" },
  { date: "2026-03-21", name: "Hari Raya Aidilfitri", region: "MY" },
  { date: "2026-05-01", name: "Labour Day", region: "MY" },
  { date: "2026-05-27", name: "Hari Raya Aidiladha", region: "MY" },
  { date: "2026-05-28", name: "Hari Raya Aidiladha", region: "MY" },
  { date: "2026-08-31", name: "Merdeka Day", region: "MY" },
  { date: "2026-09-16", name: "Malaysia Day", region: "MY" },
  { date: "2026-11-08", name: "Deepavali", region: "MY" },
  { date: "2026-12-25", name: "Christmas", region: "MY" },

  // Singapore 2025
  { date: "2025-01-01", name: "New Year", region: "SG" },
  { date: "2025-01-29", name: "Chinese New Year", region: "SG" },
  { date: "2025-01-30", name: "Chinese New Year", region: "SG" },
  { date: "2025-04-18", name: "Good Friday", region: "SG" },
  { date: "2025-05-01", name: "Labour Day", region: "SG" },
  { date: "2025-05-12", name: "Vesak Day", region: "SG" },
  { date: "2025-06-06", name: "Hari Raya Haji", region: "SG" },
  { date: "2025-08-09", name: "National Day", region: "SG" },
  { date: "2025-10-20", name: "Deepavali", region: "SG" },
  { date: "2025-12-25", name: "Christmas", region: "SG" },

  // Singapore 2026
  { date: "2026-01-01", name: "New Year", region: "SG" },
  { date: "2026-02-17", name: "Chinese New Year", region: "SG" },
  { date: "2026-02-18", name: "Chinese New Year", region: "SG" },
  { date: "2026-04-03", name: "Good Friday", region: "SG" },
  { date: "2026-05-01", name: "Labour Day", region: "SG" },
  { date: "2026-05-31", name: "Vesak Day", region: "SG" },
  { date: "2026-05-26", name: "Hari Raya Haji", region: "SG" },
  { date: "2026-08-09", name: "National Day", region: "SG" },
  { date: "2026-11-08", name: "Deepavali", region: "SG" },
  { date: "2026-12-25", name: "Christmas", region: "SG" },

  // Vietnam 2025
  { date: "2025-01-01", name: "New Year", region: "VN" },
  { date: "2025-01-28", name: "Tết (Lunar New Year)", region: "VN" },
  { date: "2025-01-29", name: "Tết (Lunar New Year)", region: "VN" },
  { date: "2025-01-30", name: "Tết (Lunar New Year)", region: "VN" },
  { date: "2025-01-31", name: "Tết (Lunar New Year)", region: "VN" },
  { date: "2025-02-01", name: "Tết (Lunar New Year)", region: "VN" },
  { date: "2025-04-10", name: "Hung Kings Festival", region: "VN" },
  { date: "2025-04-30", name: "Reunification Day", region: "VN" },
  { date: "2025-05-01", name: "Labour Day", region: "VN" },
  { date: "2025-09-02", name: "National Day", region: "VN" },

  // Thailand 2025
  { date: "2025-01-01", name: "New Year", region: "TH" },
  { date: "2025-04-06", name: "Chakri Day", region: "TH" },
  { date: "2025-04-13", name: "Songkran", region: "TH" },
  { date: "2025-04-14", name: "Songkran", region: "TH" },
  { date: "2025-04-15", name: "Songkran", region: "TH" },
  { date: "2025-05-01", name: "Labour Day", region: "TH" },
  { date: "2025-05-05", name: "Coronation Day", region: "TH" },
  { date: "2025-07-28", name: "King's Birthday", region: "TH" },
  { date: "2025-08-12", name: "Queen's Birthday", region: "TH" },
  { date: "2025-10-13", name: "King Bhumibol Memorial", region: "TH" },
  { date: "2025-10-23", name: "Chulalongkorn Day", region: "TH" },
  { date: "2025-12-05", name: "King Bhumibol Birthday", region: "TH" },
  { date: "2025-12-10", name: "Constitution Day", region: "TH" },
  { date: "2025-12-31", name: "New Year's Eve", region: "TH" },
];

export function getHolidaysByRegion(region: "MY" | "SG" | "VN" | "TH" | "ID" | "PH"): Holiday[] {
  return HOLIDAYS_2025_2030.filter((h) => h.region === region);
}

export function isHoliday(date: Date, region: "MY" | "SG" | "VN" | "TH" | "ID" | "PH"): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return HOLIDAYS_2025_2030.some((h) => h.date === dateStr && h.region === region);
}

export function getHolidayName(
  date: Date,
  region: "MY" | "SG" | "VN" | "TH" | "ID" | "PH"
): string | null {
  const dateStr = date.toISOString().split("T")[0];
  const holiday = HOLIDAYS_2025_2030.find((h) => h.date === dateStr && h.region === region);
  return holiday?.name || null;
}
