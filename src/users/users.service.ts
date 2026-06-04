import { Injectable, NotFoundException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  /** Garante o usuário admin padrão no boot (cria ou promove a admin). */
  async onModuleInit() {
    const email = 'leonardo@vcz.com.br';
    const existing = await this.findByEmail(email);
    if (!existing) {
      await this.create({ name: 'Leonardo', email, password: 'leo@1993', role: UserRole.ADMIN });
      this.logger.log(`Usuário admin padrão criado: ${email}`);
    } else if (existing.role !== UserRole.ADMIN) {
      existing.role = UserRole.ADMIN;
      await this.repo.save(existing);
      this.logger.log(`Usuário ${email} promovido a admin`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async create(data: { name: string; email: string; password: string; role?: any }): Promise<User> {
    const exists = await this.findByEmail(data.email);
    if (exists) throw new ConflictException('Email já cadastrado');
    const hash = await bcrypt.hash(data.password, 10);
    const user = this.repo.create({ name: data.name, email: data.email, password: hash, role: data.role });
    return this.repo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.repo.find();
  }
}
