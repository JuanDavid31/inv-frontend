import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { LocalStorageService } from '../services/localstorage/local-storage.service';
import { ToastService } from 'app/services/toast/toast.service';
import { EventosSseService } from 'app/services/eventos-sse/eventos-sse.service';
declare var $;

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

	problematicas = [];
	problematicasTerminadas = [];
	invitaciones = [];
	escritos = [];
	nombreNuevaProblematica: string = '';
	descripcionNuevaProblematica: string = '';
	correoAInvitar: string;
	invitacionParaInterventor: boolean = false;
	problematicaSeleccionada: any = {};
	datosProblematica: any = {};

	autoCompletadoUsuariosAInvitar: any;
	resultadosCb: any;
	usuarioAInvitarSeleccioando;

	modal: any;
	ventanaMensajes: any;

	private componentDestroyed$: Subject<boolean> = new Subject()

	estadosInvitacion = {
		PENDIENTE: 'Pendiente',
		ACEPTADA: 'Aceptada',
		RECHAZADA: 'Rechazada'
	}

	constructor(
		private http: HttpClient,
		private ngZone: NgZone,
		private serviciosLocalStorage: LocalStorageService,
		private serviciosToast: ToastService,
		private serviciosEventosSse: EventosSseService,
		private router: Router) { }

	ngOnInit() {
		this.cargarProblematicas();
		this.cargarProblematicasTerminadas();
		this.autoCompletadoUsuariosAInvitar = $(document.getElementById('pac-input'))
			.typeahead({ source: this.activateAutoCompletadoUsuariosAInvitar.bind(this), minLength: 4 })
		this.modal = $('#mi-modal');

		this.serviciosEventosSse.eventoCambioFaseProblematica$
			.pipe(takeUntil(this.componentDestroyed$))
			.subscribe(this.cambioFaseProblematica.bind(this));
		this.serviciosEventosSse.eventoInvitacionRespondida$
			.pipe(takeUntil(this.componentDestroyed$))
			.subscribe(this.actualizarInvitacion.bind(this));
	}

	cargarProblematicas() {
		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}
		this.http
			.get('http://3.130.29.100:8080/personas/' + this.serviciosLocalStorage.darEmail() + '/problematicas', options)
			.pipe(catchError(err => of(err)))
			.subscribe(res => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Ocurrió un error al cargar las problematicas, intentelo de nuevo.', 'danger');
				} else {
					this.problematicas = res;
				}
			})
	}

	/**
	 * Si actualmente se estan viendo las invitaciones
	 * de la problematica que contiene esta invitación 
	 */
	actualizarInvitacion(nuevaInvitacion) {
		if (this.problematicaSeleccionada.id !== nuevaInvitacion.idProblematica) return;
		const index = this.invitaciones.findIndex(invitacion => invitacion.id === invitacion.id);
		this.ngZone.run(() => this.invitaciones[index] = nuevaInvitacion);
	}

	cargarProblematicasTerminadas() {
		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}

		const url = `http://3.130.29.100:8080/personas/${this.serviciosLocalStorage.darEmail()}/problematicas?fase=5`;

		this.http.get(url, options)
			.pipe(catchError(err => of(err)))
			.subscribe((res: any) => {
				if (res.error) {
					this.serviciosToast.mostrarToast(
						'Error',
						'Ocurrió un error al buscar las problematicas terminadas, intentelo de nuevo.',
						'danger');
				} else {
					this.problematicasTerminadas = res;
				}
			})
	}

	activateAutoCompletadoUsuariosAInvitar(query: string, result) {
		this.resultadosCb = result;
		this.buscarUsuarios(query);
	}

	buscarUsuarios(patron) {
		if (patron.length < 5) return;

		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}

		const url = `http://3.130.29.100:8080/problematicas/${this.problematicaSeleccionada.id}/personas` +
			`?email=${patron}&email-remitente=${this.serviciosLocalStorage.darEmail()}`;

		this.http.get(url, options)
			.pipe(catchError(err => of(err)))
			.subscribe((res: any) => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Ocurrió un error al buscar los usuarios, intentelo de nuevo.', 'danger');
				} else {
					this.prepareData(res);
				}
			})
	}

	prepareData(usuariosAInvitar) {
		usuariosAInvitar.forEach(usuario => usuario.name = `${usuario.email}`);
		this.resultadosCb(usuariosAInvitar);
		this.autoCompletadoUsuariosAInvitar.change(this.onChangeautoCompletadoUsuariosAInvitar.bind(this))
	}

	/**
	 * Default behaviour will call this several times.
	 */
	onChangeautoCompletadoUsuariosAInvitar() {
		let current = this.autoCompletadoUsuariosAInvitar.typeahead("getActive");
		if (current) {
			if (current.name == this.autoCompletadoUsuariosAInvitar.val()) {
				this.usuarioAInvitarSeleccioando = current;
				this.correoAInvitar = this.usuarioAInvitarSeleccioando.email;
			} else {
				this.usuarioAInvitarSeleccioando = {}
			}
		} else {
			this.usuarioAInvitarSeleccioando = {};
		}
	}

	private cambioFaseProblematica(datos) {
		console.log('dasboard cambio fase problematica.')
		const { idProblematica } = datos;

		const problematica = this.problematicas.find(problematica => problematica.id === idProblematica);

		if (problematica) {
			problematica.fase++;
			this.serviciosToast.mostrarToast(undefined, `La problematica  "${problematica.nombre}" avanzo su fase.`);
		}
	}

	cargarInvitados(problematica) {
		const { id } = problematica;

		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}
		this.http
			.get(`http://3.130.29.100:8080/problematicas/${id}/personas/${this.serviciosLocalStorage.darEmail()}/invitaciones`, options)
			.pipe(catchError(err => of(err)))
			.subscribe(res => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Ocurrió un error alcargar los invitados, intentelo de nuevo.', 'danger');
				} else {
					this.invitaciones = res;
				}
			})
		this.problematicaSeleccionada = problematica;
	}

	abrirModal() {
		this.modal.modal('toggle');
	}

	crearProblematica() {
		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}
		this.http.post(`http://3.130.29.100:8080/personas/${this.serviciosLocalStorage.darEmail()}/problematicas`, {
			nombre: this.nombreNuevaProblematica,
			descripcion: this.descripcionNuevaProblematica
		}, options).pipe(catchError(err => of(err)))
			.subscribe((res: any) => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Ocurrió un error al agregar la problematica, intentelo de nuevo.', 'danger');
				} else {
					this.problematicas.unshift(res);
					this.modal.modal('toggle');
					this.serviciosToast.mostrarToast(undefined, 'Problematica agregada', 'success');
				}
			})
	}

	invitar() {
		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers,
			withCredentials: true
		}

		this.http.post('http://3.130.29.100:8080/invitaciones', {
			idProblematica: this.problematicaSeleccionada.id,
			emailRemitente: this.serviciosLocalStorage.darEmail(),
			emailDestinatario: this.correoAInvitar,
			paraInterventor: this.invitacionParaInterventor
		}, options).pipe(catchError(err => of(err)))
			.subscribe((res: any) => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Ocurrió un error al invitar, intentelo de nuevo.', 'danger');
				} else {
					this.serviciosToast.mostrarToast(undefined, 'Usuario invitado.');
					this.invitaciones.push(res);
					this.correoAInvitar = '';
				}
			})
	}

	eliminarInvitacion(id) {
		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}
		this.http.delete(`http://3.130.29.100:8080/invitaciones/${id}`, options)
			.pipe(catchError(err => of(err)))
			.subscribe((res: any) => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Ocurrió un error al eliminar la invitación, intentelo de nuevo.', 'danger');
				} else {
					this.serviciosToast.mostrarToast(undefined, 'Invitación eliminada', 'success');
					this.invitaciones = this.invitaciones.filter(invitacion => invitacion.id !== id);
				}
			})
	}

	sePuedeAvanzarFase() {
		const { fase } = this.problematicaSeleccionada;
		switch (fase) {
			case 1:
				return this.datosProblematica.cantidadNodos >= 2;
			case 2:
				return this.datosProblematica.cantidadGrupos >= 1;
			case 3:
				return this.datosProblematica.cantidadReacciones >= 1;
			case 4:
				return this.datosProblematica.cantidadEscritos >= 1;
			default:
				return true;
		}
	}

	avanzarFase() { //TODO: Agregar a problematicas terminadas en caso de finalizar la misma.
		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}
		this.http
			.put(`http://3.130.29.100:8080/problematicas/${this.problematicaSeleccionada.id}?avanzar=${true}`, options, { withCredentials: true })
			.pipe(catchError(err => of(err)))
			.subscribe(res => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Hubo un error al avanzar la fase, intentelo de nuevo', 'danger');
				} else {
					this.avanzarFaseProblematica(this.problematicaSeleccionada.id);
					this.serviciosToast.mostrarToast(undefined, 'Se avanzo a la siguiente fase');
				}
			})
	}

	private avanzarFaseProblematica(idProblematica) {
		const problematica = this.problematicas
			.find(problematica => problematica.id === idProblematica);

		problematica.fase = problematica.fase + 1;

		//La problematica concluyo.
		if (problematica.fase === 5) {
			this.problematicasTerminadas.push(problematica);
		}
	}

	darFaseProblematica() {
		switch (this.problematicaSeleccionada.fase) {
			case 0:
				return "Invitando participantes";
			case 1:
				return "Manipulando Nodos (Individual)"
			case 2:
				return "Manipulando Nodos (Grupal)";
			case 3:
				return "Reaccionando a nodos";
			case 4:
				return "Elaborando escritos";
			case 5:
				return 'Problematica finalizada';
			default:
				return '';
		}
	}

	participar() {
		const { fase, id } = this.problematicaSeleccionada;

		switch (fase) {
			case 1:
				this.router.navigateByUrl("/fase-individual", { state: { idProblematica: id } });
				break;
			case 2:
				this.router.navigateByUrl("/fase-grupal", { state: { idProblematica: id } });
				break;
			case 3:
				this.router.navigateByUrl("/fase-reacciones", { state: { idProblematica: id } });
				break;
			case 4:
				this.router.navigateByUrl("/fase-escritos", { state: { idProblematica: id } });
				break;
			default:
				break;
		}
	}

	darClassEstado(invitacionVigente, estaRechazada) {
		const estado = this.darEstadoInvitacion(invitacionVigente, estaRechazada);

		switch (estado) {
			case this.estadosInvitacion.PENDIENTE:
				return 'bg-light';
			case this.estadosInvitacion.RECHAZADA:
				return 'bg-danger';
			case this.estadosInvitacion.ACEPTADA:
				return 'bg-success';
			default:
				return '';
		}
	}

	invitacionBorrable(invitacionVigente, estaRechazada) {
		const estado = this.darEstadoInvitacion(invitacionVigente, estaRechazada);
		if (estado === this.estadosInvitacion.ACEPTADA) { return false; }
		return true
	}

	darEstadoInvitacion(invitacionVigente, estaRechazada) {
		if (invitacionVigente && !estaRechazada) {
			return this.estadosInvitacion.PENDIENTE;
		} else if (!invitacionVigente && estaRechazada) {
			return this.estadosInvitacion.RECHAZADA;
		} else if (!invitacionVigente && !estaRechazada) {
			return this.estadosInvitacion.ACEPTADA;
		}
	}

	sePuedeInvitar(problematica) {
		return problematica.fase === 0 && problematica.esInterventor;
	}

	estaEnFase(pFase: number) {
		const { fase } = this.problematicaSeleccionada;
		return fase === pFase;
	}

	darInfoAlAvanzar() {
		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}
		this.http
			.get(`http://3.130.29.100:8080/problematicas/${this.problematicaSeleccionada.id}?estado=true`, options)
			.pipe(catchError(err => of(err)))
			.subscribe(res => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Hubo un error al cargar la información de la problematica, intentelo de nuevo', 'danger');
				} else {
					this.datosProblematica = res;
				}
			})
	}

	buscarEscritosPorProblematica(idProblematica) {
		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}

		this.http
			.get(`http://3.130.29.100:8080/problematicas/${idProblematica}/escritos`, options)
			.pipe(catchError(err => of(err)))
			.subscribe(res => {
				if (res.error) {
					this.serviciosToast.mostrarToast(
						'Error',
						'Hubo un error al cargar los escritos, intentelo de nuevo',
						'danger'
					);
				} else {
					this.escritos = res.flatMap(grupo => grupo.escritos);
				}
			})
	}

	cambioEscrito(escrito) {
		const { nombre, descripcion } = escrito;
		this.nombreNuevaProblematica = nombre;
		this.descripcionNuevaProblematica = descripcion;
	}

	verResultados() {
		this.router.navigateByUrl("/resultados", { state: { idProblematica: this.problematicaSeleccionada.id } });
	}

	ngOnDestroy() {
		this.componentDestroyed$.next(true);
		this.componentDestroyed$.complete();
	}

}