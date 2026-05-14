import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("scan_progress_events")
export class ScanProgressEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  scanId!: string;

  @Column({ type: "varchar", length: 100 })
  phase!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "int", default: 0 })
  percent!: number;

  @Column({ type: "varchar", length: 20, default: "info" })
  level!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
