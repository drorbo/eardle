# Heads-up for the eardle agent: Jam Gym also runs on the production server

Written 2026-09-21, updated the same day when Jam Gym gained user-saved tracks (it now has a small database), and again
2026-09-30 for the 2026-09 security audit's server-level fixes (SSH, the shared Cloudflare-only nginx restriction).
**eardle's production server (`57.129.12.248`) now also hosts a second, unrelated site,
Jam Gym, at https://jam-gym.eardle.com.** It shares the host, the nginx process and the TLS certificate with eardle,
so read this before touching any of those. Nothing in the eardle repo or in eardle's own containers was changed to
make this work.

Jam Gym is a separate project (a music practice tool: a small Node app with its own SQLite file, no secrets of its own beyond one shared sign-in secret; people's accounts come from eardle, see below):

- Repo: https://github.com/drorbo/jam-gym (public). Local copy: `C:\Users\Public\Documents\jam gym`.
- Its own deployment doc, with everything below in more detail: `docs/deployment.md` in that repo.
- Deploy it with `bash scripts/deploy-prod.sh` from that repo. You should never need to redeploy it as part of an
  eardle deploy, and `scripts/deploy-prod.sh` in *this* repo does not touch it.

## What is shared, and what that means for eardle work

| Shared thing | Where | What to be careful about |
| --- | --- | --- |
| **nginx** (one process for both sites) | `/etc/nginx/`. Jam Gym is its own file: `sites-available/jam-gym.eardle.com.conf`, symlinked from `sites-enabled/` | **Always run `sudo nginx -t` before `systemctl reload nginx`.** A syntax error in *either* site's file stops the reload and can take *both* sites down on a restart. Do not delete or edit Jam Gym's file or symlink when changing `eardle.com.conf`. |
| **`/etc/nginx/cloudflare-ips.conf`** | Included from both sites' `:443` server blocks | Restricts direct HTTPS access to Cloudflare's published ranges (2026-09 audit, finding M-1): without it, anyone who knows the server's IP can bypass Cloudflare — and every rate limit and bot protection it does — by talking to nginx directly. Its one canonical, version-controlled copy is `deploy/host-nginx/cloudflare-ips.conf` in the jam-gym repo (this repo does not track its own nginx config in git); update there and copy over. Port 80 (redirect + ACME challenge) is deliberately not restricted by it. |
| **SSH into the host** (`ubuntu@57.129.12.248`) | `/etc/ssh/sshd_config.d/` | Key-only (`PasswordAuthentication no`, set in `50-cloud-init.conf` — that file loads before `60-cloudimg-settings.conf` and wins, so fix it there, not the other one, if this is ever "yes" again) and `fail2ban` is installed and enabled on `sshd`. Both affect eardle too: this is the one login path onto the box either app's containers live on. |
| **TLS certificate** | `/etc/nginx/ssl/eardle.com/fullchain.pem` and `privkey.pem` (Cloudflare Origin CA) | It is a **wildcard** (`*.eardle.com` + `eardle.com`), and Jam Gym uses the same files. If you ever renew, rotate or replace it, keep the `*.eardle.com` SAN and the same paths, or `jam-gym.eardle.com` breaks. |
| **Default HTTPS/HTTP site** | `eardle.com.conf` is loaded first, so it is nginx's default server | Unchanged by this work. Requests for any hostname nginx doesn't recognise still fall through to eardle, as before. |
| **Cloudflare zone** for `eardle.com` | Cloudflare dashboard | `jam-gym.eardle.com` is a subdomain in the same zone. Zone-wide settings (SSL/TLS mode must stay "Full" or "Full (strict)", never "Flexible"; any wildcard or redirect rules) affect both sites. |
| **Host resources** | 3.7 GB RAM, 38 GB disk, shared with eardle's Postgres | Jam Gym uses about 20 MB of RAM (hard cap 192 MB), about 200 MB of disk for its image, and a small data volume (a few MB, plus 14 daily backups). Negligible, but it is there. |

## What is separate

- **Docker**: Jam Gym is its **own Compose project** named `jam-gym`, in `~/drorbo/jam-gym` (not inside
  `~/drorbo/eardle`). One container, `jam-gym-web-1` (image `jam-gym-web`, `node:24-alpine`), on its own network.
  eardle's `eardle-app-1` / `eardle-db-1` and the `eardle_postgres_data` volume are not involved.
- **Data**: Jam Gym stores users' saved tracks and likes in its own named volume, **`jam-gym_data`** (SQLite, plus daily
  backups in `/data/backups`). It is real user data with no other copy. See the warning below.
