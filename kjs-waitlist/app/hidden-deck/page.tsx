'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeSessions, setActiveSessions] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'leads' | 'analytics' | 'telemetry'>('leads');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch leads and configuration
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch Leads
      const leadsRes = await fetch('/api/admin/leads');
      if (leadsRes.status === 401) {
        // Redirect to homepage if unauthorized
        router.push('/');
        return;
      }
      const leadsData = await leadsRes.json();
      if (leadsData.success) {
        setLeads(leadsData.leads);
      }

      // Fetch Scarcity Config
      const configRes = await fetch('/api/admin/config');
      const configData = await configRes.json();
      if (configData.success) {
        setActiveSessions(configData.config.activeSessions);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update scarcity configuration
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccess(false);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activeSessions }),
      });
      const data = await res.json();
      if (data.success) {
        setConfigSuccess(true);
        setTimeout(() => setConfigSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating config:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Clear cookie and logout
  const handleLogout = () => {
    document.cookie = 'admin_passcode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/');
  };

  // Draw cursor paths if selected
  useEffect(() => {
    if (selectedLead && selectedLead.telemetry.cursorPath && selectedLead.telemetry.cursorPath.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const path = selectedLead.telemetry.cursorPath;
        
        // Find min/max bounds to scale coordinates dynamically
        const xs = path.map(p => p.x);
        const ys = path.map(p => p.y);
        const minX = Math.min(...xs, 0);
        const maxX = Math.max(...xs, window.innerWidth);
        const minY = Math.min(...ys, 0);
        const maxY = Math.max(...ys, window.innerHeight);
        
        const scaleX = (val: number) => ((val - minX) / (maxX - minX || 1)) * (canvas.width - 40) + 20;
        const scaleY = (val: number) => ((val - minY) / (maxY - minY || 1)) * (canvas.height - 40) + 20;
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 20; i < canvas.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 20; i < canvas.height; i += 20) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        // Draw path
        ctx.beginPath();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        path.forEach((point, idx) => {
          const cx = scaleX(point.x);
          const cy = scaleY(point.y);
          if (idx === 0) {
            ctx.moveTo(cx, cy);
          } else {
            ctx.lineTo(cx, cy);
          }
        });
        ctx.stroke();

        // Highlight start point
        if (path.length > 0) {
          ctx.beginPath();
          ctx.arc(scaleX(path[0].x), scaleY(path[0].y), 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#10B981'; // Green for start
          ctx.fill();
        }

        // Highlight end point
        if (path.length > 1) {
          ctx.beginPath();
          ctx.arc(scaleX(path[path.length - 1].x), scaleY(path[path.length - 1].y), 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#EF4444'; // Red for end
          ctx.fill();
        }
      }
    }
  }, [selectedLead]);

  // Calculations for Stats Card Summary
  const totalLeads = leads.length;
  const avgEvasionAttempts = totalLeads > 0 
    ? (leads.reduce((sum, l) => sum + (l.telemetry.evadeAttempts || 0), 0) / totalLeads).toFixed(1)
    : '0.0';
  const avgTimeSpent = totalLeads > 0
    ? (leads.reduce((sum, l) => sum + (l.telemetry.timeSpent || 0), 0) / totalLeads).toFixed(1)
    : '0.0';

  // Calculations for preferences comparison
  const foodSushi = leads.filter(l => l.preferenceFood.toLowerCase().includes('sushi') || l.preferenceFood.toLowerCase() === 'sushi').length;
  const foodPasta = leads.filter(l => l.preferenceFood.toLowerCase().includes('pasta') || l.preferenceFood.toLowerCase() === 'pasta').length;
  const vibeArcade = leads.filter(l => l.preferenceVibe.toLowerCase().includes('arcade') || l.preferenceVibe.toLowerCase() === 'arcade').length;
  const vibeMovies = leads.filter(l => l.preferenceVibe.toLowerCase().includes('movie') || l.preferenceVibe.toLowerCase() === 'movies').length;

  const foodSushiPct = totalLeads > 0 ? Math.round((foodSushi / totalLeads) * 100) : 50;
  const foodPastaPct = totalLeads > 0 ? Math.round((foodPasta / totalLeads) * 100) : 50;
  const vibeArcadePct = totalLeads > 0 ? Math.round((vibeArcade / totalLeads) * 100) : 50;
  const vibeMoviesPct = totalLeads > 0 ? Math.round((vibeMovies / totalLeads) * 100) : 50;

  // Filter leads based on search query
  const filteredLeads = leads.filter(lead => {
    const term = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(term) ||
      lead.email.toLowerCase().includes(term) ||
      lead.phone.includes(term) ||
      lead.preferenceFood.toLowerCase().includes(term) ||
      lead.preferenceVibe.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans antialiased text-neutral-800 dark:text-neutral-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-black dark:text-white">
            Not2Late
          </span>
          <span className="h-4 w-[1px] bg-neutral-250 dark:bg-neutral-800" />
          <div className="flex items-center space-x-1.5 bg-neutral-50 dark:bg-zinc-900 border border-neutral-200/50 dark:border-neutral-850 px-2 py-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              Shadow Deck Active
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200/50 dark:border-neutral-800 px-3 py-1.5 transition-colors duration-300"
        >
          Deauthorize Deck
        </button>
      </header>

      {/* Main Grid View */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Analytics Summary Card Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-neutral-900 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 dark:text-neutral-550 block mb-1">Total Leads</span>
            <span className="text-2xl font-light text-neutral-900 dark:text-white tracking-tight">
              {isLoading ? '...' : totalLeads}
            </span>
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-neutral-900 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 dark:text-neutral-550 block mb-1">Avg Evasions</span>
            <span className="text-2xl font-light text-neutral-900 dark:text-white tracking-tight">
              {isLoading ? '...' : avgEvasionAttempts}
            </span>
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-neutral-900 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 dark:text-neutral-550 block mb-1">Avg Interaction Time</span>
            <span className="text-2xl font-light text-neutral-900 dark:text-white tracking-tight">
              {isLoading ? '...' : `${avgTimeSpent}s`}
            </span>
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-neutral-900 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 dark:text-neutral-550 block mb-1">Active Scarcity Cap</span>
            <span className="text-2xl font-light text-neutral-900 dark:text-white tracking-tight">
              {isLoading ? '...' : activeSessions}
            </span>
          </div>
        </section>

        {/* Dashboard Panels Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns (Tabs list and charts) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* View Selectors */}
            <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-neutral-900 p-1 flex space-x-1">
              <button
                onClick={() => { setActiveTab('leads'); setSelectedLead(null); }}
                className={`flex-1 py-2 text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 ${
                  activeTab === 'leads'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                    : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Lead Ledger
              </button>
              <button
                onClick={() => { setActiveTab('analytics'); setSelectedLead(null); }}
                className={`flex-1 py-2 text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 ${
                  activeTab === 'analytics'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                    : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Funnel Dynamics
              </button>
              <button
                onClick={() => { setActiveTab('telemetry'); setSelectedLead(null); }}
                className={`flex-1 py-2 text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 ${
                  activeTab === 'telemetry'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                    : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Telemetry Matrix
              </button>
            </div>

            {/* List and Tables views */}
            <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-neutral-900 p-6 min-h-[500px]">
              
              {isLoading ? (
                <div className="h-96 flex flex-col items-center justify-center space-y-4">
                  <svg className="animate-spin h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">Extracting database records...</span>
                </div>
              ) : activeTab === 'leads' ? (
                // --- LEADS TAB ---
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-4 mb-4">
                    <span className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold">
                      Collected Leads Ledger ({filteredLeads.length})
                    </span>
                    {/* Search Field */}
                    <div className="relative max-w-xs w-full">
                      <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                      />
                    </div>
                  </div>

                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-20 text-neutral-400 text-xs font-light">
                      No matching records found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-100 dark:border-neutral-900 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                            <th className="py-3 px-4 font-semibold">Lead Details</th>
                            <th className="py-3 px-4 font-semibold">Preferences</th>
                            <th className="py-3 px-4 font-semibold">Scheduled Date</th>
                            <th className="py-3 px-4 font-semibold text-right">Evasions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeads.map((lead) => (
                            <tr 
                              key={lead.id} 
                              onClick={() => setSelectedLead(lead)}
                              className={`border-b border-neutral-100 dark:border-neutral-900 text-xs hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 cursor-pointer transition-colors duration-200 ${
                                selectedLead?.id === lead.id ? 'bg-neutral-50 dark:bg-neutral-900/40' : ''
                              }`}
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-neutral-900 dark:text-white">{lead.name}</div>
                                <div className="text-[11px] text-neutral-400 font-light mt-0.5">{lead.email}</div>
                                <div className="text-[11px] text-neutral-400 font-light mt-0.5">{lead.phone}</div>
                              </td>
                              <td className="py-3.5 px-4 font-light text-neutral-600 dark:text-neutral-400 leading-normal">
                                <div><span className="font-medium text-neutral-800 dark:text-neutral-300">Food:</span> {lead.preferenceFood}</div>
                                <div className="mt-0.5"><span className="font-medium text-neutral-800 dark:text-neutral-300">Vibe:</span> {lead.preferenceVibe}</div>
                              </td>
                              <td className="py-3.5 px-4 font-light text-neutral-500">
                                {new Date(lead.selectedDate).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3.5 px-4 text-right font-medium">
                                <span className={`inline-block px-1.5 py-0.5 text-[10px] ${
                                  (lead.telemetry.evadeAttempts || 0) > 10 
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455' 
                                    : 'bg-neutral-50 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-450'
                                }`}>
                                  {lead.telemetry.evadeAttempts || 0}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : activeTab === 'analytics' ? (
                // --- ANALYTICS TAB ---
                <div className="space-y-8">
                  <div className="border-b border-neutral-100 dark:border-neutral-900 pb-4 mb-4">
                    <span className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-550 font-semibold">
                      Preference Statistics and Splits
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Food Preferences Split */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">Food Selection</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1 font-light">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Sushi / Omakase</span>
                            <span>{foodSushi} ({foodSushiPct}%)</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-1.5">
                            <div className="bg-black dark:bg-white h-1.5 transition-all duration-550" style={{ width: `${foodSushiPct}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1 font-light">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Pasta / Lounge</span>
                            <span>{foodPasta} ({foodPastaPct}%)</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-1.5">
                            <div className="bg-black dark:bg-white h-1.5 transition-all duration-550" style={{ width: `${foodPastaPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vibe Preferences Split */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">Vibe Selection</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1 font-light">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Arcade / Conceptual</span>
                            <span>{vibeArcade} ({vibeArcadePct}%)</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-1.5">
                            <div className="bg-black dark:bg-white h-1.5 transition-all duration-550" style={{ width: `${vibeArcadePct}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1 font-light">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Movies / Streetscapes</span>
                            <span>{vibeMovies} ({vibeMoviesPct}%)</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-1.5">
                            <div className="bg-black dark:bg-white h-1.5 transition-all duration-550" style={{ width: `${vibeMoviesPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Device type telemetry splits */}
                  <div className="pt-6 border-t border-neutral-100 dark:border-neutral-900">
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-4">Device Telemetry Logs</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-neutral-100 dark:border-neutral-900/50">
                        <span className="text-[10px] font-semibold text-neutral-400 block mb-1">Desktop Users</span>
                        <span className="text-xl font-light text-neutral-800 dark:text-white">
                          {leads.filter(l => l.telemetry.deviceType.toLowerCase() === 'desktop').length}
                        </span>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-neutral-100 dark:border-neutral-900/50">
                        <span className="text-[10px] font-semibold text-neutral-400 block mb-1">Mobile Users</span>
                        <span className="text-xl font-light text-neutral-800 dark:text-white">
                          {leads.filter(l => l.telemetry.deviceType.toLowerCase() === 'mobile').length}
                        </span>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-neutral-100 dark:border-neutral-900/50">
                        <span className="text-[10px] font-semibold text-neutral-400 block mb-1">Tablet / Other</span>
                        <span className="text-xl font-light text-neutral-800 dark:text-white">
                          {leads.filter(l => l.telemetry.deviceType.toLowerCase() !== 'mobile' && l.telemetry.deviceType.toLowerCase() !== 'desktop').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // --- TELEMETRY TAB ---
                <div className="space-y-4">
                  <div className="border-b border-neutral-100 dark:border-neutral-900 pb-4 mb-4">
                    <span className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-550 font-semibold">
                      Biometric & Kinetic Telemetry Logbook
                    </span>
                  </div>

                  <div className="space-y-3">
                    {leads.map((lead) => (
                      <div 
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-4 border text-xs cursor-pointer transition-all duration-200 ${
                          selectedLead?.id === lead.id
                            ? 'border-neutral-900 bg-neutral-50/50 dark:border-white dark:bg-neutral-900/20'
                            : 'border-neutral-100 dark:border-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-800 bg-white dark:bg-zinc-950'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-neutral-900 dark:text-white">{lead.name}</span>
                            <span className="text-[11px] text-neutral-400 font-light ml-2">({lead.telemetry.deviceType})</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-light">
                            {new Date(lead.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex space-x-6 text-[11px] font-light text-neutral-500 dark:text-neutral-400">
                          <div>
                            <span className="font-medium text-neutral-850 dark:text-neutral-300">Evasion Resistance:</span> {lead.telemetry.evadeAttempts} attempts
                          </div>
                          <div>
                            <span className="font-medium text-neutral-850 dark:text-neutral-300">Engagement Duration:</span> {lead.telemetry.timeSpent}s
                          </div>
                          <div>
                            <span className="font-medium text-neutral-850 dark:text-neutral-300">Cursor Vector Nodes:</span> {lead.telemetry.cursorPath?.length || 0} vertices
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Sidebar controls & Details) */}
          <div className="space-y-6">
            
            {/* Scarcity Control Widget */}
            <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-neutral-900 p-6">
              <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-neutral-400 block mb-2">
                Scarcity Simulation Engine
              </span>
              <h3 className="text-lg font-light text-neutral-900 dark:text-white tracking-tight mb-4">
                Active Slot Throttle
              </h3>

              <form onSubmit={handleUpdateConfig} className="space-y-4">
                <div>
                  <label className="flex justify-between text-xs text-neutral-500 mb-1.5 font-light">
                    <span>Simulated Active Co-Sessions</span>
                    <span className="font-semibold text-neutral-800 dark:text-white">{activeSessions}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={activeSessions}
                    onChange={(e) => setActiveSessions(parseInt(e.target.value))}
                    disabled={isSavingConfig}
                    className="w-full accent-black dark:accent-white cursor-pointer h-1 bg-neutral-100 dark:bg-neutral-900 appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-light mt-1">
                    <span>1 (Minimum)</span>
                    <span>30 (Maximum)</span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 dark:text-neutral-550 leading-relaxed font-light bg-neutral-50 dark:bg-zinc-900/60 p-3 border border-neutral-100 dark:border-neutral-900/50">
                  Adjusting this slider modifies the reactive simulation count displayed to site visitors, driving psychological demand signals.
                </div>

                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className={`w-full py-3 text-[9px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 border ${
                    configSuccess
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50'
                      : 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white hover:bg-white hover:text-neutral-900 dark:hover:bg-transparent dark:hover:text-white'
                  }`}
                >
                  {isSavingConfig ? (
                    <span className="flex items-center justify-center space-x-1.5">
                      <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Syncing Scarcity...</span>
                    </span>
                  ) : configSuccess ? (
                    'State Saved successfully'
                  ) : (
                    'Apply Simulation Cap'
                  )}
                </button>
              </form>
            </div>

            {/* Interactive Telemetry Log Inspector Panel */}
            <div className="bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-neutral-900 p-6 min-h-[300px]">
              <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-neutral-400 block mb-2">
                Biometric Analyzer
              </span>
              <h3 className="text-lg font-light text-neutral-900 dark:text-white tracking-tight mb-4">
                Kinetic Inspector
              </h3>

              {selectedLead ? (
                <div className="space-y-5">
                  {/* Lead overview inside inspector */}
                  <div className="pb-3 border-b border-neutral-100 dark:border-neutral-900 text-xs font-light text-neutral-500 dark:text-neutral-400">
                    <div className="font-semibold text-neutral-800 dark:text-white text-[13px] mb-0.5">{selectedLead.name}</div>
                    <div>{selectedLead.email}</div>
                  </div>

                  {/* Visual coordinate canvas render */}
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
                      Friction Evasion Vector Map
                    </span>
                    {selectedLead.telemetry.cursorPath && selectedLead.telemetry.cursorPath.length > 0 ? (
                      <div className="relative border border-neutral-200/60 dark:border-neutral-850 bg-neutral-50 dark:bg-zinc-900 flex justify-center">
                        <canvas
                          ref={canvasRef}
                          width={240}
                          height={160}
                          className="block bg-neutral-50/50 dark:bg-transparent"
                        />
                        <div className="absolute bottom-2 left-2 text-[9px] text-neutral-400 font-light flex items-center space-x-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Origin</span>
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Target</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 border border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-center p-4 text-[11px] text-neutral-400 font-light bg-neutral-50/50 dark:bg-zinc-900/20">
                        No cursor velocity coordinates saved in payload for this interaction.
                      </div>
                    )}
                  </div>

                  {/* Raw selections summary */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-neutral-50 dark:border-neutral-900 py-1">
                      <span className="text-neutral-400 font-light">Food Match</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{selectedLead.preferenceFood}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-50 dark:border-neutral-900 py-1">
                      <span className="text-neutral-400 font-light">Vibe Choice</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{selectedLead.preferenceVibe}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-50 dark:border-neutral-900 py-1">
                      <span className="text-neutral-400 font-light">Qualifier Answer</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{selectedLead.qualifierAnswer}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-50 dark:border-neutral-900 py-1">
                      <span className="text-neutral-400 font-light">Evasion Physics Proximity</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{selectedLead.telemetry.evadeAttempts} triggers</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-400 font-light">Active Session Duration</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{selectedLead.telemetry.timeSpent}s</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-neutral-400 text-xs font-light border border-dashed border-neutral-200 dark:border-neutral-800">
                  Select a lead from the Ledger or Telemetry list to run kinetic analysis.
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Footer Branding Notice */}
      <footer className="mt-20 border-t border-neutral-100 dark:border-neutral-900 py-8 text-center text-[10px] text-neutral-400 uppercase tracking-widest font-light">
        Strict Minimalist Design • Secure Sandboxed Administration
      </footer>
    </div>
  );
}
