import { Component, OnInit, OnDestroy } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from 'app/services/toast/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
declare var cytoscape;

declare var $;

@Component({
    selector: 'app-fase-individual',
    templateUrl: './fase-individual.component.html',
    styleUrls: ['./fase-individual.component.css']
})

export class FaseIndividualComponent implements OnInit {

    nodoSeleccionado: any = {};
    nodos = [];
    nodoDe: any;
    nodoA: any;
    nombreNodo = '';
    cy: any = {};
    
    private menuVisible: String = '';
    private menu = { agregarNodo: 'Agregar nodo', conectarNodos: 'Conectar nodos' };

    problematicaActual: number;
    
    modalVisualizacionImagenNodo: any;

    fotoFileInput: HTMLInputElement;

    constructor(private serviciosLocalStorage: LocalStorageService,
        private serviciosToast: ToastService,
        private http: HttpClient,
        private router: Router,
        private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
        this.fotoFileInput = (<HTMLInputElement>document.getElementById('customFileLang'));
        this.prepararOnChangeFileInput();
        this.iniciar();
        this.modalVisualizacionImagenNodo = $('#modal-visualizacion-imagen-nodo');
    }

    private prepararOnChangeFileInput() {
        $('.custom-file-input').on('change', function () {
            let el: HTMLInputElement = <HTMLInputElement>document.getElementById('customFileLang');
            var fileName = el.files[0].name;
            $(this).next('.custom-file-label').addClass("selected").html(fileName);
        })
    }

