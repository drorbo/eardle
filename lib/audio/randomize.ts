import { randomRoot, randomVoicing, VoicingId } from "./theory";
import { Category, ChordConfig, ExerciseConfig } from "@/types/exercise";

export interface PerformanceParams {
  root?: string;
  voicing?: VoicingId;
  delta?: number;
}

/**
 * Generates the random performance parameters (root/voicing/transposition) for
 * chord/scale/progression playback. Extracted so the Daily EarDle server can call
 * this once and persist the result, forcing every player to hear identical audio
 * — regular practice mode calls it fresh each time (existing per-session behavior).
 * note/interval categories are untouched — not used by Daily EarDle v1.
 */
export function generatePerformanceParams(category: Category, config: ExerciseConfig): PerformanceParams {
  if (category === "chord") {
    const c = config as ChordConfig;
    if (typeof c.inversion === "number") {
      // Inversion exercises: fixed inversion from config, no random voicing.
      // Always root at octave 3 so the highest inverted note stays in octave 4-5.
      return { root: randomRoot(3, 3), voicing: "close" };
    }
    // Regular chord exercises: random voicing, octave 3-4.
    const voicing = randomVoicing(c.type);
    const maxOctave = voicing === "close" ? 4 : 3;
    return { root: randomRoot(3, maxOctave), voicing };
  }
  if (category === "scale") {
    return { root: randomRoot(3, 4) };
  }
  if (category === "progression") {
    return { delta: Math.floor(Math.random() * 11) - 5 };
  }
  return {};
}
