"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addDays, startOfWeek, endOfWeek } from "date-fns";
import { isHoliday, getHolidayName, getNextWorkingDay } from "@/data/holidays";
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TRANSITIONS } from "@/lib/design-system/tokens";

interface HolidayAwareDatePickerProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  region?: "ABMY" | "ABSG" | "ABVN";
  minDate?: string; // ISO format
  maxDate?: string; // ISO format
  disabled?: boolean;
  required?: boolean;
  error?: string;
  placeholder?: string;
  size?: "small" | "medium" | "large";
  showWorkingDaysOnly?: boolean; // Prevent selection of weekends/holidays
  milestones?: Array<{ date: string; label: string; color?: string }>; // Milestone markers
  className?: string;
}

export function HolidayAwareDatePicker({
  value,
  onChange,
  label,
  region = "ABMY",
  minDate,
  maxDate,
  disabled = false,
  required = false,
  error,
  placeholder = "Select date",
  size = "medium",
  showWorkingDaysOnly = false,
  milestones = [],
  className = "",
}: HolidayAwareDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;
  const minDateObj = minDate ? new Date(minDate) : null;
  const maxDateObj = maxDate ? new Date(maxDate) : null;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Check if date is weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Check if date is disabled
  const isDisabledDate = (date: Date): boolean => {
    if (minDateObj && date < minDateObj) return true;
    if (maxDateObj && date > maxDateObj) return true;
    if (showWorkingDaysOnly) {
      if (isWeekend(date)) return true;
      if (isHoliday(date, region)) return true;
    }
    return false;
  };

  // Get validation status for selected date
  const getValidationStatus = () => {
    if (!selectedDate) return null;

    const weekend = isWeekend(selectedDate);
    const holiday = isHoliday(selectedDate, region);
    const holidayName = holiday ? getHolidayName(selectedDate, region) : null;

    return {
      isValid: !weekend && !holiday,
      isWeekend: weekend,
      isHoliday: holiday,
      holidayName,
    };
  };

  const validation = getValidationStatus();

  // Check if date has milestone
  const getMilestoneForDate = (date: Date): { label: string; color?: string } | null => {
    const dateStr = format(date, "yyyy-MM-dd");
    return milestones.find(m => m.date === dateStr) || null;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isDisabledDate(date)) return;

    const isoDate = format(date, "yyyy-MM-dd");
    onChange(isoDate);

    // Auto-close if working day, or stay open if weekend/holiday to show suggestion
    if (!isWeekend(date) && !isHoliday(date, region)) {
      setIsOpen(false);
    }
  };

  // Navigate to next/previous month
  const handlePreviousMonth = () => {
    setViewDate(subMonths(viewDate, 1));
  };

  const handleNextMonth = () => {
    setViewDate(addMonths(viewDate, 1));
  };

  // Jump to today
  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    if (!isDisabledDate(today)) {
      handleDateSelect(today);
    }
  };

  // Use next working day suggestion
  const handleUseNextWorkingDay = () => {
    if (!selectedDate) return;
    const nextWorkingDay = getNextWorkingDay(selectedDate, region);
    handleDateSelect(nextWorkingDay);
    setIsOpen(false);
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const calendarDays = generateCalendarDays();

  // Size configuration
  const sizeConfig = {
    small: { fontSize: TYPOGRAPHY.fontSize.caption, height: '32px', padding: `0 ${SPACING[3]}` },
    medium: { fontSize: TYPOGRAPHY.fontSize.body, height: '40px', padding: `0 ${SPACING[4]}` },
    large: { fontSize: TYPOGRAPHY.fontSize.subtitle, height: '48px', padding: `0 ${SPACING[5]}` },
  };

  const currentSize = sizeConfig[size];

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ fontFamily: TYPOGRAPHY.fontFamily.text }}>
      {/* Label */}
      {label && (
        <label style={{
          display: 'block',
          fontSize: TYPOGRAPHY.fontSize.caption,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.secondary,
          marginBottom: SPACING[2],
        }}>
          {label}
          {required && <span style={{ color: COLORS.red, marginLeft: SPACING[1] }}>*</span>}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: SPACING[3],
            backgroundColor: COLORS.bg.primary,
            border: `1px solid ${error ? COLORS.red : (isOpen ? COLORS.blue : COLORS.border.default)}`,
            borderRadius: RADIUS.default,
            height: currentSize.height,
            padding: currentSize.padding,
            fontSize: currentSize.fontSize,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
            outline: isOpen ? `2px solid ${COLORS.interactive.focus}` : 'none',
            outlineOffset: '1px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3], flex: 1, textAlign: 'left' }}>
            {/* Minimalist date indicator - simple dot */}
            <div style={{
              width: size === 'small' ? '4px' : size === 'large' ? '6px' : '5px',
              height: size === 'small' ? '4px' : size === 'large' ? '6px' : '5px',
              borderRadius: '50%',
              backgroundColor: selectedDate ? COLORS.blue : COLORS.border.strong,
              transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
              flexShrink: 0,
            }} />
            {selectedDate ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary }}>
                  {format(selectedDate, "MMM dd, yyyy")}
                </span>
                {validation && !validation.isValid && (
                  <span style={{ fontSize: TYPOGRAPHY.fontSize.label, color: COLORS.text.tertiary }}>
                    {validation.isWeekend && "Weekend"}
                    {validation.isHoliday && validation.holidayName}
                  </span>
                )}
              </div>
            ) : (
              <span style={{ color: COLORS.text.tertiary }}>{placeholder}</span>
            )}
          </div>
          {selectedDate && !disabled && <div style={{ width: SPACING[5] }} />}
        </button>

        {/* Clear button */}
        {selectedDate && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange("");
            }}
            style={{
              position: 'absolute',
              right: SPACING[2],
              top: '50%',
              transform: 'translateY(-50%)',
              padding: SPACING[1],
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: RADIUS.small,
              cursor: 'pointer',
              color: COLORS.text.tertiary,
              fontSize: '18px',
              lineHeight: 1,
              transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.interactive.hover;
              e.currentTarget.style.color = COLORS.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = COLORS.text.tertiary;
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p style={{
          marginTop: SPACING[2],
          fontSize: TYPOGRAPHY.fontSize.caption,
          color: COLORS.red,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING[2],
        }}>
          <span style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold }}>!</span>
          {error}
        </p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          marginTop: SPACING[2],
          left: 0,
          zIndex: 50,
          backgroundColor: COLORS.bg.primary,
          borderRadius: RADIUS.large,
          boxShadow: SHADOWS.large,
          border: `1px solid ${COLORS.border.default}`,
          overflow: 'hidden',
          minWidth: '368px', // Ensures 44px minimum touch targets for calendar cells
        }}>
          {/* Header - No gradient, clean */}
          <div style={{
            backgroundColor: COLORS.bg.primary, // Clean white, not gradient
            borderBottom: `1px solid ${COLORS.border.default}`,
            padding: SPACING[4],
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: SPACING[3],
            }}>
              <button
                type="button"
                onClick={handlePreviousMonth}
                data-testid="prev-month"
                aria-label="Previous month"
                style={{
                  padding: `${SPACING[2]} ${SPACING[3]}`,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: RADIUS.default,
                  cursor: 'pointer',
                  fontSize: TYPOGRAPHY.fontSize.title,
                  lineHeight: 1,
                  color: COLORS.text.primary,
                  transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.interactive.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ‹
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: TYPOGRAPHY.fontSize.subtitle,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.primary,
                }}>
                  {format(viewDate, "MMMM yyyy")}
                </div>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                data-testid="next-month"
                aria-label="Next month"
                style={{
                  padding: `${SPACING[2]} ${SPACING[3]}`,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: RADIUS.default,
                  cursor: 'pointer',
                  fontSize: TYPOGRAPHY.fontSize.title,
                  lineHeight: 1,
                  color: COLORS.text.primary,
                  transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.interactive.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ›
              </button>
            </div>
            <button
              type="button"
              onClick={handleToday}
              data-testid="today-button"
              aria-label="Go to today"
              style={{
                width: '100%',
                padding: `${SPACING[2]} ${SPACING[3]}`,
                backgroundColor: COLORS.interactive.hover,
                border: 'none',
                borderRadius: RADIUS.default,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
                cursor: 'pointer',
                transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.interactive.pressed}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.interactive.hover}
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{ padding: SPACING[4] }}>
            {/* Weekday Headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: SPACING[1],
              marginBottom: SPACING[2],
            }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} style={{
                  textAlign: 'center',
                  fontSize: TYPOGRAPHY.fontSize.label,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.tertiary,
                  padding: SPACING[1],
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: SPACING[1],
              minHeight: '290px', // CRITICAL FIX: Reserve space for 6 weeks max to prevent calendar jumping between months
              alignContent: 'start', // Align rows to top when fewer than 6 weeks
            }}>
              {calendarDays.map((date, index) => {
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isCurrentMonth = isSameMonth(date, viewDate);
                const isTodayDate = isToday(date);
                const weekend = isWeekend(date);
                const holiday = isHoliday(date, region);
                const holidayName = holiday ? getHolidayName(date, region) : null;
                const milestone = getMilestoneForDate(date);
                const disabled = isDisabledDate(date);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={disabled}
                    title={milestone?.label || holidayName || undefined}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: TYPOGRAPHY.fontSize.caption,
                      fontWeight: TYPOGRAPHY.fontWeight.regular,
                      borderRadius: RADIUS.default,
                      border: 'none',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,

                      // Color logic - simplified and calm
                      color: !isCurrentMonth ? COLORS.text.disabled :
                             isSelected ? COLORS.bg.primary :
                             weekend || holiday ? COLORS.text.tertiary :
                             isTodayDate ? COLORS.blue :
                             COLORS.text.primary,

                      backgroundColor: isSelected ? COLORS.blue :
                                       !disabled && isTodayDate ? COLORS.interactive.focus :
                                       'transparent',

                      opacity: disabled ? 0.4 : 1,
                      fontWeight: isTodayDate && !isSelected ? TYPOGRAPHY.fontWeight.semibold : TYPOGRAPHY.fontWeight.regular,
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled && !isSelected) {
                        e.currentTarget.style.backgroundColor = COLORS.interactive.hover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!disabled && !isSelected) {
                        if (isTodayDate) {
                          e.currentTarget.style.backgroundColor = COLORS.interactive.focus;
                        } else {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }
                    }}
                  >
                    {format(date, "d")}

                    {/* Minimal indicators - whisper, don't shout */}
                    {/* Milestone: 2px bar at top */}
                    {milestone && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '60%',
                        height: '2px',
                        backgroundColor: isSelected ? COLORS.bg.primary : (milestone.color || COLORS.status.success),
                        borderRadius: '2px',
                      }} />
                    )}

                    {/* Holiday: 2px dot bottom-right */}
                    {holiday && (
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '2px',
                        height: '2px',
                        backgroundColor: isSelected ? COLORS.bg.primary : COLORS.red,
                        borderRadius: '50%',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calm suggestion instead of loud warning - FIXED HEIGHT to prevent jumping */}
          <div style={{
            minHeight: validation && !validation.isValid ? 'auto' : '0px',
            overflow: 'hidden',
            transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
          }}>
            {validation && !validation.isValid && (
              <div style={{
                padding: SPACING[4],
                borderTop: `1px solid ${COLORS.border.default}`,
              }}>
                <div style={{
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  color: COLORS.text.secondary,
                  marginBottom: SPACING[3],
                }}>
                  {validation.isWeekend && `${format(selectedDate!, "EEEE")} selected. `}
                  {validation.isHoliday && `${validation.holidayName}. `}
                  Suggest: {selectedDate && format(getNextWorkingDay(selectedDate, region), "MMM dd")}
                </div>
                <button
                  type="button"
                  onClick={handleUseNextWorkingDay}
                  style={{
                    width: '100%',
                    padding: `${SPACING[2]} ${SPACING[4]}`,
                    backgroundColor: COLORS.blue,
                    color: COLORS.bg.primary,
                    border: 'none',
                    borderRadius: RADIUS.default,
                    fontSize: TYPOGRAPHY.fontSize.caption,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    cursor: 'pointer',
                    transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.blueHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.blue}
                >
                  Use Next Working Day →
                </button>
              </div>
            )}
          </div>

          {/* Simple region indicator - no emoji, no legend */}
          <div style={{
            padding: `${SPACING[3]} ${SPACING[4]}`,
            backgroundColor: COLORS.bg.subtle,
            borderTop: `1px solid ${COLORS.border.default}`,
            fontSize: TYPOGRAPHY.fontSize.label,
            color: COLORS.text.tertiary,
          }}>
            {region === "ABMY" ? "Malaysia holidays" : region === "ABSG" ? "Singapore holidays" : "Vietnam holidays"}
          </div>
        </div>
      )}
    </div>
  );
}
