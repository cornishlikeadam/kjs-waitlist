"use client";

import * as React from "react";
const { createContext, useContext, useEffect, useRef, useState } = React;

// --- TELEMETRY TYPES ---

export interface Coordinate {
  x: number;
  y: number;
  t: number; // timestamp
}

export interface MousePathPoint extends Coordinate {
  vx: number; // velocity x (px/ms)
  vy: number; // velocity y (px/ms)
  v: number;  // absolute velocity (px/ms)
}

export interface TouchVector {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs: number;
  velocity: number; // px/ms
}

export interface EvasionAttempt {
  elementId: string;
  timestamp: number;
  proximity: number; // closest distance achieved in px
  approachVelocity: number; // velocity of approach in px/ms
}

export interface ClickInteraction {
  targetId: string;
  tagName: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface ScrollMetric {
  maxScrollDepth: number;
  scrollEventsCount: number;
}

export interface TelemetryPayload {
  session: {
    startTime: string;
    endTime: string;
    totalTimeMs: number;
    activeTimeMs: number;
    deviceType: "mobile" | "tablet" | "desktop";
    screenSize: { width: number; height: number };
    userAgent: string;
  };
  interactions: {
    clicks: ClickInteraction[];
    evasions: EvasionAttempt[];
    scroll: ScrollMetric;
  };
  biometrics: {
    mousePaths: MousePathPoint[];
    touchVectors: TouchVector[];
    averageVelocity: number; // px/sec
    maxVelocity: number; // px/sec
  };
}

export interface TelemetryContextType {
  registerProtectedElement: (id: string, element: HTMLElement) => void;
  deregisterProtectedElement: (id: string) => void;
  logEvasionAttempt: (elementId: string, proximity: number, velocity: number) => void;
  logClick: (targetId: string, tagName: string, x: number, y: number) => void;
  getTelemetryPayload: () => TelemetryPayload;
  // Slow-moving state variables for components to optionally subscribe to (e.g. for dashboard metrics)
  evasionCount: number;
  clickCount: number;
  activeTimeMs: number;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

// --- PROVIDER ---

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session details
  const startTimeRef = useRef<number>(Date.now());
  const activeTimeRef = useRef<number>(0);
  const lastActiveTimestampRef = useRef<number>(Date.now());
  const isTabActiveRef = useRef<boolean>(true);

  // Stats stored in Refs to bypass React re-render cycles for 60+ FPS high-frequency inputs
  const mousePathRef = useRef<MousePathPoint[]>([]);
  const lastMousePointRef = useRef<Coordinate | null>(null);
  const touchVectorsRef = useRef<TouchVector[]>([]);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  
  const clicksRef = useRef<ClickInteraction[]>([]);
  const evasionsRef = useRef<EvasionAttempt[]>([]);
  
  const maxScrollRef = useRef<number>(0);
  const scrollCountRef = useRef<number>(0);

  // Velocity accumulation
  const maxVelocityRef = useRef<number>(0); // px/ms
  const velocitySamplesRef = useRef<number[]>([]);

  // DOM elements registered for automated evasion checking
  const protectedElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  // Track in-progress approaches to protected elements to calculate entry parameters
  const approachingStateRef = useRef<Map<string, { entryTime: number; entryVelocity: number; minDistance: number }>>(new Map());

