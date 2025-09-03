# Software Requirements Specification (SRS) — Airport Taxi Booking System

Version: 1.0  
Date: 2025-09-03  
Related doc: ./prd-airport-taxi.md

## 1. Introduction

### 1.1 Purpose
Define the functional and non-functional requirements for an airport taxi booking platform with a NestJS backend API, Next.js frontend, MongoDB primary datastore, Redis for caching/queues, and Swagger UI for API documentation. The SRS guides engineering, QA, DevOps, and stakeholders.

### 1.2 Scope
Deliver web-based booking for airport pickups/drop-offs with fixed upfront pricing, flight synchronization, driver assignment, notifications, and administrative controls. Inspired by Booking.com Airport Taxis UX patterns. Native apps and advanced partner/corporate features are out of MVP scope.

### 1.3 Definitions
- ATA: Actual Time of Arrival (flight).  
- Included Wait Time: Free waiting window (e.g., 60 min after landing).  
- PWA: Progressive Web App.  
- RBAC: Role-Based Access Control.  
- SLA: Service-Level Agreement.

### 1.4 References
- PRD: `docs/prd-airport-taxi.md`

## 2. Overall description

### 2.1 Product perspective
- Multi-tenant capable, single-tenant MVP.  
- Microservice-ready modular monolith: domain modules within NestJS, separable later.  
- Frontend consumes REST APIs and websockets for live updates.

### 2.2 Product functions (summary)
- Quote fares, create bookings, collect payments, assign drivers, track rides, notify users, manage pricing/policies, sync flight times, administer airports/drivers.

### 2.3 User classes
- Passenger, Driver, Dispatcher/Admin, Booker (hotel/agency), System Integrations (payments, flight, messaging).

### 2.4 Operating environment
- Node.js LTS (>=20), Next.js (App Router), MongoDB Atlas, Redis (managed), Docker/Kubernetes for deploy.  
- Browsers: last 2 versions of Chrome/Edge/Safari/Firefox; Mobile Safari/Chrome.

### 2.5 Constraints
- PCI scope minimized via gateway; no raw PAN stored.  
- Airport rule compliance; geofenced pickup zones.  
- GDPR/CCPA data handling.

### 2.6 Assumptions & dependencies
- At least one flight data provider reachable.  
- SMS/email providers available in target regions.  
- Sufficient driver supply in pilot city.

## 3. System architecture and tech stack

### 3.1 Architecture overview
- Monorepo (Turborepo):
  - apps/api (NestJS)
  - apps/web (Next.js)
  - packages/shared (types, DTOs, utils)
- API follows modular DDD structure: Auth, Users, Airports, Pricing, Quotes, Bookings, Payments, Drivers, Vehicles, Dispatch, Notifications, FlightSync, Admin.
- Eventing via outbox pattern (Mongo → queue) with BullMQ on Redis.
- Real-time via Socket.IO gateway for live driver/passenger status.

### 3.2 Backend (NestJS)
- Framework: NestJS (latest LTS), TypeScript.
- HTTP: REST with versioning (e.g., /api/v1).  
- Validation: class-validator/class-transformer.  
- Auth: JWT (access/refresh), Passport strategies; optional OAuth for admins later.  
- Persistence: MongoDB with Mongoose; transactions (session-based) where needed.  
- Caching: Redis via cache-manager; Redis JSON optional.  
- Rate limiting: @nestjs/throttler + Redis store.  
- Queues/Jobs: BullMQ (driver assignment, notifications, flight polling).  
- Docs: @nestjs/swagger (Swagger UI at /docs).  
- Realtime: @nestjs/websockets (Socket.IO).  
- Logging: pino + nestjs-pino; request IDs; structured logs.  
- Config: @nestjs/config with schema validation (Joi/Zod).  
- Security: Helmet, CSRF for admin UI if embedded, CORS.

