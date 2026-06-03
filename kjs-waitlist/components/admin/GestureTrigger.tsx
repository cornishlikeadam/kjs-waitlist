'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GestureTriggerProps {
  children: React.ReactNode;
}

export default function GestureTrigger({ children }: GestureTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clickTimes, setClickTimes] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Only track left clicks for mouse events
    if ('button' in e && e.button !== 0) return;

    const now = Date.now();
    const newTimes = [...clickTimes, now].slice(-3);
    setClickTimes(newTimes);

    if (newTimes.length === 3) {
      const duration = newTimes[2] - newTimes[0];
      if (duration <= 1200) {
        setClickTimes([]);
        setIsOpen(true);
      }
    }
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(false);

    // Simulate cryptographic verification delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 800));

    const expectedPasscode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || '9938';

    if (passcode === expectedPasscode) {
      // Set the session cookie so middleware allows access
      document.cookie = `admin_passcode=${passcode}; path=/; max-age=86400; SameSite=Strict`;
      
      // Navigate to the hidden admin view
      router.push('/hidden-deck');
      setIsOpen(false);
      setPasscode('');
    } else {
      setError(true);
      setPasscode('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
    setIsLoading(false);
  };

  return (
    <>
      <div 
        onClick={handleTap} 
        onTouchStart={handleTap}
        className="cursor-pointer select-none"
      >
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-md transition-opacity duration-300">
          {/* Backdrop Click to Close */}
          <div className="absolute inset-0 bg-neutral-900/10 dark:bg-black/40" onClick={() => setIsOpen(false)} />

          {/* Modal Container */}
          <div className={`relative w-full max-w-sm mx-4 bg-white dark:bg-zinc-950 border border-neutral-200/80 dark:border-neutral-800/80 p-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] rounded-none transition-all duration-300 ${
            error ? 'animate-shake border-red-500/80' : ''
          }`}>
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <span className="text-[9px] font-semibold tracking-[0.25em] uppercase text-neutral-400 dark:text-neutral-500 block mb-1.5">
                Security Gateway
              </span>
              <h3 className="text-xl font-light text-neutral-900 dark:text-white tracking-tight">
                Shadow Administration
              </h3>
              <p className="text-[11px] text-neutral-455 dark:text-neutral-500 font-light mt-1 leading-relaxed">
                Enter authorized credentials to view system telemetry.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <input
                  ref={inputRef}
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="••••••••••••••••"
                  disabled={isLoading}
                  className={`w-full px-3.5 py-3 text-sm bg-white dark:bg-zinc-900 border rounded-none tracking-widest text-center transition-all duration-300 placeholder:text-neutral-200 dark:placeholder:text-neutral-800 focus:outline-none focus:ring-1 ${
                    error
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white focus:ring-neutral-900/5 dark:focus:ring-white/5'
                  }`}
                />
                {error && (
                  <span className="text-[11px] text-red-500 font-light mt-1 text-center block">
                    Access Denied: Invalid credentials
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !passcode}
                className={`w-full py-3.5 text-[9px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border ${
                  passcode && !isLoading
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white hover:bg-white hover:text-neutral-900 dark:hover:bg-transparent dark:hover:text-white focus:outline-none'
                    : 'bg-neutral-100 text-neutral-400 border-neutral-100 dark:bg-neutral-900 dark:text-neutral-600 dark:border-neutral-900 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating...</span>
                  </span>
                ) : (
                  'Authorize Deck'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Embed shake keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </>
  );
}
