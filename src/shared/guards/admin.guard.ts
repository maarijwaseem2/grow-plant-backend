import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../users/userRole.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Previous code used `if (!user && user.role !== 'admin')` which was broken:
    //  1. `&&` meant any authenticated non-admin user still passed the guard.
    //  2. It compared against the lowercase 'admin', but the enum value is
    //     'Admin', so even the intended comparison never matched.
    // A logged-in Customer could therefore reach admin-only routes.
    if (!user || user.role !== UserRole.Admin) {
      throw new ForbiddenException('Admins only.');
    }
    return true;
  }
}
