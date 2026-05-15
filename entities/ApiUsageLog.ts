import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("api_usage_logs")
export class ApiUsageLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "uuid", nullable: true })
  scanId!: string | null;

  @Column({ type: "varchar", length: 50 })
  action!: string;

  @Column({ type: "int", default: 1 })
  creditsUsed!: number;

  @Column({ type: "int", default: 0 })
  rowsUsed!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
