import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private eliminarNotificacionSubject = new Subject<any>();
  eliminarNotificaciones$ = this.eliminarNotificacionSubject.asObservable();

  private actualizarNotificacionSubject = new Subject<any>();
  actualizarNotificacion$ = this.actualizarNotificacionSubject.asObservable();

  private agregarNotificacionSubject = new Subject<any>();
  agregarNotificacion$ = this.agregarNotificacionSubject.asObservable();

  constructor() { }

  // Service message commands
  eliminarNotificacionEnHeader(change: any) {
    this.eliminarNotificacionSubject.next(change);
  }

  actualizarNotificacionEnDashboard(change: any){
    this.actualizarNotificacionSubject.next(change);
  }

  agregarInvitacionEnNotifications(change: any){
    this.agregarNotificacionSubject.next(change);
  }
}