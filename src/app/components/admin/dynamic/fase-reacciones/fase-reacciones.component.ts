import { Component, OnInit, OnDestroy } from '@angular/core';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from 'app/services/toast/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EventosSseService } from '@services/http/eventos-sse/eventos-sse.service';
import { PersonaProblematicaService } from '@app/services/http/persona-problematica/persona-problematica.service';
declare var cytoscape;

@Component({
    selector: 'app-fase-reacciones',
    templateUrl: './fase-reacciones.component.html',
    styleUrls: ['./fase-reacciones.component.css']
})
export class FaseReaccionesComponent implements OnInit, OnDestroy {

    nombreNodo = '';
    cy: any = {};
    idGrupoSeleccionado: any;
    modalVisualizacionImagenNodo: any;
    nodoSeleccionado: any

    idProblematicaActual: number;

    private componentDestroyed$: Subject<boolean> = new Subject()

    constructor(private serviciosLocalStorage: LocalStorageService,
        private serviciosToast: ToastService,
        private serviciosEventosSse: EventosSseService,
        private serviciosPersonaProblematica: PersonaProblematicaService,
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
                this.cargarNodos();
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

    private cargarNodos() {
        this.serviciosPersonaProblematica
            .darGrupos(this.idProblematicaActual)
            .subscribe(res => {
                if (res.error) {
                    this.atenderErr(res.error);
                } else {
                    this.dibujarNodos(res);
                }
            });
    }

    private dibujarNodos(nodos) {
        this.dibujarNodosPadre(nodos);
        this.dibujarNodosHijo(nodos);

        // this.cy.layout({
        //     name: 'cose',
        //     nodeOverlap: 1,
        //     boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
        // }).run()
        this.cy.layout({ name: 'cose-bilkent', nodeRepulsion: 2000, idealEdgeLength: 150, animationDuration: 400 }).run();
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

    private prepararEtiquetaHtmlEnNodos() {
        this.cy.nodeHtmlLabel([{
            query: 'node:parent',
            valign: "bottom",
            halign: "center",
            valignBox: "bottom",
            halignBox: "center",
            tpl: function (data) {
                switch (data.reaccion) {
                    case -1:
                        return '<span class="far fa-frown fa-9x" ></span>';
                    case 0:
                        return '<span class="far fa-meh fa-9x" ></span>';
                    case 1:
                        return '<span class="far fa-smile-beam fa-9x" ></span>';
                    default:
                        return '<span></span>';
                }
            }
        }]);
    }

    private prepararMenuGrupos() {
        this.cy.cxtmenu({
            selector: 'node',
            commands: [

                {
                    //Reacción positiva
                    content: '<span class="far fa-frown fa-3x" ></span>',
                    select: this.reaccionar.bind(this, -1)
                },
                {
                    //reacción negativa
                    content: '<span class="far fa-smile-beam fa-3x" ></span>',
                    select: this.reaccionar.bind(this, 1)
                },
                {
                    // reacción neutra
                    content: '<span class="far fa-meh fa-3x" ></span>',
                    select: this.reaccionar.bind(this, 0)
                },
                {
                    // visualizar imagen
                    content: '<span class="fa fa-eye fa-2x"></span>',
                    select: this.abrirModalImagenNodo.bind(this)
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


    private atenderErr(err) {
        this.serviciosToast.mostrarToast('Error', err.erros[0], 'danger');
    }

    private reaccionar(valorReaccion, elemento) {
        if (!elemento.data().esGrupo) {
            this.serviciosToast.mostrarToast('Error', 'Solo se puede reaccionar sobre un grupo.', 'danger')
            return;
        } else {
            this.idGrupoSeleccionado = elemento.data().id;

            this.serviciosPersonaProblematica
                .reaccionar(this.idProblematicaActual, this.idGrupoSeleccionado, valorReaccion)
                .subscribe(res => {
                    if (res.error) {
                        this.atenderErr(res.error);
                    } else {
                        this.cy.getElementById(`${res.idGrupo}`).data({ reaccion: res.valor })
                    }
                });
        }
    }

    organizar() {
        // this.cy.layout({
        //     name: 'cose',
        //     nodeOverlap: 1,
        //     boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
        // }).run()
        this.cy.layout({ name: 'cose-bilkent', nodeRepulsion: 2000, idealEdgeLength: 150, animationDuration: 400 }).run();
    }

    ngOnDestroy() {
        this.componentDestroyed$.next(true)
        this.componentDestroyed$.complete()
    }
}
