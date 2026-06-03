"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TelemetryProvider } from "../context/TelemetryContext";
import { useBiometricTracker } from "../hooks/useBiometricTracker";
import { QuestionnaireSuite } from "../components/funnel/QuestionnaireSuite";
import { DatePickerGrid } from "../components/funnel/DatePickerGrid";
import { TimeSlotSelector } from "../components/funnel/TimeSlotSelector";
import LeadCaptureForm from "../components/funnel/LeadCaptureForm";
import { FinalCanvas } from "../components/funnel/FinalCanvas";
import { EvasiveButton } from "../components/interactive/EvasiveButton";
import { KJ_IDENTITY_MANIFEST } from "../config/brandIdentity";

// Individual falling raindrop component
const RainDrop = ({ delay, left, duration }: { delay: number; left: number; duration: number }) => (
  <motion.div
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: "110vh", opacity: [0, 0.7, 0.7, 0] }}
    transition={{ repeat: Infinity, duration, delay, ease: "linear" }}
    className="absolute w-[2px] h-[35px] bg-cyan-400 pointer-events-none z-0"
    style={{ left: `${left}%` }}
  />
);

// Funnel container managing state
function FunnelContainer() {
  const [step, setStep] = useState<"hero" | "questionnaire" | "calendar" | "lead_capture" | "success">("hero");
  const [selections, setSelections] = useState<{ food: string; vibe: string; qualifier: string } | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [finalDateTime, setFinalDateTime] = useState<Date | null>(null);
  const [userName, setUserName] = useState("Guest");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scarcity Engine controls
  const [scarcitySessions, setScarcitySessions] = useState(3);
  const [showScarcity, setShowScarcity] = useState(false);

  // Background states (Seamless Rain & Sun transition every 6s)
  const [showSun, setShowSun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Pop-up state ("Am I crushing ?" after 6s)
  const [showCrushingPopup, setShowCrushingPopup] = useState(false);

  // Admin deck states
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  const { logClick, getTelemetryPayload } = useBiometricTracker();
  const config = KJ_IDENTITY_MANIFEST;
  const animationCurve = config.designSystem.animationCurve;

  // Set isMounted on mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Retrieve Scarcity Engine session simulation counter from config route
  useEffect(() => {
    fetch("/thewaitlist/api/funnel/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeSessions !== undefined) {
          setScarcitySessions(data.activeSessions);
        }
      })
      .catch((err) => console.warn("Failed to fetch public scarcity config:", err));

    // Show scarcity notification toast after 2.5 seconds
    const timer = setTimeout(() => {
      setShowScarcity(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Seamless Rain / Sun alternation cycle every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSun((prev) => !prev);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Pop-up timer: trigger "Am I crushing ?" exactly 6 seconds after reaching 'success' step
  useEffect(() => {
    if (step !== "success") return;

    const popupTimer = setTimeout(() => {
      setShowCrushingPopup(true);
    }, 6000);

    return () => clearTimeout(popupTimer);
  }, [step]);

  // Generate randomized raindrops for the rain state (only on client mount)
  const rainDrops = useMemo(() => {
    if (!isMounted) return [];
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 1.5 + Math.random() * 1.5,
    }));
  }, [isMounted]);

  // Authenticate admin passphrase (9938) and set validation cookie
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    if (adminPasscode.trim() === "9938") {
      document.cookie = "admin_passcode=9938; path=/; max-age=86400";
      window.location.href = "/thewaitlist/hidden-deck";
    } else {
      setAuthError("INCORRECT PASSCODE.");
    }
  };

  const handleQuestionnaireComplete = (surveyChoices: typeof selections) => {
    setSelections(surveyChoices);
    setStep("calendar");
  };

  const handleDateTimeSelect = (dateTime: Date) => {
    setFinalDateTime(dateTime);
  };

  const handleLeadFormSubmit = async (formData: { name: string; email: string; phone: string }) => {
    setIsSubmitting(true);
    setUserName(formData.name);

    try {
      const metricsStr = localStorage.getItem("kj_waitlist_questionnaire_metrics") || "{}";
      const parsedMetrics = JSON.parse(metricsStr);
      localStorage.setItem(
        "kj_waitlist_questionnaire_metrics",
        JSON.stringify({ ...parsedMetrics, name: formData.name })
      );
    } catch (e) {
      console.warn("Local storage write failed:", e);
    }

    const payload = getTelemetryPayload();
    const formattedPayload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      preferenceFood: selections?.food || "sushi",
      preferenceVibe: selections?.vibe || "arcade",
      qualifierAnswer: selections?.qualifier || "chaotic",
      selectedDate: finalDateTime ? finalDateTime.toISOString() : new Date().toISOString(),
      telemetry: {
        evadeAttempts: payload.interactions.evasions.length,
        timeSpent: parseFloat((payload.session.totalTimeMs / 1000).toFixed(2)),
        deviceType: payload.session.deviceType,
        cursorPath: payload.biometrics.mousePaths.map(pt => ({ x: pt.x, y: pt.y, t: pt.t })),
        velocityVectors: payload.biometrics.mousePaths.map(pt => pt.v),
      },
    };

    try {
      const res = await fetch("/thewaitlist/api/funnel/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit lead data.");
      }

      setStep("success");
    } catch (err: any) {
      alert(`Submission error: ${err.message || "Please check details."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem("kj_waitlist_selections");
    localStorage.removeItem("kj_waitlist_questionnaire_metrics");
    setSelections(undefined);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setFinalDateTime(null);
    setUserName("Guest");
    window.location.reload();
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col overflow-y-auto selection:bg-yellow-400 selection:text-black font-sans relative"
      style={{
        backgroundImage: 'url("/thewaitlist/assets/kj-background.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark Overlay to guarantee high text contrast and readability */}
      <div className="absolute inset-0 bg-black/55 z-0 pointer-events-none" />

      {/* Rain Effect overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <AnimatePresence>
          {!showSun && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {rainDrops.map((drop) => (
                <RainDrop key={drop.id} left={drop.left} delay={drop.delay} duration={drop.duration} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sun Glow Gradient reveal overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ opacity: showSun ? 0.55 : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.7)_0%,rgba(249,115,22,0.4)_40%,rgba(0,0,0,0)_70%)]"
        />
      </div>

      {/* Scarcity notifications */}
      <AnimatePresence>
        {showScarcity && step !== "success" && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ ease: animationCurve, duration: 0.6 }}
            className="fixed bottom-6 right-6 z-30 max-w-sm w-full bg-white border-4 border-black p-4 shadow-[6px_6px_0px_#000] flex items-start gap-3.5"
          >
            <div className="p-2 bg-yellow-400 text-black border-2 border-black flex items-center justify-center min-w-[36px]">
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1">
                Waitlist Scarcity System
              </span>
              <p className="text-xs text-black leading-relaxed font-black uppercase">
                Another private booking invitation is currently pending response for this upcoming weekend.
              </p>
              <span className="text-[10px] text-orange-500 mt-1.5 block font-bold font-mono">
                {scarcitySessions} slots active
              </span>
            </div>
            <button
              onClick={() => setShowScarcity(false)}
              className="text-black hover:text-red-500 p-1 font-bold"
            >
              [X]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Passcode Modal (verified passcode 9938) */}
      <AnimatePresence>
        {showAdminAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-black p-8 max-w-sm w-full shadow-[8px_8px_0px_#000]"
            >
              <span className="text-[9px] font-black tracking-widest uppercase text-orange-500 block mb-2">
                ADMIN ACCESS LOCKBOX
              </span>
              <h3 className="text-lg font-black font-bubbles text-black mb-2 uppercase">
                ENTER PASSCODE
              </h3>
              <p className="text-xs text-neutral-700 mb-6 leading-relaxed font-bold">
                Input your 4-digit code to unlock database lists and biometric analytics.
              </p>
              <form onSubmit={handleAdminAuth} className="space-y-4">
                <input
                  type="password"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="CODE"
                  maxLength={6}
                  className="w-full px-4 py-3 text-sm bg-black text-white border-4 border-black rounded-none focus:outline-none focus:bg-white focus:text-black font-mono font-extrabold"
                  autoFocus
                />
                {authError && (
                  <p className="text-[11px] text-red-500 font-black font-mono">
                    [X] {authError}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-orange-500 text-white font-extrabold text-[10px] tracking-widest uppercase transition-all border-4 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
                  >
                    Unlock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminAuth(false);
                      setAdminPasscode("");
                      setAuthError("");
                    }}
                    className="px-4 py-3 border-4 border-black bg-white hover:bg-neutral-50 text-black font-extrabold text-[10px] tracking-widest uppercase transition-all shadow-[3px_3px_0px_#000]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Am I crushing ?" Evasive Modal Pop-up (Triggers at 6s) */}
      <AnimatePresence>
        {showCrushingPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000] w-full max-w-[290px] text-center space-y-6 relative"
            >
              <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase block">
                CRITICAL QUESTION
              </span>
              <h2 
                className="font-bubbles text-3xl font-extrabold tracking-normal text-transparent bg-clip-text bg-gradient-to-r from-[#8A5229] via-[#E65C00] to-[#F9D423] drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] uppercase py-1"
                style={{ WebkitTextStroke: "1px #000", textShadow: "2px 2px 0px #000" }}
              >
                Am I crushing ?
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-xs mx-auto pt-2">
                <button
                  onClick={() => {
                    logClick("crushing-yes-button", "button", 0, 0);
                    setShowCrushingPopup(false);
                  }}
                  className="w-full py-4 bg-blue-600 hover:bg-orange-500 text-white font-extrabold text-[12px] tracking-[0.2em] uppercase border-4 border-black shadow-[4px_4px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
                >
                  Yes
                </button>
                <EvasiveButton 
                  className="w-full py-4 bg-red-500 hover:bg-orange-400 text-white font-extrabold text-[12px] tracking-[0.2em] uppercase border-4 border-black shadow-[4px_4px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
                >
                  No
                </EvasiveButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center py-12 px-4 relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP A: THE HERO SCREEN */}
          {step === "hero" && (
            <motion.div
              key="hero-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-xl mx-auto text-center space-y-12 py-10"
            >
              {/* Question: GO ON A DATE WITH KJ? */}
              <div className="space-y-4">
                <span className="text-[10px] font-black tracking-[0.25em] text-yellow-400 uppercase bg-black border-2 border-black px-4 py-1.5 inline-block">
                  Personal Invitation Portfolio
                </span>
                <h1 
                  className="font-bubbles text-5xl md:text-7xl font-extrabold tracking-normal text-transparent bg-clip-text bg-gradient-to-r from-[#8A5229] via-[#E65C00] to-[#F9D423] drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] py-2 select-none uppercase"
                  style={{
                    WebkitTextStroke: "2px #000",
                    textShadow: "4px 4px 0px #000",
                  }}
                >
                  GO ON A DATE WITH KJ?
                </h1>
                <p 
                  className="text-sm text-white font-extrabold max-w-xs mx-auto italic"
                  style={{ textShadow: "2px 2px 0px #000" }}
                >
                  "{config.profile.bioHook}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-xs mx-auto">
                <button
                  onClick={() => {
                    logClick("yes-button", "button", 0, 0);
                    setStep("questionnaire");
                  }}
                  className="w-full py-4 bg-blue-600 hover:bg-orange-500 text-white font-extrabold text-[12px] tracking-[0.25em] uppercase border-4 border-black shadow-[4px_4px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
                >
                  Yes
                </button>
                <EvasiveButton 
                  className="w-full py-4 bg-red-500 hover:bg-orange-400 text-white font-extrabold text-[12px] tracking-[0.25em] uppercase border-4 border-black shadow-[4px_4px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
                >
                  No
                </EvasiveButton>
              </div>
            </motion.div>
          )}

          {/* STEP B: QUESTIONNAIRE */}
          {step === "questionnaire" && (
            <motion.div
              key="questionnaire-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full"
            >
              <QuestionnaireSuite
                onComplete={handleQuestionnaireComplete}
                onBack={() => setStep("hero")}
              />
            </motion.div>
          )}

          {/* STEP C: CALENDAR */}
          {step === "calendar" && (
            <motion.div
              key="calendar-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 items-start justify-center"
            >
              <div className="w-full lg:w-1/2">
                <DatePickerGrid
                  selectedDate={selectedDate}
                  onChange={(d) => {
                    setSelectedDate(d);
                    setSelectedTimeSlot(null);
                  }}
                />
              </div>

              <div className="w-full lg:w-1/2 flex flex-col justify-between min-h-[320px]">
                <TimeSlotSelector
                  selectedDate={selectedDate}
                  selectedTimeSlot={selectedTimeSlot}
                  onSelectTimeSlot={setSelectedTimeSlot}
                  onSelectDateTime={handleDateTimeSelect}
                />

                {finalDateTime && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setStep("lead_capture")}
                    className="w-full mt-6 py-4 bg-blue-600 text-white hover:bg-orange-500 font-extrabold text-[12px] tracking-[0.2em] uppercase border-4 border-black shadow-[4px_4px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
                  >
                    Proceed to Verification
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP D: CONTACT INFO */}
          {step === "lead_capture" && (
            <motion.div
              key="lead-capture-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full"
            >
              <LeadCaptureForm onSubmit={handleLeadFormSubmit} isLoading={isSubmitting} />
            </motion.div>
          )}

          {/* STEP E: SUCCESS CANVAS */}
          {step === "success" && (
            <motion.div
              key="success-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <FinalCanvas
                selections={selections}
                userName={userName}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer link to launch hidden admin panel (labeled simply as "KJ") */}
      {step !== "success" && (
        <footer className="w-full py-6 text-center mt-auto relative z-10">
          <button
            onClick={() => {
              setShowAdminAuth(true);
            }}
            className="text-sm font-black tracking-[0.3em] text-white hover:text-yellow-400 uppercase transition-all select-none cursor-pointer"
            style={{ textShadow: "2px 2px 0px #000" }}
          >
            KJ
          </button>
        </footer>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <TelemetryProvider>
      <FunnelContainer />
    </TelemetryProvider>
  );
}
