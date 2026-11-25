import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExternalNavigationService {
  openInNewTab(url: string): void {
    window.open(url, '_blank');
  }

  openInSameTab(url: string): void {
    window.location.assign(url);
  }
}
