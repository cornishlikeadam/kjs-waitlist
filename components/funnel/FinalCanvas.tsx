"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getScenario, DateManifest } from "../../lib/ai/scenarioEngine";
import { SurrenderSummary } from "./SurrenderSummary";
import { KJ_IDENTITY_MANIFEST } from "../../config/brandIdentity";

interface FinalCanvasProps {
  selections?: {
    food: string;
    vibe: string;
    qualifier: string;
  };
  userName?: string;
  onReset?: () => void;
}

// Vector Icon Components mapped to keys
const ChopsticksIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <line x1="2" y1="20" x2="20" y2="4" strokeLinecap="round" />
    <line x1="5" y1="22" x2="22" y2="6" strokeLinecap="round" />
  </svg>
);

const SushiIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <ellipse cx="12" cy="16" rx="7" ry="3.5" />
    <ellipse cx="12" cy="16" rx="3.5" ry="1.75" />
    <path d="M5 16V8c0-2 3.1-3.5 7-3.5s7 1.5 7 8v8" />
    <ellipse cx="12" cy="8" rx="7" ry="3.5" />
  </svg>
);

const FishIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M22 12C22 12 19 6 12 6C8.5 6 5.5 8 3.5 10C2.5 11 2 12 2 12C2 12 2.5 13 3.5 14C5.5 16 8.5 18 12 18C19 18 22 12 22 12Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12L7 12M22 12L17 12" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const PastaIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path d="M12 2v8M10 2v8M14 2v8" strokeLinecap="round" />
    <path d="M6 10c0 4 2.7 7 6 7s6-3 6-7" strokeLinecap="round" />
    <path d="M8 7c1-.8 2-1.2 4-1.2s3 .4 4 1.2" strokeLinecap="round" />
  </svg>
);

const WineIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V21M8 21H16M12 15C15.5 15 17.5 12 17.5 7V3H6.5V7C6.5 12 8.5 15 12 15Z" />
  </svg>
);

const CandleIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <rect x="9" y="8" width="6" height="13" rx="1" />
    <path d="M12 3C12 3 10.5 5 12 7C13.5 5 12 3 12 3Z" fill="currentColor" />
  </svg>
);

const JoystickIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <rect x="5" y="15" width="14" height="6" rx="2" />
    <line x1="12" y1="15" x2="12" y2="7" strokeLinecap="round" />
    <circle cx="12" cy="5" r="2" />
  </svg>
);

const GamepadIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <rect x="3" y="6" width="18" height="12" rx="3" />
    <path d="M7 12H11M9 10V14M15 12a1 1 0 110-2 1 1 0 010 2zm3-2a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const LightningIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14H11V21L20 10H13Z" />
  </svg>
);

const FilmIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 3v18M17 3v18M3 8h18M3 16h18" />
  </svg>
);

const PopcornIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path d="M6 10l1 11h10l1-11M8 10V6c0-1.5 1-2.5 2-2.5s2 1 2 2.5 1-2.5 2-2.5 2 1 2 2.5v4" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

const TornadoIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path d="M2 4h20M4 8h16M7 12h10M9 16h6M11 20h2" strokeLinecap="round" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zm-6 12l.75 2.25L9 18l-2.25.75L6 21l-.75-2.25L3 18l2.25-.75L6 15z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </svg>
);

const HourglassIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path d="M5 2h14M5 22h14M12 12V2M12 12v10M6 6c0 3.3 2.7 6 6 6s6-2.7 6-6M6 18c0-3.3 2.7-6 6-6s6 2.7 6 6" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-16 h-16 stroke-neutral-200/50 dark:stroke-neutral-800/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const iconMap: Record<string, React.FC> = {
  chopsticks: ChopsticksIcon,
  sushi: SushiIcon,
  fish: FishIcon,
  pasta: PastaIcon,
  wine: WineIcon,
  candle: CandleIcon,
  joystick: JoystickIcon,
  gamepad: GamepadIcon,
  lightning: LightningIcon,
  film: FilmIcon,
  popcorn: PopcornIcon,
  moon: MoonIcon,
  tornado: TornadoIcon,
  sparkles: SparklesIcon,
  target: TargetIcon,
  hourglass: HourglassIcon,
  star: StarIcon,
};

