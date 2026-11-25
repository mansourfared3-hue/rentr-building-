# rentr-connect

A pnpm/Turborepo monorepo for Rentr Connect, a direct-rental marketplace. The Next.js App Router frontend and NestJS API are kept in separate workspace directories, `frontend` and `backend`. The initial rental flow includes OTP sign-in, profiles, properties, Connect wallets, requests, request decisions, in-app notifications, and accepted-request chat.

## Quick start

Requirements: Node.js 20.11 or newer and pnpm 11. Install dependencies, configure a local PostgreSQL URL plus independent JWT/OTP secrets in `.env`, apply the initial schema migration, then run both apps:

```bash
pnpm install
cp .env.example .env
pnpm --filter @rentr/api prisma:migrate
pnpm --filter @rentr/api db:seed
pnpm dev
```

The web app runs at <http://localhost:3000>. The NestJS API runs at <http://localhost:3001/api>. OTP requests are served by `/api/auth/otp/request`, verification by `/api/auth/otp/verify`, refresh rotation by `/api/auth/refresh`, and revocation by `/api/auth/logout`. The local development adapter logs OTPs; configure SMTP before production. Other root commands are `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test:api`, `pnpm format`, and `pnpm format:check`.

The optional local demo seed adds 300 varied Egyptian property listings plus related demo owners, tenants, tenant profiles, wallets, requests, ledger entries, messages, and notifications. It is additive and idempotent: rerunning it skips its existing deterministic records and never deletes or updates other data. The command refuses non-local database hosts. Demo accounts use `@example.test` addresses and have no real credentials; sign-in codes follow the local OTP delivery configuration.

To run the wallet concurrency test against the local `rentr_connect` database after applying migrations, use PowerShell: `$env:RUN_DATABASE_TESTS = 'true'; pnpm --filter @rentr/api test:database`. The test refuses to run against a non-local database and cleans up its generated test records.

`.env.example` is a variable checklist, not a credential store. Use independent, high-entropy values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `OTP_PEPPER`; configure a real PostgreSQL URL and SMTP settings before using authentication outside local development. Never commit `.env` or provider credentials.

## Folder structure

```text
rentr-connect/
├── .github/workflows/       # CI checks for lint, typecheck, build, and Auth tests
├── frontend/                # Next.js App Router, components, and public assets
├── backend/                 # NestJS API, Prisma schema, and migrations
│   ├── prisma/               # PostgreSQL schema and versioned migrations
│   └── src/                  # API modules, database, and common filters
├── packages/
│   ├── config/              # Shared ESLint, TypeScript, and Tailwind configuration
│   ├── types/               # Shared marketplace domain types
│   └── ui/                  # Atomic Design components: atoms, molecules, organisms, templates
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Rental flow

The App Router includes `/login`, `/properties`, `/properties/:id`, `/properties/new`, `/requests`, `/requests/:id/chat`, and `/profile`. The root route redirects to `/properties`. Public property browse/detail, profile, wallet, request, decision, notification, and chat interactions call the NestJS API. Chat currently polls for updates; WebSocket delivery and a background task queue are deferred.

Property image uploads use S3-compatible object storage. Configure `S3_BUCKET` and `S3_PUBLIC_BASE_URL`, and set `S3_ENDPOINT`/`S3_REGION` plus access credentials for the chosen provider. AWS deployments may use the SDK's default credential chain; Cloudflare R2 requires its S3 endpoint, `auto` region, and an access key pair. The public base URL must serve objects in the configured bucket. Uploads accept up to 12 JPEG, PNG, or WebP images, each at most 5 MB. The property form's map picker uses OpenStreetMap tiles; saved exact coordinates remain private and are not returned in public property data.

When SMTP is configured, new rental requests and chat messages are emailed in one recipient-specific digest after a one-minute collection window. This short batching window is in memory, not durable: a process restart can discard a not-yet-sent digest. The existing in-app notification records remain persisted. Pending requests currently expire after 12 hours and owners receive an in-app reminder two hours before expiry.

Owners can place a pending request on hold; the 12-hour deadline continues, and its Connects are refunded if it expires. An approved Meta WhatsApp template is required for the administrative alert. Configure `META_WHATSAPP_API_VERSION`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_ACCESS_TOKEN`, `ADMIN_WHATSAPP_NUMBER`, `META_WHATSAPP_TEMPLATE_NAME`, and `META_WHATSAPP_TEMPLATE_LANGUAGE`. The approved template must have three body placeholders for request ID, property title, and owner email. Hold alerts are written to a PostgreSQL outbox and retried with backoff until Meta accepts them. Accepting a request rejects/refunds other active requests for that property and withdraws the property from new requests.

## Backend module conventions

Feature modules live under `backend/src/modules/<name>/` and follow the `module-template` scaffold: `<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts`, DTOs, reference-only entity types, and tests. Prisma remains the sole model definition; do not duplicate database fields in entity files. The `module-template` scaffold is not imported by the app and does not expose sample routes.

Auth is a passwordless email OTP flow. Codes are generated with a cryptographically secure RNG, stored as HMAC hashes with expiry/attempt limits, and verified independently from delivery. The built-in SMTP adapter sends mail when SMTP is configured; otherwise only local development logs the code, and production refuses to log OTPs. Access tokens are short lived. Refresh JWTs are HttpOnly cookies backed by hashed, revocable, rotating database sessions. New users receive the `TENANT` role and can enable owner mode on the same account.

The global validation pipe rejects unknown DTO fields. The global exception filter returns `{ statusCode, error, message, path, timestamp }`. Production migrations can be applied with `pnpm --filter @rentr/api prisma:migrate:deploy`.

## Atomic Design in `packages/ui`

Components are grouped by composition level, not by page or feature. **Atoms** are the smallest reusable elements (for example, a button or text field). **Molecules** combine atoms into a focused unit (for example, a labeled field). **Organisms** combine atoms and molecules into a larger interface section (for example, a site header). **Templates** arrange organisms and content slots into page-level layouts without fetching data or owning route-specific business state.

Each level owns an `index.ts` barrel. Import from the level rather than reaching into component files:

```tsx
import { Button, Input } from '@rentr/ui/atoms';
import { PropertyCard, PropertyForm } from '@rentr/ui/organisms';
import { PropertyListTemplate } from '@rentr/ui/templates';
```

The Tailwind theme extension is exported from `@rentr/ui/tokens`. The molecule barrel is available from `@rentr/ui/molecules`. `CountdownBadge` defaults to warning at 60 minutes and danger at 15 minutes remaining; both thresholds can be overridden through props.

## Workspace conventions

- Each app and package is a separate pnpm workspace package with declared scripts.
- Shared TypeScript options come from `@rentr/config`; strict mode and `no-explicit-any` are enabled.
- Turborepo builds upstream workspace dependencies before dependent tasks; `pnpm dev` starts API and web together.
- Keep secrets out of Git. Add environment-variable names to `.env.example` and load real values through local/deployment secret stores.

## GitHub Actions

`.github/workflows/ci.yml` runs lint, typecheck, build, and the Auth unit tests as separate parallel jobs on pull requests, pushes to `main`, and manual dispatch. CI uses Node.js 22, the pnpm version pinned in `package.json`, and frozen lockfile installs. CI does not deploy; choose a hosting target and configure its credentials before adding deployment automation.
#   r e n t r - b u i l d i n g -  
 