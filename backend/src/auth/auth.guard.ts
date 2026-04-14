import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FastifyRequest } from "fastify";

import { AuthService } from "./auth.service";

export const IS_PUBLIC_ROUTE = "isPublicRoute";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()]
    );

    if (isPublicRoute === true) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authorizationHeader = request.headers.authorization;

    if (authorizationHeader === undefined) {
      throw new UnauthorizedException("Missing Authorization header");
    }

    const [scheme, key] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || key === undefined || key.length === 0) {
      throw new UnauthorizedException("Invalid Authorization header");
    }

    const isValidKey = await this.authService.validateKey(key);

    if (!isValidKey) {
      throw new UnauthorizedException("Invalid API key");
    }

    return true;
  }
}
