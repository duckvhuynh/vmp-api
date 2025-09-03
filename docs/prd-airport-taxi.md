# Airport Taxi Booking System — Product Requirements Document (PRD)

Version: 1.0  
Owner: Product (Airport Mobility)  
Date: 2025-09-03

## 0) Executive summary
Build a web/mobile experience to pre-book airport transfers with upfront pricing, meet-and-greet pickup, included wait time, and live flight tracking. The system coordinates passengers, drivers, and airport rules while offering transparent pricing and reliable service. The experience is inspired by best practices common in Booking.com’s “Airport taxis” flow: fixed, all-inclusive fares, free cancellation up to a window, professional drivers, meet-and-greet, and included waiting time for arrivals.

## 1) Goals and non-goals

Goals
- Frictionless, trusted airport transfers with clear pricing and reliable pickups. 
- Reduce pickup failures and coordination overhead through flight sync and geofencing. 
- Provide compliance and safety for drivers and airports. 
- Deliver a scalable foundation for corporate, hotel, and partner bookings.

Non-goals (Phase 1)
- On-demand street-hails or marketplace surge dispatch outside airports.
- Shared rides/pooling and multi-passenger matching. 
- Complex loyalty programs, kiosks, or multi-tenant airport ops beyond the initial pilot.

## 2) Success metrics (KPIs)
- Quote-to-booking conversion: ≥ 18% (web MVP). 
- Pickup success rate (arrivals met): ≥ 97%. 
- On-time pickup (±10 min vs. target pickup): ≥ 95%. 
- CSAT (post-ride 5-star rate): ≥ 4.7/5.0. 
- Refund/complaint rate: ≤ 2%. 
- Driver acceptance rate for assigned jobs: ≥ 90%. 
- Avg. time-to-assign driver after booking: ≤ 10 minutes (pre-landing).

## 3) Personas
- Traveler (Leisure): Wants a stress-free pickup with a clear price and guidance to the meeting point.
- Traveler (Business): Prioritizes reliability, receipt, and policy-compliant bookings.
- Booker (PA/Hotel/Agency): Books on behalf of travelers, needs consolidated billing and oversight.
- Driver: Needs clear pickup instructions, flight updates, fair wait-time compensation.
- Dispatcher/Admin: Manages fleet, exceptions, compliance, and airport rules.

## 4) Competitive inspiration (Booking.com-style “Airport taxis”)
Common patterns we’ll adopt:
- Upfront, all-inclusive fixed price shown at quote (taxes/fees included).
- Free cancellation up to a certain window (e.g., 24 hours before pickup).
- Included waiting time for airport pickups (e.g., 60 minutes after landing) and a standardized meet-and-greet at arrivals with a name sign.
- Professional, vetted drivers, vehicle class options (sedan/SUV/van), and extras (child seats, extra luggage). 
- Real-time updates, tracking link, masked chat/call, and multilingual support.

## 5) User stories (MVP)
Passenger
- As a traveler, I can get a fixed-price quote for an airport pickup or drop-off by entering origin/destination and time. 
- As a traveler, I can add my flight number so pickup time auto-adjusts to delays/early arrivals. 
- As a traveler, I can choose a vehicle class and extras (child seat, extra luggage, meet-and-greet sign text). 
- As a traveler, I can pay securely and receive a confirmation email/SMS with clear pickup instructions. 
- As a traveler, I receive notifications when a driver is assigned, arriving, or delayed, and I can track the driver. 
- As a traveler, I can cancel within the free window and receive a prompt refund.

Driver
- As a driver, I can receive and accept an airport transfer with meeting point guidance and flight updates. 
- As a driver, I can mark status (On the way, Arrived, Waiting, Passenger on board, Completed, No-show). 
- As a driver, I can see included waiting time and any incremental wait-time charges.

Admin/Dispatcher
- As an admin, I can set airport pickup rules (zones, included wait time), pricing, and cancellation policies. 
- As a dispatcher, I can view live trips, assign/reassign drivers, and handle exceptions.

