# ClipTech Admin

Admin dashboard for ClipTech. Next.js (App Router, SSR) + Tailwind + shadcn/ui
+ TanStack Query + TanStack Table + Zustand + React Hook Form + Zod.

## Getting started

```bash
cp .env.local.example .env.local
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be sent to
`/login`. You need a running cliptech-api and an admin account with the `users`
role - create one with `cmd/create-admin.go` in that repo.

## How this app talks to cliptech-api

The API authenticates admins with an **HttpOnly cookie set on its own origin**,
which neither half of a Next app can use naively: the browser would be
cross-origin, and the Next server can't read a cookie scoped to the API's host.
Two fetchers, one `ApiFetcher` contract:

- `src/app/api/proxy/[...path]/route.ts` - forwards `/api/proxy/admin/users` to
  `${API_URL}/v1/admin/users`, relaying cookies both ways. Same-origin, so the
  browser sends the session automatically and the token never touches JS.
- `src/lib/api-client.ts` - `clientFetch`, the browser side, goes through that
  proxy.
- `src/lib/api-server.ts` - `serverFetch`, for Server Components, calls the API
  directly and forwards the cookie from `next/headers`.

Paths are written without the version prefix: `"/admin/users"`.

The proxy strips the `Domain` attribute off relayed cookies
(`src/lib/cookies.ts`), so `COOKIE_DOMAIN` in cliptech-api - set for the
creator-facing app - can't break this one: the session binds host-only to the
admin app. `HttpOnly`, `Secure`, `SameSite` and the expiry pass through
untouched. `ALLOWED_ORIGINS` is likewise irrelevant here, since the API only
ever sees a server-to-server call.

## Data fetching pattern

Query options are **factories that take a fetcher**, so one definition serves
both sides of the render:

```ts
// Server Component
await queryClient.prefetchQuery(usersListOptions(params, serverFetch));
// Client hook - same key, same shape
useQuery(usersListOptions(params));
```

Table state (page, limit, search, status, date range) lives in the **URL**.
`src/lib/list-params.ts` parses and serialises it; the Server Component reads it
to build the prefetch and `useListParams` reads the same URL on the client, so
the two can never derive different query keys. Filtered views are shareable and
survive a refresh.

## Layout

- `src/app/(dashboard)` - the sidebar shell and pages.
- `src/components/ui` - shadcn/ui primitives (Base UI, style `base-nova`).
  `form.tsx` is hand-authored: this registry style hasn't shipped a form
  component, so it's a from-scratch RHF-compatible take on the classic API.
- `src/components/data-table` - generic TanStack Table v8 wrapper (v8 pinned
  deliberately; v9 rewrote the API around a mandatory `tableFeatures()` system
  shadcn's docs haven't caught up to). Passing `serverPagination` switches it
  from in-memory paging/filtering to server-driven; omitting it keeps the
  in-memory behaviour for small embedded tables.
- `src/components/shared` - `PageHeader`, `ConfirmDialog`, `DetailList`,
  `CheckboxGroup`, `QueryState` (the loading/error/empty triple, with 401
  phrased as an expired session).
- `src/lib/list-params.ts`, `src/hooks/use-list-params.ts` - the
  `?page&limit&search&from&to` + per-resource filters contract every admin
  listing in cliptech-api shares.
- `src/components/users`, `src/hooks/use-users.ts`, `src/schemas/user.ts` - the
  reference feature. Copy this shape for the next resource.
- `src/components/admins`, `src/hooks/use-admins.ts` - the second one, sharing
  every generic piece above.
- `src/components/campaigns`, `src/components/submissions` - the campaign
  tracking screens.
- `src/middleware.ts`, `src/app/login`, `src/hooks/use-admin.ts` - the session.

## Users

Wired to the real endpoints, all behind the admin cookie and the `users` role:

| Method | Path |
|---|---|
| `GET` | `/v1/admin/users` (`?search&status&from&to&page&limit`) |
| `GET` | `/v1/admin/users/:id` |
| `PATCH` | `/v1/admin/users/:id` (`name`, `status`, `country`, `country_code`) |
| `PATCH` | `/v1/admin/users/:id/note` |
| `DELETE` | `/v1/admin/users/:id` (soft delete) |
| `GET` | `/v1/admin/users/:id/transactions` |
| `GET` | `/v1/admin/users/:id/social-accounts` |

`/users` is the listing; `/users/[id]` is the detail page, with Profile,
Internal note, Transactions and Connected accounts tabs.

Notes on what the API does and doesn't allow:

- **There is no create endpoint.** Creators come into existence by signing in
  with an OTP (`GetOrCreateByEmail`), so the UI has no "Add user". The form and
  table components are resource-agnostic, so adding one is a hook plus a
  `POST /v1/admin/users` on the API side.
- **Sorting is server-fixed** at `created_at DESC` and takes no sort parameter,
  so the column headers don't offer sorting - it would only reorder the page in
  hand and misrepresent the rest.
- **`country_code` can't be cleared.** The API requires exactly two letters and
  has no unset path, so a blank field means "leave it alone" and is omitted
  from the PATCH.
- **Updates send only changed fields.** `AdminUpdateRequest` takes pointers and
  rejects an empty patch with `ErrNoChanges`; sending the whole form would also
  log every field as changed in the audit trail.

## Auth

`/login` posts to `/v1/admin/auth/login` through the proxy; the API answers with
the session cookie, which the proxy re-hosts on this origin. Nothing is kept in
JS or `localStorage` - `useAdminMeQuery` (`GET /v1/admin/me`) is the app's read
of its own session, prefetched once in the dashboard layout.

`src/middleware.ts` redirects anonymous requests to `/login?next=...`. It checks
that the cookie is **present**, not that it is valid: verifying the JWT would
mean copying cliptech-api's signing secret into a second service to duplicate a
check the API already does on every request. So middleware is routing, and the
API stays the only thing that decides what an admin may do.

Two consequences worth knowing:

- A **stale** cookie passes middleware and gets a 401 from the API. `QueryState`
  renders that as "Your session has expired" with a Sign in link back to the
  current page, rather than a retry that would fail identically.
- There is deliberately **no** cookie-present -> redirect-away-from-`/login`
  rule. With only presence to go on, a stale cookie would bounce the admin off
  the one page that can fix it.

`?next=` is constrained by `safeNextPath` (`src/lib/redirect.ts`) to a
single-slash path inside this app, so it can't be used as an open redirect.

**No second factor.** The login response reports `two_factor_enabled`, but the
API issues the session cookie on the first call regardless - a challenge step
would be theatre. It belongs here once the API withholds the session pending
one.

## Admins

`/admins` lists staff accounts, `/admins/new` adds one, `/admins/[id]` edits or
deletes one.

| Method | Path | Needs |
|---|---|---|
| `GET` | `/v1/admin/admins` (`?search&role&is_active&page&limit`) | `admins` |
| `GET` | `/v1/admin/admins/:id` | `admins` |
| `POST` | `/v1/admin/admins` | `admins` |
| `POST` | `/v1/admin/admins/invite` | **super admin** |
| `PATCH` | `/v1/admin/admins/:id` | `admins` |
| `DELETE` | `/v1/admin/admins/:id` | `admins` |

**Two ways to add an admin, because the API has two endpoints and they are not
interchangeable.** `/admins/new` shows both, and disables whichever the
signed-in account isn't allowed to use:

- **Invite** generates the password, emails it, and never returns it - so there
  is nothing in the UI to display or copy afterwards. Super admin only. It
  refuses outright (503) when SMTP is unconfigured rather than creating an
  account nobody can sign in to, and rolls the account back (502) if the send
  fails. The form explains both rather than echoing the raw message, since
  neither is about what was typed and neither leaves an account behind.
- **Create** takes a password you choose and needs only the `admins` role.
  It's the path for deployments with no mail relay.

Other things the API dictates:

- **`is_active` is not a filter the listing shares** with users - `ListFilters`
  here is search/role/is_active only, with no date range, so the toolbar omits
  it rather than sending parameters the API ignores.
- **Delete is refused with 409 in two cases**: deleting yourself, and deleting
  an admin with recorded actions (deactivate instead - the audit trail has to
  keep pointing at a real row). Self-delete is hidden in the UI since it is
  knowable; action history isn't, so that one surfaces as the API's message.
- **Roles are config-driven** (`allowed_admin_roles` in cliptech-api's
  config.yaml) and no endpoint publishes them, so `ADMIN_ROLES` in
  `src/schemas/admin.ts` mirrors the default list. The API still validates.
- **A blank password field means "leave it alone"**, not "clear it".

Sidebar sections are hidden when the signed-in admin lacks the role their
routes require. That is presentation only - the API re-checks every request
against the stored row, so hiding a link grants nothing and protects nothing.

## Typography

Montserrat (variable, so one request covers every weight) via `next/font`,
with Geist Mono kept for ids and other monospaced text.

Note the `@theme` block previously declared `--font-sans: var(--font-sans)` -
a self-reference that resolved to nothing, so every `font-sans` was silently
falling through to the browser's default serif. The stack now names the loaded
family and real fallbacks.

## Campaigns

`/campaigns` lists them, `/campaigns/new` creates one, `/campaigns/[id]` is the
tracking page. `/submissions` is the same submissions table unscoped - the
review queue across every campaign.

| Method | Path | Role |
|---|---|---|
| `GET` `POST` | `/v1/admin/campaigns` (`?search&status&platform&from&to`) | `campaigns` |
| `GET` `PATCH` | `/v1/admin/campaigns/:id` | `campaigns` |
| `PATCH` | `/v1/admin/campaigns/:id/status` | `campaigns` |
| `POST` | `/v1/admin/campaigns/:id/archive` | `campaigns` |
| `GET` | `/v1/admin/campaigns/:id/snapshots` | `campaigns` |
| `GET` | `/v1/admin/submissions` (`?campaign_id&user_id&status&platform&payment_status&from&to`) | `submissions` |
| `GET` | `/v1/admin/submissions/:id` and `/logs` | `submissions` |
| `PATCH` | `/v1/admin/submissions/:id/{approve,reject,flag,invalidate}` | `submissions` |
| `GET` | `/v1/admin/exports/campaigns/:id/results.csv` | `campaigns` |

### The tracking page

Ordered by what an admin opens it to find out: state and the moves available,
then where the money is, then the posts driving it, then the payouts already
made, then the terms. Budget sits above the tabs because "is this campaign
healthy" should never be a click away.

- **Budget** is one bar with two segments, because spent vs accrued is the
  distinction that matters: both are committed, only spent has reached
  creators. The submission cutoff is marked on it.
- **Submissions** reuses the generic table with `campaign_id` pinned - the API
  already takes that filter, so no second endpoint was needed.
- **A submission opens in a sheet**, addressed by `?submission=<id>`, so a post
  under review can be linked to a colleague without leaving the campaign.
- **Payout history** is the campaign's snapshots: each threshold crossing and
  what it credited. Markers (a crossing with no money attached) are labelled.

### Things the API dictates

- **`next_statuses` drives the status menu.** The API computes the legal moves
  from its own transition table, so the UI never offers one it would refuse and
  never needs updating when that table changes. Ending confirms - it is the one
  irreversible stop.
- **Archive is only reachable from completed.** An *ended* campaign has stopped
  running but has not yet paid what it owes.
- **CPM, platforms and the start date freeze once a campaign leaves draft**
  (`ErrFrozenField`), and the budget may then only grow. Those inputs are
  disabled with the reason shown rather than left editable for the API to
  reject.
- **Submissions have no `search` filter** - `ListFilters` there is
  campaign/user/platform/status/payment/date only - so the toolbar shows no
  search box rather than one that silently does nothing.
- **Review actions follow the API's own preconditions**: only a pending post
  can be approved, rejected or invalidated; only a pending or approved one can
  be flagged. Invalidation reasons come from a fixed list.
- **Submissions carry only `user_id`.** Creator names are resolved through the
  users feature's own cache (`useSubmissionUsers`), so repeat submitters cost
  one request. It needs the `users` role and fails silently to the id without
  it - an admin holding only `campaigns` still gets a usable table.

### The tracker-history chart

`ViewLogChart` plots raw vs payable views over a post's polls. The gap between
the two lines is the point: raw climbing while payable flattens means the post
has hit the campaign's per-post cap or is accruing views that don't qualify.

- Earnings are deliberately **not** a third line - money and views are
  different scales, and a second y-axis is the one thing a chart must not do.
  The figure lives in the table and the tooltip.
- **Failed polls are not plotted as zero.** A failed fetch still writes a row,
  but its zeroes mean "we couldn't read the post", not "the post lost its
  views"; plotting them would draw a crash that never happened. They are marked
  on the axis instead, with the error text in the table.
- Colours are `--chart-1/2`, set in `globals.css` to a pair validated with the
  dataviz skill's checker (CVD delta-E 24.7 light / 26.8 dark, both >= 3:1 on
  their surface). The palette that ships with this shadcn style is chroma-0
  grey throughout, which cannot carry series identity. **Re-run
  `validate_palette.js` before adding a third series.**
- Hover gives a crosshair and one tooltip listing both series; the same
  readings are reachable by keyboard (focus the chart, arrow left/right), and
  the table below repeats every value.

## Responsive

Verified with headless Chrome at 320/375/414/768px across every route (48
combinations): no page scrolls horizontally, and nothing sits outside the
viewport that isn't inside a deliberate scroll container.

The rules that keep it that way:

- `min-w-0` on `SidebarInset` and the content wrapper. A flex child defaults to
  `min-width: auto`, so without it one wide table stretches the main column
  past the viewport and scrolls the whole page sideways instead of scrolling
  itself.
- Tables scroll inside their own `overflow-x-auto` border, never the page.
- The toolbar stacks below `sm`: search full width, each dropdown on its own
  row, the date pair sharing one.
- Tab strips with more than two tabs scroll horizontally rather than wrapping.
- The breadcrumb shows only the last crumb below `sm` and shortens anything
  that looks like a record id.
