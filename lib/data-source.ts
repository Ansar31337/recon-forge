import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "@/entities/User";
import { RoleCreditDefault } from "@/entities/RoleCreditDefault";
import { UserCreditOverride } from "@/entities/UserCreditOverride";
import { ApiUsageLog } from "@/entities/ApiUsageLog";
import { Scan } from "@/entities/Scan";
import { Target } from "@/entities/Target";
import { ScanProgressEvent } from "@/entities/ScanProgressEvent";
import { HostResult } from "@/entities/HostResult";
import { TechFingerprint } from "@/entities/TechFingerprint";
import { Endpoint } from "@/entities/Endpoint";
import { CveMatch } from "@/entities/CveMatch";
import { SupportMessage } from "@/entities/SupportMessage";
import { PasswordResetRequest } from "@/entities/PasswordResetRequest";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "tesla",
  database: process.env.DB_NAME || "recon-forge",
  synchronize: true,
  logging: false,
  entities: [
    User,
    RoleCreditDefault,
    UserCreditOverride,
    ApiUsageLog,
    Scan,
    Target,
    ScanProgressEvent,
    HostResult,
    TechFingerprint,
    Endpoint,
    CveMatch,
    SupportMessage,
    PasswordResetRequest,
  ],
  migrations: [],
  subscribers: [],
});
