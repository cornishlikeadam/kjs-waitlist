"use client";

import React, { useState, useMemo } from "react";

export interface DatePickerGridProps {
  selectedDate: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  availableDaysOfWeek?: number[];
}

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const DAYS_OF_WEEK = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export const DatePickerGrid: React.FC<DatePickerGridProps> = ({
  selectedDate,
  onChange,
  minDate = new Date(),
  maxDate,
  availableDaysOfWeek,
}) => {
  const normalizedMinDate = useMemo(() => {
    const d = new Date(minDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minDate]);

  const normalizedMaxDate = useMemo(() => {
    if (!maxDate) return null;
    const d = new Date(maxDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [maxDate]);

  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const initial = selectedDate || new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonthDaysCount = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDaysCount - i),
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const checkDateAvailable = (date: Date) => {
    const checkTime = date.getTime();
    if (checkTime < normalizedMinDate.getTime()) return false;
    if (normalizedMaxDate && checkTime > normalizedMaxDate.getTime()) return false;
    if (availableDaysOfWeek && !availableDaysOfWeek.includes(date.getDay())) {
      return false;
    }
    return true;
  };

  const handlePrevMonth = () => {
    setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(today, date);
  };

  const isPrevDisabled = useMemo(() => {
    const firstOfCurrentView = new Date(year, month, 1);
    const firstOfMinDateMonth = new Date(normalizedMinDate.getFullYear(), normalizedMinDate.getMonth(), 1);
    return firstOfCurrentView.getTime() <= firstOfMinDateMonth.getTime();
  }, [year, month, normalizedMinDate]);

  return (
    <div className="w-full max-w-md mx-auto select-none bg-white p-5 border-4 border-black shadow-[6px_6px_0px_#000]">
      {/* Month & Navigation */}
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-sm font-extrabold text-black tracking-tight uppercase">
          {MONTHS[month]} <span className="text-neutral-500 font-bold">{year}</span>
        </h2>
        
        <div className="flex space-x-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className={`p-2 border-2 border-black flex items-center justify-center transition-all cursor-pointer ${
              isPrevDisabled 
                ? "opacity-35 cursor-not-allowed bg-neutral-100" 
                : "hover:bg-neutral-100 active:scale-95 text-black"
            }`}
            aria-label="Previous Month"
          >
            ←
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 border-2 border-black flex items-center justify-center transition-all hover:bg-neutral-100 active:scale-95 text-black cursor-pointer"
            aria-label="Next Month"
          >
            →
          </button>
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-y-2 mb-2 text-center">
        {DAYS_OF_WEEK.map((day) => (
          <span key={day} className="text-[10px] font-black text-black tracking-widest">
            {day}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map(({ date, isCurrentMonth }, index) => {
          const isSel = isSameDay(selectedDate, date);
          const isTd = isToday(date);
          const isAvailable = checkDateAvailable(date);
          const isClickable = isCurrentMonth && isAvailable;

          return (
            <button
              key={`${date.toISOString()}-${index}`}
              type="button"
              disabled={!isClickable}
              onClick={() => onChange(date)}
              className={`
                relative h-9 w-9 mx-auto border-2 flex items-center justify-center text-xs font-black transition-all cursor-pointer
                ${!isCurrentMonth ? "text-neutral-300 border-transparent pointer-events-none" : ""}
                ${isCurrentMonth && !isAvailable ? "text-neutral-300 border-transparent line-through cursor-not-allowed opacity-50" : ""}
                ${isClickable && !isSel ? "text-black border-transparent hover:border-black hover:bg-neutral-100 active:scale-95" : ""}
                ${isSel ? "bg-orange-500 text-black border-black shadow-[2px_2px_0px_#000] scale-102 z-10" : ""}
              `}
            >
              <span>{date.getDate()}</span>
              {isTd && !isSel && (
                <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-black" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DatePickerGrid;
