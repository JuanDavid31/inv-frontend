import { Component, OnInit, ElementRef } from '@angular/core';
import { ROUTES } from '../sidebar/sidebar.component';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { NotificacionesService } from '../../services/notificaciones/notificaciones.service';
import { of } from 'rxjs';
import { LocalStorageService } from '../../services/localstorage/local-storage.service';
import { ToastService } from 'app/services/toast/toast.service';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

	mobile_menu_visible: any = 0;
	private toggleButton: any;
	private sidebarVisible: boolean;
	private listTitles: any[];
	location: Location;

	invitaciones = [];
	
	servidor: EventSource;

	constructor(private element: ElementRef,
		private serviciosNotificaciones: NotificacionesService,
		private serviciosLocalStorage: LocalStorageService,
		private serviciosToast: ToastService,
		private router: Router,
		private http: HttpClient,
		location: Location) {
		this.sidebarVisible = false;
		this.location = location;
	}

	ngOnInit() {
		this.prepararObserverNotificaciones();
		this.cargarInvitaciones();
		this.prepararSse();

		this.listTitles = ROUTES.filter(listTitle => listTitle);
		const navbar: HTMLElement = this.element.nativeElement;
		this.toggleButton = navbar.getElementsByClassName('navbar-toggler')[0];
		this.router.events.subscribe((event) => {
			this.sidebarClose();
			var $layer: any = document.getElementsByClassName('close-layer')[0];
			if ($layer) {
				$layer.remove();
				this.mobile_menu_visible = 0;
			}
		});
	}

	/**
	 * Se suscribe la los cambios emitidos cuando se acepta o rechaza una invitacón.
	 * Cuando se emite un evento, se elimina la invitación involucrada.
	 **/
	prepararObserverNotificaciones() {
		this.serviciosNotificaciones
			.changeEmitted$
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
	
	prepararSse(){
		this.servidor = new EventSource(`http://3.130.29.100:8080/eventos-invitaciones?email=${this.serviciosLocalStorage.darEmail()}`, {withCredentials: true})
		this.servidor.onmessage = this.recibirEvento.bind(this);
	}
	
	private recibirEvento(datos: MessageEvent) {
		const json: any = JSON.parse(datos.data);
		switch (json.accion) {
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

	private agregarNuevaInvitacion(invitacion){
		this.serviciosToast.mostrarToast(undefined, 'Tienes una nueva invitación');
		this.invitaciones.push(invitacion)
	}
	
	private notificarSobreInvitacionRespondida(datos){
		this.serviciosToast
		.mostrarToast(undefined, `La invitación al usuario ${datos.emailDestinatario} fue respondida.`);
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

	sidebarToggle() {
		var $toggle = document.getElementsByClassName('navbar-toggler')[0];

		if (this.sidebarVisible === false) {
			this.sidebarOpen();
		} else {
			this.sidebarClose();
		}
		const body = document.getElementsByTagName('body')[0];

		if (this.mobile_menu_visible == 1) {
			body.classList.remove('nav-open');
			if ($layer) {
				$layer.remove();
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
				setTimeout(function () {
					$layer.remove();
					$toggle.classList.remove('toggled');
				}, 400);
			}.bind(this);

			body.classList.add('nav-open');
			this.mobile_menu_visible = 1;

		}
	};

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
}