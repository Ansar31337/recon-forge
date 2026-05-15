import { MoreThanOrEqual } from "typeorm";
import { getDB } from "@/lib/db";
import { ApiUsageLog } from "@/entities/ApiUsageLog";
import { RoleCreditDefault } from "@/entities/RoleCreditDefault";
import { UserCreditOverride } from "@/entities/UserCreditOverride";

export interface CreditLimit {
  dailyScanLimit: number;
  maxCrawlDepth: number;
  cveEnabled: boolean;
  monthlySubdomainDownloadLimit: number;
}

export interface CreditSummary {
  role: string;
  dailyScanLimit: number;
  dailyScanUsed: number;
  monthlyDownloadLimit: number;
  monthlyDownloadUsed: number;
}

export async function resolveLimit(
  userId: string,
  role: string,
): Promise<CreditLimit> {
  const db = await getDB();
  const override = await db
    .getRepository(UserCreditOverride)
    .findOne({ where: { userId } });
  const roleDefault = await db
    .getRepository(RoleCreditDefault)
    .findOne({ where: { role: role as any } });

  return {
    dailyScanLimit:
      override?.dailyScanLimit ?? roleDefault?.dailyScanLimit ?? 0,
    maxCrawlDepth: override?.maxCrawlDepth ?? roleDefault?.maxCrawlDepth ?? 0,
    cveEnabled: override?.cveEnabled ?? roleDefault?.cveEnabled ?? false,
    monthlySubdomainDownloadLimit:
      override?.monthlySubdomainDownloadLimit ??
      roleDefault?.monthlySubdomainDownloadLimit ??
      0,
  };
}

export async function getDailyScanUsage(userId: string): Promise<number> {
  const db = await getDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return db.getRepository(ApiUsageLog).count({
    where: {
      userId,
      action: "scan",
      createdAt: MoreThanOrEqual(today),
    },
  });
}

export async function getMonthlyDownloadUsage(userId: string): Promise<number> {
  const db = await getDB();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { sum } = await db
    .getRepository(ApiUsageLog)
    .createQueryBuilder("log")
    .select("COALESCE(SUM(log.rowsUsed), 0)", "sum")
    .where("log.userId = :userId", { userId })
    .andWhere("log.action = :action", { action: "subdomain_download" })
    .andWhere("log.createdAt >= :monthStart", {
      monthStart: monthStart.toISOString(),
    })
    .getRawOne();

  return Number(sum) || 0;
}

export async function getCreditsSummary(
  userId: string,
  role: string,
): Promise<CreditSummary> {
  const [limit, dailyScanUsed, monthlyDownloadUsed] = await Promise.all([
    resolveLimit(userId, role),
    getDailyScanUsage(userId),
    getMonthlyDownloadUsage(userId),
  ]);

  return {
    role,
    dailyScanLimit: limit.dailyScanLimit,
    dailyScanUsed,
    monthlyDownloadLimit: limit.monthlySubdomainDownloadLimit,
    monthlyDownloadUsed,
  };
}

export async function checkAndConsume(
  userId: string,
  action: "scan" | "export",
  scanId?: string,
): Promise<{ ok: boolean; message?: string }> {
  const db = await getDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (action === "export") {
    const dailyExportUsage = await db.getRepository(ApiUsageLog).count({
      where: { userId, action: "export", createdAt: MoreThanOrEqual(today) },
    });
    const exportUsage = await db.getRepository(ApiUsageLog).count({
      where: { userId, action: "export", createdAt: MoreThanOrEqual(today) },
    });
    if (exportUsage >= 5) {
      return { ok: false, message: "Daily export limit reached" };
    }
  }

  await db.getRepository(ApiUsageLog).save({
    userId,
    scanId: scanId || null,
    action,
    creditsUsed: 1,
    rowsUsed: 0,
  });
  return { ok: true };
}

export async function consumeDownload(
  userId: string,
  scanId: string,
  rowsUsed: number,
): Promise<void> {
  const db = await getDB();
  await db.getRepository(ApiUsageLog).save({
    userId,
    scanId,
    action: "subdomain_download",
    creditsUsed: 0,
    rowsUsed,
  });
}