### 3.3 Frontend (Next.js)
- Next.js (App Router), TypeScript, React server components + edge/SSR where appropriate.  
- State/data: TanStack Query for server state; Zod for client-side schema validation; minimal local state (Zustand).  
- UI: Tailwind CSS + shadcn/ui.  
- Maps: Google Maps or Mapbox SDK (autocomplete, routing).  
- Payments: Stripe Elements.  
- i18n: next-intl (MVP: en; extensible).  
- Auth: next-auth (JWT) integrated with API.

### 3.4 Data stores
- MongoDB (primary), Redis (cache/queues), Object storage (S3-compatible) for driver docs.

### 3.5 Observability & ops
- OpenTelemetry traces/metrics; logs via pino to ELK/Grafana Loki.  
- Metrics: Prometheus + Grafana.  
- Error tracking: Sentry.  
- Health checks: /health (liveness/readiness).  
- Feature flags: Config-driven (simple), optional Unleash/Flagsmith later.

### 3.6 Deployment
- Docker images; Kubernetes with Helm; GitHub Actions CI/CD.  
- Frontend optionally on Vercel; API on managed K8s; managed MongoDB/Redis.

## 4. External interface requirements

### 4.1 User interfaces (web)
- Passenger flow: Home (search/quote) → Results (vehicle classes) → Details (extras, passenger, flight) → Payment → Confirmation/Tracking.  
- Driver portal (web): Jobs list → Job details → Status updates (on the way, arrived, waiting, on board, complete).  
- Admin console: Airports/meeting points, pricing, drivers/vehicles, bookings monitor, policies.

### 4.2 API interfaces (REST, sample)
Base: /api/v1
- Auth: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout
- Quotes: POST /quotes, GET /quotes/{id}
- Bookings: POST /bookings, GET /bookings/{id}, POST /bookings/{id}/cancel
- Payments: POST /payments/intent, POST /webhooks/payments (webhook)
- Flight: POST /webhooks/flight-updates (webhook)
- Drivers: GET /drivers/me/jobs, POST /drivers/me/jobs/{id}/status
- Dispatch: POST /dispatch/assign, POST /dispatch/reassign
- Admin: CRUD for airports, terminals, meeting-points, vehicle-classes, price-rules, policies, promos
- Notifications: POST /webhooks/sms-status

All endpoints documented via Swagger UI with schemas, enums, examples.

### 4.3 Authentication & authorization
- JWT Bearer for API; roles: passenger, driver, admin, dispatcher.  
- RBAC guards per module; ownership checks for passenger resources.  
- CSRF not required for pure API JWT flow; Admin web UI secured.

### 4.4 Third-party integrations
- Payments: Stripe (tokenization, Payment Intents, refunds).  
- Flight data: FlightAware/Cirium/AviationStack (one for MVP).  
- Maps/geocoding: Google or Mapbox.  
- Messaging: Twilio (SMS), SendGrid/SES (email).  
- Voice masking: Twilio (future).

## 5. System features (detailed)

Each feature has: Priority (MVP/NTH), Actors, Preconditions, Triggers, Main flow, Alternate/Errors, Data, Success criteria.

### 5.1 Quote fare (MVP)
- Actors: Passenger
- Preconditions: API up; pricing configured.
- Trigger: Passenger submits origin/destination, pickup time, pax/bags.
- Main flow: Validate → Resolve places → Compute fare (fixed/zone or distance/time) → Return options by vehicle class, policies, total.
- Errors: Invalid address, route unavailable, pricing missing → return error codes.
- Success: Quote returned <800ms p95.

### 5.2 Create booking (MVP)
- Actors: Passenger
- Preconditions: Valid quote; payment method available.
- Flow: Persist booking draft → Create payment intent → Confirm 3DS → On success mark booking confirmed → Queue driver assignment.
- Errors: Payment failure, duplicate → idempotency key; return graceful errors.

### 5.3 Flight synchronization (MVP)
- Actors: System, Driver, Passenger
- Flow: Poll/subscribe to flight status → Update ETA and pickup time → Notify driver/passenger of changes → Start included wait timer on ATA.

