/**
 * The real visitor's IP address, as Cloudflare reports it — for rate limiting only, never for anything that assumes
 * it uniquely identifies a person (many people can share one IP, and one person can have many).
 *
 * Reads only `CF-Connecting-IP`, not `X-Forwarded-For`: nginx's `$proxy_add_x_forwarded_for` appends the connecting
 * peer to whatever X-Forwarded-For the client already sent, so its *first* entry — the one naive code tends to
 * read — is exactly what an attacker gets to choose. CF-Connecting-IP has no such problem: Cloudflare sets it at
 * their edge from the real TCP connection and it cannot be spoofed by anyone talking to Cloudflare over the public
 * internet. It is trustworthy here specifically because nginx accepts HTTPS connections only from Cloudflare's own
 * published IP ranges (see JAM-GYM-ON-THIS-SERVER.md and the sibling fix in the jam-gym repo) — before that, anyone
 * could bypass Cloudflare and talk to the origin directly, forging this header themselves.
 *
 * Returns null off Cloudflare (local development, or if that restriction is ever removed) rather than a
 * spoofable fallback — callers should treat null as "cannot rate-limit by IP", not as a shared "unknown" bucket.
 */
export function clientIp(req: Request): string | null {
  const cf = req.headers.get("cf-connecting-ip");
  return cf && cf.trim() ? cf.trim() : null;
}
