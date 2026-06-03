'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface OptionCardProps {
  label: string;
  description?: string;
  value: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const animationCurve = [0.16, 1, 0.3, 1] as [number, number, number, number]; // Custom ease-out expo from Brand Manifest

export const OptionCard: React.FC<OptionCardProps> = ({
  label,
  description,
  value,
  isSelected,
  onClick,
  icon,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25, ease: animationCurve }}
      className={`relative w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 focus-visible:ring-offset-2 ${
        isSelected
          ? 'border-neutral-900 bg-neutral-50/40 shadow-[0_12px_24px_rgba(0,0,0,0.03)]'
          : 'border-neutral-100 bg-white hover:border-neutral-200 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.03)]'
      }`}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
            isSelected ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-600 border border-neutral-100/50'
          }`}>
            {icon}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-neutral-800 text-[15px] leading-snug tracking-tight">
            {label}
          </span>
          {description && (
            <span className="text-[12.5px] text-neutral-400 font-medium leading-normal">
              {description}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
            isSelected
              ? 'border-neutral-900 bg-neutral-900'
              : 'border-neutral-200 bg-transparent'
          }`}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ease: animationCurve, duration: 0.3 }}
              className="w-1.5 h-1.5 rounded-full bg-white"
            />
          )}
        </div>
      </div>
    </motion.button>
  );
};