- **Ports**: eardle is `127.0.0.1:3000`. Jam Gym is **`127.0.0.1:3100`** (loopback only). Do not reuse 3100.
- **Code, images, logs**: separate directory; nginx logs are `/var/log/nginx/jam-gym.eardle.com.{access,error}.log`.
- **App level**: no shared cookies (eardle's are host-only), no shared database. The two apps have separate `.env` files but share one
  value, the SSO secret (`JAMGYM_SSO_SECRET` here, `EARDLE_SSO_SECRET` there). **Accounts are shared, though: Jam Gym signs people in
  with their eardle account.** That integration lives in this repo under `app/jam-gym/`, `lib/jamGymSso.ts` and `lib/safeNext.ts`,
  and is described in `docs/jam-gym-integration.md`. Read it before changing eardle sign-in, `users`, or `NEXTAUTH_SECRET`.

## Commands that would hurt Jam Gym as a side effect

Scoped commands are fine: `cd ~/drorbo/eardle && docker compose -f docker-compose.yml ...` only ever touches eardle.
Avoid the host-wide ones, or re-run Jam Gym's deploy afterwards:

- **`docker volume prune`, `docker system prune --volumes`, `docker volume rm jam-gym_data`. These permanently delete
  Jam Gym's users' tracks and likes.** A volume is only safe from prune while a container uses it, so do not prune
  volumes on this host at all.
- `docker system prune -a`, `docker container prune`, `docker stop $(docker ps -q)`, `docker rm -f $(docker ps -aq)`,
  `docker rmi $(docker images -q)`. These would stop or delete `jam-gym-web-1` and its image.
- `sudo systemctl stop nginx`, or replacing `/etc/nginx/nginx.conf` or `sites-enabled/` wholesale.
- Rebooting is fine: both stacks use `restart: always` and nginx starts on boot.

## Quick health check for both sites

```bash
# eardle
curl -s -o /dev/null -w 'eardle   %{http_code}\n' https://eardle.com/
# Jam Gym (the manifest exists only on Jam Gym, so a 200 proves the request reached it and not eardle)
curl -s -o /dev/null -w 'jam-gym  %{http_code}\n' https://jam-gym.eardle.com/samples/manifest.json
curl -s https://jam-gym.eardle.com/api/health          # {"ok":true,"schema":1}
ssh eardle-prod 'docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"; sudo nginx -t'
```

Expected containers: `eardle-app-1` (3000), `eardle-db-1`, `jam-gym-web-1` (3100). Expected both `200`.

## Undoing the Jam Gym nginx site (only if it ever causes trouble)

```bash
sudo rm /etc/nginx/sites-enabled/jam-gym.eardle.com.conf   # disable
sudo nginx -t && sudo systemctl reload nginx                # eardle is unaffected
# optional: cd ~/drorbo/jam-gym && docker compose -f docker-compose.yml down   # keeps the data volume; never add -v
```

Jam Gym's moderation and backups are commands run inside its own container, for example
`docker exec jam-gym-web-1 node server/admin.js stats` (see `docs/deployment.md` in its repo). eardle never needs them.

Removing the symlink is enough to make eardle behave exactly as it did before Jam Gym existed; `jam-gym.eardle.com`
would then fall through to eardle's site.
