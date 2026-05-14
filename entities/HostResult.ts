import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("host_results")
export class HostResult {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  scanId!: string;

  @Column({ type: "varchar", length: 255 })
  host!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  displayTitle!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  detectedType!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  rootDomain!: string | null;

  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  apexDomain!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  country!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  city!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  asn!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  organization!: string | null;

  @Column({ type: "jsonb", nullable: true })
  aRecords!: string[] | null;

  @Column({ type: "jsonb", nullable: true })
  aaaaRecords!: string[] | null;

  @Column({ type: "jsonb", nullable: true })
  cnameRecords!: string[] | null;

  @Column({ type: "jsonb", nullable: true })
  mxRecords!: string[] | null;

  @Column({ type: "jsonb", nullable: true })
  nsRecords!: string[] | null;

  @Column({ type: "jsonb", nullable: true })
  txtRecords!: string[] | null;

  @Column({ type: "int", nullable: true })
  statusCode!: number | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  pageTitle!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  serverHeader!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  poweredByHeader!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  finalUrl!: string | null;

  @Column({ type: "jsonb", nullable: true })
  openPorts!: any[] | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  wafName!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  source!: string | null;

  @Column({ type: "date", nullable: true })
  lastSeenOn!: string | null;

  @Column({ type: "boolean", default: false })
  selectedForScan!: boolean;

  @Column({ type: "boolean", default: false })
  selectedScanCompleted!: boolean;

  @Column({ type: "timestamp", nullable: true })
  selectedScanCompletedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