## 6) Scope (MVP)
In scope (Phase 1)
- Passenger responsive web (PWA) for quotes, booking, and payments. 
- Pricing engine with fixed airport fares and distance-based fallback; extras and surcharges. 
- Flight data integration to adjust pickup time; included waiting time policies. 
- Notifications via email/SMS; driver assignment alerts and tracking link.
- Lightweight driver web app for status updates and navigation handoff. 
- Basic admin console: pricing, policies, airport meeting-point content, trip monitor, manual dispatch.
- Payments (e.g., Stripe/Adyen), 3DS when required, multi-currency support (config-based). 

Out of scope (Phase 1)
- Native iOS/Android apps. 
- Pooling, subscriptions, corporate cost centers and SSO. 
- Kiosk/hotel desk tools and airline deep integrations.

## 7) Functional requirements

7.1 Quoting and booking (Passenger)
- Origin/destination entry supports: Airport (IATA code + terminal), address/place search. 
- Date/time picker; for arrivals, flight number strongly recommended. 
- Vehicle classes with capacity (pax/bags), amenities; extras (child seat, meet & greet sign text, extra luggage). 
- Upfront price breakdown (base, airport fee, extras, taxes) with clear policies: included wait time and cancellation window. 
- Booking details capture: passenger name, contact (phone/email), flight info, pickup sign text, special notes. 
- Payment: card tokenization and charge; handle 3DS; retry on failure; idempotency for checkout. 
- Confirmation page + email/SMS containing booking ref, meeting point, driver assignment status (pending/confirmed).

7.2 Flight sync and pickup adjustments
- Pull flight status (scheduled, estimated, actual) and adjust pickup time dynamically with configurable buffers. 
- If landing time changes, update driver ETA target and inform both parties. 
- When flight lands, start included waiting time counter (e.g., 60 min) for arrivals.

7.3 Driver assignment and guidance
- Auto-suggest drivers based on proximity, capacity, and airport permit; allow manual override. 
- Provide terminal/door/zone meeting points and geofenced restrictions. 
- Status flow: Assigned → On the way → Arrived → Waiting → Passenger on board → Completed; exception: Passenger no-show.

7.4 Notifications and communications
- Triggers: booking confirmed, driver assigned, driver en route, flight landed, driver arrived, long wait nearing threshold, trip started, completed, receipt sent. 
- Channels: email, SMS; optional push for future native apps. 
- Masked chat/call between driver and passenger within a time window.

7.5 Pricing and policies
- Fixed airport fares by zone and vehicle class with inclusions (e.g., 60 min waiting for arrivals). 
- Distance/time fallback pricing for non-zoned routes. 
- Extras: per-seat fee, extra bag fee, late-night surcharge, child seat. 
- Cancellation: free until X hours before pickup; then tiered fees; no refund post-arrival. 
- Wait-time charges post-included period at per-minute rate with driver compensation.

7.6 Admin/ops
- Manage airports, terminals, meeting-point content and photos; geofence polygons; rule parameters. 
- Manage vehicle classes, extras, pricing tables, and promo codes. 
- Live trip monitor; reassign/cancel; issue refunds/adjustments; lost-and-found workflow. 
- Driver/vehicle verification: license, insurance, airport permit, document expiry reminders. 
- Audit logs and role-based access control.

## 8) Non-functional requirements
- Performance: quote response < 800 ms p95; booking completion < 2 s p95 (excluding 3DS). 
- Availability: 99.9% monthly for quote/booking APIs; graceful degradation of flight sync. 
- Security & Privacy: PCI scope minimized via gateway; PII encryption at rest; GDPR-compliant retention and deletion; masked communications. 
- Reliability: idempotent APIs; at-least-once processing for webhooks; replay protection. 
- Accessibility: WCAG 2.1 AA; keyboard and screen-reader support. 
- Localization: i18n, time zones, number/date formats, multi-currency display and rounding. 

