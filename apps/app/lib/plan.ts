import { db } from "./db";
import { PLANS, planFor } from "./stripe";

export async function getUsageThisMonth(userId: string) {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  return db.usageEvent.count({
    where: {
      userId,
      eventType: "ai_call",
      createdAt: { gte: start },
    },
  });
}

export async function assertAiQuota(userId: string, plan: string | null) {
  const p = planFor(plan);
  if (p.monthlyAiCalls === null) return { ok: true as const };
  const used = await getUsageThisMonth(userId);
  if (used >= p.monthlyAiCalls) {
    return {
      ok: false as const,
      used,
      limit: p.monthlyAiCalls,
      plan: p.id,
    };
  }
  return { ok: true as const, used, limit: p.monthlyAiCalls };
}

export { PLANS, planFor };
