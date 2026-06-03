"use client";

import * as React from "react";
const { useCallback } = React;
import { useTelemetryContext, TelemetryPayload } from "../context/TelemetryContext";

export interface BiometricTrackerHook {
  /**
   * React callback ref to register layout elements that should be monitored for cursor/touch evasion.
   * Usage: `<button ref={registerEvasiveElement("no-button")} ... />`
   */
  registerEvasiveElement: (id: string) => (node: HTMLElement | null) => void;
  
  /**
   * Manually record an evasion attempt. Use this for custom animation frame triggers
   * or physics engine state shifts (e.g., when the No button jumps).
   */
  logEvasionAttempt: (elementId: string, proximity: number, velocity: number) => void;
  
  /**
   * Manually record a specific element click.
   */
  logClick: (targetId: string, tagName: string, x: number, y: number) => void;
  
  /**
   * Retrieves the fully structured JSON telemetry data payload.
   */
  getTelemetryPayload: () => TelemetryPayload;
  
  /**
   * Reactive state parameters for dynamic UI dashboard widgets.
   */
  evasionCount: number;
  clickCount: number;
  activeTimeMs: number;
}

export const useBiometricTracker = (): BiometricTrackerHook => {
  const context = useTelemetryContext();

  const registerEvasiveElement = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      if (node) {
        context.registerProtectedElement(id, node);
      } else {
        context.deregisterProtectedElement(id);
      }
    },
    [context]
  );

  return {
    registerEvasiveElement,
    logEvasionAttempt: context.logEvasionAttempt,
    logClick: context.logClick,
    getTelemetryPayload: context.getTelemetryPayload,
    evasionCount: context.evasionCount,
    clickCount: context.clickCount,
    activeTimeMs: context.activeTimeMs,
  };
};
