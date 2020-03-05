import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { ToastService } from 'app/services/toast/toast.service';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { map, takeUntil } from 'rxjs/operators';
import { forkJoin, Subject } from 'rxjs';
import { NgForm } from '@angular/forms';
import { EventosSseService } from '@services/http/eventos-sse/eventos-sse.service';
import { ProblematicaReaccionService } from '@app/services/http/problematica-reaccion/problematica-reaccion.service';
import { ProblematicaPersonaService } from '@app/services/http/problematica-persona/problematica-persona.service';
import { Escrito } from '@app/classes/Escrito';

declare var cytoscape;

@Component({
	selector: 'app-fase-escritos',
	templateUrl: './fase-escritos.component.html',
	styleUrls: ['./fase-escritos.component.scss']
})
export class FaseEscritosComponent implements OnInit, OnDestroy {

	cy: any = {};
	idProblematicaActual: number;
	modalVisualizacionImagenNodo: any;
	nodoSeleccionado: any;
	escritos: Escrito[] = [];

	nombreEscrito = '';
	descripcionEscrito = '';

	grupoSeleccionado = undefined;
	escritoSeleccionado: Escrito = new Escrito();

	private formEscrito: NgForm;

	private componentDestroyed$: Subject<boolean> = new Subject()

	@ViewChild('formEscrito', { static: false }) //No funciona si esta dentro de un *ngIf
	set form(content: NgForm) {
		this.formEscrito = content;
	}

	constructor(private serviciosLocalStorage: LocalStorageService,
		private serviciosToast: ToastService,
		private serviciosEventosSse: EventosSseService,
		private serviciosProblematicaPersona: ProblematicaPersonaService,
		private serviciosProblematicaReaccion: ProblematicaReaccionService,
		private http: HttpClient,
		private router: Router,
		private activatedRoute: ActivatedRoute) { }

	ngOnInit() {
		this.modalVisualizacionImagenNodo = $('#modal-visualizacion-imagen-nodo');
		this.iniciar();
	}

	private iniciar() {
		this.activatedRoute
			.paramMap
			.pipe(map(() => window.history.state))
			.subscribe(params => {
				this.idProblematicaActual = params.idProblematica;
				if (!this.idProblematicaActual) { this.router.navigateByUrl('/dashboard'); return; }

				this.serviciosEventosSse.eventoCambioFaseProblematica$
					.pipe(takeUntil(this.componentDestroyed$))
					.subscribe(this.evaluarProblematicaActualizada.bind(this));

				this.prepararCytoscape();
				this.cargarNodosYEscritos();
				this.prepararEtiquetaHtmlEnNodos();
				this.prepararMenuGrupos()
			})
	}

	private evaluarProblematicaActualizada(datos) {
		const { idProblematica } = datos;
		if (this.idProblematicaActual === idProblematica) {
			this.router.navigateByUrl('/dashboard');
			this.serviciosToast.mostrarToast(undefined,
				'Ya no puedes modificar esta fase porque la problematica ahora avanzo a una nueva fase.',
				'info');
		}
	}

	private prepararCytoscape() {
		this.cy = cytoscape({

			container: document.getElementById('cy'), // container to render in
			style: [ // the stylesheet for the graph
				{
					selector: 'node',
					style: {
						'label': 'data(id)',
						'font-size': '40',
						'height': 200,
						'width': 200,
						'background-fit': 'cover',
						'border-color': '#2980b9',
						'border-width': 3,
						'border-opacity': 0.5
					}
				},
				{
					selector: 'node:parent',
					style: {
						'label': 'data(nombre)',
						'font-size': '40',
						'height': 200,
						'width': 200,
						'background-fit': 'cover',
						'border-width': 3,
						'border-opacity': 0.5
					}
				},
				{
					selector: 'edge',
					style: {
						'width': 3,
						'curve-style': 'straight', //Necesario para que la flecha sea visible.
						'line-color': '#34495e',
						'target-arrow-color': '#2c3e50',
						'target-arrow-shape': 'triangle',
						'arrow-scale': '3'
					}
				}
			],

			minZoom: 0.1,
			maxZoom: 2
		});
		this.cy.on('select', this.visualizarEscrito.bind(this))
	}

	existeEscrito = false;

	private visualizarEscrito({ target }) {
		if (this.getOPutEnProceso || this.deleteEnProceso) return;
		if (!target.data().esGrupo) return;
		this.formEscrito.form.markAsPristine();
		this.grupoSeleccionado = target.data();

		this.escritoSeleccionado = this.escritos.find(escrito => escrito.idGrupo.toString() === this.grupoSeleccionado.id); //El id se guarda como String.

		if (this.escritoSeleccionado) {
			this.existeEscrito = true;
			//Hay escrito, muestro boton de editar y eliminar. Editar solo es esta habilitado si el formulario es valido.
			//Eliminar estara habilitado siempre que exista el escrito.
		}
		else { //No hay escrito. Muestro el boton de crear.
			this.existeEscrito = false;
			this.escritoSeleccionado = new Escrito()
			this.escritoSeleccionado.idGrupo = +this.grupoSeleccionado.id;
		}
	}

	private cargarNodosYEscritos() {
		const requestNodos = this.serviciosProblematicaReaccion
			.darGruposConReacciones(this.idProblematicaActual);
		const requestEscritos = this.serviciosProblematicaPersona
			.darEscritosPorProblematicaYPersona(this.idProblematicaActual);

		forkJoin([requestNodos, requestEscritos])
			.subscribe(res => {
				this.atenderRequestNodos(res[0]);
				this.atenderRequestEscritos(res[1]);
			})
	}

