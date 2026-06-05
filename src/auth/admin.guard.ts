import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/** Permite apenas usuários com role admin. Usar junto do JwtAuthGuard. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem gerenciar usuários');
    }
    return true;
  }
}
