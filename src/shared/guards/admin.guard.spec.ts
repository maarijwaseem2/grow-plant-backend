import { AdminGuard } from './admin.guard';
import { UserRole } from '../../users/userRole.enum';
import { ForbiddenException } from '@nestjs/common';

const ctx = (user: any): any => ({
  switchToHttp: () => ({ getRequest: () => ({ user }) }),
});

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows an Admin', () => {
    expect(guard.canActivate(ctx({ role: UserRole.Admin }))).toBe(true);
  });

  it('rejects a Customer (403)', () => {
    expect(() => guard.canActivate(ctx({ role: UserRole.Customer }))).toThrow(ForbiddenException);
  });

  it('rejects a Gardener (403)', () => {
    expect(() => guard.canActivate(ctx({ role: UserRole.Gardener }))).toThrow(ForbiddenException);
  });

  it('rejects a missing user (403)', () => {
    expect(() => guard.canActivate(ctx(undefined))).toThrow(ForbiddenException);
  });
});
