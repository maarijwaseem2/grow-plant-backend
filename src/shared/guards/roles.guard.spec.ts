import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/userRole.enum';
import { ForbiddenException } from '@nestjs/common';

const ctx = (user: any): any => ({
  switchToHttp: () => ({ getRequest: () => ({ user }) }),
  getHandler: () => null,
  getClass: () => null,
});

const guardWith = (required: UserRole[] | undefined) => {
  const reflector = { getAllAndOverride: () => required } as unknown as Reflector;
  return new RolesGuard(reflector);
};

describe('RolesGuard', () => {
  it('allows when no roles are required', () => {
    expect(guardWith(undefined).canActivate(ctx({ role: UserRole.Customer }))).toBe(true);
  });

  it('allows a matching role', () => {
    expect(guardWith([UserRole.Admin]).canActivate(ctx({ role: UserRole.Admin }))).toBe(true);
  });

  it('rejects a non-matching role (403)', () => {
    expect(() => guardWith([UserRole.Admin]).canActivate(ctx({ role: UserRole.Customer }))).toThrow(ForbiddenException);
  });
});
