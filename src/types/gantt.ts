export type GanttTask = {
  id: string;
  name: string;
  start?: string; // ISO yyyy-mm-dd
  end?: string; // ISO yyyy-mm-dd
  durationDays?: number; // calendar days
  parentId?: string | null;
  dependencies?: string[];
  resource?: string;
  percent?: number; // 0..100
  phase?: string;
  track?: string;
  notes?: string;
};

export type WeekBucket = { w: number; startISO: string; endISO: string };

export type ResourceWeekAlloc = {
  id: string;
  roleName: string;
  roleId?: string; // resolved id from catalog
  rank?: string;
  company?: string;
  resourceName?: string;
  week: number;
  weekStart: string;
  mandays: number;
  taskId: string;
};
