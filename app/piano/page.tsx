import type { Metadata } from "next";
import { KeyboardPlayground } from "@/components/piano/KeyboardPlayground";

export const metadata: Metadata = {
  title: "Keyboard Playground — Eardle",
  description: "A free-play piano keyboard to experiment with sounds — no exercises, no scoring.",
};

export default function PianoPage() {
  return <KeyboardPlayground />;
}
