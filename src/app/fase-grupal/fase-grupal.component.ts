import { Component, OnInit, OnDestroy } from '@angular/core';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from 'app/services/toast/toast.service';
import { map } from 'rxjs/operators';
declare var cytoscape;

declare var $;

@Component({
	selector: 'app-fase-grupal',
	templateUrl: './fase-grupal.component.html',
	styleUrls: ['./fase-grupal.component.scss']
})
export class FaseGrupalComponent implements OnInit, OnDestroy {

	idNodoAgarrado: any;

	/**
	 * Contiene grupos y edges.
	 */
	gruposYEdges: any[] = [];

	grupoDe: any;
	grupoA: any;

	cy: any = {};
	cdnd: any = {};

	solicitandoOrganizacion: boolean = false;

	ejecucionEnMensajeRecibido: boolean = false;

	solicitantes: any[] = [{
		nombre: `${this.serviciosLocalStorage.darNombres()} ${this.serviciosLocalStorage.darApellidos()} (Tú)`,
		email: this.serviciosLocalStorage.darEmail(),
		solicitandoOrganizacion: false
	}];

	socket: WebSocket;

	constructor(private serviciosLocalStorage: LocalStorageService,
		private activatedRoute: ActivatedRoute,
		private router: Router,
		private serviciosToast: ToastService) { }

	ngOnInit() {
		this.activatedRoute
			.paramMap
			.pipe(map(() => window.history.state))
			.subscribe(params => {
				const { idProblematica } = params;
				if (!idProblematica) {
					this.router.navigateByUrl('/dashboard')
					return;
				}

				this.prepararCytoscape();
				this.prepararMenuEdges();
				this.prepararMenuGrupos();
				this.socket = new WebSocket(`ws://localhost:8080/colaboracion?idProblematica=${idProblematica}`);
				this.socket.onopen = this.onopenEvent.bind(this);
				this.socket.onmessage = this.onmessageEvent.bind(this);
			});

		// const cy = this.cy;

		// setTimeout(function () {
		// 	cy.add([{ data: { id: 'e', parent: 'h' } }, { data: { id: 'h' } }]);
		// }, 2000);

		// const nodo = this.cy.getElementById('a');
		// setTimeout(() => {
		// 	nodo.data({ id: 'aa' });
		// }, 2000);

		// const nodo = this.cy.getElementById('p');
		// setInterval(function () {
		// 	nodo.position({ x: 0, y: 0 });
		// }, 2000)
	}

