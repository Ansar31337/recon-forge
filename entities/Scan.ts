import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("scans")
export class Scan {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  name!: string | null;

  @Column({ type: "varchar", length: 20 })
  inputMode!: string;

  @Column({ type: "varchar", length: 20 })
  inputType!: string;

  @Column({ type: "text" })
  targetValue!: string;

  @Column({ type: "varchar", length: 20, default: "queued" })
  status!: string;

  @Column({ type: "varchar", length: 20, default: "top100" })
  portProfile!: string;

  @Column({ type: "int", default: 1 })
  crawlDepth!: number;

  @Column({ type: "boolean", default: false })
  cancelRequested!: boolean;

  @Column({ type: "timestamp", nullable: true })
  startedAt!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  finishedAt!: Date | null;

  @Column({ type: "boolean", default: true })
  enableSubdomainDiscovery!: boolean;

  @Column({ type: "boolean", default: true })
  enableIpThcLookup!: boolean;

  @Column({ type: "boolean", default: true })
  enableDnsLookup!: boolean;

  @Column({ type: "boolean", default: true })
  enableHttpProbe!: boolean;

  @Column({ type: "boolean", default: true })
  enableWebsiteTitleExtraction!: boolean;

  @Column({ type: "boolean", default: true })
  enablePortScan!: boolean;

  @Column({ type: "boolean", default: true })
  enableTechnologyDetection!: boolean;

  @Column({ type: "boolean", default: true })
  enableEndpointCrawler!: boolean;

  @Column({ type: "boolean", default: false })
  enableCveMatching!: boolean;

  @Column({ type: "boolean", default: false })
  cveEnabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
