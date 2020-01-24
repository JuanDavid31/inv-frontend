import { Component, OnInit, ViewChild, ViewChildren, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { ToastService } from 'app/services/toast/toast.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of , forkJoin } from 'rxjs';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { NgForm } from '@angular/forms';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

declare var cytoscape;

@Component({
	selector: 'app-fase-escritos',
	templateUrl: './fase-escritos.component.html',
	styleUrls: ['./fase-escritos.component.scss']
})
export class FaseEscritosComponent implements OnInit{

	cy: any = {};
	problematicaActual: number;
	modalVisualizacionImagenNodo: any;
	nodoSeleccionado: any;
	escritos: any[] = [];

	nombreEscrito = '';
	descripcionEscrito = '';

	grupoSeleccionado = undefined;
	escritoSeleccionado: any = {};
	
	private formEscrito: NgForm;

	@ViewChild('formEscrito', {static: false}) //No funciona si esta dentor de un *ngIf
	set form(content: NgForm) {
    	this.formEscrito = content;
	}

	constructor(private serviciosLocalStorage: LocalStorageService,
		private serviciosToast: ToastService,
		private http: HttpClient,
		private router: Router,
		private activatedRoute: ActivatedRoute) {}

	ngOnInit() {
		this.modalVisualizacionImagenNodo = $('#modal-visualizacion-imagen-nodo');
		this.iniciar();
	}

	private iniciar() {
		this.activatedRoute
			.paramMap
			.pipe(map(() => window.history.state))
			.subscribe(params => {
				this.problematicaActual = params.idProblematica;
				if (!this.problematicaActual) { this.router.navigateByUrl('/dashboard'); return; }

				this.prepararCytoscape();
				this.cargarNodosYEscritos();
				this.prepararEtiquetaHtmlEnNodos();
				this.prepararMenuGrupos()
			})
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
		if(this.getOPutEnProceso || this.deleteEnProceso)return;
		if (!target.data().esGrupo) return;
		this.formEscrito.form.markAsPristine();
		this.grupoSeleccionado = target.data();

		const idGrupo = this.grupoSeleccionado.id;
		this.escritoSeleccionado = this.escritos.find(escrito => escrito.idGrupo.toString() === this.grupoSeleccionado.id); //El id se guarda como String.

		if (this.escritoSeleccionado) {
			this.existeEscrito = true;
			//Hay escrito, muestro boton de editar y eliminar. Editar solo es esta habilitado si el formulario es valido.
			//Eliminar estara habilitado siempre que exista el escrito.
		}
		else { //No hay escrito. Muestro crear.
			this.existeEscrito = false;
			this.escritoSeleccionado = {
				nombre: '',
				descripcion: '',
				idGrupo: +this.grupoSeleccionado.id
			}
		}
	}

	private cargarNodosYEscritos() {
		const requestNodos = this.darRequestNodos();
		const requestEscritos = this.darRequestEscritos();

		forkJoin([requestNodos, requestEscritos])
			.subscribe(res => {
				this.atenderRequestNodos(res[0]);
				this.atenderRequestEscritos(res[1]);
			})
	}

	private darRequestNodos() {
		const options = {
			headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
		}

		return this.http
			.get(`http://3.130.29.100:8080/problematicas/${this.problematicaActual}/reacciones`, options)
			.pipe(catchError(err => of (err)))
	}

	private darRequestEscritos() {
		const options = {
			headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
		}

		const email = this.serviciosLocalStorage.darEmail();
		if (!email) return;

		return this.http
			.get(`http://3.130.29.100:8080/problematicas/${this.problematicaActual}/personas/${email}/escritos`, options)
			.pipe(catchError(err => of (err)))
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
		console.log(this.cy.nodes().jsons())
		this.cy.layout({
			name: 'cose',
			nodeOverlap: 1,
			boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
		}).run()
		console.log(this.cy.nodes().jsons())

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
			this.escritos = [];
		}
	}

	private prepararEtiquetaHtmlEnNodos() {
		this.cy.nodeHtmlLabel([{
			query: 'node:parent',
			valign: "bottom",
			halign: "center",
			valignBox: "bottom",
			halignBox: "center",
			tpl: function(data) {
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
					content: 'Nada'
				}
			]
		});
	}

	private abrirModalImagenNodo(elemento) {
		if (elemento.data().esGrupo || !elemento.isNode()) {
			this.serviciosToast.mostrarToast({
				titulo: 'Error',
				cuerpo: 'Solo se pueden visualizar las imagenes de los nodos o individuales.',
				esMensajeInfo: false
			})
			return;
		}
		this.nodoSeleccionado = elemento.data();
		this.modalVisualizacionImagenNodo.modal('toggle');
	}

	private atenderErr(datos) {
		this.serviciosToast.mostrarToast({
			titulo: 'Error',
			cuerpo: `Ocurrio un error al cargar los ${datos}`,
			esMensajeInfo: false
		});
	}

	organizar() {
		this.cy.layout({
			name: 'cose',
			nodeOverlap: 1,
			boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
		}).run()
	}
	
	getOPutEnProceso = false;

	crearEscrito() {
		this.getOPutEnProceso = true;
		const options = {
			headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
		}

		const url = `http://3.130.29.100:8080/problematicas/${this.problematicaActual}/personas/` +
			`${this.serviciosLocalStorage.darEmail()}/escritos`;

		this.http
			.post(url, this.escritoSeleccionado, options)
			.pipe(catchError(err => of (err)))
			.subscribe(res => {
				this.getOPutEnProceso = false;
				if (res.error) {
					//TODO: Recibir mensaje de success
					this.serviciosToast.mostrarToast({ esMensajeInfo: false, titulo: 'Error', cuerpo: res.error.errors[0] });
					
					
					//TODO: Poner modo edición.
					const data = this.grupoSeleccionado;
					this.visualizarEscrito({target: {data}})
				} else {
					this.serviciosToast.mostrarToast({ cuerpo: 'Escrito agregado.' })
					this.escritos.push(res);
				}
			});
	}

	editarEscrito() {
		this.getOPutEnProceso = true;
		const options = {
			headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
		}

		const url = `http://3.130.29.100:8080/problematicas/${this.problematicaActual}/personas/` +
			`${this.serviciosLocalStorage.darEmail}/escritos/${this.escritoSeleccionado.id}`;

		this.http
			.put(url, this.escritoSeleccionado, options)
			.pipe(catchError(err => of (err)))
			.subscribe(res => {
				this.getOPutEnProceso = false;
				if (res.error) {
					this.serviciosToast.mostrarToast({ esMensajeInfo: false, titulo: 'Error', cuerpo: res.error.errors[0] });
				} else {
					this.serviciosToast.mostrarToast({ cuerpo: 'Escrito guardado.' })
				}
			});
	}
	
	deleteEnProceso = false;

	eliminarEscrito() {
		this.deleteEnProceso = true;
		const options = {
			headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
		}

		const url = `http://3.130.29.100:8080/problematicas/${this.problematicaActual}/personas/` +
			`${this.serviciosLocalStorage.darEmail}/escritos/${this.escritoSeleccionado.id}`;

		this.http
			.delete(url, options)
			.pipe(catchError(err => of (err)))
			.subscribe(res => {
				this.deleteEnProceso = false;
				if (res.error) {
					this.serviciosToast.mostrarToast({ esMensajeInfo: false, titulo: 'Error', cuerpo: res.error.errors[0] });
				} else {
					this.serviciosToast.mostrarToast({ cuerpo: 'Escrito borrado.' });
					const index = this.escritos.findIndex(escrito => escrito.id === this.escritoSeleccionado.id);
					this.escritos.splice(index, 1);
					this.grupoSeleccionado = undefined;
				}
			});
	}

	testing(form) {
		console.log(form);
		console.log(form.controls);
		return '';
	}



	escritosPdf = [];
	nombresPdf = 'Algo iba aquí';

	generatePdf() {

		var datos = "";

		for (var d = 0; d < this.escritosPdf.length; d++) {

			datos += this.escritosPdf[d] + "\n";

		}
		let documentDefinition = {
			info: {
				title: 'Escritos problematicas',

			},

			content: [{
					text: 'Resumen de escritos',
					bold: true,
					fontSize: 20,
					alignment: 'center',
					margin: [0, 0, 0, 20]
				},
				{
					columns: [
						[

							{
								text: 'Elaborado por: ' + 'Diego Pena',
								style: 'name'
							},
							{
								text: datos
							}
						],
						[
							// Document definition for Profile pic
						]
					]
				}
			],
			styles: {
				name: {
					fontSize: 16,
					bold: true
				}
			}

		}


		pdfMake.createPdf(documentDefinition).open();
	}


	generarDatosPdf() {

		var datos = "{info: {title: 'Escritos problematicas', },content: [{ text: 'Resumen de escritos',bold: true, fontSize: 20, alignment: 'center', margin: [0, 0, 0, 20] }, {columns: [[ ";

		for (var d = 0; d < this.escritosPdf.length; d++) {

			datos += "{ text: 'Elaborado por: ' +" + this.nombresPdf + ", style: 'name'},{ text:" + this.escritosPdf + "},";

		}
		datos += "],[ ]]}],styles: { name: { fontSize: 16,bold: true } }"

		return datos;
	}
}