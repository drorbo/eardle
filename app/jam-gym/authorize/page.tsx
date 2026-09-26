export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createJamGymToken, isValidState, jamGymCallbackUrl } from "@/lib/jamGymSso";

/**
 * "Sign in with eardle" for Jam Gym (jam-gym.eardle.com). Jam Gym sends the person's browser here with a random `state`.
 * If they are signed in to eardle we send them straight back to Jam Gym with a signed token naming them; if not, they sign
 * in (or sign up) first and /signin brings them back here. Nothing about the person is shown or sent beyond their eardle
 * id and nickname: never the email or password hash. See docs/jam-gym-integration.md.
 */
export default async function AuthorizeJamGymPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const secret = process.env.JAMGYM_SSO_SECRET;
  if (!secret) notFound(); // the integration is switched off unless the shared secret is configured

  const { state } = await searchParams;
  if (!isValidState(state)) {
    return <Message title="That link is not valid">Go back to Jam Gym and choose &ldquo;Sign in with eardle&rdquo; again.</Message>;
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?next=${encodeURIComponent(`/jam-gym/authorize?state=${state}`)}`);
  }
  if (session.user.role !== "user") {
    // admins live in a separate table whose ids overlap with the users' ids, so an admin session must never be turned into a user id
    return <Message title="Admin accounts can&rsquo;t be used here">Sign out of the admin account, then sign in with your regular eardle account.</Message>;
  }

  const token = createJamGymToken(secret, {
    sub: session.user.id,
    name: session.user.nickname || session.user.name || undefined,
    state,
  });
  redirect(jamGymCallbackUrl(token));
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-text mb-2">{title}</h1>
        <p className="text-text-muted text-sm mb-6">{children}</p>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">Back to eardle</Link>
      </div>
    </div>
  );
}
