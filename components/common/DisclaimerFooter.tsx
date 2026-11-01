import React from "react";
import { DISCLAIMER } from "@/schemas/limits";

export function DisclaimerFooter() {
  return (
    <footer className="mt-auto py-6 border-t border-[#263449] text-xs text-[#94A3B8] text-center px-4 bg-[#0B1220]">
      <div className="max-w-4xl mx-auto space-y-1">
        <p className="font-semibold text-[#F8FAFC]">
          ⚠️ {DISCLAIMER}
        </p>
        <p className="text-[11px] text-[#94A3B8]">
          Blunder Check is an evidence-gap evaluation assistant for research goals.
          Findings are potential signals from reviewed documents, not legal or authoritative advice.
        </p>
      </div>
    </footer>
  );
}
