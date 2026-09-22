import { Schema, model, models } from "mongoose";

const audit = { timestamps: true };

const userSchema = new Schema({
  externalId: { type: String, unique: true, sparse: true },
  name: String,
  email: { type: String, unique: true },
  role: {
    type: String,
    enum: ["USER", "OWNER", "CITY_OPERATOR", "ADMIN"],
    required: true,
  },
  status: { type: String, default: "ACTIVE" },
  profile: Object,
}, audit);

const ownerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  verificationStatus: { type: String, default: "PENDING" },
  reliabilityScore: { type: Number, default: 70 },
  earningsSummary: Object,
}, audit);

const spaceSchema = new Schema({
  externalId: { type: String, unique: true, sparse: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "SpaceOwner" },
  title: String,
  address: String,
  zone: String,
  coordinates: { lat: Number, lng: Number },
  mode: {
    type: String,
    enum: ["PARKING", "LOADING", "PICKUP", "EV", "ACCESSIBILITY"],
  },
  capacity: Number,
  available: Number,
  amenities: [String],
  restrictions: [String],
  pricing: {
    hourly: Number,
    daily: Number,
    monthly: Number,
  },
  verificationStatus: { type: String, default: "PENDING" },
  operationalStatus: { type: String, default: "INACTIVE" },
  reliabilityScore: Number,
  lastUpdatedAt: Date,
  bookingLockToken: {
    type: String,
    default: undefined,
  },
  bookingLockExpiresAt: {
    type: Date,
    default: undefined,
  },
}, audit);

const reservationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  spaceId: { type: Schema.Types.ObjectId, ref: "Space" },
  startAt: Date,
  endAt: Date,
  checkInAt: Date,
  checkOutAt: Date,
  status: {
    type: String,
    enum: [
      "RESERVED",
      "CHECKED_IN",
      "OCCUPIED",
      "CHECKED_OUT",
      "CANCELLED",
      "FAILED",
    ],
  },
  amount: Number,
  commission: Number,
  ownerSettlement: Number,
  reference: { type: String, unique: true },
  qrPayload: String,
  incidentId: { type: Schema.Types.ObjectId, ref: "Incident" },
}, audit);

reservationSchema.index({
  spaceId: 1,
  startAt: 1,
  endAt: 1,
  status: 1,
});

const paymentSchema = new Schema({
  userId: Schema.Types.ObjectId,
  reservationId: Schema.Types.ObjectId,
  amount: Number,
  currency: { type: String, default: "INR" },
  type: String,
  status: String,
  providerReference: String,
}, audit);

const membershipSchema = new Schema({
  userId: Schema.Types.ObjectId,
  plan: String,
  status: String,
  startAt: Date,
  endAt: Date,
  benefits: [String],
}, audit);

const incidentSchema = new Schema({
  reservationId: Schema.Types.ObjectId,
  userId: Schema.Types.ObjectId,
  ownerId: Schema.Types.ObjectId,
  category: String,
  description: String,
  status: String,
  verified: Boolean,
  ownerResponse: String,
  resolution: String,
  refundAmount: Number,
}, audit);

const verificationSchema = new Schema({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "SpaceOwner",
    required: true,
  },

  spaceId: {
    type: Schema.Types.ObjectId,
    ref: "Space",
    required: true,
  },

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "CHANGES_REQUESTED"],
    default: "PENDING",
  },

  reviewedAt: Date,

  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  demoEvidenceSummary: String,

  // NEW
  reviewNote: {
    type: String,
    default: "",
  },
}, audit);

const availabilitySchema = new Schema({
  spaceId: Schema.Types.ObjectId,
  zoneId: Schema.Types.ObjectId,
  status: String,
  source: String,
  timestamp: Date,
}, audit);

const demandSchema = new Schema({
  zone: String,
  timestamp: Date,
  currentOccupancy: Number,
  available: Number,
  predictedAvailability: Number,
  predictedDemand: Number,
  confidence: Number,
}, audit);

const pricingSchema = new Schema({
  scope: String,
  basePrice: Number,
  min: Number,
  max: Number,
  conditions: Object,
  active: Boolean,
}, audit);

const zoneSchema = new Schema({
  name: String,
  coordinates: [Number],
  metrics: Object,
}, audit);

const activitySchema = new Schema({
  actorId: Schema.Types.ObjectId,
  action: String,
  entityType: String,
  entityId: Schema.Types.ObjectId,
  metadata: Object,
}, audit);

const cityInterventionSchema = new Schema({
  zone: { type: String, required: true },
  action: {
    type: String,
    enum: [
      "REDIRECT_DEMAND",
      "MARK_INTERVENTION",
      "CREATE_ZONE_ALERT",
    ],
    required: true,
  },
  alternatives: { type: [Schema.Types.Mixed], default: [] },
  status: { type: String, required: true },
  actorId: { type: Schema.Types.ObjectId, ref: "User" },
}, audit);

export const User = models.User || model("User", userSchema);
export const SpaceOwner =
  models.SpaceOwner || model("SpaceOwner", ownerSchema);
export const Space = models.Space || model("Space", spaceSchema);
export const Reservation =
  models.Reservation || model("Reservation", reservationSchema);
export const Payment =
  models.Payment || model("Payment", paymentSchema);
export const Membership =
  models.Membership || model("Membership", membershipSchema);
export const Incident =
  models.Incident || model("Incident", incidentSchema);
export const Verification =
  models.Verification || model("Verification", verificationSchema);
export const AvailabilityEvent =
  models.AvailabilityEvent ||
  model("AvailabilityEvent", availabilitySchema);
export const DemandSnapshot =
  models.DemandSnapshot ||
  model("DemandSnapshot", demandSchema);
export const PricingRule =
  models.PricingRule || model("PricingRule", pricingSchema);
export const CityZone =
  models.CityZone || model("CityZone", zoneSchema);
export const ActivityLog =
  models.ActivityLog || model("ActivityLog", activitySchema);
export const CityIntervention =
  models.CityIntervention ||
  model("CityIntervention", cityInterventionSchema);

