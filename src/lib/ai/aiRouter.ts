// ============================================================
// AI ROUTER — 100% local, NO external API calls.
// Routes every question straight to the offline Sub AI Brain
// (src/lib/ai/subAiBrain.ts), which is a hand-built knowledge
// base + keyword-matching engine. Nothing here ever leaves
// the browser or calls any third-party service.
// ============================================================

import type { AIMode } from "./types";
import { getSubAIResponse, KB_SIZE } from "./subAiBrain";

interface AIRequest {
  message: string;
  mode: AIMode;
  history: {
    role: string;
    content: string;
  }[];
  user: {
    name: string;
    level: number;
    xp: number;
    streak: number;
  };
}

// Small mode-flavored intro/outro added around the local KB answer so the
// same underlying knowledge still feels tailored to the selected mode,
// without needing any external model.
function wrapForMode(mode: AIMode, text: string, userName: string): string {
  switch (mode) {
    case "debug":
      return `🐛 **Debug mode** — let's trace through this together, ${userName}.\n\n${text}\n\n💡 If you can paste the exact error message or the line it points to, I can help pin down the fix faster.`;
    case "interview":
      return `🎤 **Interview practice** — here's the concept, ${userName}. In a real interview, be ready to explain it out loud and write the code from scratch:\n\n${text}\n\n👉 Want to turn this into a mock question? Head to the **Interview** tab in the sidebar for a full live practice round.`;
    case "project":
      return `🚀 **Project mode** — here's the building block you asked about, ${userName}:\n\n${text}\n\n🏗️ Need a full project idea using this? Check the **Projects** tab for ready-made, step-by-step builds.`;
    case "teacher":
    default:
      return text;
  }
}

export async function getSmartResponse(data: AIRequest) {
  // No network call, no API key, no delay needed — but a tiny artificial
  // pause makes the "thinking..." state feel natural in the UI.
  await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 350));

  try {
    const result = getSubAIResponse(data.message);
    const text = wrapForMode(data.mode, result.text, data.user.name);

    return {
      text,
      source: "bitzy" as const,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error("Sub AI Brain error:", error);
    return {
      text: "⚠️ Sub AI hit a snag processing that. Please try rephrasing your question!",
      source: "bitzy" as const,
      confidence: 0,
    };
  }
}

// Exposed for debugging / showing "trained on N topics" in the UI if desired.
export { KB_SIZE };