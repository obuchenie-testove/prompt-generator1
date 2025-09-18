# Prompt Generator System Design

## Vision Overview
- **Purpose:** Provide a unified platform for designing, governing, and reusing high-quality prompts tailored for educational resources, starting with Bulgarian History worksheets.
- **Key Goals:**
  - Consistent, reusable prompt patterns across curricula and creators.
  - Full lifecycle governance with versioning, approvals, and auditability.
  - Fast, teacher-friendly UX with presets and history for rapid reuse.
  - Extensible taxonomy and template model that can scale to new subjects, grades, and output formats.

## High-Level Architecture
The solution follows a three-tier architecture:

1. **Frontend SPA (React + TypeScript + Vite):**
   - Routes for `/admin/*` and `/generator`.
   - Uses Zustand for lightweight state management.
   - Tailwind CSS for rapid UI development and accessibility compliance.
   - Communicates with the API through a typed client generated from the OpenAPI spec.

2. **Backend API (NestJS + TypeScript):**
   - Modular structure (`AuthModule`, `CatalogModule`, `TemplatesModule`, `GeneratorModule`, `AuditModule`, etc.).
   - Uses Prisma ORM for PostgreSQL persistence and Zod for runtime validation.
   - Implements RBAC with JWT tokens, MFA for administrators, and rate limiting via NestJS guards.
   - Exposes REST endpoints aligned with the OpenAPI contract and serves Swagger UI for documentation.

3. **Data Layer (PostgreSQL):**
   - Normalized schema mirroring the taxonomy and template structure.
   - Row-level versioning for templates with lifecycle states (Draft → Review → Approved → Deprecated).
   - Audit log captures before/after snapshots for traceability.

Supporting components include:
- **Background workers** for generating exports (Docx/HTML) and sending notifications when templates reach approval.
- **CI/CD pipeline** executing linting, unit/integration/E2E tests, and database migrations via Prisma.
- **Observability stack** (Prometheus + Grafana + Loki) for metrics, tracing, and logs.

## ERD (Textual Description)
- `users (id, email, password_hash, full_name, role, mfa_secret, is_active, created_at, updated_at)`
  - `role` is an enum: `super_admin`, `admin`, `editor`, `viewer`, `api_client`.
  - One-to-many relationship to `audit_logs`, `templates` (`created_by`, `updated_by`), and `user_configs`.
- `roles (id, name, description, is_active, created_at, updated_at)`
  - Linked to `template_relations` (role_id) and `presets` metadata.
- `tasks (id, name, description, subject, is_active, created_at, updated_at)`
  - Linked to `template_relations` (task_id).
- `formats (id, name, mime, extension, is_active, created_at, updated_at)`
  - Linked to `template_relations` (format_id) and referenced inside placeholder definitions.
- `dimensions (id, name, type, choices_json, validators_json, is_active, created_at, updated_at)`
  - Provide Bloom levels, grades, duration, etc.
- `templates (id, name, description, content_md, status, version, created_by, updated_by, approved_by, approved_at, changelog, created_at, updated_at)`
  - `status` enum: `draft`, `in_review`, `approved`, `deprecated`.
  - Has many `template_placeholder_definitions` and `template_relations` records.
- `template_placeholder_definitions (id, template_id, placeholder_key, placeholder_type, label, description, is_required, default_value_json, options_json, validators_json, order_index, created_at)`
  - Describes each placeholder (string, enum, multiselect, url_list, markdown, etc.).
- `template_relations (id, template_id, role_id, task_id, format_id)`
  - Many-to-one to `templates`, `roles`, `tasks`, `formats`.
- `presets (id, name, description, meta_json, template_id, created_by, created_at)`
  - `meta_json` stores pre-configured placeholder values and recommended dimension selections.
- `user_configs (id, user_id, template_id, name, values_json, is_favorite, created_at)`
  - Records history of generated prompts and favorites.
- `generated_prompts (id, user_id, template_id, values_json, output_md, created_at)`
  - Immutable record for auditability and analytics.
- `audit_logs (id, user_id, entity, entity_id, action, before_json, after_json, created_at)`
  - Captures CRUD actions across administrative resources.
- `api_tokens (id, user_id, name, token_hash, expires_at, created_at)`
  - Supports optional API clients with revocable access.

## Data Flow Summary
1. Admin defines catalog entries (roles, tasks, formats, dimensions).
2. Admin drafts a template with placeholder definitions → submits for review.
3. Second admin reviews, comments, and approves; template status changes to `approved` and becomes selectable.
4. Editor/Teacher opens generator UI, selects template or preset, fills dynamic form generated from placeholder definitions.
5. API validates inputs against placeholder validators, composes prompt sections, stores generated prompt, and returns final text plus metadata.
6. User can export, copy, or bookmark configuration; audit log records actions.

## Security & Compliance Considerations
- **Authentication:** OAuth2 password or SSO (SAML) integration; JWT access tokens with refresh flow.
- **Authorization:** NestJS Guards enforce RBAC per route and per resource; database-level constraints ensure only approved templates are exposed.
- **MFA:** Time-based OTP required for Super Admins and Admins.
- **Input Validation:** Zod schemas derived from placeholder definitions; server rejects invalid URLs, lengths, or enum values.
- **Rate Limiting:** Leaky bucket per user/IP; stricter limits for API clients.
- **Auditing:** All admin actions logged; tamper-resistant logs forwarded to SIEM.
- **Compliance:** GDPR-compliant data retention, PII minimization, export/delete endpoints for user configs.

## UX Highlights
- Four-step generator wizard with live preview panel updating as users fill fields.
- Accessible components (ARIA roles, keyboard shortcuts, high contrast themes).
- Presets presented as "recipes" cards with quick load.
- Inline validation and helper tooltips pulled from placeholder definitions.
- One-click export buttons for Markdown, TXT, JSON; copy-to-clipboard with toast confirmation.

## Testing Strategy
- **Unit Tests:**
  - Placeholder validation schema builder.
  - Template lifecycle transitions and RBAC guards.
- **Integration/API Tests:**
  - Catalog endpoints contract tests.
  - `/api/generate` validation and output structure.
- **E2E Tests (Playwright/Cypress):**
  - Admin creates template → reviewer approves → teacher generates prompt.
  - Accessibility suite with Lighthouse score ≥ 90.
- **Security Tests:**
  - Automated dependency scanning, static analysis, and OWASP ZAP baseline scan.

## Deployment & Operations
- Dockerized services orchestrated via `docker-compose` for local dev and Helm charts for production.
- CI pipeline (GitHub Actions) executes lint, tests, coverage (≥80%), and builds Docker images.
- Monitoring via OpenTelemetry traces, Prometheus metrics, Grafana dashboards, and Loki logs.
- Nightly backups of PostgreSQL; point-in-time recovery configured.

## Roadmap (from specification)
- **v1:** Core catalogs, single template, prompt generation, favorites, RBAC, audit logs.
- **v1.1:** Full versioning workflow with review/approval and diffing.
- **v1.2:** Presets, history UI, DOCX/HTML exports.
- **v1.3:** Organizations/teams with shared template libraries.
- **v2:** Public template marketplace and API key management.
