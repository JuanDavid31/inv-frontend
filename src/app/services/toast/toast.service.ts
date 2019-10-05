import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  // Observable string sources
  private emitChangeSource = new Subject<any>();

  constructor() { }

  // Observable string streams
  changeEmitted$ = this.emitChangeSource.asObservable();

  // Service message commands
  mostrarToast(change: any) {
    this.emitChangeSource.next(change);
  }
}
