"use client";

import { useState } from "react";

export default function WebLLMExperimentalPage() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="card">
      <h1>Experimental on-device explanations</h1>
      <p style={{ opacity: 0.85 }}>
        This repository does not ship large browser LLM weights by default. Enabling this toggle only reveals UI for a
        future WebLLM-class integration (summaries / explanations, never authoritative grading).
      </p>
      <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enable experimental panel
      </label>
      {enabled ? (
        <p style={{ marginTop: 16 }}>
          Placeholder panel — wire `@mlc-ai/web-llm` (or similar) here behind explicit model downloads.
        </p>
      ) : null}
    </div>
  );
}
