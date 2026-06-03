"use client";

import React from "react";
import { motion } from "framer-motion";

export interface OptionCardProps {
  label: string;
  description?: string;
  value: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

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
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={`relative w-full text-left p-5 border-4 border-black transition-all cursor-pointer outline-none ${
        isSelected
          ? "bg-amber-400 text-black shadow-[4px_4px_0px_#000] translate-y-0.5 translate-x-0.5"
          : "bg-white text-black shadow-[6px_6px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:translate-y-0.5 hover:translate-x-0.5"
      }`}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className={`p-2 border-2 border-black flex items-center justify-center ${
            isSelected ? "bg-black text-white" : "bg-neutral-100 text-black"
          }`}>
            {icon}
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="font-extrabold text-[15px] uppercase tracking-wide">
            {label}
          </span>
          {description && (
            <span className="text-[12px] text-neutral-700 font-medium leading-tight">
              {description}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};
