import { connectDb } from "@/lib/db";
import { ActivityLog, Space, SpaceOwner, Verification } from "@/lib/models";
import { requireRole, type SessionUser } from "@/lib/auth";

export type VerificationDecision =
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED";

export async function reviewVerification(
  actor: SessionUser,
  verificationId: string,
  decision: VerificationDecision,
  reviewNote = "",
) {
  requireRole(actor, "ADMIN");

  await connectDb();

  const verification = await Verification.findById(verificationId);

  if (!verification) {
    throw new Error("VERIFICATION_NOT_FOUND");
  }

  verification.status = decision;
  verification.reviewedAt = new Date();
  verification.reviewerId = actor.id;
  verification.reviewNote = reviewNote.trim();

  await verification.save();

  if (decision === "APPROVED") {
    await Space.findByIdAndUpdate(verification.spaceId, {
      verificationStatus: "APPROVED",
      operationalStatus: "ACTIVE",
    });
  }

  if (decision === "REJECTED") {
    await Space.findByIdAndUpdate(verification.spaceId, {
      verificationStatus: "REJECTED",
      operationalStatus: "INACTIVE",
    });
  }

  if (decision === "CHANGES_REQUESTED") {
    await Space.findByIdAndUpdate(verification.spaceId, {
      verificationStatus: "CHANGES_REQUESTED",
      operationalStatus: "INACTIVE",
    });
  }

  await ActivityLog.create({
    actorId: actor.id,
    action: `VERIFICATION_${decision}`,
    entityType: "Verification",
    entityId: verification.id,
    metadata: {
      reviewNote: reviewNote.trim(),
    },
  });

  return verification;
}


/**
 * Returns verification records visible to the current actor.
 *
 * ADMIN:
 *   Can see all verification requests.
 *
 * OWNER:
 *   Can see only their own verification requests.
 */
export async function getVisibleVerifications(actor: SessionUser) {
  await connectDb();

  if (actor.role === "ADMIN") {
    const verifications = await Verification.find()
      .populate({
        path: "ownerId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .populate({
        path: "spaceId",
        select:
          "title address zone mode capacity available pricing amenities restrictions verificationStatus operationalStatus",
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return verifications;
  }

  if (actor.role === "OWNER") {
    const owner = await SpaceOwner.findOne({
      userId: actor.id,
    });

    if (!owner) {
      throw new Error("SPACE_OWNER_NOT_FOUND");
    }

    const verifications = await Verification.find({
      ownerId: owner._id,
    })
      .populate({
        path: "spaceId",
        select:
          "title address zone mode capacity available pricing amenities restrictions verificationStatus operationalStatus",
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return verifications;
  }

  throw new Error("FORBIDDEN");
}