import mongoose from "mongoose";

const uri =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/sparc";

const options = {
  timestamps: true,
};

const userSchema = new mongoose.Schema(
  {
    externalId: { type: String, unique: true, sparse: true },
    name: String,
    email: { type: String, unique: true },
    role: String,
    status: { type: String, default: "ACTIVE" },
    profile: Object,
  },
  options,
);

const ownerSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    verificationStatus: String,
    reliabilityScore: Number,
    earningsSummary: Object,
  },
  options,
);

const spaceSchema = new mongoose.Schema(
  {
    externalId: { type: String, unique: true, sparse: true },
    ownerId: mongoose.Schema.Types.ObjectId,
    title: String,
    address: String,
    zone: String,
    coordinates: { lat: Number, lng: Number },
    mode: String,
    capacity: Number,
    available: Number,
    amenities: [String],
    restrictions: [String],
    pricing: {
      hourly: Number,
      daily: Number,
      monthly: Number,
    },
    verificationStatus: String,
    operationalStatus: String,
    reliabilityScore: Number,
    lastUpdatedAt: Date,
  },
  options,
);

const verificationSchema = new mongoose.Schema(
  {
    ownerId: mongoose.Schema.Types.ObjectId,
    spaceId: mongoose.Schema.Types.ObjectId,
    status: String,
    reviewedAt: Date,
    reviewerId: mongoose.Schema.Types.ObjectId,
    demoEvidenceSummary: String,
  },
  options,
);

const reservationSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    spaceId: mongoose.Schema.Types.ObjectId,
    startAt: Date,
    endAt: Date,
    checkInAt: Date,
    checkOutAt: Date,
    status: String,
    amount: Number,
    commission: Number,
    ownerSettlement: Number,
    reference: { type: String, unique: true },
    qrPayload: String,
  },
  options,
);

const demandSnapshotSchema = new mongoose.Schema(
  {
    zone: String,
    timestamp: Date,
    currentOccupancy: Number,
    available: Number,
    predictedAvailability: Number,
    predictedDemand: Number,
    confidence: Number,
  },
  options,
);

const activityLogSchema = new mongoose.Schema(
  {
    actorId: mongoose.Schema.Types.ObjectId,
    action: String,
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    metadata: Object,
  },
  options,
);

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

const SpaceOwner =
  mongoose.models.SpaceOwner ||
  mongoose.model("SpaceOwner", ownerSchema);

const Space =
  mongoose.models.Space ||
  mongoose.model("Space", spaceSchema);

const Verification =
  mongoose.models.Verification ||
  mongoose.model("Verification", verificationSchema);

const Reservation =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);

const DemandSnapshot =
  mongoose.models.DemandSnapshot ||
  mongoose.model("DemandSnapshot", demandSnapshotSchema);

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", activityLogSchema);

const accounts = [
  {
    externalId: "demo-user-1",
    name: "Demo User",
    email: "rhea@sparc.demo",
    role: "USER",
  },
  {
    externalId: "demo-owner-1",
    name: "Demo Owner",
    email: "aman@sparc.demo",
    role: "OWNER",
  },
  {
    externalId: "demo-city-1",
    name: "Demo City Operator",
    email: "nisha@sparc.demo",
    role: "CITY_OPERATOR",
  },
  {
    externalId: "demo-admin-1",
    name: "Demo Admin",
    email: "admin@sparc.demo",
    role: "ADMIN",
  },
];

