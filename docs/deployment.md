# Deployment

## Server

- **Host**: `57.129.12.248` — production, serving `https://eardle.com` (Cloudflare → nginx → Docker on this host).
- **SSH user**: `ubuntu`
- **SSH access**: key-based only. No password auth is ever used against this server — see "SSH access" below.
- **Repo location on server**: `~/drorbo/eardle` (i.e. `/home/ubuntu/drorbo/eardle`), tracking the `main` branch.
- **Runtime**: Docker Compose — `db` (`postgres:16-alpine`) and `app` (this repo's `Dockerfile`) services.
  **Production must use `docker compose -f docker-compose.yml` only.** Never let
  `docker-compose.override.yml` apply on the server — it's dev-only (exposes a
  different Postgres port, etc.) and was previously the cause of a production
  misconfiguration incident.

## Branching / deploy flow

Day-to-day development happens on `dev`. `main` is what the server tracks and
deploys from. To ship a change:

1. Land your work on `dev` (fast-forward merge from a feature branch, as usual).
2. `git push origin dev`
3. `git push origin dev:main` — this updates the branch the server pulls from.
4. Deploy on the server — either the manual steps below, or `bash scripts/deploy-prod.sh`.

## SSH access

**The private key is intentionally not stored in this repository** (or anywhere
under version control). It's expected to live at `~/.ssh/eardle_deploy` on
whichever machine is doing the deploying, with a matching entry in
`~/.ssh/config`:

```
Host eardle-prod
    HostName 57.129.12.248
    User ubuntu
    IdentityFile ~/.ssh/eardle_deploy
    IdentitiesOnly yes
```

With that in place, `ssh eardle-prod` connects directly — nothing else needs
to reference the IP or key path.

**If this key is missing** (new machine, fresh environment, etc.): generate a
new ed25519 keypair (`ssh-keygen -t ed25519 -f ~/.ssh/eardle_deploy`) and add
its **public** half to `~/.ssh/authorized_keys` for the `ubuntu` user on the
server. That last step requires *some* existing access to the server —
either an already-authorized key, or the account owner adding it themselves
through their hosting provider's console. **Never authenticate with a
plaintext password, even if one is offered** — set up key-based access
instead and, if a password was ever shared in plaintext, treat it as
compromised and have it rotated.

## Manual deploy steps

```bash
ssh eardle-prod "cd ~/drorbo/eardle && git pull origin main"
ssh eardle-prod "cd ~/drorbo/eardle && docker compose -f docker-compose.yml build app"
ssh eardle-prod "cd ~/drorbo/eardle && docker compose -f docker-compose.yml up -d app"
ssh eardle-prod "cd ~/drorbo/eardle && docker compose -f docker-compose.yml ps"
ssh eardle-prod "docker logs eardle-app-1 --tail 15"
curl -s -o /dev/null -w '%{http_code}\n' https://eardle.com/
```

Or just run `bash scripts/deploy-prod.sh`, which does all of the above plus a
couple of route checks.

## Other operational notes

- **Admin login**: seeded from the `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars on
  the server (in its `.env` / `eardle.env` — not committed, not documented
  here). The app refuses to seed a weak default if these are unset.
- **nginx config**: `/etc/nginx/sites-available/eardle.com.conf` on the
  server; proxies to `127.0.0.1:3000`.
- **TLS**: Cloudflare Origin CA certificate installed at
  `/etc/nginx/ssl/eardle.com/` on the server (cert + key, not in this repo).
  Cloudflare's SSL/TLS mode for the zone should be "Full" or "Full (strict)".
- **DB migrations**: run automatically on container start
  (`npx tsx scripts/migrate.ts`, part of the `start` script in
  `package.json`) — no separate manual migration step needed as part of a
  normal deploy.
- **Rebuilding vs. just restarting**: a code change requires the `build`
  step (rebuilds the image); an env var or `docker-compose.yml` change alone
  can sometimes just need `up -d` again, but rebuilding is always safe and is
  what `scripts/deploy-prod.sh` does unconditionally.
