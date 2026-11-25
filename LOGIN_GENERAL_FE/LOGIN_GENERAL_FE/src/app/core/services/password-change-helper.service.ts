import { Injectable } from '@angular/core';
import { UpdateUser } from '@models/auth.model';

export interface PasswordChangeFormValue {
  passwordOld: string | null | undefined;
  passwordNew: string | null | undefined;
  passwordNewRep: string | null | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordChangeHelperService {
  hasMismatch(value: PasswordChangeFormValue): boolean {
    return String(value.passwordNew ?? '') !== String(value.passwordNewRep ?? '');
  }

  buildUpdatePayload(userId: number | string | null | undefined, value: PasswordChangeFormValue): UpdateUser {
    return {
      v_ID_USER: String(userId ?? ''),
      v_PREVIOUS_PASSWORD: String(value.passwordOld ?? ''),
      v_NEW_PASSWORD: String(value.passwordNew ?? ''),
      v_REPEAT_PASSWORD: String(value.passwordNewRep ?? '')
    };
  }
}