	private prepararCytoscape() {
		this.cy = cytoscape({
			container: document.getElementById('cy'),

			style: [
				{
					selector: 'node',
					style: {
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
					selector: 'node:parent',
					style: {
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
				},
				{
					selector: '.cdnd-grabbed-node',
					style: {
						'background-color': 'red'
					}
				},
				{
					selector: '.cdnd-drop-sibling',
					style: {
						'background-color': 'red'
					}
				},
				{
					selector: '.cdnd-drop-target',
					style: {
						'border-color': 'red',
						'border-style': 'dashed'
					}
				}
			]
			// ,
			// elements: {
			// 	nodes: [
			// 		{ data: { id: 'a' } },
			// 		{ data: { id: 'b' } },
			// 		{ data: { id: 'c' } },
			// 		{ data: { id: 'd' } }
			// 	],
			// 	edges: [

			// 	]
			// }
		});

		const options = {
			grabbedNode: node => true, // filter function to specify which nodes are valid to grab and drop into other nodes
			dropTarget: node => true, // filter function to specify which parent nodes are valid drop targets
			dropSibling: node => true, // filter function to specify which orphan nodes are valid drop siblings
			newParentNode: (grabbedNode, dropSibling) => ({ data: { esGrupo: true, nombre: `Nombre - ${Math.ceil(Math.random() * 10000)}` } }), // specifies element json for parent nodes added by dropping an orphan node on another orphan (a drop sibling)
			overThreshold: 10, // make dragging over a drop target easier by expanding the hit area by this amount on all sides
			outThreshold: 30 // make dragging out of a drop target a bit harder by expanding the hit area by this amount on all sides
		};

		this.cdnd = this.cy.compoundDragAndDrop(options);
		this.prepararEventos();
	}

	private prepararEventos() {
		this.cy.on('add', this.addEvent.bind(this));
		this.cy.on('move', this.moveEvent.bind(this))
		this.cy.on('remove', this.removeEvent.bind(this));
		this.cy.on('grabon', this.grabonEvent.bind(this));
		this.cy.on('free', this.freeEvent.bind(this));
		this.cy.on('position', this.positionEvent.bind(this));
		this.cy.on('cdndover', this.cdndoverEvent.bind(this));
		this.cy.on('cdndout', this.cdndoutEvent.bind(this));

		this.cy.on('data', elemento => {
			console.log('Data event')
			console.log(elemento.target.data());
		})
	}

	private addEvent(event) {
		console.log('Add event - ' + event.target.data().id);
		const elemento = event.target;
		this.agregarAGruposYEdges(elemento);

		if (this.bloqueo) {
			this.bloqueo = false;
			return;
		}

		this.socket.send(JSON.stringify({
			accion: 'Agregar elemento',
			elemento: { data: elemento.data() }
		}));
	}

	private eventosPendientes: number = 0;

	private moveEvent(event) {
		console.log('Move event');

		if (this.bloqueo) {
			this.bloqueo = false;
			return;
		}

		const elemento = event.target;

		this.socket.send(JSON.stringify({
			accion: 'Mover elemento',
			elemento: { data: elemento.data() }
		}));

	}

	private areThereParentsWithOneChild() { //?TODO: Borrar
		return this.cy.nodes().find(this.isParentOfOneChildAndIsNotAnEdge);
	}

	private isParentOfOneChildAndIsNotAnEdge(node) {
		//Los grupos recien creados que no han sido soltados, tienen 0 hijos aunque no sea así.
		//El <= asegura que los nodos recien creados sin haber sido soltados sean tratados de manera correcta y no causen bugs.
		return node.data().esGrupo && node.children().length <= 1;
	};

	private removeParentsOfOneChild() {
		this.cy.nodes().filter(this.isParentOfOneChildAndIsNotAnEdge).forEach(this.removeParent.bind(this));
	};

	private removeParent(parent) {
		parent.children().move({ parent: null });
		parent.remove();
	};

	private removeEvent(event) {
		console.log('Remove event - ' + event.target.data().id);
		const elemento = event.target;
		this.eliminar(elemento.id())

		if (this.bloqueo) {
			this.bloqueo = false;
			return;
		}

		this.socket.send(JSON.stringify({
			accion: 'Eliminar elemento',
			elemento: { data: elemento.data() }
		}));
	}

	/**
	 * Eliminar del arreglo de grupos el elemento que coincida
	 * con el id pasado por parametro.
	 **/
	private eliminar(id) {
		this.gruposYEdges
			.some((grupo, indice) => { //ForEach que si retorna true entonces termina.
				if (grupo.data.id === id) {
					this.gruposYEdges.splice(indice, 1)
					return true;
				}
				return false;
			})
	}

	private grabonEvent(event) {
		const nodo = event.target;
		this.idNodoAgarrado = nodo.id();
		const nodos = [event.target.id()];
		if (nodo.isParent()) { nodo.descendants().forEach(e => nodos.push(e.id())); }

		if (this.bloqueo) {
			this.bloqueo = false;
			return;
		}

		this.socket.send(JSON.stringify({
			accion: 'Bloquear',
			nodos,
			nombreUsuario: this.serviciosLocalStorage.darNombres()
		}))
	}

	private freeEvent(event) {
		const nodo = event.target;
		const nodos = [event.target.id()];
		if (nodo.isParent()) { nodo.descendants().forEach(e => nodos.push(e.id())); }

		if (this.bloqueo) {
			this.bloqueo = false;
			return;
		}

		this.socket.send(JSON.stringify({
			accion: 'Desbloquear',
			nodos
		}))

		this.idNodoAgarrado = '';
	}

	private positionEvent(event) {
		const nodo = event.target;
		if (this.idNodoAgarrado !== event.target.id()) return;
		if (this.bloqueo) {
			this.bloqueo = false;
			return;
		}
		if (nodo.isParent()) {
			this.enviarMoverPadre(nodo);
		} else {
			this.enviarMover(nodo);
		}
	}

	private enviarMoverPadre(nodo) {
		const hijos = nodo.children();
		this.socket.send(JSON.stringify({
			accion: 'Mover padre',
			elemento: { data: nodo.data(), position: nodo.position() },
			nodosHijos: hijos.jsons()
		}))
	}

	private enviarMover(nodo) {
		this.socket.send(JSON.stringify({
			accion: 'Mover',
			elemento: { data: nodo.data(), position: nodo.position() }
		}));
	}

	private cdndoverEvent(event, nodoPadre, dropSibling) {
		console.log('Entrar nodo event');
	}

	private cdndoutEvent(event, dropTarget, dropSibling) {
		console.log('Salie nodo event');
		this.removeParentsOfOneChild();
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

	private prepararMenuGrupos() {
		this.cy.cxtmenu({
			selector: 'node',
			commands: [
				{
					content: '<span class="fa fa-edit fa-2x"></span>',
					select: this.cambiarNombreGrupo.bind(this)
				},
				{
					content: 'Nada',
					select: function (ele) { }
				}
			]
		});
	}

	private onopenEvent(event) {
		this.socket.send(JSON.stringify({
			accion: 'Conectarse',
			nombre: `${this.serviciosLocalStorage.darNombres()} ${this.serviciosLocalStorage.darApellidos()}`,
			email: this.serviciosLocalStorage.darEmail(),
			solicitandoOrganizacion: this.solicitandoOrganizacion
		}));
	}

	private onmessageEvent(event) {
		const json = JSON.parse(event.data);
		switch (json.accion) {
			case 'Conectarse':
				this.alguienSeConecto(json);
				break;
			case 'Nodos':
				this.cargarNodos(json);
				break;
			case 'Mover':
				this.moverNodo(json);
				break;
			case 'Agregar elemento':
				this.agregarElemento(json);
				break;
			case 'Mover elemento':
				this.moverElemento(json);
				break;
			case 'Eliminar elemento':
				this.eliminarElemento(json);
				break;
			case 'Bloquear':
				this.bloquearNodo(json);
				break;
			case 'Desbloquear':
				this.desbloquearNodo(json);
				break;
			case 'Iniciar reinicio':
				this.iniciarReinicio(json);
				break;
			case 'Reiniciar solicitudes':
				this.reiniciarSolicitudes(json);
				break;
			case 'Desconectarse':
				this.alguienSeDesconecto(json);
				break;
			default:
				return;
		}
	}

	bloqueo = false;

	private alguienSeConecto(datos: any) {
		const { nombre, email, solicitandoOrganizacion } = datos;
		this.solicitantes.push({ nombre, email, solicitandoOrganizacion });
	}

	private cargarNodos(datos: any) {
		this.gruposYEdges = datos.nodos.filter(nodo => nodo.data.esGrupo);
		const nodos = this.cy.nodes();

		this.bloqueo = true;
		this.cy.remove(nodos);

		datos.nodos
			.filter(nodo => nodo.data.esGrupo)
			.forEach(grupo => {
				this.bloqueo = true;

				this.cy.add(grupo);
			})

		datos.nodos
			.filter(nodo => !nodo.data.esGrupo)
			.forEach(nodo => {
				this.bloqueo = true;

				this.cy.add({ data: nodo.data, position: nodo.position });

				this.cy.style()
					.selector(`#${nodo.data.id}`)
					.css({
						'background-image': `${nodo.data.urlFoto}`
					}).update();
			});

		console.log(this.cy.nodes());

		this.cy.layout({
			name: 'cose',
			rows: 3,
			cols: 3,
			padding: 20,
			boundingBox: { x1: 0, y1: 0, w: 500, h: 1500 }
		}).run();

		this.solicitantes.concat(datos.solicitantes);
	}

	private agregarElemento(json) {
		this.bloqueo = true;
		this.cy.add(json.elemento);
	}

	private moverElemento(json) {
		console.log('Moviendo elemento');
		const { elemento } = json
		this.bloqueo = true;
		this.cy.getElementById(elemento.data.id)
			.move({
				parent: elemento.data.parent ? elemento.data.parent : null
			})
	}

	private eliminarElemento(json) {
		const { elemento } = json;
		this.bloqueo = true;
		this.cy.getElementById(elemento.data.id).remove();
	}

	private moverNodo(datos: any) {
		const { elemento } = datos;
		const nodoAMover = this.cy.getElementById(elemento.data.id);
		this.bloqueo = true;
		nodoAMover.position(elemento.position);
	}

	private bloquearNodo(datos: any) {
		const { nodos, nombreUsuario } = datos;
		nodos.forEach(idNodo => {
			this.bloqueo = true;
			this.cy.getElementById(idNodo).ungrabify()
		});
		//TODO: Poner el nombre debajo del nodo padre.
	}

	private desbloquearNodo(datos: any) {
		datos.nodos.forEach(idNodo => {
			this.bloqueo = true;
			this.cy.getElementById(idNodo).grabify()
		});
		//TODO: Quitar el nombre debajo del nodo padre.
	}

	private iniciarReinicio(datos) {
		this.cy.reset();
		this.solicitandoOrganizacion = false;
		this.solicitantes.forEach(solicitante => solicitante.solicitandoOrganizacion = false);
	}

	private reiniciarSolicitudes(datos) {
		this.solicitandoOrganizacion = false;
		this.solicitantes.forEach(solicitante => solicitante.solicitandoOrganizacion = false);
	}

	private alguienSeDesconecto(datos: any) {
		console.log('Alguien se desconecto');
		const { email } = datos;

		//Elimina el solicitante con el email dado.
		this.solicitantes = this.solicitantes
			.filter(solicitante => solicitante.email !== email);
	}

	//Adición y elimnación de edges

	conectar() {
		const idPadre = this.grupoDe.id;
		const id = this.grupoA.id;

		if (!this.nodosValidos(idPadre, id)) return;
		if (this.yaExisteRelacion(idPadre, id)) return;
		if (this.tieneOtroPadre(id)) return;
		if (this.esConexion(idPadre, id)) return;

		this.crearEdge(id, idPadre);
	}

	private nodosValidos(idPadre, id) {
		if (!idPadre || !id) {
			this.serviciosToast.mostrarToast({
				titulo: 'Error',
				cuerpo: 'Debe seleccionar 2 nodos diferente',
				esMensajeInfo: false
			})
			return false;
		}
		return true;
	}

	private yaExisteRelacion(idPadre, id) {
		if (this.esEdge(`${idPadre}${id}`) || this.esEdge(`${id}${idPadre}`)) {
			this.serviciosToast.mostrarToast({
				titulo: 'Error',
				cuerpo: 'Ya existe una relación',
				esMensajeInfo: false
			})
			return true;
		}
		return false;
	}

	private esEdge(id) {
		let posibleEdge = this.cy.getElementById(id);
		return posibleEdge.length > 0 && posibleEdge[0].isEdge();
	}

	private tieneOtroPadre(idNodo) {
		const tieneOtroPadre = this.gruposYEdges.find(grupo => this.esEdge(`${grupo.id}${idNodo}`)) !== undefined
		if (tieneOtroPadre) {
			this.serviciosToast.mostrarToast({
				titulo: 'Error',
				cuerpo: 'Un nodo no puede tener 2 padres.',
				esMensajeInfo: false
			});
			return true;
		}
		return false;
	}

	private esConexion(idPadre, id) {
		let ob = this.cy.getElementById(`${idPadre}${id}`);
		if (ob.length > 0 && ob[0].isEdge()) {
			this.serviciosToast.mostrarToast({
				titulo: 'Error',
				cuerpo: 'Ya existe la conexión',
				esMensajeInfo: false
			});
			return true;
		}
		return false;
	}

	private crearEdge(idNodo, idPadre) {
		const edge = { data: { id: `${idPadre}${idNodo}`, source: `${idPadre}`, target: `${idNodo}` } };
		this.cy.add(edge);
	}

	desconectar(edge) {
		this.cy.getElementById(edge.id()).remove();
	}

	cambioSolicitud(event) {
		this.solicitandoOrganizacion = !this.solicitandoOrganizacion;

		this.solicitantes.find(solicitante => {
			return solicitante.email === this.serviciosLocalStorage.darEmail()
		}).solicitandoOrganizacion = this.solicitandoOrganizacion;

		this.socket.send(JSON.stringify({
			accion: 'Cambio solicitud de organizacion',
			email: this.serviciosLocalStorage.darEmail(),
			solicitandoOrganizacion: this.solicitandoOrganizacion
		}));
	}

	cambiarNombreGrupo(id, nuevoNombre) {
		this.gruposYEdges
			.find(grupo => grupo.data.id === id)
			.grupo.data.nombre = nuevoNombre;

		this.cy.getElementById(id).data({ nombre: nuevoNombre });

		//Esto puede ir aquí o en un dataEvent.
		this.socket.send(JSON.stringify({
			accion: 'Cambiar nombre',
			grupo: { data: { id, nombre: nuevoNombre } }
		}));
	}

	atenderCambioDeSolicitud(datos) {
		this.solicitantes
			.find(solicitante => solicitante.email === datos.email)
			.solicitandoOrganizacion = datos.solicitandoOrganizacion;
	}

	cambioUnNombre(datos) {
		const { id, nombre } = datos.grupo.data;

		this.gruposYEdges
			.find(grupo => grupo.data.id === id)
			.nombre = nombre;

		const nodo = this.cy.getElementById(id);
		nodo.data({ nombre });
	}

	darCantidadSolicitantes() {
		return this.solicitantes
			.filter(solicitante => solicitante.solicitandoOrganizacion)
			.length;
	}

	darGruposIterables() {
		return this.gruposYEdges.length > 0 ? this.gruposYEdges.filter(grupo => grupo.data.esGrupo) : [];
	}

	/**
	 * Recibe un objeto tipo nodo o edge de cytoscape.
	 */
	private agregarAGruposYEdges(grupoOEdge) {
		const elementoEncontrado = this.gruposYEdges.find(nodo => nodo.data.id === grupoOEdge.data().id);
		if (elementoEncontrado) return;
		this.gruposYEdges.push({ data: grupoOEdge.data() });
	}

	ngOnDestroy() {
		if (this.socket) {
			this.socket.close();
		}
	}

}