## 9) User flows (high level)

9.1 Arrival pickup (inspired by Booking.com’s flow)
1) Search: Select Airport → Destination, date/time, pax/bags, vehicle class suggestions. 
2) Quote: Show fixed all-in price; note included wait time and free cancellation window. 
3) Details: Collect passenger info, flight number, sign text, extras. 
4) Pay: Card entry/3DS; booking confirmed; email/SMS sent. 
5) Assign: Driver matched before landing; tracking link provided. 
6) Landed: System starts included wait timer; driver arrives at meeting point with name sign. 
7) Handover: Driver marks On board; trip starts. 
8) Complete: Receipt auto-sent; rating prompt.

9.2 Departure drop-off
1) Search Airport drop-off → fixed price. 
2) Booking and payment. 
3) Driver en route; pickup at address; ride to terminal; receipt and rating.

## 10) States and policies
- BookingStatus: pending_payment, confirmed, driver_assigned, en_route, arrived, waiting, no_show, on_trip, completed, cancelled_by_user, cancelled_by_ops, payment_failed. 
- AssignmentStatus: unassigned, offered, accepted, declined, reassign_requested, reassigned. 
- Cancellation policy: free until 24h before pickup (configurable); 50% fee within 24h to 2h; 100% fee <2h or after driver arrived (example defaults). 
- Included waiting: arrivals 60 min after wheels-down (ATA), non-airport 15 min; configurable per airport.

## 11) Data model (conceptual)
- Airport (id, IATA, name, time zone) 
- Terminal (id, airportId, name, meetingPoints[]) 
- VehicleClass (id, name, paxCapacity, bagCapacity, priceMultiplier) 
- PriceRule (airportId, zoneId?, classId, base, perKm, perMin, fees, surcharges) 
- Quote (id, origin, destination, classId, pax, bags, extras[], currency, total, policySnapshot) 
- Booking (id, quoteId, passenger, contact, flightInfo, pickupAt, status, notes) 
- Payment (id, bookingId, provider, method, amount, currency, status, refunds[]) 
- Driver (id, name, permits[], documents, status) 
- Vehicle (id, classId, plates, luggageCapacity, permits) 
- Assignment (id, bookingId, driverId, status, timestamps) 
- FlightInfo (flightNumber, date, status, scheduled, estimated, actual) 
- Notification (id, bookingId, channel, template, status, providerMeta) 
- Policy (id, name, values) 
- EventLog (id, bookingId, type, payload, at)

## 12) APIs (MVP, illustrative)
- POST /api/quotes
  - Input: origin {type: airport|address, airportCode, terminal?}, destination {address|placeId}, pickupAt, pax, bags, extras[], preferredClass?
  - Output: { quoteId, currency, total, breakdown, classes[], policy }
- POST /api/bookings
  - Input: { quoteId, passenger {name}, contact {email, phone}, flight {number, date}, signText?, extras[], notes?, paymentMethodId }
  - Output: { bookingId, status, policySnapshot, confirmation }
- GET /api/bookings/{id}
- POST /api/bookings/{id}/cancel
- Webhooks: /webhooks/payments, /webhooks/flight-updates, /webhooks/sms-status
- Admin: CRUD for airports, terminals, meeting points, vehicle classes, pricing, policies.

## 13) Integrations
- Payments: Stripe or Adyen (tokenization, 3DS, refunds). 
- Flight data: FlightAware, Cirium, or AviationStack (status + times). 
- Maps/geocoding: Google Maps Platform or Mapbox (routes, distance). 
- Messaging: Twilio/MessageBird (SMS), SendGrid/SES (email). 
- Voice/Masking: Twilio voice with number pooling.

## 14) Notifications (MVP)
- Booking confirmed (email + SMS). 
- Driver assigned (email + SMS with tracking link). 
- Flight landed (internal + driver alert). 
- Driver arrived (SMS to passenger). 
- Wait-time nearing charge threshold (SMS). 
- Trip started, Trip completed + receipt. 
- Cancellation confirmation and refund status.

