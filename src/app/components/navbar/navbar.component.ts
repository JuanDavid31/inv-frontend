import { Component, OnInit, ElementRef, ChangeDetectorRef, OnDestroy, NgZone } from '@angular/core';
import { ROUTES } from '../sidebar/sidebar.component';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, takeUntil } from 'rxjs/operators';
import { NotificacionesService } from '../../services/notificaciones/notificaciones.service';
import { of, Subject } from 'rxjs';
import { LocalStorageService } from '../../services/localstorage/local-storage.service';
import { ToastService } from 'app/services/toast/toast.service';
import { EventosSseService } from 'app/services/eventos-sse/eventos-sse.service';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

	mobile_menu_visible: any = 0;
	private toggleButton: any;
	private sidebarVisible: boolean;
	private listTitles: any[];
	location: Location;

	invitaciones = [];

	servidor: EventSource;

	private componentDestroyed$: Subject<boolean> = new Subject()

	constructor(private element: ElementRef,
		private serviciosNotificaciones: NotificacionesService,
		private serviciosEventosSse: EventosSseService,
		private serviciosLocalStorage: LocalStorageService,
		private serviciosToast: ToastService,
		private router: Router,
		private http: HttpClient,
		private ngZone: NgZone,
		location: Location) {
		this.sidebarVisible = false;
		this.location = location;
	}

	menuVisible: boolean = false;
	ultimoTamanio: number;

	ngOnInit() {
		this.prepararObserverNotificaciones();
		this.cargarInvitaciones();
		this.prepararSse();

		this.ultimoTamanio = window.innerWidth;

		window.onresize = (event) => {
			const nuevoTamanio = window.innerWidth;
			if (this.esMovil(this.ultimoTamanio) && this.esDesktop(nuevoTamanio) && this.menuVisible) {
				this.desbloquearDesplazamientoVertical();
			} else if (this.esMovil(nuevoTamanio) && this.esDesktop(this.ultimoTamanio) && this.menuVisible) {
				this.bloquearDesplazamientoVertical();
			}
			this.ultimoTamanio = window.innerWidth;
		}

		this.listTitles = ROUTES.filter(listTitle => listTitle);
		const navbar: HTMLElement = this.element.nativeElement;
		this.toggleButton = navbar.getElementsByClassName('navbar-toggler')[0];
		this.router.events.subscribe((event) => {
			this.sidebarClose();
			var $layer: any = document.getElementsByClassName('close-layer')[0];
			if ($layer) {
				$layer.remove();

				this.menuVisible = false;
				this.desbloquearDesplazamientoVertical();

				this.mobile_menu_visible = 0;
			}
		});
	}

	private esMovil(tamanio) {
		return tamanio <= 991;
	}

	private esDesktop(tamanio) {
		return tamanio > 991;
	}

	/**
	 * Se suscribe la los cambios emitidos cuando se acepta o rechaza una invitacón.
	 * Cuando se emite un evento, se elimina la invitación involucrada.
	 **/
	prepararObserverNotificaciones() {
		this.serviciosNotificaciones
			.eliminarNotificaciones$
			.pipe(takeUntil(this.componentDestroyed$))
			.subscribe(idInvitacion => {
				this.invitaciones = this.invitaciones.filter(invitacion => invitacion.idInvitacion !== idInvitacion);
			})
	}

	cargarInvitaciones() {
		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}
		this.http
			.get('http://3.130.29.100:8080/personas/' + this.serviciosLocalStorage.darEmail() + '/invitaciones', options)
			.pipe(catchError(err => of(err)))
			.subscribe(res => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Hubo un error al cargar las notificaciones, intentelo de nuveo.', 'danger');
				} else {
					this.invitaciones = res;
				}
			})
	}

	prepararSse() {
		this.servidor = new EventSource(`http://3.130.29.100:8080/eventos?email=${this.serviciosLocalStorage.darEmail()}`,
			{ withCredentials: true });
		this.servidor.onmessage = this.recibirEvento.bind(this);
	}

	private recibirEvento(datos: MessageEvent) {
		const json: any = JSON.parse(datos.data);
		switch (json.accion) {
			case 'Cambio fase problematica': console.log('Cambio fase problematica');
				this.actualizarFaseProblematica(json);
				break;
			case 'Invitacion recibida':
				this.agregarNuevaInvitacion(json.invitacion);
				break;
			case 'Invitacion respondida':
				this.notificarSobreInvitacionRespondida(json.invitacion);
				break;
			default:
				break;
		}
	}

	private actualizarFaseProblematica(json) {
		this.serviciosEventosSse.dispersarEventoCambioFaseProblematica(json);
	}

	private agregarNuevaInvitacion(invitacion) {
		this.serviciosToast.mostrarToast(undefined, 'Tienes una nueva invitación');
		this.ngZone.run(() => this.invitaciones.push(invitacion))
		this.serviciosEventosSse.dispersarEventoInvitacionRecibida(invitacion);
	}

	private notificarSobreInvitacionRespondida(invitacion) {
		this.serviciosToast
			.mostrarToast(undefined, `La invitación al usuario ${invitacion.emailDestinatario} fue respondida.`);

		this.serviciosEventosSse.dispersarEventoInvitacionRespondida(invitacion);
	}

	sidebarOpen() {
		const toggleButton = this.toggleButton;
		const body = document.getElementsByTagName('body')[0];
		setTimeout(function () {
			toggleButton.classList.add('toggled');
		}, 500);

		body.classList.add('nav-open');

		this.sidebarVisible = true;
	};

	sidebarClose() {
		const body = document.getElementsByTagName('body')[0];
		this.toggleButton.classList.remove('toggled');
		this.sidebarVisible = false;
		body.classList.remove('nav-open');
	};

	sidebarToggle() { //* Solo se llama al oprimir el boton, no he encontrado otra manera de abrir el menu
		this.menuVisible = true;
		this.bloquearDesplazamientoVertical();

		var $toggle = document.getElementsByClassName('navbar-toggler')[0];

		if (this.sidebarVisible === false) {
			this.sidebarOpen();
		} else {
			this.sidebarClose();
		}
		const body = document.getElementsByTagName('body')[0];

		if (this.mobile_menu_visible == 1) { //* No he encontrado un caso de uso donde esta condición suceda.
			body.classList.remove('nav-open');
			if ($layer) {
				$layer.remove(); console.log('No se llama');
			}
			setTimeout(function () {
				$toggle.classList.remove('toggled');
			}, 400);

			this.mobile_menu_visible = 0;
		} else {
			setTimeout(function () {
				$toggle.classList.add('toggled');
			}, 430);

			var $layer = document.createElement('div');
			$layer.setAttribute('class', 'close-layer');


			if (body.querySelectorAll('.main-panel')) {
				document.getElementsByClassName('main-panel')[0].appendChild($layer);
			} else if (body.classList.contains('off-canvas-sidebar')) {
				document.getElementsByClassName('wrapper-full-page')[0].appendChild($layer);
			}

			setTimeout(function () {
				$layer.classList.add('visible');
			}, 100);

			$layer.onclick = function () { //asign a function
				body.classList.remove('nav-open');
				this.mobile_menu_visible = 0;
				$layer.classList.remove('visible');
				const that = this;
				setTimeout(function () {
					$layer.remove();

					that.menuVisible = false;
					that.desbloquearDesplazamientoVertical();

					$toggle.classList.remove('toggled');
				}, 400);
			}.bind(this);

			body.classList.add('nav-open');
			this.mobile_menu_visible = 1;

		}
	};

	/**
	 * Habilidad el desplazamiento o scrolling en toda la app.
	 */
	private bloquearDesplazamientoVertical() {
		$('html, body').css({ overflow: 'hidden', height: '100%' });
	}

	/**
	 * Inhabilita el desplazamiento o scrolling en toda la app.
	 */
	private desbloquearDesplazamientoVertical() {
		$('html, body').css({ overflow: 'auto', height: 'auto' });
	}

	getTitle() {
		var titlee = this.location.prepareExternalUrl(this.location.path());
		if (titlee.charAt(0) === '#') {
			titlee = titlee.slice(1);
		}

		switch (titlee) {
			case '/fase-individual':
				return 'Fase individual';
			case '/fase-grupal':
				return 'Fase grupal';
			case '/notifications':
				return 'Notificaciones';
			case '/fase-reacciones':
				return 'Fase de reacciones';
			case '/fase-escritos':
				return 'Fase de escritos';
			case '/resultados':
				return 'Resultados';
		}

		for (var item = 0; item < this.listTitles.length; item++) {
			if (this.listTitles[item].path === titlee) {
				return this.listTitles[item].title;
			}
		}
		return 'Dashboard';
	}

	cerrarCesion() { //TODO: Cesion ?
		this.serviciosLocalStorage.eliminarDatos();
		this.router.navigateByUrl("/login");
	}

	mandarANotificaciones() { //TODO: mandar?
		this.router.navigateByUrl("/notifications");
	}

	ngOnDestroy() {
		this.servidor.close();
		$('html, body').css({ overflow: 'auto', height: '100%' });

		this.componentDestroyed$.next(true)
		this.componentDestroyed$.complete()
	}

}