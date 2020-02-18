import { Component, OnInit, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { LocalStorageService } from '@services/localstorage/local-storage.service';
import { NotificacionesService } from 'app/services/notificaciones/notificaciones.service';
import { ToastService } from 'app/services/toast/toast.service';
import { EventosSseService } from 'app/services/eventos-sse/eventos-sse.service';

@Component({
	selector: 'app-notifications',
	templateUrl: './notifications.component.html',
	styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {

	invitaciones = [];
	decision: boolean;
	idProblematica;

	private componentDestroyed$: Subject<boolean> = new Subject()

	constructor(private http: HttpClient,
		private ngZone: NgZone,
		private serviciosLocalStorage: LocalStorageService,
		private serviciosNotificaciones: NotificacionesService,
		private serviciosEventosSse: EventosSseService,
		private serviciosToast: ToastService) { }

	ngOnInit() {
		this.cargarInvitaciones();

		this.serviciosEventosSse.eventoInvitacionRecibida$
			.pipe(takeUntil(this.componentDestroyed$))
			.subscribe(this.agregarInvitacion.bind(this));
	}

	cargarInvitaciones() {
		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}

		this.http
			.get(`http://3.130.29.100:8080/personas/${this.serviciosLocalStorage.darEmail()}/invitaciones`, options)
			.pipe(catchError(err => of(err)))
			.subscribe(res => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Hubo un error al cargar las invitaciones, intentelo de nuevo.', 'danger');
				} else {
					this.invitaciones = res;
				}
			})
	}

	/**
	 * Agrega la invitación cuando esta es notificada.
	 */
	private agregarInvitacion(invitacion) {
		this.ngZone.run(() => this.invitaciones.push(invitacion));
	}

	aceptarInvitacion(invitacion, decision: boolean) {
		const { idInvitacion, idProblematica, emailRemitente, paraInterventor } = invitacion;

		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers,
			withCredentials: true
		}

		this.http.put(`http://3.130.29.100:8080/invitaciones/${idInvitacion}?aceptar=${decision}`, {
			idProblematica,
			emailRemitente,
			emailDestinatario: this.serviciosLocalStorage.darEmail(),
			paraInterventor
		}, options).pipe(catchError(err => of(err)))
			.subscribe(res => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Hubo un error al aceptar la invitación, intentelo de nuevo.', 'danger')
				} else {
					this.serviciosToast.mostrarToast(undefined, 'Invitación aceptada');
					this.invitaciones = this.invitaciones.filter(invitacion => invitacion.idInvitacion !== res.id);
					//this.changeDetector.detectChanges();
					this.eliminarNotificacion(res.id);
				}
			})
	}

	rechazarInvitacion(invitacion) {

		this.decision = false;

		const { idInvitacion, idProblematica, emailRemitente, paraInterventor } = invitacion;

		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers,
			withCredentials: true
		}

		this.http.put(`http://3.130.29.100:8080/invitaciones/${idInvitacion}?aceptar=${this.decision}`, {
			idProblematica,
			emailRemitente,
			emailDestinatario: this.serviciosLocalStorage.darEmail(),
			paraInterventor
		}, options).pipe(catchError(err => of(err)))
			.subscribe((res: any) => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Hubo un error al rechazar la invitación, intentelo de nuevo.', 'danger')
				} else {
					this.serviciosToast.mostrarToast(undefined, 'Rechazaste la invitación');
					this.invitaciones = this.invitaciones.filter(invitacion => invitacion.idInvitacion !== res.id);
					this.eliminarNotificacion(res.id);
				}
			})
	}

	eliminarNotificacion(idInvitacion) {
		this.serviciosNotificaciones
			.eliminarNotificacionEnHeader(idInvitacion);
	}

	ngOnDestroy() {
		this.componentDestroyed$.next(true)
		this.componentDestroyed$.complete()
	}

}