### 5.4 Driver assignment (MVP)
- Actors: Dispatcher/System, Driver
- Flow: Candidate drivers by proximity/permit/class → Offer job (timeout) → Accept/decline → Assign → Notify passenger.

### 5.5 Notifications (MVP)
- Email/SMS templates for confirmation, assignment, arrival, wait threshold, start, complete, receipt, cancellation.

### 5.6 Tracking and status (MVP)
- Web tracking page for passenger; driver status updates via driver portal or app; realtime via websockets.

### 5.7 Cancellation & refunds (MVP)
- Enforce policy windows; compute fees; call Stripe refund; update booking status/audit.

### 5.8 Admin & content (MVP)
- Manage airports, terminals, meeting points, pricing tables, extras, policies, promos; view trips; reassign/cancel; refunds.

## 6. Non-functional requirements
- Performance: Quote p95 < 800ms; booking create p95 < 2s excluding 3DS; driver assignment job latency p95 < 60s.  
- Availability: 99.9% core APIs; graceful degradation for flight sync.  
- Scalability: Horizontal auto-scale on API and queues; Redis clustering; Mongo shard-ready.  
- Security: JWT, RBAC, OWASP controls, rate limiting, WAF/Cloudflare, encryption at rest/in transit.  
- Privacy/compliance: GDPR/CCPA, data retention policies, subject access & deletion.  
- Observability: 99% endpoints with traces/metrics; SLO dashboards and alerts.  
- Accessibility: WCAG 2.1 AA for web.  
- Localization: i18n-ready content, time zones, currency formatting.  
- Maintainability: Linting, formatting, tests; modular code structure.  
- Reliability: Idempotent APIs; outbox/webhook retries with backoff.

## 7. Data requirements

### 7.1 Collections (MongoDB, key fields)
- airports: { _id, iata, name, tz, terminals[], meetingPoints[] }
- vehicleClasses: { _id, name, paxCap, bagCap, amenities, multiplier }
- priceRules: { _id, airportId, zoneId?, classId, base, perKm, perMin, fees, surcharges, currency }
- quotes: { _id, origin, destination, classId, pax, bags, extras[], currency, total, breakdown, policySnapshot, expiresAt }
- bookings: { _id, quoteId, passenger, contact, flight, pickupAt, status, notes, policySnapshot, currency, totals, audit[] }
- payments: { _id, bookingId, provider, intentId, amount, currency, status, refunds[] }
- drivers: { _id, userId, permits[], docs, status, rating }
- vehicles: { _id, driverId, classId, plate, luggageCapacity, permits }
- assignments: { _id, bookingId, driverId, status, timestamps }
- notifications: { _id, bookingId, channel, template, status, providerMeta }
- events: { _id, bookingId, type, payload, at }
- users: { _id, roles[], name, email, phone, passwordHash }

### 7.2 Indexing
- bookings: { status, pickupAt }, { passenger.email }, TTL on soft-deleted if needed.  
- drivers: { status }, { permits }, geo index for lastKnownLocation (future).  
- assignments: { bookingId }, { driverId, status }.  
- quotes: TTL on expiresAt.

### 7.3 Data retention
- PII minimization; retention policies by legal requirement.  
- Soft delete where appropriate; hard delete for SARs.

## 8. States & policies
- BookingStatus: pending_payment | confirmed | driver_assigned | en_route | arrived | waiting | no_show | on_trip | completed | cancelled_by_user | cancelled_by_ops | payment_failed.  
- AssignmentStatus: unassigned | offered | accepted | declined | reassigned.  
- Policies: cancellation windows, included wait time, per-minute overage, airport fees.

## 9. Key flows (sequence overviews)

