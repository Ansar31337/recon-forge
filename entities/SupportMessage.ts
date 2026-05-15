import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("support_messages")
export class SupportMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  fromUserId!: string;

  @Column({ type: "varchar", length: 50 })
  category!: string;

  @Column({ type: "varchar", length: 255 })
  subject!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "text", nullable: true })
  adminReply!: string | null;

  @Column({ type: "varchar", length: 20, default: "open" })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
