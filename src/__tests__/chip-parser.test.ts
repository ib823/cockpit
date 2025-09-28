// src/__tests__/chip-parser.test.ts
import { parseRFPText } from '@/lib/chip-parser';

describe('ChipParser', () => {
  it('should extract country from text', () => {
    const text = 'Manufacturing company based in Malaysia with 500 employees';
    const chips = parseRFPText(text);
    
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.some((c: any) => c.kind === 'country')).toBe(true);
  });

  it('should extract employee count', () => {
    const text = 'Company with 500 employees';
    const chips = parseRFPText(text);
    
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.some((c: any) => c.kind === 'employees')).toBe(true);
  });

  it('should handle malicious input safely', () => {
    const malicious = '<script>alert("xss")</script>Malaysia company';
    const chips = parseRFPText(malicious);
    
    expect(chips.length).toBeGreaterThan(0);
    const firstChip = chips[0] as any;
    expect(firstChip.raw || firstChip.value).not.toContain('<script>');
  });

  it('should extract SAP modules', () => {
    const text = 'Need Finance, HR, and Supply Chain modules';
    const chips = parseRFPText(text);
    
    const moduleChips = chips.filter((c: any) => c.kind === 'modules');
    expect(moduleChips.length).toBeGreaterThanOrEqual(1);
  });
});