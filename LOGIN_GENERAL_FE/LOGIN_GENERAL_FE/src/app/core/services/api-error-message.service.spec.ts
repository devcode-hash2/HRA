import { ApiErrorMessageService } from './api-error-message.service';

describe('ApiErrorMessageService', () => {
  let service: ApiErrorMessageService;

  beforeEach(() => {
    service = new ApiErrorMessageService();
  });

  it('extracts message from value[0].message', () => {
    const message = service.extract(
      { error: { value: [{ message: 'Error desde value' }] } },
      'fallback'
    );
    expect(message).toBe('Error desde value');
  });

  it('extracts message from validation keys', () => {
    const message = service.extract(
      { error: { V_PASSWORD: ['La contraseña actual es incorrecta.'] } },
      'fallback'
    );
    expect(message).toBe('La contraseña actual es incorrecta.');
  });

  it('extracts message from top-level message', () => {
    const message = service.extract(
      { error: { message: 'Token revocado.' } },
      'fallback'
    );
    expect(message).toBe('Token revocado.');
  });

  it('returns fallback when payload has no recognizable message', () => {
    const message = service.extract({ error: { status: 500 } }, 'fallback');
    expect(message).toBe('fallback');
  });

  it('extracts message from HttpErrorResponse wrapper when body has no message', () => {
    const message = service.extract(
      { status: 500, message: 'Http failure response for /api: 500 Internal Server Error' },
      'fallback'
    );
    expect(message).toContain('Http failure response');
  });

  it('gets status code from wrapper and payload', () => {
    expect(service.getStatusCode({ status: 401, error: {} })).toBe(401);
    expect(service.getStatusCode({ error: { statusCode: 422 } })).toBe(422);
    expect(service.getStatusCode({ error: { StatusCode: 403 } })).toBe(403);
  });
});
