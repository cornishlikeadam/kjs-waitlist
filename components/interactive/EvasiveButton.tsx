"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useBiometricTracker } from "../../hooks/useBiometricTracker";

interface EvasiveButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const EvasiveButton: React.FC<EvasiveButtonProps> = ({
  children,
  className = "",
  onClick,
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { registerEvasiveElement, logEvasionAttempt } = useBiometricTracker();

  // Handle both internal ref assignment and biometric registration
  const refCallback = useCallback(
    (node: HTMLButtonElement | null) => {
      buttonRef.current = node;
      registerEvasiveElement("no-button")(node);
    },
    [registerEvasiveElement]
  );

  // Auto-reset position back to initial center coordinates after 2 seconds
  useEffect(() => {
    if (position.x === 0 && position.y === 0) return;

    const timer = setTimeout(() => {
      setPosition({ x: 0, y: 0 });
    }, 2000);

    return () => clearTimeout(timer);
  }, [position]);

  // General move calculation triggered on hover, touch, or click attempt
  const moveButton = useCallback((clientX: number, clientY: number) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const winW = typeof window !== "undefined" ? window.innerWidth : 800;
    const winH = typeof window !== "undefined" ? window.innerHeight : 600;
    const pad = 24;

    // Retrieve initial layout position (static position without relative offset translate)
    const initialLeft = rect.left - position.x;
    const initialTop = rect.top - position.y;

    // Center of the button in absolute viewport coordinates
    const bx = rect.left + rect.width / 2;
    const by = rect.top + rect.height / 2;

    let dx = bx - clientX;
    let dy = by - clientY;

    // If coordinates are exact, randomize direction
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      const angle = Math.random() * Math.PI * 2;
      dx = Math.cos(angle) * 10;
      dy = Math.sin(angle) * 10;
    }

    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Unit vectors
    const ux = dx / (distance || 1);
    const uy = dy / (distance || 1);

    // Dynamic random variance to jump in varying directions
    const randomAngleOffset = (Math.random() - 0.5) * 1.2; // +/- 35 degrees variance
    const rx = ux * Math.cos(randomAngleOffset) - uy * Math.sin(randomAngleOffset);
    const ry = ux * Math.sin(randomAngleOffset) + uy * Math.cos(randomAngleOffset);

    // Soft, short push distance (75px to 100px) so the button evades gently
    const pushDistance = 75 + Math.random() * 25; 
    let targetX = position.x + rx * pushDistance;
    let targetY = position.y + ry * pushDistance;

    // Calculate proposed absolute viewport coordinates
    let nextLeft = initialLeft + targetX;
    let nextTop = initialTop + targetY;

    // Viewport collision bounce logic
    if (nextLeft < pad) {
      targetX = position.x + Math.abs(rx) * pushDistance;
      nextLeft = initialLeft + targetX;
    } else if (nextLeft + rect.width > winW - pad) {
      targetX = position.x - Math.abs(rx) * pushDistance;
      nextLeft = initialLeft + targetX;
    }

    if (nextTop < pad) {
      targetY = position.y + Math.abs(ry) * pushDistance;
      nextTop = initialTop + targetY;
    } else if (nextTop + rect.height > winH - pad) {
      targetY = position.y - Math.abs(ry) * pushDistance;
      nextTop = initialTop + targetY;
    }

    // Hard clamp proposed coordinates to keep button fully visible on screen
    const clampedLeft = Math.max(pad, Math.min(winW - rect.width - pad, nextLeft));
    const clampedTop = Math.max(pad, Math.min(winH - rect.height - pad, nextTop));

    // Resolve back to motion offsets relative to initial layout position
    const clampedX = clampedLeft - initialLeft;
    const clampedY = clampedTop - initialTop;

    setPosition({ x: clampedX, y: clampedY });
    
    // Log telemetry event
    logEvasionAttempt("no-button", distance || 5, 0.85);
  }, [position, logEvasionAttempt]);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const bx = rect.left + rect.width / 2;
      const by = rect.top + rect.height / 2;
      const dist = Math.sqrt((bx - clientX) ** 2 + (by - clientY) ** 2);
      if (dist < 75) {
        moveButton(clientX, clientY);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleMove(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [moveButton]);

  const handleInteraction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let clientX = 0;
    let clientY = 0;
    
    if ('clientX' in e && typeof (e as any).clientX === 'number') {
      clientX = (e as any).clientX;
      clientY = (e as any).clientY;
    } else if ('touches' in e && (e as any).touches?.[0]) {
      clientX = (e as any).touches[0].clientX;
      clientY = (e as any).touches[0].clientY;
    } else if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    moveButton(clientX, clientY);
  };

  // Dampened spring profile: mass 0.8, stiffness 100, damping 22
  return (
    <motion.button
      ref={refCallback}
      id="no-button"
      onClick={handleInteraction}
      onPointerDown={handleInteraction}
      onTouchStart={handleInteraction}
      onMouseEnter={handleInteraction}
      animate={{ x: position.x, y: position.y }}
      transition={{
        type: "spring",
        mass: 0.8,
        stiffness: 100,
        damping: 22,
      }}
      className={`select-none cursor-pointer focus:outline-none ${className}`}
      style={{ touchAction: "none" }}
    >
      {children}
    </motion.button>
  );
};
