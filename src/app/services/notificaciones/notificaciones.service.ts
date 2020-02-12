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
	
	private actualizarNotificacionSubject= new Subject<any>();
	actualizarNotificacion$= this.actualizarNotificacionSubject.asObservable();
	
	private agregarNotificacionSubject= new Subject<any>();
	agregarNotificacion$= this.agregarNotificacionSubject.asObservable();

	constructor(private router: Router,
				private serviciosToast: ToastService) { }

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
  
	idProblematicaActual: number;
	servidor: EventSource;
  
	suscribirseANotificaciones(idProblematica: number, email: string){
		this.servidor= new EventSource(`http://3.130.29.100:8080/eventos-dashboard?email=${email}`, {withCredentials: true})
		this.servidor.onmessage= this.recibirEvento;
	}
  
	recibirEvento(datos){
		const { idProblematica }= datos.data;
		if(this.idProblematicaActual=== idProblematica){
			this.router.navigateByUrl('/dashboard');
			this.serviciosToast.mostrarToast(undefined, 
				'Ya no puedes modificar esta fase porque la problematica ahora avanzo a una nueva fase.', 
				'info');
		}
	}
  
	terminarSuscripcion(){
		if(this.servidor){
			this.servidor.close();	
		}
	}
}