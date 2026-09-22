# SPARC — AGENTS.md

## Identity
Project: SPARC
Expansion: Smart Parking & Resource Coordination
Category: Intelligent Urban Space Infrastructure

SPARC connects users with verified urban-space providers and coordinates parking, logistics and mobility capacity using real-time information, prediction and optimization.

## Absolute rules
1. SPARC is a product, not a generic CRUD project.
2. Parking is the initial use case, not the entire product.
3. Keep Parking, Logistics and Mobility as first-class domains.
4. Keep User, Owner/Operator, City Operator and SPARC Admin surfaces.
5. A physical space cannot become publicly bookable before verification.
6. Never permit overlapping confirmed reservations.
7. Availability must distinguish live/recent data from prediction.
8. Recommendations must be explainable.
9. Failed reservations must trigger alternatives and an incident/complaint path.
10. STAR provides priority/access benefits, never ownership or absolute control.
11. Parking and EV charging are separate billable services.
12. Commission is configurable; prototype default is 8%, with 5–10% as the initial assumption.
13. Do not collect real identity/property documents.
14. Use synthetic/demo data and label simulated analytics.
15. Never fabricate ML accuracy or real integrations.
16. Keep future integrations possible without overengineering.

## UX rules
- Premium modern urban mobility aesthetic.
- Map-first discovery.
- Mobile-first user experience.
- Desktop operator/admin analytics.
- Clear verification, freshness and reliability indicators.
- Subtle motion.
- Loading, empty and error states.
- Avoid generic dashboard templates.
- Prefer clarity over decoration.

## Engineering rules
- TypeScript strictness where practical.
- Server-side enforcement for critical business rules.
- Validate all external input.
- Server-side role authorization.
- Never commit secrets.
- Never store raw card credentials.
- Keep domain logic out of UI where possible.
- Prefer reusable services.
- Avoid unnecessary microservices.
- Keep AI/prediction replaceable.
- Test critical business rules.
- Do not modify unrelated repositories.

## Booking
AVAILABLE -> RESERVED -> CHECKED_IN -> OCCUPIED -> CHECKED_OUT -> AVAILABLE

Conflict checks are server-side. Client availability is informational.

## Business rules
- Only approved/verified spaces are bookable.
- Commission is server-calculated.
- Owner settlement derives from booking amount and configured commission.
- STAR is an entitlement system, not ownership.
- Recurring/monthly reservations respect availability.
- Failed fulfillment creates an incident.
- Rebooking prefers verified alternatives near the destination and within reasonable price tolerance.
- Reliability is based on measurable history.

## Prototype boundaries
Do not spend MVP time on real payment processing, municipal integrations, real property verification, physical ANPR/gates/sensors, real EV hardware control, or production-scale infrastructure.

## Demo priority
discover -> compare -> book -> pay -> QR -> check-in -> occupy -> check-out

Then demonstrate:
reservation failure -> alternative -> complaint -> owner response

Then:
loading -> EV -> STAR/monthly -> city analytics -> admin/revenue.

## Codex working style
Before modifying code:
1. inspect repository structure
2. inspect relevant files
3. understand architecture
4. make a concise plan
5. implement coherently
6. run relevant tests/typecheck/lint
7. fix errors
8. summarize changes and verification

Do not repeatedly ask approval for ordinary decisions already covered here.

When ambiguous, choose the simplest architecture consistent with these rules.

Do not remove SPARC capabilities merely because they are not in the current screen; preserve roadmap capabilities through appropriate abstractions.

## Completion standard
A feature is complete only when:
- happy path works
- invalid path is handled
- permissions are enforced
- persistence works
- loading/error states exist
- critical logic is tested
- responsive UI exists
- demo data supports it
