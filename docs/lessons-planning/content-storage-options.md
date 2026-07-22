# Lesson Content Storage Options (Research Draft — Tradeoffs Only)

No recommendation is made here on purpose — this is a decision the site
owner wants to make directly. This lays out how each option would actually
work given Eardle's current stack: Next.js (App Router) + TypeScript +
Drizzle ORM over Postgres, with an existing admin panel
(`app/admin/(protected)/exercises/...`) where the non-programmer owner
already edits exercise rows through a web UI today. That existing pattern —
DB row + admin form, no direct file/code editing — is the closest precedent
in the current app and worth keeping in mind while weighing options below.

## (a) Markdown / MDX files committed to the repo

**Editing experience for a non-programmer:** Requires comfort with a text
editor, Markdown syntax, and — critically — the Git workflow (clone/pull,
edit, commit, push, open a PR, wait for deploy) to actually publish a
change. This is the biggest practical barrier if the owner isn't a
developer: even simple text fixes require a code-adjacent workflow, unless
paired with something like GitHub's web-based file editor (workable for
small edits, awkward for adding a whole new lesson file with correct
front-matter and file placement).

**Git-diff friendliness:** Best of all options. Plain-text diffs show
exactly what prose changed, line by line; PR review is natural; full
history and blame are free.

**Embedded interactive/audio components:** MDX (not plain Markdown)
supports importing and rendering React components directly inside prose —
this is the standard way to drop a "play this interval" widget in the
middle of a paragraph of explanation. Next.js has first-party MDX support
via `@next/mdx`, working with the App Router and Server Components.
Plain Markdown alone cannot do this — it would need a fixed set of
custom markdown syntax extensions or shortcodes instead, which is more
limited but doesn't require JSX authoring.

**Deployment/build implications:** MDX files are typically compiled at
build time, so adding/editing a lesson means a new deploy for it to go
live (no instant "save and see it" the way a DB-backed admin form gives
today). Note also that **Contentlayer** — historically the most common
"typed content layer over MDX files" tool for Next.js — is effectively
unmaintained (its main backer was acquired and stopped supporting it),
and it never fully supported the App Router well. Newer alternatives
exist (Content Collections, Velite, plain `@next/mdx`) but this space has
churned in the last couple of years, so any choice here should account for
maintenance risk, not just current features.

**Integration with this app:** Would sit alongside, not inside, the
Drizzle/Postgres data model — lesson prose lives in the repo's filesystem,
while anything needing to be queried/joined (which lesson unlocks which
exercise topic, completion tracking per user) would still need a database
table referencing the MDX file by slug/id.

## (b) JSON files in the repo

**Editing experience for a non-programmer:** Similar Git-workflow burden
as (a), plus JSON is considerably less pleasant to hand-write prose in
than Markdown — no natural paragraph/heading syntax, easy to introduce a
syntax error (missing comma/bracket) that silently breaks the build. Best
suited to structured data (ordering, prerequisite lists, exercise links)
rather than actual lesson prose.

**Git-diff friendliness:** Good for diffing structured fields, but prose
inside a JSON string value diffs poorly — a one-sentence edit to a long
paragraph shows as a single unreadable line change rather than a clean
paragraph-level diff the way Markdown would.

**Embedded interactive/audio components:** Not naturally — JSON is data,
not a templating layer, so any interactivity would need a separate
rendering layer that interprets JSON fields into components (e.g. a
"blocks" schema: `{"type": "audioExample", "config": {...}}`) which is
essentially reinventing a lightweight MDX.

**Deployment/build implications:** Same as (a) if read at build time
(static import); could instead be read at runtime from the filesystem or
fetched, avoiding a rebuild-per-edit, at the cost of extra runtime file
I/O plumbing.

**Integration with this app:** Fits naturally next to existing patterns —
the app already stores structured `config` as JSON text in the `exercises`
table (see `lib/db/schema.ts`), so a JSON-shaped lesson schema is at least
conceptually familiar. Still requires Git access to edit, so doesn't solve
the non-programmer-editing goal any better than (a).

## (c) Database-backed content (rows in Postgres, edited via an admin UI)

**Editing experience for a non-programmer:** Best fit for a non-programmer
editing over time, and it directly matches how the owner *already* edits
exercises today via `app/admin/(protected)/exercises`. A lesson editor
form (title, body, ordering, links to exercise categories/difficulty)
would feel identical to that existing workflow — no Git, no build, no file
paths to get right, and changes go live immediately on save.

**Git-diff friendliness:** Weakest option by design — content changes are
rows changing in a live database, not reviewable in a pull request. Any
"review before publish" workflow (draft vs. published state, revision
history) has to be built explicitly rather than inherited for free from
Git. Backups/rollback become an app-level concern (e.g. a `lesson_revisions`
table) instead of `git log`.

