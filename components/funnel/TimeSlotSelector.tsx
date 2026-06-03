"use client";

import React, { useMemo } from "react";

export interface TimeSlotSelectorProps {
  selectedDate: Date | null;
  selectedTimeSlot: string | null;
  onSelectDateTime: (date: Date) => void;
  onSelectTimeSlot: (slot: string) => void;
  availableSlots?: string[];
  bookedSlots?: string[];
}

const DEFAULT_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "19:00", "20:00", "21:00"
];

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedDate,
  selectedTimeSlot,
  onSelectDateTime,
  onSelectTimeSlot,
  availableSlots = DEFAULT_SLOTS,
  bookedSlots = [],
}) => {
  const formatTimeDisplay = (time24: string): string => {
    const [hoursStr, minutesStr] = time24.split(":");
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hours12}:${minutesStr} ${ampm}`;
  };

  const groupedSlots = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate
      ? selectedDate.getDate() === now.getDate() &&
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getFullYear() === now.getFullYear()
      : false;

    const morning: { time: string; display: string; disabled: boolean }[] = [];
    const afternoon: { time: string; display: string; disabled: boolean }[] = [];
    const evening: { time: string; display: string; disabled: boolean }[] = [];

    availableSlots.forEach((slot) => {
      const [hourStr, minStr] = slot.split(":");
      const hour = parseInt(hourStr, 10);
      const min = parseInt(minStr, 10);

      let isPast = false;
      if (isToday) {
        const slotTimeToday = new Date(selectedDate!);
        slotTimeToday.setHours(hour, min, 0, 0);
        isPast = slotTimeToday.getTime() <= now.getTime();
      }

      const isBooked = bookedSlots.includes(slot);
      const disabled = isPast || isBooked;
      const slotData = {
        time: slot,
        display: formatTimeDisplay(slot),
        disabled,
      };

      if (hour < 12) {
        morning.push(slotData);
      } else if (hour >= 12 && hour < 17) {
        afternoon.push(slotData);
      } else {
        evening.push(slotData);
      }
    });

    return { morning, afternoon, evening };
  }, [selectedDate, availableSlots, bookedSlots]);

  const handleSlotSelect = (timeSlot: string) => {
    if (!selectedDate) return;
    onSelectTimeSlot(timeSlot);

    const [hours, minutes] = timeSlot.split(":").map(Number);
    const dateWithTime = new Date(selectedDate);
    dateWithTime.setHours(hours, minutes, 0, 0);
    onSelectDateTime(dateWithTime);
  };

  const dateHeading = useMemo(() => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate]);

  if (!selectedDate) {
    return (
      <div className="w-full max-w-md mx-auto h-[320px] flex flex-col items-center justify-center bg-white p-5 border-4 border-dashed border-black text-black select-none">
        <svg className="w-8 h-8 mb-3 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-black uppercase tracking-wider text-center">Select a date to unlock available times</span>
      </div>
    );
  }

  const sections = [
    { title: "Morning", slots: groupedSlots.morning },
    { title: "Afternoon", slots: groupedSlots.afternoon },
    { title: "Evening", slots: groupedSlots.evening },
  ];

  return (
    <div className="w-full max-w-md mx-auto bg-white p-5 border-4 border-black shadow-[6px_6px_0px_#000]">
      {/* Heading */}
      <div className="mb-4">
        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-0.5">
          AVAILABLE TIME SLOTS
        </span>
        <h3 className="text-sm font-extrabold text-black uppercase tracking-tight">
          {dateHeading}
        </h3>
      </div>

      {/* Slots List */}
      <div className="space-y-4 overflow-y-auto max-h-[220px] pr-1">
        {sections.map(({ title, slots }) => {
          if (slots.length === 0) return null;
          
          return (
            <div key={title}>
              <h4 className="text-[10px] font-black text-neutral-400 mb-2 uppercase tracking-wider">
                {title}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {slots.map(({ time, display, disabled }) => {
                  const isSel = selectedTimeSlot === time;
                  
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSlotSelect(time)}
                      className={`
                        py-2 px-1 text-[11px] font-black border-2 text-center transition-all cursor-pointer select-none
                        ${disabled 
                          ? "border-neutral-200 bg-neutral-50 text-neutral-350 line-through opacity-50 cursor-not-allowed" 
                          : isSel
                            ? "border-black bg-blue-600 text-white shadow-[2px_2px_0px_#000] scale-102"
                            : "border-black text-black hover:bg-neutral-100 hover:shadow-[2px_2px_0px_#000] active:scale-95"
                        }
                      `}
                    >
                      {display}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotSelector;
