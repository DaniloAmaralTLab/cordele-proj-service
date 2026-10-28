import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Passthrough middleware registered for the ProjController routes.
 *
 * It lives in modules/ and does not import src/infrastructure/ directly.
 */
@Injectable()
export class EmpresaContextMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction): void {
    next();
  }
}
