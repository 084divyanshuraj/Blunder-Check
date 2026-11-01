import React from "react";
import { DISCLAIMER } from "@/schemas/limits";

export function DisclaimerFooter() {
  return (
    <footer className="mt-auto py-6 border-t border-[#222533] text-xs text-[#8E95A5] text-center px-4 bg-[#08080C]">
      <div className="max-w-4xl mx-auto space-y-1">
        <p className="font-semibold text-[#F8FAFC]">
          ⚠️ {DISCLAIMER}
        </p>
        <p className="text-[11px] text-[#8E95A5]">
          Blunder Check is an evidence-gap evaluation assistant for research goals.
          Findings are potential signals from reviewed documents, not legal or authoritative advice.
        </p>
      </div>
    </footer>
  );
}
