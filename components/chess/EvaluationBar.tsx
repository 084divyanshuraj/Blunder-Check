"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface EvaluationBarProps {
  score: number; // -5.0 to +5.0
  className?: string;
}

export function EvaluationBar({ score, className = "" }: EvaluationBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const clampedScore = Math.max(-5, Math.min(5, score));
  const fillPercent = Math.max(5, Math.min(95, ((clampedScore + 5) / 10) * 100));
  const formattedScore = `${clampedScore >= 0 ? "+" : ""}${clampedScore.toFixed(1)}`;
  const isPositive = clampedScore >= 0;

  return (
    <div
      className={`flex flex-col items-center select-none ${className}`}
      aria-label={`Information Position ${formattedScore} of range -5 to +5`}
    >
      {/* Desktop Vertical Eval Bar */}
      <div className="relative w-8 h-[340px] rounded-full overflow-hidden bg-[#111C2E] border border-[#263449] shadow-inner hidden md:flex flex-col justify-end">
        {/* Zero baseline tick */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-white/20 z-10 pointer-events-none"
          style={{ bottom: "50%" }}
          title="Neutral (0.0)"
        />

        {/* Animated fill rising from bottom */}
        <motion.div
          className={`w-full rounded-b-full transition-colors duration-300 ${
            isPositive ? "bg-[#14B8A6]" : "bg-[#EF4444]"
          }`}
          initial={{ height: shouldReduceMotion ? `${fillPercent}%` : "50%" }}
          animate={{ height: `${fillPercent}%` }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
          }}
        />

        {/* Dynamic score label positioned near boundary */}
        <div
          className="absolute left-0 right-0 flex justify-center text-[11px] font-bold font-mono tracking-tight text-white drop-shadow-md z-20 pointer-events-none transition-all duration-300"
          style={{
            bottom:
              fillPercent >= 50
                ? `${Math.max(10, fillPercent - 9)}%`
                : `${Math.min(90, fillPercent + 2)}%`,
          }}
        >
          {formattedScore}
        </div>
      </div>

      {/* Mobile Horizontal Bar */}
      <div className="md:hidden w-full h-7 rounded-full overflow-hidden bg-[#111C2E] border border-[#263449] relative flex items-center">
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white/20 z-10"
          style={{ left: "50%" }}
        />

        <motion.div
          className={`h-full ${isPositive ? "bg-[#14B8A6]" : "bg-[#EF4444]"}`}
          initial={{ width: shouldReduceMotion ? `${fillPercent}%` : "50%" }}
          animate={{ width: `${fillPercent}%` }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
          }}
        />

        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono text-white drop-shadow">
          {formattedScore}
        </span>
      </div>

      <div className="mt-2 text-[10px] text-[#94A3B8] font-mono uppercase tracking-wider text-center">
        Eval Bar
      </div>
    </div>
  );
}
