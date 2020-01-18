import { Component, OnInit } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from 'app/services/toast/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
declare var cytoscape;

@Component({
  selector: 'app-table-list',
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.css']
})
export class TableListComponent implements OnInit {

    nodos = [];
    nodoDe: any;
    nodoA: any;
    nombreNodo = '';
    cy: any = {}; 
    idGrupoSeleccionado: any;
    modalVisualizacionImagenNodo: any;

    problematicaActual: number;

   constructor(private serviciosLocalStorage: LocalStorageService,
        private serviciosToast: ToastService,
        private http: HttpClient,
        private router: Router,
        private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.iniciar();
   this.prepararMenuGrupos()
    this.modalVisualizacionImagenNodo = $('#modal-visualizacion-imagen-nodo');
  }
  
   private iniciar() {
        this.activatedRoute
            .paramMap
            .pipe(map(() => window.history.state))
            .subscribe(params => {
                this.problematicaActual = params.idProblematica;
                if (!this.problematicaActual) { this.router.navigateByUrl('/dashboard') }

                this.nodoDe = {};
                this.nodoA = {};

                this.prepararCytoscape();
                this.cargarNodos();
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
    
    private cargarNodos() {
        const options = {
            headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
        }

        const email = this.serviciosLocalStorage.darEmail();

        this.http
            .get(`http://3.130.29.100:8080/problematicas/${this.problematicaActual}/grupos?email=${email}`, options)
            .pipe(catchError(err => of(err)))
            .subscribe(res => {
                if (res.error) {
                    this.atenderErr(res.error);
                } else {
                    this.dibujarNodos(res);
                }
            });
    }
    
     private dibujarNodos(nodos) {
        this.nodos = nodos;
        
        
        this.dibujarNodosPadre(nodos);
        this.dibujarNodosHijo(nodos);

        this.cy.layout({
            name: 'cose',
			nodeOverlap: 1,
			boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
        }).run()

        
    }
    
    private dibujarNodosPadre(nodos){
        nodos.filter(nodo => nodo.data.esGrupo)
			.forEach(grupo => {
				this.cy.add(grupo);
			});
    }
    
    private dibujarNodosHijo(nodos){
        nodos.filter( nodo => !nodo.data.esGrupo)
        .forEach(nodo => {
            this.cy.add(nodo);

            this.cy.style()
                .selector(`#${nodo.data.id}`)
                .css({
                    'background-image': `${nodo.data.urlFoto}`
                }).update();
        })
    }
    
    private prepararMenuGrupos() {
		this.cy.cxtmenu({
			selector: 'node',
			commands: [
				
				{
				    //Reacción positiva
					content: '<span class="far fa-frown fa-3x" ></span>',
					select: this.reaccionar.bind(this,-1) //this.cambiarNombreGrupo.bind(this)
				},
				{
				    //reacción negativa
					content: '<span class="far fa-smile-beam fa-3x" ></span>',
					select: this.reaccionar.bind(this,1) //this.cambiarNombreGrupo.bind(this)
				},
				{
				   // reacción neutra
					content: '<span class="far fa-meh fa-3x" ></span>',
					select:  this.reaccionar.bind(this,0) 
				},
				{
				    // visualizar imagen
					content:'<span class="fa fa-eye fa-2x"></span>',
					select: this.abrirModalImagenNodo.bind(this) //this.cambiarNombreGrupo.bind(this)
				}
			]
		});
	}
	 private prepararMenuNodos() {
		this.cy.cxtmenu({
			selector: 'node',
			commands: [
				
				{
					content:'<span class="fa fa-eye fa-2x"></span>',
					select: this.abrirModalImagenNodo.bind(this) //this.cambiarNombreGrupo.bind(this)
				},
				{
					content: 'Nada',
					select: function (ele) { }
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
		this.idGrupoSeleccionado = elemento.data();
		this.modalVisualizacionImagenNodo.modal('toggle');
	}
	
    
    private atenderErr(err) {
        this.serviciosToast.mostrarToast({
            titulo: 'Error',
            cuerpo: err.errros[0],
            esMensajeInfo: false
        });
    }
    
    private reaccionar(valorReaccion,elemento){
        
        const options = {
            headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
        }

        const email = this.serviciosLocalStorage.darEmail();
        
    	if (!elemento.data().esGrupo) {
			this.serviciosToast.mostrarToast({
				titulo: 'Error',
				cuerpo: 'Solo se puede reaccionar sobre un grupo.',
				esMensajeInfo: false
			})
			return;
    	}
    	else{
    	    this.idGrupoSeleccionado = elemento.data().id; 
    	    this.http
            .post(`http://3.130.29.100:8080/grupos/${this.idGrupoSeleccionado}/reacciones?valor=${valorReaccion}&id-persona-problematica=${email}${this.problematicaActual}`, options)
            .pipe(catchError(err => of(err)))
            .subscribe(res => {
                if (res.error) {
                    this.atenderErr(res.error);
                } else {
                    console.log(valorReaccion)
                }
            });
    	    
    	}
        	
    }
    
    
}
