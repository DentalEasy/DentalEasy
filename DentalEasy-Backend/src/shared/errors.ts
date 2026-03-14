export class DomainError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 400,
    code = 'DOMAIN_ERROR',
    details?: unknown,
  ) {
    super(message);
    this.name = 'DomainError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends DomainError {
  constructor(message = 'Usuario nao autenticado.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends DomainError {
  constructor(message = 'Usuario nao autorizado para esta acao.') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnsupportedMediaTypeError extends DomainError {
  constructor(message = 'Tipo de conteudo nao suportado.') {
    super(message, 415, 'UNSUPPORTED_MEDIA_TYPE');
    this.name = 'UnsupportedMediaTypeError';
  }
}

export class TooManyRequestsError extends DomainError {
  constructor(message = 'Muitas tentativas. Tente novamente mais tarde.') {
    super(message, 429, 'TOO_MANY_REQUESTS');
    this.name = 'TooManyRequestsError';
  }
}