  // Slow-moving react state for real-time UI counters (updates on page changes, clicks, evasions)
  const [evasionCount, setEvasionCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [activeTimeMs, setActiveTimeMs] = useState(0);

  // Determine device type dynamically
  const getDeviceType = (): "mobile" | "tablet" | "desktop" => {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  };

  // 1. Time Tracking Loop
  useEffect(() => {
    lastActiveTimestampRef.current = Date.now();
    const interval = setInterval(() => {
      if (isTabActiveRef.current && typeof document !== "undefined" && document.visibilityState === "visible") {
        const now = Date.now();
        const delta = now - lastActiveTimestampRef.current;
        activeTimeRef.current += delta;
        lastActiveTimestampRef.current = now;
        
        // Sync activeTimeState every 1 second (low frequency update)
        setActiveTimeMs(activeTimeRef.current);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 2. Tab/Window state handlers
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        isTabActiveRef.current = true;
        lastActiveTimestampRef.current = Date.now();
      } else {
        isTabActiveRef.current = false;
        // Accumulate final time slice
        activeTimeRef.current += Date.now() - lastActiveTimestampRef.current;
        setActiveTimeMs(activeTimeRef.current);
      }
    };

    const handleFocus = () => {
      isTabActiveRef.current = true;
      lastActiveTimestampRef.current = Date.now();
    };

    const handleBlur = () => {
      isTabActiveRef.current = false;
      activeTimeRef.current += Date.now() - lastActiveTimestampRef.current;
      setActiveTimeMs(activeTimeRef.current);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // 3. Register Protected Elements for Automated Evasion Detection
  const registerProtectedElement = (id: string, element: HTMLElement) => {
    protectedElementsRef.current.set(id, element);
  };

  const deregisterProtectedElement = (id: string) => {
    protectedElementsRef.current.delete(id);
    approachingStateRef.current.delete(id);
  };

  // Manual Evasion Logging (can be called by component physics or hook)
  const logEvasionAttempt = (elementId: string, proximity: number, velocity: number) => {
    const exists = evasionsRef.current.some(
      (ev) => ev.elementId === elementId && Date.now() - ev.timestamp < 300
    );
    if (exists) return; // Prevent duplicate logs for the same evasion event within 300ms

    const evasion: EvasionAttempt = {
      elementId,
      timestamp: Date.now(),
      proximity: parseFloat(proximity.toFixed(2)),
      approachVelocity: parseFloat(velocity.toFixed(4)),
    };
    evasionsRef.current.push(evasion);
    setEvasionCount((c) => c + 1);
  };

  // Click tracking helper
  const logClick = (targetId: string, tagName: string, x: number, y: number) => {
    clicksRef.current.push({
      targetId,
      tagName,
      x,
      y,
      timestamp: Date.now(),
    });
    setClickCount((c) => c + 1);
  };

  // 4. Capture & Calculate Interaction Metrics
  useEffect(() => {
    // A. Mouse movements
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const x = e.clientX;
      const y = e.clientY;

      let vx = 0;
      let vy = 0;
      let v = 0;

      if (lastMousePointRef.current) {
        const dx = x - lastMousePointRef.current.x;
        const dy = y - lastMousePointRef.current.y;
        const dt = now - lastMousePointRef.current.t;

        if (dt > 0) {
          vx = dx / dt;
          vy = dy / dt;
          v = Math.sqrt(dx * dx + dy * dy) / dt; // px/ms
        }
      }

      // Track rolling velocity peak and averages
      if (v > 0) {
        velocitySamplesRef.current.push(v);
        if (v > maxVelocityRef.current) {
          maxVelocityRef.current = v;
        }
      }

      // DOWN-SAMPLING LOGIC: Only store coordinates if distance is > 15px OR elapsed time is > 100ms
      const lastSaved = mousePathRef.current[mousePathRef.current.length - 1];
      if (
        !lastSaved ||
        Math.sqrt((x - lastSaved.x) ** 2 + (y - lastSaved.y) ** 2) > 15 ||
        now - lastSaved.t > 100
      ) {
        mousePathRef.current.push({
          x,
          y,
          t: now,
          vx: parseFloat(vx.toFixed(4)),
          vy: parseFloat(vy.toFixed(4)),
          v: parseFloat(v.toFixed(4)),
        });

        // Limit local buffer memory size to 1000 points
        if (mousePathRef.current.length > 1000) {
          mousePathRef.current.shift();
        }
      }

      lastMousePointRef.current = { x, y, t: now };

      // --- AUTOMATED PROXIMITY & EVASION CHECKS ---
      protectedElementsRef.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
        const threshold = 75; // px trigger threshold

        const state = approachingStateRef.current.get(id);

        if (dist < threshold) {
          if (!state) {
            // Entered Proximity Zone: Record entry variables
            approachingStateRef.current.set(id, {
              entryTime: now,
              entryVelocity: v,
              minDistance: dist,
            });
          } else {
            // Move within proximity zone: Update minimum proximity achievement
            state.minDistance = Math.min(state.minDistance, dist);
            approachingStateRef.current.set(id, state);
          }
        } else {
          if (state) {
            // Exited Proximity Zone: Log the evasion attempt as user backed out/evaded
            logEvasionAttempt(id, state.minDistance, state.entryVelocity);
            approachingStateRef.current.delete(id);
          }
        }
      });
    };

    // B. Touch tracking (Mobile/Tablet velocity vectors)
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          t: Date.now(),
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Monitor touch vectors for proximity / evasions
      const touch = e.touches[0];
      const start = touchStartRef.current;
      if (touch && start) {
        const x = touch.clientX;
        const y = touch.clientY;
        const now = Date.now();
        const dt = now - start.t;
        const dist = Math.sqrt((x - start.x) ** 2 + (y - start.y) ** 2);
        const v = dt > 0 ? dist / dt : 0;

        // Process proximity against protected elements
        protectedElementsRef.current.forEach((el, id) => {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const touchDist = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
          const threshold = 75;

          const state = approachingStateRef.current.get(id);

          if (touchDist < threshold) {
            if (!state) {
              approachingStateRef.current.set(id, {
                entryTime: now,
                entryVelocity: v,
                minDistance: touchDist,
              });
            } else {
              state.minDistance = Math.min(state.minDistance, touchDist);
              approachingStateRef.current.set(id, state);
            }
          }
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const start = touchStartRef.current;
      if (start && e.changedTouches[0]) {
        const touch = e.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;
        const duration = Date.now() - start.t;
        const dist = Math.sqrt((endX - start.x) ** 2 + (endY - start.y) ** 2);
        const velocity = duration > 0 ? dist / duration : 0;

        touchVectorsRef.current.push({
          startX: parseFloat(start.x.toFixed(1)),
          startY: parseFloat(start.y.toFixed(1)),
          endX: parseFloat(endX.toFixed(1)),
          endY: parseFloat(endY.toFixed(1)),
          durationMs: duration,
          velocity: parseFloat(velocity.toFixed(4)),
        });

        // Trigger evasion log if a touch ended while inside proximity
        protectedElementsRef.current.forEach((el, id) => {
          const state = approachingStateRef.current.get(id);
          if (state) {
            logEvasionAttempt(id, state.minDistance, state.entryVelocity);
            approachingStateRef.current.delete(id);
          }
        });

        touchStartRef.current = null;
      }
    };

    // C. Scroll tracking
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      if (currentScroll > maxScrollRef.current) {
        maxScrollRef.current = currentScroll;
      }
      scrollCountRef.current += 1;
    };

    // D. Click event tracking
    const handleClick = (e: MouseEvent) => {
      let targetId = "unknown";
      let tagName = "unknown";
      if (e.target instanceof HTMLElement) {
        targetId = e.target.id || e.target.className || "unidentified";
        tagName = e.target.tagName.toLowerCase();
      }
      logClick(targetId, tagName, e.clientX, e.clientY);
    };

    // Register event listeners passively
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  // 5. Structure payload for database upload
  const getTelemetryPayload = (): TelemetryPayload => {
    // Add remaining tab active slice before compiling payload
    const now = Date.now();
    const finalActiveTime = isTabActiveRef.current
      ? activeTimeRef.current + (now - lastActiveTimestampRef.current)
      : activeTimeRef.current;

    // Calculate velocity stats (convert from px/ms to px/sec)
    const samples = velocitySamplesRef.current;
    const avgVelocityPxMs = samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
    
    return {
      session: {
        startTime: new Date(startTimeRef.current).toISOString(),
        endTime: new Date(now).toISOString(),
        totalTimeMs: now - startTimeRef.current,
        activeTimeMs: finalActiveTime,
        deviceType: getDeviceType(),
        screenSize: {
          width: typeof window !== "undefined" ? window.innerWidth : 0,
          height: typeof window !== "undefined" ? window.innerHeight : 0,
        },
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "SSR",
      },
      interactions: {
        clicks: clicksRef.current,
        evasions: evasionsRef.current,
        scroll: {
          maxScrollDepth: maxScrollRef.current,
          scrollEventsCount: scrollCountRef.current,
        },
      },
      biometrics: {
        mousePaths: mousePathRef.current,
        touchVectors: touchVectorsRef.current,
        averageVelocity: parseFloat((avgVelocityPxMs * 1000).toFixed(2)),
        maxVelocity: parseFloat((maxVelocityRef.current * 1000).toFixed(2)),
      },
    };
  };

  return (
    <TelemetryContext.Provider
      value={{
        registerProtectedElement,
        deregisterProtectedElement,
        logEvasionAttempt,
        logClick,
        getTelemetryPayload,
        evasionCount,
        clickCount,
        activeTimeMs,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

// Custom Hook to consume Telemetry Context internally (used in Provider file for exports structure)
export const useTelemetryContext = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetryContext must be used within a TelemetryProvider");
  }
  return context;
};