    private iniciar() {
        this.activatedRoute
            .paramMap
            .pipe(map(() => window.history.state))
            .subscribe(params => {
                this.problematicaActual = params.idProblematica;
                if (!this.problematicaActual) { this.router.navigateByUrl('/dashboard'); return; }

                this.nodoDe = {};
                this.nodoA = {};

                this.prepararCytoscape();
                this.prepararMenus();
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
                        'background-color': '#2980b9',
                        'label': 'data(nombre)',
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

    private prepararMenus() {
        this.prepararMenuNodos();
        this.prepararMenuEdges();
    }

    private prepararMenuNodos() {
        this.cy.cxtmenu({
            selector: 'node',
            commands: [
				{
					content: '<span class="fa fa-eye fa-2x"></span>',
					select: this.abrirModalImagenNodo.bind(this)
				},
                {
                    content: '<span class="fa fa-trash fa-2x"></span>',
                    select: this.eliminarPorId.bind(this)
                },
                {
                    content: 'Nada',
                    select: function () { }
                }
            ]
        });
    }

    private prepararMenuEdges() {
        this.cy.cxtmenu({
            selector: 'edge',
            commands: [
                {
                    content: '<span class="fa fa-trash fa-2x"></span>',
                    select: this.desconectar.bind(this)
                },
                {
                    content: 'Nada',
                    select: function (ele) { }
                }
            ]
        });
    }

    private cargarNodos() {
        const options = {
            headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
        }

        const email = this.serviciosLocalStorage.darEmail();

        this.http
            .get(`http://3.130.29.100:8080/personas/${email}/problematicas/${this.problematicaActual}/nodos`, options)
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
        this.nodos.forEach(nodo => {
            const { id, nombre, urlFoto } = nodo;
            this.cy.add({ data: { id, nombre, urlFoto} });

            this.cy.style()
                .selector(`#${nodo.id}`)
                .css({
                    'background-image': `${nodo.urlFoto}`
                }).update();
        })

        this.cy.layout({
            name: 'grid',
            rows: 3,
            cols: 3,
            padding: 50
        }).run()

        this.cargarEdges();
    }

    private cargarEdges() {
        this.nodos
            .filter(nodo => nodo.idPadre !== 0)
            .forEach(nodo => this.crearEdge(nodo.id, nodo.idPadre));
    }

    private atenderErr(err) {
        this.serviciosToast.mostrarToast('Error', err.erros[0], 'danger');
    }

    agregar() {
        if (!this.nombreNodo) {
            this.serviciosToast.mostrarToast('Error', 'El nodo necesita un nombre.', 'danger');
            return;
        }

        const foto = this.fotoFileInput.files[0];

        if (!foto) {
            this.serviciosToast.mostrarToast('Error', 'El nodo necesita una imagen.', 'danger');
            return;
        }

        const arr = foto.name.split('.');
        const extensionFoto = arr[arr.length - 1];

        const form = new FormData();
        form.append('foto', foto);
        form.append('nombre', this.nombreNodo);

        const options = {
            headers: new HttpHeaders({
                'Authorization': this.serviciosLocalStorage.darToken(),
                'extension': extensionFoto
            })
        }

        const email = this.serviciosLocalStorage.darEmail();

        this.http
            .post(`http://3.130.29.100:8080/problematicas/${this.problematicaActual}/personas/${email}/nodos`, form, options)
            .pipe(catchError(err => of(err)))
            .subscribe(res => {
                if (res.error) {
                    this.atenderErr(res.error.erros[0]);
                } else {
                    this.atenderPOST(res);
                }
            });
    }

    atenderPOST(nodo) {
        this.limpiarCamposNodo();

        this.nodos.push(nodo);
        
        this.cy.add({ 
            data: { id: nodo.id, nombre: nodo.nombre, urlFoto: nodo.urlFoto }, 
            position: { x: this.cy.width() / 2, y: this.cy.height() / 2 } 
        });
        
        this.cy.style()
            .selector(`#${nodo.id}`)
            .css({
                'background-image': nodo.urlFoto
            }).update();
    }

    private limpiarCamposNodo() {
        this.fotoFileInput.value = '';
        this.nombreNodo = '';
        $('.custom-file-label').html('');
    }

    eliminarPorId(nodo) {
        const id = nodo.id();

        const options = {
            headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
        }

        this.http
            .delete(`http://3.130.29.100:8080/nodos/${id}`, options)
            .pipe(catchError(err => of(err)))
            .subscribe(res => {
                if (res.error) {
                    this.atenderErr(res.error);
                } else {
                    this.atenderDELETE(nodo);
                }
            });
    }

    atenderDELETE(nodo) {
        this.nodos = this.nodos.filter(e => e.id !== +nodo.id());
        nodo.remove();
    }

    reiniciar() {
        this.cy.layout({
            name: 'grid',
            rows: 3
        }).run()
    }

    conectar() {
        const idPadre = this.nodoDe.id;
        const id = this.nodoA.id;

        if (!this.nodosValidos(idPadre, id)) return;
        if (this.yaExisteRelacion(idPadre, id)) return;
        if (this.tieneOtroPadre(id)) return;

        const options = {
            headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
        }

        this.http
            .put(`http://3.130.29.100:8080/nodos/${id}?id-padre=${idPadre}&apadrinar=true`, options)
            .pipe(catchError(err => of(err)))
            .subscribe(res => {
                if (res.error) {
                    this.atenderErr(res.error);
                } else {
                    this.atenderPUTApadrinar(res);
                }
            });

    }

    private nodosValidos(idPadre, id) {
        if (!idPadre || !id) {
            this.serviciosToast.mostrarToast('Error', 'Debe seleccionar 2 nodos diferente', 'danger');
            return false;
        }
        return true;
    }

    private yaExisteRelacion(idPadre, id) {
        if (this.esEdge(`${idPadre}${id}`) || this.esEdge(`${id}${idPadre}`)) {
            this.serviciosToast.mostrarToast('Error', 'Ya existe una relación', 'danger');
            return true;
        }
        return false;
    }

    private esEdge(id) {
        let posibleEdge = this.cy.getElementById(id);
        return posibleEdge.length > 0 && posibleEdge[0].isEdge();
    }

    private tieneOtroPadre(idNodo) {
        const tieneOtroPadre = this.nodos.find(nodo => this.esEdge(`${nodo.id}${idNodo}`)) !== undefined
        if (tieneOtroPadre) {
            this.serviciosToast.mostrarToast('Error', 'Un nodo no puede tener 2 padres.', 'danger');
            return true;
        }
        return false;
    }

    private atenderPUTApadrinar(res) {
        let idDesde = this.nodoDe.id;
        let idA = this.nodoA.id;
        let ob = this.cy.getElementById(`${idDesde}${idA}`);
        if (ob.length > 0 && ob[0].isEdge()) {
            this.serviciosToast.mostrarToast('Error', 'Ya existe la conexión', 'danger');
        } else {
            this.crearEdge(idA, idDesde);
        }
    }

    private crearEdge(idNodo, idPadre) {
        this.cy.add({ data: { id: `${idPadre}${idNodo}`, source: `${idPadre}`, target: `${idNodo}` } })
    }

    desconectar(edge) {
        const idEdge = edge.id();
        const idNodo = edge.target().id();
        const idPadre = edge.source().id();

        const options = {
            headers: new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() })
        }

        this.http
            .put(`http://3.130.29.100:8080/nodos/${idNodo}?id-padre=${idPadre}&apadrinar=false`, options)
            .pipe(catchError(err => of(err)))
            .subscribe(res => {
                if (res.error) {
                    this.atenderErr(res.error);
                } else {
                    this.atenderPUTDesapadrinar(idEdge);
                }
            });
    }

    private atenderPUTDesapadrinar(id) {
        this.cy.getElementById(id).remove();
    }
    
    hayMenuVisible(){
        return this.menuVisible !== '';
    }
    
    alternarVisibilidadAccionesAgregarNodo(){
        if(this.menuVisible === this.menu.agregarNodo){
            this.menuVisible = '';
        }else{
            this.menuVisible = this.menu.agregarNodo;
        }
    }
    
    alternarVisibilidadAccionesConectarNodos(){
        if(this.menuVisible === this.menu.conectarNodos){
            this.menuVisible = '';
        }else{
            this.menuVisible = this.menu.conectarNodos;
        }
    }
        
    esAccionesAgregarNodoVisible(){
        return this.menuVisible === this.menu.agregarNodo;
    }
    
    esAccionesConectarNodosVisible(){
        return this.menuVisible === this.menu.conectarNodos;
    }
    
	private abrirModalImagenNodo(elemento) {
		this.nodoSeleccionado = elemento.data();
		this.modalVisualizacionImagenNodo.modal('toggle');
	}

}