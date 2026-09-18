import { GardenerGuard } from './gardener.guard';
import { Reflector } from '@nestjs/core';

const ctx = (user: any): any => ({
  switchToHttp: () => ({ getRequest: () => ({ user }) }),
});

describe('GardenerGuard', () => {
  const guard = new GardenerGuard({} as Reflector);

  it('allows a Gardener', () => {
    expect(guard.canActivate(ctx({ role: 'Gardener' }))).toBeTruthy();
  });

  it('rejects a Customer', () => {
    expect(guard.canActivate(ctx({ role: 'Customer' }))).toBeFalsy();
  });

  it('rejects a missing user', () => {
    expect(guard.canActivate(ctx(undefined))).toBeFalsy();
  });
});
