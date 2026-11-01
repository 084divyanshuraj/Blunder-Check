import React from "react";
import { DISCLAIMER } from "@/schemas/limits";

export function DisclaimerFooter() {
  return (
    <footer className="mt-auto py-6 border-t border-border/60 text-xs text-muted/80 text-center px-4 bg-surface/30">
      <div className="max-w-4xl mx-auto space-y-1">
        <p className="font-medium text-slate-300">
          ⚠️ {DISCLAIMER}
        </p>
        <p className="text-[11px] text-muted">
          Blunder Check is an evidence-gap evaluation assistant for research goals.
          Findings are potential signals from reviewed documents, not legal or authoritative advice.
        </p>
      </div>
    </footer>
  );
}

