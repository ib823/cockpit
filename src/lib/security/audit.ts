interface AuditLog {
  timestamp: Date;
  userId?: string;
  action: string;
  entity: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}

class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs = 1000;

  log(action: string, entity: string, details?: Partial<AuditLog>) {
    const entry: AuditLog = {
      timestamp: new Date(),
      action,
      entity,
      ...details
    };
    
    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    if (typeof window !== 'undefined') {
      console.log('[AUDIT]', entry);
    }
  }

  getRecentLogs(count = 100): AuditLog[] {
    return this.logs.slice(-count);
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const audit = new AuditLogger();