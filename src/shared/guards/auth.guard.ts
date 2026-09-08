import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { errorMessages } from '../constant/constant';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}

function validateRequest(
  request: any,
): boolean | Promise<boolean> | Observable<boolean> {
  const user = request.user;
  if (user) {
    return true;
  } else {
    throw new Error(errorMessages.notDefine);
  }
}
