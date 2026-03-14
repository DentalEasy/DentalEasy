import { NextFunction, Request, Response } from 'express';
import { UnsupportedMediaTypeError } from '../../shared/errors';

const methodsWithBody = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const hasBodyPayload = (req: Request): boolean => {
  if (req.headers['transfer-encoding'] !== undefined) {
    return true;
  }

  const contentLengthHeader = req.headers['content-length'];
  if (!contentLengthHeader) {
    return false;
  }

  const normalizedContentLength = Array.isArray(contentLengthHeader)
    ? contentLengthHeader[0]
    : contentLengthHeader;
  const contentLength = Number.parseInt(normalizedContentLength, 10);

  return Number.isFinite(contentLength) && contentLength > 0;
};

export const requireJsonContentType = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!methodsWithBody.has(req.method)) {
    next();
    return;
  }

  if (!hasBodyPayload(req)) {
    next();
    return;
  }

  const contentType = req.is(['application/json', 'application/*+json']);
  if (!contentType) {
    next(
      new UnsupportedMediaTypeError(
        'Content-Type deve ser application/json para este endpoint.',
      ),
    );
    return;
  }

  next();
};