const spaces = [
  {
    externalId: "s1",
    title: "Orchid Metro Deck",
    zone: "Indiranagar",
    mode: "PARKING",
    price: 80,
    available: 12,
    capacity: 18,
    reliability: 96,
    owner: "Orchid Mobility",
    coordinates: { lat: 12.978, lng: 77.640 },
    amenities: ["Covered", "CCTV", "Two-wheeler bays"],
    monthlyPrice: 6400,
  },
  {
    externalId: "s2",
    title: "12th Main EV Hub",
    zone: "Indiranagar",
    mode: "EV",
    price: 110,
    available: 4,
    capacity: 10,
    reliability: 93,
    owner: "Volt City",
    coordinates: { lat: 12.974, lng: 77.645 },
    amenities: ["22kW charging", "CCS2 connector", "Charging available"],
  },
  {
    externalId: "s3",
    title: "Civic Loading Bay",
    zone: "Koramangala",
    mode: "LOADING",
    price: 120,
    available: 3,
    capacity: 4,
    reliability: 91,
    owner: "Civic Operations",
    coordinates: { lat: 12.935, lng: 77.624 },
    amenities: ["LCV / Van", "30 min dwell"],
  },
  {
    externalId: "s4",
    title: "Metro Access Plaza",
    zone: "Indiranagar",
    mode: "ACCESSIBILITY",
    price: 60,
    available: 2,
    capacity: 3,
    reliability: 98,
    owner: "Metro Access",
    coordinates: { lat: 12.971, lng: 77.638 },
    amenities: ["Step-free", "Attendant"],
  },
  {
    externalId: "s5",
    title: "Brigade Pickup Loop",
    zone: "MG Road",
    mode: "PICKUP",
    price: 45,
    available: 6,
    capacity: 8,
    reliability: 88,
    owner: "Brigade Loop",
    coordinates: { lat: 12.974, lng: 77.610 },
    amenities: ["10 min window"],
  },
  {
    externalId: "s6",
    title: "Pending Garden Space",
    zone: "Ulsoor",
    mode: "PARKING",
    price: 55,
    available: 2,
    capacity: 8,
    reliability: 72,
    owner: "Garden Parking",
    coordinates: { lat: 12.981, lng: 77.625 },
    amenities: [],
    verificationStatus: "PENDING",
    operationalStatus: "INACTIVE",
  },
  {
    externalId: "s7",
    title: "Richmond Avenue Garage",
    zone: "Richmond Town",
    mode: "PARKING",
    price: 80,
    available: 1,
    capacity: 20,
    reliability: 91,
    owner: "Avenue Garage",
    coordinates: { lat: 12.966, lng: 77.604 },
    amenities: ["CCTV", "Security"],
    monthlyPrice: 5200,
  },
  {
    externalId: "s8",
    title: "Forum Overflow Lot",
    zone: "Koramangala",
    mode: "PARKING",
    price: 70,
    available: 0,
    capacity: 24,
    reliability: 86,
    owner: "Forum Ops",
    coordinates: { lat: 12.934, lng: 77.611 },
    amenities: ["Open-air"],
  },
];

