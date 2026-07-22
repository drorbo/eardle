"use client";

import { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const user = session?.user;

  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname ?? user.name ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
    }
  }, [user]);

  if (status === "loading" || !user) return null;

  const previewSrc = avatarUrl || (user.id ? dicebearUrl(user.id) : null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: nickname.trim() || undefined,
        avatarUrl: avatarUrl.trim() || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save.");
    } else {
      // Refresh session token so Navbar picks up the new values
      await update();
      setMessage("Profile updated!");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-text-faint hover:text-text-muted transition text-sm">
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-text mb-6">Edit Profile</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-2xl p-8 space-y-6 border border-border-subtle surface-elevated"
      >
        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-3">
          {previewSrc && (
            <Image
              src={previewSrc}
              alt="Avatar preview"
              width={80}
              height={80}
              className="rounded-full bg-surface-2"
              unoptimized
            />
          )}
          <p className="text-xs text-text-subtle">
            {avatarUrl ? "Custom avatar" : "Generated avatar (default)"}
          </p>
        </div>

        <div>
          <label className="field-label">Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="field-input"
            placeholder="Your display name"
            maxLength={30}
          />
        </div>

        <div>
          <label className="field-label">Avatar URL</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="field-input"
            placeholder="https://… (leave blank for generated avatar)"
          />
          <p className="text-xs text-text-faint mt-1.5">
            Paste any image URL, or leave blank to use your auto-generated avatar
          </p>
        </div>

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        {message && <p className="text-green-600 dark:text-green-400 text-sm">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <p className="text-center text-sm text-text-faint mt-4">
        Signed in as <span className="text-text-muted">{user.email}</span>
      </p>
    </div>
  );
}
