import { Component, OnInit, ViewChild } from '@angular/core';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { ToastService } from 'app/services/toast/toast.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

declare var cytoscape;
declare var $;

@Component({
	selector: 'app-resultados',
	templateUrl: './resultados.component.html',
	styleUrls: ['./resultados.component.scss']
})
export class ResultadosComponent implements OnInit {

	cy: any = {};
	problematicaActual: number;
	modalVisualizacionImagenNodo: any;
	nodoSeleccionado: any;

	grupos = [];
	grupoSeleccionado;
	escritos = [];
	escritoSeleccionado = { nombre: '', descripcion: '' };

	arregloGrupos: any[] = [];
	arregloEscritos: any[] = [];
	arreglodatosPdf: any[] = [];

	constructor(private serviciosLocalStorage: LocalStorageService,
		private serviciosToast: ToastService,
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
				this.problematicaActual = params.idProblematica;
				if (!this.problematicaActual) { this.router.navigateByUrl('/dashboard'); return; }

				this.prepararCytoscape();
				this.cargarNodosYEscritos();
				this.prepararEtiquetaHtmlEnNodos();
				this.prepararMenuGrupos();
				this.cargarArregloGrupos();

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
			.pipe(catchError(err => of(err)))
	}

	private darRequestEscritos() {
		const options = {
			headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
		}

		const email = this.serviciosLocalStorage.darEmail();
		if (!email) return;

		return this.http
			.get(`http://3.130.29.100:8080/problematicas/${this.problematicaActual}/escritos`, options)
			.pipe(catchError(err => of(err)))
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
		this.cy.layout({
			name: 'cose',
			nodeOverlap: 1,
			boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
		}).run()
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
		} else {
			this.grupos = res;
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
				select: () => {}
			}]
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
		this.cy.layout({
			name: 'cose',
			nodeOverlap: 1,
			boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
		}).run()
	}

	actualizarListaEscritos() {
		this.escritos = this.grupoSeleccionado.escritos;
	}

	cargarArregloGrupos() {

		const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

		const options = {
			headers: headers
		}
		this.http
			.get('http://3.130.29.100:8080/problematicas/' + this.problematicaActual + '/escritos', options)
			.pipe(catchError(err => of(err)))
			.subscribe(res => {
				if (res.error) {
					this.serviciosToast.mostrarToast('Error', 'Ocurrió un error al cargar las problematicas, intentelo de nuevo.', 'danger');
				} else {
					this.arregloGrupos = res;

				}
			})
	}


	cargarArregloEscritos() {

		let contador = 0;

		for (let d in this.arregloGrupos) {

			this.arreglodatosPdf[contador];

			const header = {
				text: [{ text: 'Grupo: ', style: 'header', bold: true }, this.arregloGrupos[d].nombreGrupo + '\n\n'],
				style: 'header',

			}

			this.arreglodatosPdf.push(header);


			for (let i in this.arregloGrupos[d].escritos) {

				this.arreglodatosPdf[contador];


				const headerTitulo = {
					text: this.arregloGrupos[d].escritos[i].nombre + '\n\n',
					style: 'subheader',
					bold: true


				};


				this.arreglodatosPdf.push(headerTitulo);

				const descripcionGrupo = {
					text: [this.arregloGrupos[d].escritos[i].descripcion + '. ', { text: ' Elaborado por ' + this.arregloGrupos[d].escritos[i].autor + '\n\n', style: 'parrafo', bold: true }],
					style: 'parrafo',

				};

				this.arreglodatosPdf.push(descripcionGrupo);
			}
		}
		contador = 0;

		return this.arreglodatosPdf;
	}


	generatePdf() {

		const escrito = {
			info: {
				title: 'Escritos problematicas\n\n',

			},

			alignment: 'justify',

			content: [{

				text: 'Resumen de escritos ',
				bold: true,
				fontSize: 16,
				alignment: 'center',
				margin: [20, 20, 20, 20]
			},
			{
				alignment: 'justify',
				columns: [
					this.cargarArregloEscritos(),

				]
			}],
			styles: {
				header: {
					fontSize: 14,


				},
				subheader: {
					fontSize: 13,


				},
				parrafo: {
					fontSize: 11
				}
			}

		}

		console.log(escrito);
		pdfMake.createPdf(escrito).open();
	}


	algo() {
		console.log(this.escritoSeleccionado);
	}

}