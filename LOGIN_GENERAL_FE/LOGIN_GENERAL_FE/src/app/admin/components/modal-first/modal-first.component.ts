import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-modal-first',
    imports: [CommonModule, FontAwesomeModule],
    templateUrl: './modal-first.component.html',
    styleUrl: './modal-first.component.scss'
})
export class ModalFirstComponent {

  faXmark = faXmark;

  @Input() title: string = 'Modal Title';
  @Input() isOpen: boolean = false;
  @Input() isCloseOut: boolean = false;
  @Output() cancelModal = new EventEmitter<void>();
  @Input() colorBgTitle: string = "bg-primary-500";

  onCancel() {
    if(this.isCloseOut){
      this.cancelModal.emit();
    }
  }

  btnClose(){
    this.cancelModal.emit();
  }
  
  closeOut(event: Event){
    if(this.isCloseOut){
      event.stopPropagation();
    }
  }
}
