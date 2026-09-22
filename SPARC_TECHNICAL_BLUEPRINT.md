# SPARC — Technical Blueprint

## Recommended stack
- Next.js + TypeScript
- Tailwind CSS + shadcn/ui
- MongoDB
- Mongoose or Prisma (choose one and stay consistent)
- Auth.js/NextAuth or another well-supported session solution
- Leaflet + OpenStreetMap for prototype mapping
- Zod
- Recharts
- QR library
- Vitest/Jest and Playwright where practical

Keep the prototype as one coherent application. Do not create microservices unless a concrete requirement justifies them. Keep prediction logic modular so a Python/ML service can be introduced later.

## Architecture
UI -> application services -> domain/business rules -> persistence
                         |
                         -> intelligence adapters

Booking, pricing, verification and payment rules must be server-side.

## Major models
User:
id, role, name, email, phone/demo profile, vehicle profiles, membership, status

SpaceOwner:
id/userId, verificationStatus, verification metadata, reliabilityScore, earnings summary

Space:
id, ownerId, title, address, coordinates, type, capacity, amenities, restrictions, pricing, availability rules, verificationStatus, reliabilityScore, operationalStatus

Reservation:
id, userId, spaceId, startAt, endAt, status, amount, commission, ownerSettlement, qr/reference, checkInAt, checkOutAt, incidentId

Payment:
id, userId, reservationId/subscriptionId, amount, currency, type, status, providerReference, createdAt

Membership:
userId, plan, status, startAt, endAt, benefits

Complaint/Incident:
id, reservationId, userId, ownerId, category, description, status, ownerResponse, resolution, refundAmount

Verification:
id, ownerId, spaceId, status, submittedAt, reviewedAt, reviewerId, demoEvidenceSummary

AvailabilityEvent:
spaceId/zoneId, status, source, timestamp

DemandSnapshot:
zoneId, timestamp, currentOccupancy, available, predictedAvailability, predictedDemand, confidence

PricingRule:
scope, basePrice, min/max, conditions, active

CityZone:
name, polygon/coordinates, metrics

ActivityLog:
actorId, action, entityType, entityId, metadata, timestamp

## Roles
USER, OWNER, CITY_OPERATOR, ADMIN

Server-side authorization is mandatory.

## Booking integrity
Before confirmation:
1. validate user
2. validate space
3. require approved/active space
4. validate time window
5. detect overlapping reservations
6. calculate price
7. calculate commission
8. create reservation
9. create payment record
10. return reservation/QR data

Never rely on client-side availability alone.

## Availability
Track:
- operational state
- reservation state
- current reported occupancy
- last updated timestamp
- forecast

Expose LIVE / RECENT / STALE.

## Recommendation
Initial deterministic ranking can combine:
availability compatibility + distance + price + reliability + verification + demand/confidence + preferences.

Make the service replaceable later by a trained model.

## Prediction
For demo:
- seeded historical occupancy
- time of day
- day of week
- event multiplier
- recent trend

Output forecast + confidence. Never claim fabricated accuracy.

## Rebooking
Prefer:
- same mode
- compatible vehicle/requirements
- overlapping requested time
- verified/approved space
- reasonable distance
- price within configured tolerance
- sufficient confidence

Prefer same price when possible.

## Payments
Use a MockPaymentProvider abstraction with:
createPayment, confirmPayment, refundPayment

Do not integrate real payment credentials for the MVP.

## EV
Keep ParkingReservation and ChargingSession separate.

ChargingSession:
reservationId, chargerId, start/end, tariff, amount, status, authorizationState

## Seed data
Create 30–60 synthetic spaces with:
- multiple owners
- verified/unverified examples
- hourly/daily/monthly
- EV
- accessible
- loading
- pickup/drop-off
- reservations
- incidents
- demand snapshots
- city zones
- demo users for every role

## UI
Premium urban mobility aesthetic:
- map-first
- strong whitespace
- restrained color system
- status chips
- subtle motion
- responsive/mobile-first
- operator/admin desktop analytics

Reusable components:
navigation, mode selector, map, space cards, trust indicators, booking panel, status timeline, analytics cards, charts, tables, modal/drawer, toast, loading/empty/error states.

## Security
- secure sessions
- server validation
- role checks
- input sanitization
- rate limits where practical
- no secrets in source
- .env.example
- no real personal/property documents
- audit admin actions

## Tests
At minimum:
- booking overlap
- commission calculation
- state transitions
- authorization
- rebooking selection
- membership entitlement
- verification gating
- key APIs
- one end-to-end happy path

## Git
Use meaningful commits:
chore: initialize SPARC
feat: auth and roles
feat: space marketplace
feat: reservation engine
feat: trust and rebooking
feat: monetization
feat: logistics and mobility
feat: intelligence
feat: admin and city analytics
chore: demo polish
