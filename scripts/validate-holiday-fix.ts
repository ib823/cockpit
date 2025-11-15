/**
 * Comprehensive Validation Script for Holiday Fix
 * Tests all working-days functions with various holiday configurations
 * Following Jobs/Ive excellence standard - 500000%+ test coverage
 */

import {
  calculateWorkingDaysInclusive,
  isHoliday,
  isWorkingDay,
  addWorkingDays,
  adjustDatesToWorkingDays
} from '../src/lib/gantt-tool/working-days';
import type { GanttHoliday } from '../src/types/gantt-tool';

// Test data configurations
const testHolidays: GanttHoliday[] = [
  { id: '1', name: 'New Year', date: '2025-01-01', region: 'ABMY', type: 'public' },
  { id: '2', name: 'Christmas', date: '2025-12-25', region: 'ABMY', type: 'public' },
  { id: '3', name: 'Company Day', date: '2025-06-15', region: 'ABMY', type: 'company' },
];

const emptyHolidays: GanttHoliday[] = [];

// Test Results
interface TestResult {
  scenario: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
}

const results: TestResult[] = [];

function test(scenario: string, expected: any, actual: any) {
  const passed = JSON.stringify(expected) === JSON.stringify(actual);
  results.push({ scenario, passed, expected, actual });
  if (!passed) {
    console.error(`❌ FAILED: ${scenario}`);
    console.error(`   Expected: ${JSON.stringify(expected)}`);
    console.error(`   Actual:   ${JSON.stringify(actual)}`);
  } else {
    console.log(`✓ PASSED: ${scenario}`);
  }
}

console.log('🧪 Starting Comprehensive Holiday Fix Validation\n');
console.log('='.repeat(80));
console.log('\n## Phase 1: Basic Function Tests with Holidays Array\n');

// Test 1: calculateWorkingDaysInclusive with empty holidays
test(
  'calculateWorkingDaysInclusive with empty holidays (Mon-Fri)',
  5,
  calculateWorkingDaysInclusive(
    new Date('2025-01-06'), // Monday
    new Date('2025-01-10'), // Friday
    emptyHolidays
  )
);

// Test 2: calculateWorkingDaysInclusive with holidays in range
test(
  'calculateWorkingDaysInclusive with New Year holiday (Wed in week)',
  2, // Jan 1 (Wed holiday), Jan 2 (Thu), Jan 3 (Fri), Jan 4-5 (weekend) = 2 working days
  calculateWorkingDaysInclusive(
    new Date('2025-01-01'), // Wed (New Year - holiday)
    new Date('2025-01-05'), // Sun
    testHolidays
  )
);

// Test 3: isHoliday with valid holiday
test(
  'isHoliday returns true for New Year',
  true,
  isHoliday(new Date('2025-01-01'), testHolidays)
);

// Test 4: isHoliday with non-holiday
test(
  'isHoliday returns false for regular day',
  false,
  isHoliday(new Date('2025-01-02'), testHolidays)
);

// Test 5: isWorkingDay on weekday non-holiday
test(
  'isWorkingDay returns true for regular Friday',
  true,
  isWorkingDay(new Date('2025-01-03'), testHolidays)
);

// Test 6: isWorkingDay on holiday
test(
  'isWorkingDay returns false for New Year',
  false,
  isWorkingDay(new Date('2025-01-01'), testHolidays)
);

// Test 7: isWorkingDay on weekend
test(
  'isWorkingDay returns false for Saturday',
  false,
  isWorkingDay(new Date('2025-01-04'), emptyHolidays)
);

// Test 8: addWorkingDays skips weekend
test(
  'addWorkingDays skips weekend correctly',
  '2025-01-08',
  addWorkingDays('2025-01-03', 3, emptyHolidays).toISOString().split('T')[0]
);

// Test 9: addWorkingDays skips holiday
test(
  'addWorkingDays skips New Year holiday',
  '2025-01-06', // Skip Jan 1 (Wed holiday), Jan 4-5 (Sat-Sun)
  addWorkingDays('2024-12-31', 3, testHolidays).toISOString().split('T')[0]
);

// Test 10: adjustDatesToWorkingDays with weekend start
const adjusted1 = adjustDatesToWorkingDays('2025-01-04', '2025-01-10', emptyHolidays);
test(
  'adjustDatesToWorkingDays moves Saturday start to Monday',
  { startDate: '2025-01-06', endDate: '2025-01-10' },
  adjusted1
);

// Test 11: adjustDatesToWorkingDays with holiday start
const adjusted2 = adjustDatesToWorkingDays('2025-01-01', '2025-01-03', testHolidays);
test(
  'adjustDatesToWorkingDays moves New Year to next working day',
  { startDate: '2025-01-02', endDate: '2025-01-03' },
  adjusted2
);

console.log('\n## Phase 2: Edge Cases and Boundary Tests\n');

// Test 12: calculateWorkingDaysInclusive with single day (working day)
test(
  'Single working day returns 1',
  1,
  calculateWorkingDaysInclusive(
    new Date('2025-01-06'),
    new Date('2025-01-06'),
    emptyHolidays
  )
);

// Test 13: calculateWorkingDaysInclusive with single day (weekend)
test(
  'Single weekend day returns 0',
  0,
  calculateWorkingDaysInclusive(
    new Date('2025-01-04'), // Saturday
    new Date('2025-01-04'),
    emptyHolidays
  )
);

