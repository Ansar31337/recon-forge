import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("targets")
export class Target {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  scanId!: string;

  @Column({ type: "varchar", length: 20 })
  type!: string;

  @Column({ type: "varchar", length: 255 })
  value!: string;

  @Column({ type: "varchar", length: 20 })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
