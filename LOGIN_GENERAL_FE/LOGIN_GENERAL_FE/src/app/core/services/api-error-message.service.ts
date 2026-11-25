import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiErrorMessageService {
  private readonly prioritizedValidationKeys = [
    'V_PASSWORD',
    'V_NEW_PASSWORD',
    'V_REPEAT_PASSWORD',
    'passwordOld',
    'passwordNew',
    'passwordNewRep'
  ];

  extract(error: unknown, fallback: string): string {
    const wrapper = this.unwrapWrapper(error);
    const payload = this.unwrapPayload(error);

    const directMessage = this.readString(payload);
    if (directMessage) return directMessage;

    const prioritizedValidationMessage = this.readPrioritizedValidationMessage(payload);
    if (prioritizedValidationMessage) return prioritizedValidationMessage;

    const topLevelMessage = this.readFirstString(
      payload?.message,
      payload?.Message,
      payload?.detail,
      payload?.Detail,
      payload?.title,
      payload?.Title
    );
    if (topLevelMessage) return topLevelMessage;

    const valueMessage = this.readValueListMessage(payload);
    if (valueMessage) return valueMessage;

    const errorsDictionaryMessage = this.readErrorsDictionaryMessage(payload?.errors ?? payload?.Errors);
    if (errorsDictionaryMessage) return errorsDictionaryMessage;

    // HttpErrorResponse (Angular): fallback útil cuando no hay body estructurado
    const wrapperMessage = this.readFirstString(wrapper?.message, wrapper?.statusText);
    if (wrapperMessage) return wrapperMessage;

    return fallback;
  }

  getStatusCode(error: unknown): number | null {
    const wrapper = this.unwrapWrapper(error);
    const payload = this.unwrapPayload(error);

    const candidates = [
      wrapper?.status,
      payload?.status,
      payload?.statusCode,
      payload?.StatusCode
    ];

    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  }

  private unwrapPayload(error: unknown): any {
    const wrapper = this.unwrapWrapper(error);
    return wrapper?.error ?? wrapper;
  }

  private unwrapWrapper(error: unknown): any {
    if (!error || typeof error !== 'object') {
      return error;
    }

    return error as any;
  }

  private readString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }

  private readFirstString(...values: unknown[]): string | null {
    for (const value of values) {
      const result = this.readString(value);
      if (result) return result;
    }
    return null;
  }

  private readPrioritizedValidationMessage(payload: any): string | null {
    if (!payload || typeof payload !== 'object') return null;

    for (const key of this.prioritizedValidationKeys) {
      const candidate = payload?.[key];
      if (Array.isArray(candidate) && candidate.length) {
        const message = this.readString(candidate[0]);
        if (message) return message;
      }
    }

    return null;
  }

  private readValueListMessage(payload: any): string | null {
    const value = payload?.value ?? payload?.Value;
    if (!Array.isArray(value) || !value.length) return null;

    const first = value[0];
    if (typeof first === 'string') return this.readString(first);
    if (!first || typeof first !== 'object') return null;

    return this.readFirstString(
      first.message,
      first.Message,
      first.detail,
      first.Detail
    );
  }

  private readErrorsDictionaryMessage(errors: unknown): string | null {
    if (!errors || typeof errors !== 'object') return null;

    for (const value of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(value) && value.length) {
        const message = this.readString(value[0]);
        if (message) return message;
      }

      const direct = this.readString(value);
      if (direct) return direct;
    }

    return null;
  }
}
