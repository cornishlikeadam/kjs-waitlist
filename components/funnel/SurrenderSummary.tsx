"use client";

import React, { useEffect, useState } from "react";
import { useBiometricTracker } from "../../hooks/useBiometricTracker";
import { motion } from "framer-motion";

export const SurrenderSummary: React.FC = () => {
  const {
    evasionCount,
    clickCount,
    activeTimeMs,
    getTelemetryPayload,
  } = useBiometricTracker();

  const [payload, setPayload] = useState<ReturnType<typeof getTelemetryPayload> | null>(null);

  useEffect(() => {
    try {
      setPayload(getTelemetryPayload());
    } catch (e) {
      console.warn("Failed to retrieve telemetry:", e);
    }
  }, [evasionCount, clickCount, activeTimeMs, getTelemetryPayload]);

  const activeSec = (activeTimeMs / 1000).toFixed(1);
  const maxVelocity = payload?.biometrics?.maxVelocity ?? 0;
  const deviceType = payload?.session?.deviceType ?? "desktop";
  const screenWidth = payload?.session?.screenSize?.width ?? 0;
  const screenHeight = payload?.session?.screenSize?.height ?? 0;

  const getHumorousResistanceRating = () => {
    return "HEURISTIC VIBE CHECK COMPLETE";
  };

  const getHumorousCommentary = (evasions: number) => {
    if (evasions === 0) {
      return "Zero hesitation registered. Immediate synchronization initiated.";
    }
    return `Behavioral telemetry indicates you tried to escape by pressing 'No' ${evasions} times. Evading was completely futile. We have recorded your parameters.`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="w-full max-w-lg mx-auto bg-black border-4 border-black p-6 shadow-[8px_8px_0px_#000] text-emerald-400 font-mono space-y-5 text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-emerald-500/30 pb-3">
        <div className="flex flex-col">
          <span className="text-[9px] font-black tracking-widest text-emerald-500 uppercase">
            [DATA_EXTRACTION_SUCCESS]
          </span>
          <h3 className="text-sm font-extrabold text-emerald-400 uppercase">
            Biometric Telemetry Feed
          </h3>
        </div>
        <div className="bg-emerald-950 border border-emerald-500/50 px-2.5 py-0.5 text-[9px] font-black text-emerald-400 animate-pulse">
          LIVE TELEMETRY
        </div>
      </div>

      {/* Commentary */}
      <div className="bg-neutral-900 border-2 border-emerald-500/30 p-4 space-y-2">
        <p className="text-xs leading-relaxed text-emerald-300">
          "{getHumorousCommentary(evasionCount)}"
        </p>
        <div className="h-[1px] bg-emerald-500/20" />
        <div className="flex justify-between items-center text-[10px] font-black">
          <span className="text-emerald-500">SURRENDER METRIC:</span>
          <span className="bg-emerald-900/60 px-2 py-0.5 border border-emerald-500/50 text-emerald-300 uppercase">
            {getHumorousResistanceRating()}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-neutral-900 border border-emerald-500/20 p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black text-emerald-500 uppercase">
            Evasion Triggers
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-black text-emerald-300">
              {evasionCount}
            </span>
            <span className="text-[9px] text-emerald-500 font-bold">attempts</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-emerald-500/20 p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black text-emerald-500 uppercase">
            Attention time
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-xl font-black text-emerald-300">
              {activeSec}
            </span>
            <span className="text-[9px] text-emerald-500 font-bold">sec</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-emerald-500/20 p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black text-emerald-500 uppercase">
            Approach Speed
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-lg font-black text-emerald-300">
              {(maxVelocity / 1000).toFixed(2)}
            </span>
            <span className="text-[9px] text-emerald-500 font-bold">px/ms</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-emerald-500/20 p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black text-emerald-500 uppercase">
            Viewport signature
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-xs font-black uppercase text-emerald-300">
              {deviceType}
            </span>
            <span className="text-[9px] text-emerald-500">
              ({screenWidth}x{screenHeight})
            </span>
          </div>
        </div>
      </div>

      {/* Waveform graphic */}
      <div className="space-y-1.5">
        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider block">
          Client Waveform
        </span>
        <div className="h-10 bg-neutral-900 border border-emerald-500/25 flex items-center justify-center relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <path
              d={`M -20,20 Q 50,${20 - Math.sin(evasionCount) * 8} 100,${20 + Math.cos(maxVelocity) * 10} T 220,${20 - (evasionCount % 4) * 6} T 350,${20 + (activeTimeMs % 10) * 1.2} T 480,20 L 520,20`}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              className="opacity-40"
            />
          </svg>
          <span className="text-[9px] text-emerald-300 font-bold uppercase relative z-10">
            [SYS_BIOMETRIC_SYNCED]
          </span>
        </div>
      </div>
    </motion.div>
  );
};