### 9.1 Booking (arrival)
1) POST /quotes → returns fixed price + policies.  
2) POST /bookings with flight → creates booking, payment intent.  
3) Confirm payment (3DS) → Booking confirmed.  
4) Queue driver assignment → Driver accepts.  
5) Flight landed → start wait timer → Driver Arrived → On board → Completed → Receipt.

### 9.2 Flight update
- Webhook ingests update → Update booking.pickupAt/ETA → notify driver & passenger → adjust assignment timing.

### 9.3 Cancellation
- Passenger cancels → compute fee → refund via Stripe → update status → send confirmation.

## 10. API specification (outline)

Modules and sample endpoints (all typed DTOs, documented in Swagger):
- AuthModule: login, register, refresh, logout.  
- QuotesModule: POST /quotes (input: origin, destination, time, pax, bags, extras).  
- BookingsModule: POST /bookings, GET /bookings/:id, POST /bookings/:id/cancel.  
- PaymentsModule: POST /payments/intent, POST /webhooks/payments.  
- DriversModule: GET /drivers/me/jobs, POST /drivers/me/jobs/:id/status.  
- DispatchModule: POST /dispatch/assign, POST /dispatch/reassign.  
- AirportsModule: CRUD airports/terminals/meeting-points.  
- PricingModule: CRUD vehicle-classes/price-rules/extras.  
- NotificationsModule: POST /webhooks/sms-status.  
- FlightSyncModule: POST /webhooks/flight-updates.  
- AdminModule: role management, refunds, audits.

Swagger UI: GET /docs, OpenAPI JSON at /docs-json.

## 11. Security requirements
- JWT with short-lived access, rotating refresh; revoke on logout.  
- Passwords: Argon2id hashing; password policies; email verification.  
- Input validation & sanitization; prevent NoSQL injection.  
- Rate limits per IP/route; captcha on abusive flows.  
- Secrets in secure vault; rotated regularly.  
- Audit logs (admin actions, refunds, policy changes).  
- Data encryption at rest (DB/volumes) and TLS everywhere.

## 12. Performance & capacity planning
- Initial: 50 RPS peak on API; 5 RPS payments; 1 RPS flight webhooks; 500 concurrent tracking sessions.  
- Load test scenarios: quote spikes, payment bursts, flight update storms.

## 13. Logging, monitoring, alerting
- Correlated request IDs across services.  
- Dashboards for latency, error %, queue lag, assignment time, notification failures.  
- Alerts on SLO violations and provider/webhook failures.

## 14. Deployment & CI/CD
- Branch strategy: trunk with PRs, feature branches.  
- Pipelines: lint, typecheck, unit tests, build, image publish, deploy to staging, e2e tests, prod deploy with approvals.  
- Blue/green or canary for API; preview deploys for web.

## 15. Testing strategy
- Unit: services, controllers (Jest).  
- Integration: module + Mongo memory server, Redis test container.  
- E2E: API flows with Supertest; smoke tests post-deploy.  
- Contract tests for webhooks (payments/flight).  
- Load tests (k6 or Artillery).

## 16. Configuration & environment
- ENV: NODE_ENV, PORT, MONGODB_URI, REDIS_URL, JWT_SECRET, STRIPE_KEYS, SMS/EMAIL KEYS, FLIGHT_API_KEY, BASE_URL, CORS_ORIGINS.  
- Configured via @nestjs/config with schema validation.

## 17. Acceptance criteria (MVP)
- Booking with flight delay adjusts pickup and notifies both parties within 2 minutes of update.  
- Free cancellation honored per policy with correct refund.  
- Driver assignment occurs within 10 minutes p95; reassignment updates tracking in <30s.  
- Swagger UI exposes all MVP endpoints with accurate schemas.  
- P95 latency targets met under defined load; zero critical security findings.

## 18. Open issues
- Choose exact providers (flight data, maps) for pilot.  
- Decide pre-auth vs. capture timing per market.  
- Confirm pilot airport/city and pricing tables.  
- Determine masking/voice requirements for MVP.

---
End of SRS.
