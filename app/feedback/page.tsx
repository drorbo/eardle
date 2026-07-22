"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";

export default function FeedbackPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [name, setName] = useState(user?.nickname ?? user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), message }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to send. Please try again.");
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-xl font-bold text-text mb-2">Thank you!</h2>
          <p className="text-text-muted text-sm">
            Your feedback means a lot. We read every message and use it to make Eardle better.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <p className="text-4xl mb-3">💬</p>
        <h1 className="text-2xl font-bold text-text mb-2">Share your thoughts</h1>
        <p className="text-text-muted text-sm leading-relaxed">
          Love something? Have a suggestion? Found a bug? We'd love to hear it all.
          Honest feedback — both praise and criticism — helps us build a better app.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-2xl p-8 space-y-5 border border-border-subtle surface-elevated"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Name <span className="text-text-faint">(optional)</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="field-label">Email <span className="text-text-faint">(optional)</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
              placeholder="For follow-ups"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            className="field-input resize-none"
            placeholder="Tell us what you think — what's great, what's missing, what could be better…"
          />
        </div>

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send Feedback"}
        </button>
      </form>
    </div>
  );
}
