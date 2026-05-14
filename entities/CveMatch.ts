import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("cve_matches")
export class CveMatch {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  hostResultId!: string;

  @Column({ type: "uuid", nullable: true })
  techFingerprintId!: string | null;

  @Column({ type: "varchar", length: 50 })
  cveId!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  severity!: string | null;

  @Column({ type: "decimal", precision: 4, scale: 1, nullable: true })
  score!: number | null;

  @Column({ type: "text", nullable: true })
  summary!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
