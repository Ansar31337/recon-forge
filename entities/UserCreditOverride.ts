import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("user_credit_overrides")
export class UserCreditOverride {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  userId!: string;

  @Column({ type: "int", nullable: true })
  dailyScanLimit!: number | null;

  @Column({ type: "int", nullable: true })
  maxCrawlDepth!: number | null;

  @Column({ type: "boolean", nullable: true })
  cveEnabled!: boolean | null;

  @Column({ type: "int", nullable: true })
  monthlySubdomainDownloadLimit!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
