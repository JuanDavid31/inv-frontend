import { Component, OnInit, OnDestroy } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from 'app/services/toast/toast.service';
declare var cytoscape;

declare var $;

@Component({
    selector: 'app-fase-individual',
    templateUrl: './fase-individual.component.html',
    styleUrls: ['./fase-individual.component.css']
})

export class FaseIndividualComponent implements OnInit, OnDestroy {

    esMenu1 = true;
    menuOb = {};

    nodos = [];
    nodoDe: any;
    nodoA: any;
    nombreNodo = '';
    cy: any = {};

    fotoFileInput: HTMLInputElement;

    constructor(private serviciosLocalStorage: LocalStorageService,
        private serviciosToast: ToastService,
        private http: HttpClient) { }

    ngOnInit() {
        this.fotoFileInput = (<HTMLInputElement>document.getElementById('customFileLang'));
        this.prepararOnChangeFileInput();
        this.iniciar();
    }

    private prepararOnChangeFileInput() {
        $('.custom-file-input').on('change', function () {
            var fileName = (<HTMLInputElement>document.getElementById('customFileLang')).files[0].name;
            $(this).next('.custom-file-label').addClass("selected").html(fileName);
        })
    }

    private iniciar() {
        this.nodoDe = {};
        this.nodoA = {};

        this.prepararCytoscape();
        this.prepararMenus();
        this.cargarNodos();
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
        const problematica = this.serviciosLocalStorage.darProblematicaActual();

        this.http
            .get(`http://3.130.29.100:8080/personas/${email}/problematicas/${problematica}/nodos`, options)
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
            const { id, nombre } = nodo;
            this.cy.add({ data: { id, nombre } });

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
        this.serviciosToast.mostrarToast({
            titulo: 'Error',
            cuerpo: err.errros[0],
            esMensajeInfo: false
        });
    }

    agregar() {
        if (!this.nombreNodo) {
            this.serviciosToast.mostrarToast({
                titulo: 'Error',
                cuerpo: 'El nodo necesita un nombre.',
                esMensajeInfo: false
            });
            return;
        }

        const foto = this.fotoFileInput.files[0];

        if (!foto) {
            this.serviciosToast.mostrarToast({
                titulo: 'Error',
                cuerpo: 'El nodo necesita una imagen.',
                esMensajeInfo: false
            });
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
        const problematica = this.serviciosLocalStorage.darProblematicaActual();

        this.http
            .post(`http://3.130.29.100:8080/problematicas/${problematica}/personas/${email}/nodos`, form, options)
            .pipe(catchError(err => of(err)))
            .subscribe(res => {
                if (res.error) {
                    this.atenderErr(res.error);
                } else {
                    this.atenderPOST(res);
                }
            });
    }

    atenderPOST(nodo) {
        this.limpiarCamposNodo();

        this.nodos.push(nodo);
        this.cy.add({ data: { id: nodo.id, nombre: nodo.nombre }, position: { x: this.cy.width() / 2, y: this.cy.height() / 2 } });
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
        this.iniciar();
    }

    conectar() {
        const idPadre = this.nodoDe.id;
        const id = this.nodoA.id;

        if (!idPadre || !id) {
            this.serviciosToast.mostrarToast({
                titulo: 'Error',
                cuerpo: 'Debe seleccionar 2 nodos diferente',
                esMensajeInfo: false
            })
            return;
        }

        if (this.esEdge(`${idPadre}${id}`) || this.esEdge(`${id}${idPadre}`)) {
            this.serviciosToast.mostrarToast({
                titulo: 'Error',
                cuerpo: 'Ya existe una relación',
                esMensajeInfo: false
            })
            return;
        }

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

    esEdge(id) {
        let posibleEdge = this.cy.getElementById(id);
        return posibleEdge.length > 0 && posibleEdge[0].isEdge();
    }

    atenderPUTApadrinar(res) {
        let idDesde = this.nodoDe.id;
        let idA = this.nodoA.id;
        let ob = this.cy.getElementById(`${idDesde}${idA}`);
        if (ob.length > 0 && ob[0].isEdge()) {
            this.serviciosToast.mostrarToast({
                titulo: 'Error',
                cuerpo: 'Ya existe la conexión',
                esMensajeInfo: false
            });
        } else {
            this.crearEdge(idA, idDesde);
        }
    }

    crearEdge(idNodo, idPadre) {
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

    atenderPUTDesapadrinar(id) {
        this.cy.getElementById(id).remove();
    }

    ngOnDestroy() {
        this.serviciosLocalStorage.eliminarProblematicaActual();
    }
}