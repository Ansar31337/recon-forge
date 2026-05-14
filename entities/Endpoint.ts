import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("endpoints")
export class Endpoint {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  hostResultId!: string;

  @Column({ type: "text" })
  url!: string;

  @Column({ type: "text", nullable: true })
  path!: string | null;

  @Column({ type: "varchar", length: 10, default: "GET" })
  method!: string;

  @Column({ type: "int", nullable: true })
  statusCode!: number | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  contentType!: string | null;

  @Column({ type: "int", default: 1 })
  depth!: number;

  @Column({ type: "boolean", default: true })
  keptByUro!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