export const FinalCanvas: React.FC<FinalCanvasProps> = ({
  selections,
  userName = "Guest",
  onReset,
}) => {
  const [resolvedSelections, setResolvedSelections] = useState({
    food: "sushi",
    vibe: "arcade",
    qualifier: "chaotic",
  });

  const [resolvedName, setResolvedName] = useState(userName);
  const [dateManifest, setDateManifest] = useState<DateManifest | null>(null);
  const [floatingItems, setFloatingItems] = useState<{ id: number; key: string; x: number; y: number; scale: number; duration: number }[]>([]);

  useEffect(() => {
    let activeFood = selections?.food;
    let activeVibe = selections?.vibe;
    let activeQual = selections?.qualifier;
    let activeName = userName;

    if (!activeFood || !activeVibe || !activeQual) {
      try {
        const stored = localStorage.getItem("kj_waitlist_selections");
        if (stored) {
          const parsed = JSON.parse(stored);
          activeFood = parsed.food ?? activeFood;
          activeVibe = parsed.vibe ?? activeVibe;
          activeQual = parsed.qualifier ?? activeQual;
        }

        const metricsStr = localStorage.getItem("kj_waitlist_questionnaire_metrics");
        if (metricsStr) {
          const parsed = JSON.parse(metricsStr);
          activeName = parsed.name ?? activeName;
        }
      } catch (e) {
        console.warn("Could not read selections fallback:", e);
      }
    }

    const finalSelections = {
      food: activeFood || "sushi",
      vibe: activeVibe || "arcade",
      qualifier: activeQual || "chaotic",
    };

    setResolvedSelections(finalSelections);
    setResolvedName(activeName);

    const manifest = getScenario(
      finalSelections.food,
      finalSelections.vibe,
      finalSelections.qualifier,
      activeName
    );
    setDateManifest(manifest);

    const items = manifest.vectorKeys.map((key, i) => {
      const keyHash = key.charCodeAt(0) + i * 17;
      return {
        id: i,
        key,
        x: 10 + (i * 12 + keyHash * 2) % 80,
        y: 10 + (i * 15 + keyHash * 3) % 80,
        scale: 0.7 + (keyHash % 5) * 0.12,
        duration: 15 + (keyHash % 12) * 2,
      };
    });
    setFloatingItems(items);
  }, [selections, userName]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col items-center py-20 px-4 md:px-8">
      {/* Animated Floating Background Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {floatingItems.map((item) => {
          const IconComponent = iconMap[item.key] || StarIcon;
          return (
            <motion.div
              key={item.id}
              className="absolute text-neutral-100/10 dark:text-neutral-900/10"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0.15, 0.45, 0.15],
                scale: [item.scale, item.scale * 1.15, item.scale],
                x: [0, Math.sin(item.id) * 30, 0],
                y: [0, Math.cos(item.id) * 30, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: item.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <IconComponent />
            </motion.div>
          );
        })}
      </div>

      {/* Success Layout Cards */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-12">
        {/* Success check bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-12 h-12 rounded-none border-4 border-black bg-yellow-400 flex items-center justify-center shadow-[4px_4px_0px_#000]"
        >
          <svg className="w-6 h-6 text-black stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>

        {/* Title */}
        <div className="space-y-4 max-w-lg">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black tracking-widest text-orange-500 uppercase border-2 border-black bg-white px-3 py-1 inline-block"
          >
            PLAN UNLOCKED
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black font-bubbles tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-blue-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] py-1"
          >
            {dateManifest?.title}
          </motion.h1>
        </div>

        {/* Matched Itinerary Card */}
        {dateManifest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_#000] text-left space-y-6"
          >
            <div className="space-y-1 border-b-4 border-black pb-4">
              <span className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">
                THE MEMORANDUM
              </span>
              <h2 className="text-xl font-extrabold text-black">
                {dateManifest.title}
              </h2>
              <p className="text-xs text-neutral-600 font-bold italic">
                {dateManifest.subtitle}
              </p>
            </div>

            <p className="text-sm text-neutral-800 leading-relaxed font-bold">
              {dateManifest.narrative}
            </p>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black tracking-wider text-black uppercase">
                VAGUE TIMELINE PROTOCOL
              </h4>
              <div className="relative border-l-4 border-black pl-4 ml-1 space-y-6">
                {dateManifest.agenda.map((item, index) => (
                  <div key={index} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[24px] top-1 w-3.5 h-3.5 bg-yellow-400 border-2 border-black" />
                    
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-extrabold text-orange-500">
                        {item.time}
                      </span>
                      <h5 className="text-xs font-black text-black uppercase">
                        {item.activity}
                      </h5>
                      <p className="text-[11px] text-neutral-700 font-bold leading-normal">
                        {item.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Biometric analysis SurrenderSummary log */}
        <div className="w-full">
          <SurrenderSummary />
        </div>

        {/* Personal Reset Option */}
        {onReset && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            whileHover={{ opacity: 1, scale: 1.02 }}
            onClick={onReset}
            className="px-6 py-3 border-4 border-black bg-white text-black font-extrabold text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000] cursor-pointer"
          >
            Reset the plan
          </motion.button>
        )}
      </div>
    </div>
  );
};
