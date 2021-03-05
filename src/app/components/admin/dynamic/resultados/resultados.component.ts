import { Component, OnInit } from '@angular/core';
import { ToastService } from 'app/services/toast/toast.service';
import { Router, ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Escrito } from '@app/classes/Escrito';
import { ProblematicaEscritoService } from '@app/services/http/problematica-escrito/problematica-escrito.service';
import { ProblematicaReaccionService } from '@app/services/http/problematica-reaccion/problematica-reaccion.service';
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
	idProblematicaActual: number;
	nombreProblematica: string;
	modalVisualizacionImagenNodo: any;
	nodoSeleccionado: any;

	grupos = [];
	grupoSeleccionado;
	escritos: Escrito[] = [];
	escritoSeleccionado: Escrito = new Escrito();

	constructor(private serviciosToast: ToastService,
		private serviciosProblematicaReaccion: ProblematicaReaccionService,
		private serviciosProblematicaEscrito: ProblematicaEscritoService,
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
				this.nombreProblematica = params.nombreProblematica;
				if (!this.idProblematicaActual) { this.router.navigateByUrl('/dashboard'); return; }

				this.prepararCytoscape();
				this.cargarNodosYEscritos();
				this.prepararEtiquetaHtmlEnNodos();
				this.prepararMenuGrupos();
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
		this.cy.on('position', this.positionEvent.bind(this));
	}

	private positionEvent(event) {
		console.log('position');
		const nodo = event.target;
		if (nodo.data().esGrupo) {
			this.refrescarEdges();
		}
	}

	private refrescarEdges() {
		const edges = this.cy.edges();
		edges.forEach(edge => {
			const data = edge.data();
			edge.remove();
			this.cy.add({ data });
		})
	}

	private cargarNodosYEscritos() {
		const requestNodos = this.serviciosProblematicaReaccion.darGruposConReacciones(this.idProblematicaActual);//darRequestNodos();
		const requestEscritos = this.serviciosProblematicaEscrito.darEscritosPorProblematica(this.idProblematicaActual); //darRequestEscritos();

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
				select: () => { }
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
		// this.cy.layout({
		// 	name: 'cose',
		// 	nodeOverlap: 1,
		// 	boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
		// }).run()
		this.cy.layout({ name: 'cose-bilkent', nodeRepulsion: 1500, idealEdgeLength: 150, animationDuration: 400 }).run();
	}

	actualizarListaEscritos() {
		this.escritos = this.grupoSeleccionado.escritos;
	}


	darDatosPdf() {

		const datosPdf = [];

		this.grupos.forEach(grupo => {

			const header = {
				text: [{ text: 'Grupo: ', style: 'header', bold: true }, grupo.nombreGrupo + '\n\n'],
				style: 'header',
			}

			datosPdf.push(header);

			grupo.escritos.forEach(escrito => {
				const headerTitulo = {
					text: escrito.nombre + '\n\n',
					style: 'subheader',
					bold: true
				};

				datosPdf.push(headerTitulo);

				const descripcionGrupo = {
					text: [escrito.descripcion + '. ', { text: ' Elaborado por ' + escrito.autor + '\n\n', style: 'parrafo', bold: true }],
					style: 'parrafo',
				};

				datosPdf.push(descripcionGrupo);
			})

		});
		return datosPdf;
	}


	generatePdf() {
		const escrito = {
			info: {
				title: 'Escritos problematicas\n\n',
			},
			alignment: 'justify',
			content: [{
				text: this.nombreProblematica,
				bold: true,
				fontSize: 16,
				alignment: 'center',
				margin: [20, 20, 20, 20]
			},
			{
				alignment: 'justify',
				columns: [
					this.darDatosPdf(),
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

		pdfMake.createPdf(escrito).open();
	}
}
