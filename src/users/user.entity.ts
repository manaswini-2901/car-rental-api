import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'Admin' | 'User';
export type UserStatus = 'Active' | 'Inactive';

@Entity('users')  // 👈 use plural table name to avoid reserved word issues
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // create-only (we’ll ignore on update and never return it)

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({ type: 'varchar', length: 10, default: 'User' })
  role: UserRole; // 'Admin' | 'User'

  @Column({ type: 'varchar', length: 10, default: 'Active' })
  status: UserStatus; // 'Active' | 'Inactive'

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
