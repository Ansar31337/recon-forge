import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type UserRole = "superadmin" | "enterprise" | "regular";

@Entity("role_credit_defaults")
export class RoleCreditDefault {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 20, unique: true })
  role!: UserRole;

  @Column({ type: "int", default: 0 })
  dailyScanLimit!: number;

  @Column({ type: "int", default: 0 })
  maxCrawlDepth!: number;

  @Column({ type: "boolean", default: false })
  cveEnabled!: boolean;

  @Column({ type: "int", default: 0 })
  monthlySubdomainDownloadLimit!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
