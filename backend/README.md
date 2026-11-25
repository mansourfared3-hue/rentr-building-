# Rentr Connect API

NestJS API for the Rentr Connect monorepo. The API is an independent workspace at `backend`; the Next.js frontend in `frontend` calls it for rental flows. PostgreSQL access is provided through Prisma.

## Standard module template

Every feature module lives under `src/modules/<name>/` and follows this structure:

```text
<name>.module.ts
<name>.controller.ts
<name>.service.ts
dto/
  create-<name>.dto.ts
  update-<name>.dto.ts
entities/                 # reference Prisma types only; do not duplicate model fields
  <name>.entity.ts
<name>.service.spec.ts
```

Modules may add feature-specific DTOs and collaborators (for example, Auth adds `otp.service.ts` and an OTP delivery adapter). Keep controllers responsible for HTTP transport, services responsible for use cases, DTOs responsible for input validation, and persistence types defined only in `prisma/schema.prisma`.

## Authentication endpoints

All endpoints are under `/api/auth`:

- `POST /otp/request` with `{ "email": "tenant@example.com" }` requests an expiring six-digit code. The response is generic to avoid account enumeration.
- `POST /otp/verify` with `{ "email": "tenant@example.com", "code": "123456" }` verifies a code, creates a tenant account on first login, and sets short-lived access and rotating refresh HttpOnly cookies.
- `POST /roles/owner` enables owner mode on the signed-in account.
- `POST /refresh` rotates the refresh cookie and returns a new access token.
- `POST /logout` revokes the refresh session and clears the cookie.

The frontend refreshes the session and retries a request once after an access-token expiry.

Browser requests use the HttpOnly access cookie; API clients can also use `Authorization: Bearer <accessToken>`. Apply `@Roles(UserRole.TENANT)` or `@Roles(UserRole.OWNER)` with `JwtAuthGuard` and `RolesGuard` for role-restricted routes. New email sign-ins receive `TENANT`; an authenticated user can enable owner mode on the same account.

## Local setup

1. Copy the root `.env.example` to `.env` and set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `OTP_PEPPER` to local values.
2. Install workspace dependencies from the root with `pnpm install`.
3. Generate the Prisma client: `pnpm --filter @rentr/api prisma:generate`.
4. Apply a local schema migration: `pnpm --filter @rentr/api prisma:migrate`.
5. Optionally populate the local database with demo data: `pnpm --filter @rentr/api db:seed`.
6. Run the API: `pnpm --filter @rentr/api dev`.
7. Run OTP tests: `pnpm --filter @rentr/api test`.

The seed creates 300 Egyptian property listings and related demo users, profiles, wallets, requests, ledger entries, messages, and notifications. It only inserts deterministic demo records, skips duplicates on reruns, never clears existing data, and refuses to connect to non-local database hosts. Seeded email addresses use the reserved `example.test` domain and do not represent real accounts.

The development OTP adapter logs codes to the API process logs and is never suitable for production. To send real email, configure SMTP variables in `.env`; the verification service is independent of the delivery adapter, so a future WhatsApp adapter can replace SMTP without changing code validation or session issuance. Production startup/OTP delivery must use real secrets and a delivery channel; the backend intentionally does not provide hard-coded credentials or a fake successful email.

The global validation pipe rejects unknown DTO fields. The global exception filter returns a stable JSON shape: `{ statusCode, error, message, path, timestamp }`.

## Property media and notification email

Property images are uploaded through the owner-only `POST /api/properties/images` endpoint and stored in an S3-compatible bucket. Configure `S3_BUCKET` and a public object base URL in `S3_PUBLIC_BASE_URL`; for Cloudflare R2, also set the account S3 endpoint, `S3_REGION=auto`, and the R2 access-key pair. AWS can use its default SDK credential chain and a region such as `us-east-1`. The public base URL must resolve to readable objects in that bucket. Uploads validate image signatures and accept up to 12 JPEG/PNG/WebP files, with a 5 MB limit per file.

When SMTP is configured, new request and message emails are grouped by recipient over a one-minute in-memory window. In-app notifications are persisted regardless of SMTP availability. Since the digest buffer is not durable, an API restart can discard a pending digest; a durable queue remains deferred. Request owners receive the in-app expiry reminder two hours before the request's 12-hour deadline.

Rejecting a request because the unit is unavailable sets the property to `ON_HOLD`, hiding it from public listings, and writes a manual-follow-up alert to `admin_whatsapp_outbox` in the same transaction. Configure the Meta WhatsApp Cloud API credentials, admin E.164 number, API version, and an approved template through `META_WHATSAPP_*` and `ADMIN_WHATSAPP_NUMBER`; the template must define body placeholders for request ID, property title, and owner email. Alert delivery retries with exponential backoff until the API accepts it. A successful acceptance continues to withdraw the property, reject/refund its other pending or held requests, and notify affected tenants.
