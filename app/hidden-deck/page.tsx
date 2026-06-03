"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TelemetryData {
  evadeAttempts: number;
  timeSpent: number;
  deviceType: string;
  cursorPath?: { x: number; y: number; t: number }[];
  velocityVectors?: number[];
}

interface Lead {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  preferenceFood: string;
  preferenceVibe: string;
  qualifierAnswer: string;
  selectedDate: string;
  telemetry: TelemetryData;
}

interface SystemConfig {
  adminPasscode: string;
  activeSessions: number;
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // Scarcity controls state
  const [activeSessionsInput, setActiveSessionsInput] = useState("");
  const [passcodeInput, setPasscodeInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await fetch("/api/admin/leads");
      if (res.status === 401) {
        setError("Unauthorized access. Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load dashboard records.");
      }
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
        setConfig(data.config);
        setActiveSessionsInput(String(data.config.activeSessions));
        setPasscodeInput(data.config.adminPasscode);
      } else {
        throw new Error(data.message || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingConfig(true);
      setSaveSuccess("");
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeSessions: parseInt(activeSessionsInput, 10),
          adminPasscode: passcodeInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setSaveSuccess("System config updated.");
        // Update browser passcode cookie
        document.cookie = `admin_passcode=${data.config.adminPasscode}; path=/; max-age=86400`;
      } else {
        throw new Error(data.message || "Failed to update config.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleLogout = () => {
    // Clear admin auth cookie
    document.cookie = "admin_passcode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-6 w-6 text-black" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
            [SYS_LOADING] INITIALIZING PORTAL...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans text-center px-4">
        <span className="text-[10px] font-black text-red-500 tracking-widest uppercase mb-2">ERROR</span>
        <h1 className="text-xl font-bold text-black uppercase">{error}</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-neutral-50 text-black font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-5 gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase block mb-1">
              RELATIONSHIP TELEMETRY DASHBOARD
            </span>
            <h1 className="text-3xl font-black font-bubbles text-black tracking-tight uppercase">
              KJ'S CONTROL DECK
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 border-4 border-black text-[10px] font-extrabold tracking-wider uppercase hover:bg-neutral-100 transition-all bg-white shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border-4 border-black bg-red-500 hover:bg-red-400 text-black font-extrabold text-[10px] tracking-wider uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* SCARCITY CONFIG PANEL */}
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000]">
          <h2 className="text-xs font-black tracking-wider text-black uppercase mb-4">
            SCARCITY ENGINE PARAMETERS
          </h2>
          <form onSubmit={handleUpdateConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[9px] font-black text-black uppercase tracking-wider">
                Active Sessions Count
              </label>
              <input
                type="number"
                value={activeSessionsInput}
                onChange={(e) => setActiveSessionsInput(e.target.value)}
                className="px-3 py-2 text-sm bg-neutral-50 border-2 border-black focus:outline-none focus:bg-white transition-all font-bold"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[9px] font-black text-black uppercase tracking-wider">
                Admin Passcode
              </label>
              <input
                type="text"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className="px-3 py-2 text-sm bg-neutral-50 border-2 border-black focus:outline-none focus:bg-white transition-all font-mono font-bold"
              />
            </div>
            <div className="flex flex-col">
              <button
                type="submit"
                disabled={updatingConfig}
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-extrabold text-[10px] tracking-widest uppercase transition-all cursor-pointer border-2 border-black disabled:opacity-50"
              >
                Apply Parameters
              </button>
            </div>
          </form>
          {saveSuccess && (
            <p className="text-[10px] font-black text-emerald-600 mt-2 font-mono">
              [SYS_LOG] {saveSuccess}
            </p>
          )}
        </div>

        {/* SUBMITTED RESERVATIONS (PREPARED VERTICALLY) */}
        <div className="space-y-4">
          <h2 className="text-xs font-black tracking-wider text-black uppercase">
            SUBMITTED RESERVATIONS MATRIX ({leads.length})
          </h2>

          <div className="flex flex-col gap-5">
            {leads.length === 0 ? (
              <div className="border-4 border-dashed border-black p-10 text-center text-xs text-neutral-500 font-mono">
                [SYS_NOTICE] NO ACTIVE LEADS CAPTURED.
              </div>
            ) : (
              leads.map((lead) => {
                const dateObj = new Date(lead.selectedDate);
                const dateFormatted = dateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isSelected = selectedLeadId === lead.id;

                return (
                  <div
                    key={lead.id}
                    className={`bg-white border-4 border-black p-5 shadow-[6px_6px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:translate-y-0.5 hover:translate-x-0.5 transition-all space-y-4 cursor-pointer`}
                    onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}
                  >
                    {/* Top Row: Name & Date Info */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-black pb-3 gap-2">
                      <div>
                        <h3 className="text-lg font-black text-black uppercase tracking-tight">
                          {lead.name}
                        </h3>
                        <p className="text-xs font-bold text-orange-500 mt-0.5 font-mono">
                          {lead.email} • {lead.phone}
                        </p>
                      </div>
                      <div className="bg-black text-white text-xs font-black px-3 py-1.5 uppercase font-mono tracking-wider border-2 border-black self-start">
                        {dateFormatted}
                      </div>
                    </div>

                    {/* Preferences Badge Row */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-3 py-1 border-2 border-black bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest">
                        FOOD: {lead.preferenceFood}
                      </span>
                      <span className="px-3 py-1 border-2 border-black bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest">
                        VIBE: {lead.preferenceVibe}
                      </span>
                      <span className="px-3 py-1 border-2 border-black bg-red-500 text-white text-[10px] font-black uppercase tracking-widest">
                        ALIGN: {lead.qualifierAnswer}
                      </span>
                    </div>

                    {/* Expandable Telemetry log drawer */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden space-y-3 pt-3 border-t-2 border-neutral-100"
                        >
                          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                            <div className="p-2 border-2 border-black bg-neutral-50">
                              <span className="text-neutral-400 font-bold block">EVASION HITS:</span>
                              <span className="font-extrabold text-black">{lead.telemetry.evadeAttempts} attempts</span>
                            </div>
                            <div className="p-2 border-2 border-black bg-neutral-50">
                              <span className="text-neutral-400 font-bold block">SESSION TIME:</span>
                              <span className="font-extrabold text-black">{lead.telemetry.timeSpent} seconds</span>
                            </div>
                            <div className="p-2 border-2 border-black bg-neutral-50">
                              <span className="text-neutral-400 font-bold block">DEVICE Resolved:</span>
                              <span className="font-extrabold uppercase text-black">{lead.telemetry.deviceType}</span>
                            </div>
                            <div className="p-2 border-2 border-black bg-neutral-50">
                              <span className="text-neutral-400 font-bold block">SUBMITTED ON:</span>
                              <span className="font-extrabold text-black">{new Date(lead.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {lead.telemetry.cursorPath && lead.telemetry.cursorPath.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-black uppercase tracking-wider block">
                                Biometric Path Sample Nodes
                              </span>
                              <div className="max-h-24 overflow-y-auto border-2 border-black p-2 font-mono text-[9px] text-neutral-700 bg-neutral-50 space-y-0.5">
                                {lead.telemetry.cursorPath.slice(0, 5).map((pt, i) => (
                                  <div key={i} className="flex justify-between">
                                    <span>N{i + 1}: ({pt.x.toFixed(0)}, {pt.y.toFixed(0)})</span>
                                    <span>t: {new Date(pt.t).toLocaleTimeString()}</span>
                                  </div>
                                ))}
                                {lead.telemetry.cursorPath.length > 5 && (
                                  <div className="text-[8px] text-neutral-400 text-center pt-1 border-t border-dashed border-black">
                                    + {lead.telemetry.cursorPath.length - 5} downsampled nodes
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
