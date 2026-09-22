import { connectDb } from "@/lib/db";
import { ActivityLog, User } from "@/lib/models";
import { requireRole, type SessionUser } from "@/lib/auth";

export async function getAdminAuditEvents(actor: SessionUser) {
  requireRole(actor, "ADMIN");
  await connectDb();

  const events = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
    .exec();

  const actorIds = events
    .map((event: any) => event.actorId)
    .filter(Boolean)
    .map((id: unknown) => String(id));

  const users = await User.find({
    _id: { $in: actorIds },
  })
    .select("name role")
    .lean()
    .exec();

  const userMap = new Map(
    users.map((user: any) => [
      String(user._id),
      {
        name: String(user.name ?? "Unknown actor"),
        role: String(user.role ?? "UNKNOWN"),
      },
    ]),
  );

  return events.map((event: any) => {
    const actorId = event.actorId
      ? String(event.actorId)
      : "";
    const eventActor = userMap.get(actorId);

    return {
      id: String(event._id),
      action: String(event.action ?? "UNKNOWN_ACTION"),
      actor: eventActor?.name ?? "Unknown actor",
      actorRole: eventActor?.role ?? "UNKNOWN",
      entity: String(event.entityType ?? "Unknown entity"),
      entityId: event.entityId
        ? String(event.entityId)
        : "",
      timestamp: event.createdAt
        ? new Date(event.createdAt).toISOString()
        : null,
    };
  });
}