## 15) Pricing, fees, and refunds (defaults, configurable)
- Fixed fare tables per airport↔city zones by vehicle class. 
- Extras: child seat per unit, extra luggage per unit, late-night surcharge, meet-and-greet. 
- Cancellations: example schedule above; refunds via gateway with reason codes. 
- Wait-time charges automatically calculated beyond included window.

## 16) Compliance, safety, and privacy
- Driver KYC, license/insurance uploads, airport permit validation and expiry reminders. 
- SOS contact for passengers; lost-and-found ticketing. 
- GDPR/CCPA: data minimization, PII encryption, subject access requests, deletion workflow. 
- PCI: card data handled by gateway; no card storage on our servers.

## 17) Accessibility and localization
- WCAG 2.1 AA, high contrast, large text options. 
- Multi-language content and right-to-left support; phone number formats by locale; time zones. 
- Currency display with rounding rules; settlement currency configured per market.

## 18) Analytics and events
- Key events: QuoteViewed, QuoteAccepted, CheckoutStarted, PaymentAttempted, PaymentSucceeded/Failed, BookingConfirmed, DriverAssigned, DriverArrived, TripStarted, TripCompleted, CancellationRequested, RefundIssued. 
- Dashboards: conversion funnel, pickup success, on-time rate, cancellations by reason, wait-time overages, driver acceptance.

## 19) Risks and mitigations
- Flight data inaccuracies → multiple providers and heuristics; manual override. 
- Driver supply at peak times → incentives, scheduled assignment windows, backup partners. 
- Airport rule variability → rules engine per airport; content CMS for meeting points. 
- Payment failures (3DS, travel cards) → retries, alternate methods, pre-auth vs. capture logic. 
- Communication failures (roaming) → email + SMS redundancy; shareable tracking links.

## 20) Open questions
- Exact free cancellation window and included wait time per market? 
- Pre-auth and capture timing (now vs. post-ride) for different markets? 
- Will corporates/hotels participate in MVP or Phase 2? 
- Which single airport and city to pilot?

## 21) MVP acceptance criteria (sample)
- Given a user books an arrival pickup with a flight number, when the flight is delayed by ≥ 30 minutes, then the pickup time updates and both driver and passenger are notified. 
- Given a driver marks Arrived, when 60 minutes elapse without On board, then the system flags no-show risk and triggers no-show policy notifications. 
- Given a user cancels ≥ 24 hours before pickup, then a full refund is issued automatically within the payment provider and the booking is marked cancelled_by_user. 
- Given included wait time is exceeded, then extra wait charges are added to the fare and reflected in driver compensation. 
- Given a booking is confirmed, then the confirmation email and SMS with meeting-point instructions are sent within 1 minute. 
- Given the driver is reassigned by dispatcher, then the passenger tracking link updates without requiring a new link. 
- All passenger and payment PII is encrypted at rest; successful 3DS flows complete without errors at p95.

## 22) Phased roadmap
- Phase 1 (MVP, 6–10 weeks): Core flows above, 1 airport + 1 city, 2 vehicle classes, Stripe, Twilio, one flight provider. 
- Phase 2: Native apps, corporate portal, hotel partner links, multi-airport rules, advanced pricing, multi-provider flight redundancy. 
- Phase 3: Pooling, kiosks, multi-tenant ops, loyalty, affiliate marketplace.

## 23) Engineering notes (implementation pointers)
- Service boundaries: Pricing, Bookings, Payments, Notifications, FlightSync, Dispatch, Admin. 
- Data store: relational (Postgres) with read replicas; object store for documents; cache for quotes. 
- Events: Outbox pattern for webhooks; idempotency keys for checkout and webhooks. 
- Testing: contract tests for payment/flight providers; synthetic flight updates for staging.

---
End of document.