	private atenderRequestNodos(res) {
		if (res.error) {
			this.atenderErr('nodos')
		}
		else {
			this.dibujarNodos(res);
		}
	}

	private dibujarNodos(nodos) {
		this.dibujarNodosPadre(nodos);
		this.dibujarNodosHijo(nodos);
		// this.cy.layout({
		// 	name: 'cose',
		// 	nodeOverlap: 1,
		// 	boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
		// }).run()
		this.cy.layout({ name: 'cose-bilkent', nodeRepulsion: 1500, idealEdgeLength: 150, animationDuration: 400 }).run();
	}

	private dibujarNodosPadre(nodos) {
		nodos.filter(nodo => nodo.data.esGrupo)
			.forEach(grupo => {
				this.cy.add(grupo);
			});
	}

	private dibujarNodosHijo(nodos) {
		nodos.filter(nodo => !nodo.data.esGrupo)
			.forEach(nodo => {
				this.cy.add(nodo);

				this.cy.style()
					.selector(`#${nodo.data.id}`)
					.css({
						'background-image': `${nodo.data.urlFoto}`
					}).update();
			})
	}

	private atenderRequestEscritos(res) {
		if (res.error) {
			this.atenderErr('escritos');
		}
		else {
			this.escritos = res;
		}
	}

	private prepararEtiquetaHtmlEnNodos() {
		this.cy.nodeHtmlLabel([{
			query: 'node:parent',
			valign: "bottom",
			halign: "center",
			valignBox: "bottom",
			halignBox: "center",
			tpl: function (data) {
				return `
					<div class="mt-6" style="display:flex; flex-direction:row">
						<div style="display:flex; flex-direction:column;">
							<span class="far fa-frown fa-9x"></span> 
							<span class="mt-4" style="font-size: 60px; display: flex; justify-content: center;"> 
								${data.reaccionesNegativas} 
							</span>
						</div>
						<div class="ml-2 mr-2" style="display:flex; flex-direction:column;">
							<span class="far fa-meh fa-9x"></span>
							<span class="mt-4" style="font-size: 60px; display: flex; justify-content: center;"> 
    							${data.reaccionesNeutras} 
    						</span>
						</div>
						<div  style="display:flex; flex-direction:column;">
							<span class="far fa-smile-beam fa-9x"></span>
							<span class="mt-4" style="font-size: 60px; display: flex; justify-content: center;"> 
								${data.reaccionesPositivas} 
							</span>
						</div>
					</div>
				`;
			}
		}]);
	}

	private prepararMenuGrupos() {
		this.cy.cxtmenu({
			selector: 'node',
			commands: [{
				// visualizar imagen
				content: '<span class="fa fa-eye fa-2x"></span>',
				select: this.abrirModalImagenNodo.bind(this)
			},
			{
				content: '<span class="fa fa-check fa-2x"></span>',
				select: () => { }
			}
			]
		});
	}

	private abrirModalImagenNodo(elemento) {
		if (elemento.data().esGrupo || !elemento.isNode()) {
			this.serviciosToast.mostrarToast('Error', 'Solo se pueden visualizar las imagenes de los nodos o individuales.', 'danger');
			return;
		}
		this.nodoSeleccionado = elemento.data();
		this.modalVisualizacionImagenNodo.modal('toggle');
	}

	private atenderErr(datos) {
		this.serviciosToast.mostrarToast('Error', `Ocurrio un error al cargar los ${datos}`, 'danger');
	}

	organizar() {
		// this.cy.layout({
		// 	name: 'cose',
		// 	nodeOverlap: 1,
		// 	boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
		// }).run()
		this.cy.layout({ name: 'cose-bilkent', nodeRepulsion: 1500, idealEdgeLength: 150, animationDuration: 400 }).run();
	}

	getOPutEnProceso = false;

	crearEscrito() {
		this.getOPutEnProceso = true;

		this.serviciosProblematicaPersona
			.agregarEscrito(this.idProblematicaActual, this.escritoSeleccionado)
			.subscribe(res => {
				this.getOPutEnProceso = false;
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', res.error.errors[0], 'danger');
				} else {
					this.serviciosToast.mostrarToast(undefined, 'Escrito agregado', 'success');
					this.escritos.push(res);
					const data = this.grupoSeleccionado;
					this.visualizarEscrito({ target: { data: function () { return data } } })
				}
			});
	}

	editarEscrito() {
		this.getOPutEnProceso = true;

		this.serviciosProblematicaPersona
			.actualizarEscrito(this.idProblematicaActual, this.escritoSeleccionado)
			.subscribe(res => {
				this.getOPutEnProceso = false;
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', res.error.errors[0], 'danger');
				} else {
					this.serviciosToast.mostrarToast(undefined, 'Escrito guardado.', 'success');
					this.formEscrito.control.markAsPristine();
				}
			});
	}

	deleteEnProceso = false;

	eliminarEscrito() {
		this.deleteEnProceso = true;

		this.serviciosProblematicaPersona
			.eliminarEscrito(this.idProblematicaActual, this.escritoSeleccionado.id)
			.subscribe(res => {
				this.deleteEnProceso = false;
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', res.error.errors[0], 'danger');
				} else {
					this.serviciosToast.mostrarToast(undefined, 'Escrito borrado.', 'success');

					const index = this.escritos.findIndex(escrito => escrito.id === this.escritoSeleccionado.id);
					this.escritos.splice(index, 1);
					this.cy.getElementById(this.grupoSeleccionado.id).unselect();
					this.grupoSeleccionado = undefined;
				}
			});
	}

	ngOnDestroy() {
		this.componentDestroyed$.next(true)
		this.componentDestroyed$.complete()
	}
}
