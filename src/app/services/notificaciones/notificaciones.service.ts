import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LocalStorageService } from '../localstorage/local-storage.service';
import { Router } from '@angular/router';
import { ToastService } from '../toast/toast.service';

@Injectable({
 providedIn: 'root'
})
export class NotificacionesService {

	private eliminarNotificacionSubject= new Subject<any>();
	eliminarNotificaciones$= this.eliminarNotificacionSubject.asObservable();
	
	constructor() { }

	// Service message commands
	eliminarNotificacionEnHeader(change: any) {
		this.eliminarNotificacionSubject.next(change);
	}
}