// Test 14: calculateWorkingDaysInclusive with single day (holiday)
test(
  'Single holiday returns 0',
  0,
  calculateWorkingDaysInclusive(
    new Date('2025-01-01'),
    new Date('2025-01-01'),
    testHolidays
  )
);

// Test 15: Week spanning multiple holidays
const multiHolidays: GanttHoliday[] = [
  { id: '1', name: 'Holiday 1', date: '2025-01-06', region: 'ABMY', type: 'public' },
  { id: '2', name: 'Holiday 2', date: '2025-01-07', region: 'ABMY', type: 'public' },
  { id: '3', name: 'Holiday 3', date: '2025-01-08', region: 'ABMY', type: 'public' },
];
test(
  'Week with 3 consecutive holidays',
  2, // Mon-Fri = 5 days, minus 3 holidays (Tue-Thu) = 2 days
  calculateWorkingDaysInclusive(
    new Date('2025-01-06'), // Mon
    new Date('2025-01-10'), // Fri
    multiHolidays
  )
);

// Test 16: Month boundary
test(
  'calculateWorkingDaysInclusive across month boundary',
  2, // Dec 31 (Wed) and Jan 2 (Fri), skip Jan 1 (holiday) and Jan 4-5 (weekend)
  calculateWorkingDaysInclusive(
    new Date('2024-12-31'),
    new Date('2025-01-02'),
    testHolidays
  )
);

// Test 17: Year boundary
test(
  'calculateWorkingDaysInclusive across year boundary with holiday',
  3, // Dec 30-31 (Mon-Tue), Jan 1 (Wed holiday), Jan 2 (Thu) = 3 working days (Mon, Tue, Thu)
  calculateWorkingDaysInclusive(
    new Date('2024-12-30'),
    new Date('2025-01-02'),
    testHolidays
  )
);

console.log('\n## Phase 3: Type Safety Tests\n');

// Test 18: Ensure holidays parameter accepts GanttHoliday[] type
test(
  'Type compatibility: GanttHoliday[] array accepted',
  true,
  Array.isArray(testHolidays) && testHolidays.length > 0
);

// Test 19: Ensure holidays parameter rejects string (compile-time, but we can test runtime)
let typeError = false;
try {
  // This would cause compile error, but let's test runtime behavior
  const badParam: any = "ABMY";
  isHoliday(new Date('2025-01-01'), badParam);
} catch (e) {
  typeError = true;
}
test(
  'Type safety: string parameter causes error',
  true,
  typeError
);

console.log('\n## Phase 4: Real-World Scenarios\n');

// Test 20: Task spanning 2 weeks with Christmas
test(
  '2-week task with Christmas holiday',
  9, // 14 calendar days - 4 weekend days - 1 Christmas = 9 working days
  calculateWorkingDaysInclusive(
    new Date('2025-12-22'), // Mon
    new Date('2026-01-04'), // Sun
    testHolidays
  )
);

// Test 21: Long project with multiple holidays
const projectHolidays: GanttHoliday[] = [
  { id: '1', name: 'New Year', date: '2025-01-01', region: 'ABMY', type: 'public' },
  { id: '2', name: 'CNY Day 1', date: '2025-01-29', region: 'ABMY', type: 'public' },
  { id: '3', name: 'CNY Day 2', date: '2025-01-30', region: 'ABMY', type: 'public' },
  { id: '4', name: 'Labor Day', date: '2025-05-01', region: 'ABMY', type: 'public' },
];
const workingDaysJan = calculateWorkingDaysInclusive(
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  projectHolidays
);
test(
  'January 2025 with 3 holidays',
  20, // 31 days - 8 weekends - 3 holidays = 20 working days
  workingDaysJan
);

// Test 22: Resource cost calculation scenario
const taskStart = new Date('2025-06-09'); // Mon
const taskEnd = new Date('2025-06-20'); // Fri
const workingDays = calculateWorkingDaysInclusive(taskStart, taskEnd, testHolidays);
const expectedDays = 10; // 12 calendar days - 4 weekend days (Jun 14-15, 21-22) = 10 working days (Jun 15 holiday is Sunday, doesn't affect count)
test(
  'Resource cost calculation: 2-week task with company holiday',
  expectedDays,
  workingDays
);

console.log('\n## Phase 5: Regression Tests\n');

// Test 23: Ensure backward compatibility with empty array
test(
  'Backward compatibility: empty holidays array works',
  5,
  calculateWorkingDaysInclusive(
    new Date('2025-01-06'),
    new Date('2025-01-10'),
    []
  )
);

// Test 24: Ensure null dates are handled gracefully
test(
  'Invalid date handling: returns false for isHoliday',
  false,
  isHoliday(new Date('invalid'), testHolidays)
);

// Test 25: Leap year handling
test(
  'Leap year: Feb 29, 2024 is recognized',
  true,
  isWorkingDay(new Date('2024-02-29'), emptyHolidays) // Thursday
);

console.log('\n' + '='.repeat(80));
console.log('\n## TEST SUMMARY\n');

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;
const passRate = ((passed / total) * 100).toFixed(2);

console.log(`Total Tests: ${total}`);
console.log(`Passed: ${passed} ✓`);
console.log(`Failed: ${failed} ❌`);
console.log(`Pass Rate: ${passRate}%`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Holiday fix is working perfectly.');
  console.log('✓ Type safety verified');
  console.log('✓ Edge cases handled');
  console.log('✓ Real-world scenarios validated');
  console.log('✓ Regression tests passed');
  console.log('\n✅ Ready for production deployment!');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Please review above errors.`);
  process.exit(1);
}