async function run() {
  console.log("Starting SPARC database seed...");

  await mongoose.connect(uri);
  console.log(`Connected to ${uri}`);

  const users = {};

  for (const account of accounts) {
    const user = await User.findOneAndUpdate(
      { externalId: account.externalId },
      {
        $set: {
          ...account,
          status: "ACTIVE",
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    users[account.externalId] = user;
  }

  const ownerUser = users["demo-owner-1"];

  const owner = await SpaceOwner.findOneAndUpdate(
    { userId: ownerUser._id },
    {
      $set: {
        userId: ownerUser._id,
        verificationStatus: "APPROVED",
        reliabilityScore: 94,
        earningsSummary: {
          totalBookings: 128,
          totalEarnings: 68420,
        },
      },
    },
    {
      upsert: true,
      new: true,
    },
  );

  const seededSpaces = {};

  for (const item of spaces) {
    const savedSpace = await Space.findOneAndUpdate(
      { externalId: item.externalId },
      {
        $set: {
          externalId: item.externalId,
          ownerId: owner._id,
          title: item.title,
          address: `${item.zone}, Bengaluru`,
          zone: item.zone,
          coordinates: item.coordinates,
          mode: item.mode,
          capacity: item.capacity,
          available: item.available,
          amenities: item.amenities,
          restrictions: [],
          pricing: {
            hourly: item.price,
            daily: item.price * 8,
            monthly: item.monthlyPrice ?? item.price * 80,
          },
          verificationStatus:
            item.verificationStatus ?? "APPROVED",
          operationalStatus:
            item.operationalStatus ?? "ACTIVE",
          reliabilityScore: item.reliability,
          lastUpdatedAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    seededSpaces[item.externalId] = savedSpace;
  }

  for (const item of spaces) {
    const space = seededSpaces[item.externalId];
    const status = item.verificationStatus ?? "APPROVED";

    await Verification.findOneAndUpdate(
      { spaceId: space._id },
      {
        $set: {
          ownerId: owner._id,
          spaceId: space._id,
          status,
          demoEvidenceSummary:
            "Synthetic demo verification record. No identity or property documents are stored.",
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  const approvedSpaces = spaces.filter(
    (item) => (item.verificationStatus ?? "APPROVED") === "APPROVED",
  );

  const checkedOutSpace =
    seededSpaces[approvedSpaces[0].externalId];

  const reservedSpace =
    seededSpaces[approvedSpaces[1].externalId];

  const user = users["demo-user-1"];

  await Reservation.findOneAndUpdate(
    { reference: "SPARC-DEMO-COMPLETED" },
    {
      $set: {
        userId: user._id,
        spaceId: checkedOutSpace._id,
        startAt: new Date("2026-09-21T10:00:00Z"),
        endAt: new Date("2026-09-21T12:00:00Z"),
        checkInAt: new Date("2026-09-21T10:05:00Z"),
        checkOutAt: new Date("2026-09-21T11:55:00Z"),
        status: "CHECKED_OUT",
        amount: 160,
        commission: 13,
        ownerSettlement: 147,
        reference: "SPARC-DEMO-COMPLETED",
        qrPayload: "sparc://check-in/SPARC-DEMO-COMPLETED",
      },
    },
    { upsert: true, new: true },
  );

  await Reservation.findOneAndUpdate(
    { reference: "SPARC-DEMO-RESERVED" },
    {
      $set: {
        userId: user._id,
        spaceId: reservedSpace._id,
        startAt: new Date("2026-09-22T18:00:00Z"),
        endAt: new Date("2026-09-22T20:00:00Z"),
        status: "RESERVED",
        amount: 220,
        commission: 18,
        ownerSettlement: 202,
        reference: "SPARC-DEMO-RESERVED",
        qrPayload: "sparc://check-in/SPARC-DEMO-RESERVED",
      },
    },
    { upsert: true, new: true },
  );

  // Keep the seeded reserved space aligned with the seeded
  // reservation without decrementing it again on repeat runs.
  const reservedSpaceSeed = spaces.find(
    (item) => item.externalId === approvedSpaces[1].externalId,
  );

  await Space.findOneAndUpdate(
    { _id: reservedSpace._id },
    {
      $set: {
        available: Math.max(
          0,
          reservedSpaceSeed.available - 1,
        ),
        lastUpdatedAt: new Date(),
      },
    },
  );

  const snapshotZones = [
    "Indiranagar",
    "Koramangala",
    "MG Road",
    "Richmond Town",
  ];

  for (let index = 0; index < snapshotZones.length; index += 1) {
    const zone = snapshotZones[index];
    const baseAvailable = 10 + index * 2;

    for (let sample = 0; sample < 2; sample += 1) {
      const timestamp = new Date(
        Date.now() -
          (2 - sample) * 60 * 60 * 1000,
      );

      await DemandSnapshot.findOneAndUpdate(
        { zone, timestamp },
        {
          $set: {
            zone,
            timestamp,
            currentOccupancy: 18 - index,
            available: baseAvailable - sample,
            predictedAvailability:
              baseAvailable - sample - 1,
            predictedDemand:
              20 - baseAvailable + sample,
            confidence: 60,
          },
        },
        { upsert: true, new: true },
      );
    }
  }

  await ActivityLog.findOneAndUpdate(
    { action: "SEED_DEMO_READY" },
    {
      $set: {
        actorId: users["demo-admin-1"]._id,
        action: "SEED_DEMO_READY",
        entityType: "DemoEnvironment",
        metadata: {
          source: "synthetic-demo-seed",
        },
      },
    },
    { upsert: true, new: true },
  );

  console.log(`Seeded ${accounts.length} demo users.`);
  console.log(`Seeded ${spaces.length} demo spaces.`);
  console.log(`Seeded ${spaces.length} verification records.`);
  console.log("SPARC database seed completed.");

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Seed failed:", error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