**Embedded interactive/audio components:** Requires the lesson body to be
either (1) a constrained rich-text/blocks format the admin UI can produce
without hand-written JSX (e.g. a block editor with an "insert audio
example" block type, similar in spirit to Notion-style editors), or (2)
raw HTML/Markdown-in-a-text-column rendered with a fixed set of
recognized custom tags. Full arbitrary React embedding isn't realistic
from a plain textarea — this is the real cost of choosing DB storage for
prose that needs interactivity.

**Deployment/build implications:** None — this is the option requiring no
rebuild or redeploy per content edit, which is a real advantage for a site
owner who wants to iterate on wording without involving a developer or a
deploy pipeline at all.

**Integration with this app:** Most natural fit for the existing stack —
a new Drizzle table (e.g. `lessons`) alongside `exercises`, migrated with
the same `drizzle-kit` workflow already in use, and an admin route
alongside the existing `app/admin/(protected)/exercises` pages. Ordering,
prerequisites, and exercise-category links become simple foreign
keys/columns instead of file-path conventions.

## (d) Headless CMS (Sanity, Contentful, or similar)

**Editing experience for a non-programmer:** Generally the best
out-of-the-box editing UI of all options if the owner wants a polished
writing experience (rich text, media library, drafts/preview) without a
developer building that UI themselves. That said, sources evaluating
Sanity specifically note non-technical editors can find its Studio
overwhelming *without* custom configuration — someone still has to invest
developer time to tailor the schema/UI to the owner's actual needs, or the
"good for non-programmers" benefit doesn't fully materialize. Contentful
is frequently cited as more turnkey for non-technical editors out of the
box, at the cost of being more locked into its own content-modeling UI.

**Git-diff friendliness:** None of the mainstream headless CMS options
store content in Git by default — content lives in the vendor's hosted
datastore, versioned within that vendor's own history/versioning feature
(if any), not in the app's repo. (A different category, "Git-based CMS"
tools like Keystatic, split the difference by writing structured content
files back into the repo automatically from a UI — effectively a hybrid
of (a)/(d) — worth knowing exists as a middle path.)

**Embedded interactive/audio components:** Well-supported conceptually —
most headless CMSs support a "portable text" / structured rich-content
format with custom embeddable block types, so a schema can define an
"audio example" or "interval quiz" block the owner inserts while writing,
similar in spirit to option (c)'s blocks approach but with a more mature
authoring UI.

**Deployment/build implications:** Content is fetched at request time or
via ISR/webhook-triggered rebuild — publishing a lesson typically does
*not* require a new app deploy, similar to (c). Adds an external service
dependency (uptime, API rate limits, potential ongoing cost) that doesn't
exist with (a)/(b)/(c).

**Integration with this app:** Would be a genuinely new piece of
infrastructure — a new account/project, new environment variables/API
tokens, a client SDK to fetch content, and a mental model (content lake,
GROQ or similar query language for Sanity) that doesn't exist anywhere
else in this codebase today. Bigger integration lift than any other
option, and least aligned with the "everything lives in this repo/DB"
shape the app currently has (Drizzle schema + admin UI covers all other
content types).

## (e) Hybrid: MDX/Markdown for prose + DB rows for structure/metadata

**Editing experience for a non-programmer:** Same Git-workflow requirement
as (a) for the actual prose-writing step; the DB half (ordering,
prerequisites, which exercise topics a lesson unlocks) would typically be
managed through the existing admin UI, not hand-edited, so the owner's
day-to-day "add a lesson" task is still partly a file edit + partly a form
fill.

**Git-diff friendliness:** Good for the prose half (inherits (a)'s
strength there); the structural half lives in Postgres and doesn't diff
in Git, same caveat as (c).

**Embedded interactive/audio components:** Same MDX component-embedding
capability as (a) for the prose; the DB half can additionally store
structured references (e.g. "this lesson's practice block should launch
exercise category=interval, difficulty=easy, topic=null") that the MDX
file wouldn't otherwise represent well.

**Deployment/build implications:** Prose edits require a rebuild (MDX
compiled at build time) unless read from the filesystem at runtime; the
metadata half (ordering, links) can update live via the admin UI without a
deploy, which is a nice separation — reordering the curriculum or
relinking a lesson to a different exercise topic doesn't need a code
deploy even if editing the words does.

**Integration with this app:** Requires maintaining two parallel systems
(a content pipeline for MDX plus the Drizzle schema/admin UI), which is
more moving parts than any single option alone, but does let each piece do
what it's naturally best at — Git-reviewable prose, DB-queryable
structure. This is a common enough pattern in the wider ecosystem (prose
in files, everything else in a database) that it's a reasonable shape to
consider, not a novel idea specific to this project.

## Cross-cutting summary

| Option | Non-programmer editing | Git-diffable | Embedded interactivity | Needs a deploy to publish? | New infra required |
|---|---|---|---|---|---|
| (a) MDX in repo | Needs Git workflow | Best | Strong (native JSX) | Yes (build-time) | No |
| (b) JSON in repo | Needs Git workflow, worse for prose | Weak for prose | Needs custom "blocks" layer | Yes (if build-time) | No |
| (c) DB rows + admin UI | Best (matches existing exercises workflow) | None (needs app-level revisions) | Needs custom blocks/rich-text | No | No |
| (d) Headless CMS | Good, but needs schema tailoring | None (vendor-side versioning) | Strong (mature block editors) | No (typically) | Yes — new vendor/service |
| (e) MDX + DB hybrid | Mixed (Git for prose, UI for structure) | Good for prose only | Strong (native JSX) | Yes for prose, no for structure | No, but two systems to maintain |

## Sources
- Contentlayer's unmaintained status and App Router incompatibility:
  https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives
- Next.js official MDX support and App Router/Server Component compatibility:
  https://nextjs.org/docs/app/guides/mdx
- Headless CMS comparison for Next.js (Sanity, Contentful, Payload, and
  editor-friendliness tradeoffs), including the Studio-overwhelming-for-
  non-technical-editors caveat and mention of Keystatic as a Git-backed
  alternative:
  https://www.luckymedia.dev/guides/best-headless-cms-for-nextjs,
  https://dev.to/nayankyada/best-headless-cms-for-nextjs-in-2026-sanity-vs-contentful-vs-payload-vs-storyblok-557k
- This repo's existing schema/admin precedent (read directly, not an
  external source): `lib/db/schema.ts`, `app/admin/(protected)/exercises/`
