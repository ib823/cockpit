'use client';

import { useState, useEffect } from 'react';
import GanttChart from '@/components/timeline/GanttChart';
import TimelineControls from '@/components/timeline/TimelineControls';
import { downloadPDF, generateTimelinePDF } from '@/lib/export/pdf-generator';
import { useTimelineStore } from '@/stores/timeline-store';
import { usePresalesStore } from '@/stores/presales-store';
import { useStorageSync } from '@/hooks/useStorageSync';
import { validateStartDate, getRecommendedStartDate, formatDateForDisplay } from '@/lib/timeline/date-validation';
import { getHolidaysByRegion, type Holiday } from '@/data/holidays';
import type { Chip } from '@/types/core';

export default function TimelinePage() {
  // Enable cross-tab synchronization
  useStorageSync();

  // Destructure all needed values from store
  const {
    phases,
    profile,
    generateTimeline,
    getProjectStartDate,
    getProjectEndDate,
    getProjectCost,
    clearPackages,
    resetProfile
  } = useTimelineStore();

  const { addChips, clearChips } = usePresalesStore();

  // Local state for enhanced features
  const [startDate, setStartDate] = useState<Date>(getRecommendedStartDate());
  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<'MY' | 'SG' | 'VN' | 'TH'>('MY');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [currency, setCurrency] = useState<'MYR' | 'SGD' | 'VND' | 'THB'>('MYR');
  const [forexRate, setForexRate] = useState<number | null>(null);
  const [forexError, setForexError] = useState<string | null>(null);
  const [showHolidayPanel, setShowHolidayPanel] = useState(false);

  // Validate start date on change
  useEffect(() => {
    const validation = validateStartDate(startDate);
    setStartDateError(validation.error || null);
  }, [startDate]);

  // Load holidays when region changes
  useEffect(() => {
    const regionalHolidays = getHolidaysByRegion(selectedRegion);
    setHolidays(regionalHolidays);
  }, [selectedRegion]);

  // Validate forex when currency changes
  useEffect(() => {
    if (currency !== 'MYR' && (forexRate === null || forexRate <= 0)) {
      setForexError('Forex rate required for non-MYR currencies');
    } else {
      setForexError(null);
    }
  }, [currency, forexRate]);

  // Add PDF export handler here (inside component, after hooks)
  const handleExportPDF = async () => {
    try {
      // Gather data
      const exportData = {
        projectName: profile.company || 'SAP Implementation',
        startDate: getProjectStartDate()?.toLocaleDateString() || 'TBD',
        endDate: getProjectEndDate()?.toLocaleDateString() || 'TBD',
        totalCost: getProjectCost(),
        currency: profile.region === 'ABSG' ? 'SGD' :
                  profile.region === 'ABVN' ? 'VND' : 'MYR',
        phases: phases,
        teamMembers: phases.flatMap(p =>
          (p.resources || []).map(r => ({
            name: r.name || 'Unnamed',
            role: r.role,
            allocation: r.allocation
          }))
        )
      };

      // Generate PDF
      const pdfBytes = await generateTimelinePDF(exportData);

      // Download
      const filename = `timeline-${Date.now()}.pdf`;
      downloadPDF(pdfBytes, filename);

      console.log('✅ PDF exported successfully');
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Reset all data
  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      clearPackages();
      resetProfile();
      clearChips();
      setStartDate(getRecommendedStartDate());
      setSelectedRegion('MY');
      setCurrency('MYR');
      setForexRate(null);
      console.log('✅ All data reset');
    }
  };

  // Generate random test data
  const handleGenerateTestData = () => {
    const sampleChips: Chip[] = [
      {
        id: `test-${Date.now()}-1`,
        type: 'country',
        value: 'Malaysia',
        confidence: 0.95,
        source: 'manual',
        timestamp: new Date()
      },
      {
        id: `test-${Date.now()}-2`,
        type: 'employees',
        value: Math.floor(Math.random() * 5000) + 500,
        confidence: 0.9,
        source: 'manual',
        timestamp: new Date()
      },
      {
        id: `test-${Date.now()}-3`,
        type: 'revenue',
        value: Math.floor(Math.random() * 500000000) + 50000000,
        confidence: 0.85,
        source: 'manual',
        timestamp: new Date()
      },
      {
        id: `test-${Date.now()}-4`,
        type: 'modules',
        value: ['Finance', 'HR', 'Supply Chain'][Math.floor(Math.random() * 3)],
        confidence: 0.92,
        source: 'manual',
        timestamp: new Date()
      },
      {
        id: `test-${Date.now()}-5`,
        type: 'modules',
        value: ['Sales', 'Procurement', 'Manufacturing'][Math.floor(Math.random() * 3)],
        confidence: 0.88,
        source: 'manual',
        timestamp: new Date()
      },
      {
        id: `test-${Date.now()}-6`,
        type: 'timeline',
        value: `${Math.floor(Math.random() * 12) + 6} months`,
        confidence: 0.8,
        source: 'manual',
        timestamp: new Date()
      },
      {
        id: `test-${Date.now()}-7`,
        type: 'integration',
        value: ['Legacy ERP', 'CRM System', 'Banking Interface'][Math.floor(Math.random() * 3)],
        confidence: 0.87,
        source: 'manual',
        timestamp: new Date()
      },
      {
        id: `test-${Date.now()}-8`,
        type: 'legal_entities',
        value: Math.floor(Math.random() * 5) + 1,
        confidence: 0.9,
        source: 'manual',
        timestamp: new Date()
      },
      {
        id: `test-${Date.now()}-9`,
        type: 'locations',
        value: Math.floor(Math.random() * 10) + 1,
        confidence: 0.85,
        source: 'manual',
        timestamp: new Date()
      },
      {
        id: `test-${Date.now()}-10`,
        type: 'users',
        value: Math.floor(Math.random() * 2000) + 200,
        confidence: 0.88,
        source: 'manual',
        timestamp: new Date()
      }
    ];

    clearChips();
    addChips(sampleChips);
    console.log('✅ Test data generated:', sampleChips.length, 'chips');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">SAP Implementation Intelligence Platform</h1>
          <p className="text-gray-600 mt-1">142 SAP modules with AI-powered estimation</p>
        </div>
      </div>

      {/* Enhanced Project Configuration */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Start Date Selector */}
          <div className="card-shadow rounded-xl p-6 bg-white hover-lift">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Project Start Date
            </label>
            <input
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              className={`w-full px-4 py-3 rounded-lg border transition-all ${
                startDateError
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500 animate-shake'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
              }`}
            />
            {startDateError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600 animate-fade-in">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293z" clipRule="evenodd" />
                </svg>
                {startDateError}
              </div>
            )}
            {!startDateError && (
              <p className="mt-2 text-xs text-gray-500 animate-fade-in">
                ✓ Valid start date: {formatDateForDisplay(startDate)}
              </p>
            )}
          </div>

          {/* Region & Holidays */}
          <div className="card-shadow rounded-xl p-6 bg-white hover-lift">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Region & Holidays
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as any)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white"
            >
              <option value="MY">🇲🇾 Malaysia</option>
              <option value="SG">🇸🇬 Singapore</option>
              <option value="VN">🇻🇳 Vietnam</option>
              <option value="TH">🇹🇭 Thailand</option>
            </select>
            <button
              onClick={() => setShowHolidayPanel(!showHolidayPanel)}
              className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {holidays.length} holidays loaded • {showHolidayPanel ? 'Hide' : 'View'}
            </button>
          </div>

          {/* Currency & Forex */}
          <div className="card-shadow rounded-xl p-6 bg-white hover-lift">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white mb-3"
            >
              <option value="MYR">MYR - Malaysian Ringgit</option>
              <option value="SGD">SGD - Singapore Dollar</option>
              <option value="VND">VND - Vietnamese Dong</option>
              <option value="THB">THB - Thai Baht</option>
            </select>
            {currency !== 'MYR' && (
              <input
                type="number"
                step="0.0001"
                value={forexRate || ''}
                onChange={(e) => setForexRate(parseFloat(e.target.value) || null)}
                placeholder={`1 ${currency} = ? MYR`}
                className={`w-full px-4 py-3 rounded-lg border transition-all ${
                  forexError
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
            )}
            {forexError && (
              <p className="mt-2 text-xs text-red-600 animate-fade-in">{forexError}</p>
            )}
          </div>
        </div>

        {/* Holiday Panel */}
        {showHolidayPanel && (
          <div className="mt-6 card-shadow-lg rounded-xl p-6 bg-white animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Public Holidays - {selectedRegion}
              </h3>
              <button
                onClick={() => setShowHolidayPanel(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {holidays.slice(0, 20).map((holiday, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{holiday.name}</div>
                    <div className="text-xs text-gray-500">{holiday.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls - Add Export button here */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="flex items-center justify-between">
          <TimelineControls />

          <div className="flex items-center gap-3">
            {/* Test Data Button */}
            <button
              onClick={handleGenerateTestData}
              className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
              title="Generate random test data for quick testing"
            >
              Generate Test Data
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetAll}
              className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
              title="Clear all data and reset to defaults"
            >
              Reset All
            </button>

            {/* Export PDF button - only show if timeline exists */}
            {phases.length > 0 && (
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 gradient-blue text-white rounded-lg hover-lift font-medium shadow-md"
              >
                Export PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {phases.length === 0 ? (
          <div className="card-shadow-lg rounded-2xl p-12 text-center bg-white animate-fade-in">
            <div className="mx-auto w-20 h-20 bg-gradient-blue rounded-full flex items-center justify-center mb-6 animate-glow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Plan Your SAP Implementation?</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Configure your project details above and generate an intelligent timeline powered by our estimation engine.
            </p>
            <button
              onClick={generateTimeline}
              disabled={!!startDateError || (currency !== 'MYR' && !!forexError)}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                startDateError || (currency !== 'MYR' && forexError)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'gradient-blue text-white hover-lift shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              Generate Intelligent Timeline
            </button>
            {(startDateError || (currency !== 'MYR' && forexError)) && (
              <p className="mt-4 text-sm text-red-600 animate-shake">
                Please fix validation errors above before generating timeline
              </p>
            )}
          </div>
        ) : (
          <div className="card-shadow-lg rounded-2xl p-6 bg-white animate-slide-up">
            <h2 className="text-lg font-semibold mb-4">Project Timeline</h2>
            <GanttChart />
          </div>
        )}
      </div>
    </div>
  );
}