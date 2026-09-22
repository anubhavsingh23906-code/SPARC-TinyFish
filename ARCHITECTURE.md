# SPARC architecture

`UI → application services → domain rules → Mongoose persistence` is the governing boundary. Route handlers authenticate/validate; services orchestrate; `src/lib/domain` owns pure, testable rules. Intelligence adapters (`recommendation.ts` today) use deterministic seeded signals and can be replaced later.

Critical booking safeguards are server-side: approved and active space gating, Zod time validation, overlap checks, configurable commission settlement, payment-record creation and audit logging. MongoDB should additionally receive a transaction/locking strategy before multi-instance production deployment.

Models cover User, SpaceOwner, Space, Reservation, Payment, Membership, Incident, Verification, AvailabilityEvent, DemandSnapshot, PricingRule, CityZone and ActivityLog. EV charging remains outside Reservation as a future ChargingSession model, ensuring parking and charging are separately billable.

Role surfaces live at `/`, `/owner`, `/city_operator`, and `/admin`. Current user resolution is isolated for Auth.js migration; `requireRole` is the server authorization primitive.
