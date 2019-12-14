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

	grupos: any[] = [];

	grupoDe: any;
	grupoA: any;

	cy: any = {};
	cdnd: any = {};

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

	private onopenEvent(event) {
		this.socket.send(JSON.stringify({
			accion: 'Conectarse',
			nombre: this.serviciosLocalStorage.darNombres(),
			email: this.serviciosLocalStorage.darEmail()
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
			case 'Desconectarse':
				this.alguienSeDesconecto(json);
				break;
			case 'Mover':
				this.moverNodo(json);
				break;
			case 'Bloquear':
				this.bloquearNodo(json);
				break;
			case 'Desbloquear':
				this.desbloquearNodo(json);
				break;
			case 'Juntar nodos':
				this.juntarNodos(json);
				break;
			case 'Separar nodos':
				this.separarNodos(json);
				break;
			case 'Conectar':
				this.conectarNodos(json);
				break;
			case 'Desconectar':
				this.desconectarNodos(json);
			default:
				return;
		}
	}

	private alguienSeConecto(datos: any) {
		console.log('Alguien se conecto');
	}

	private cargarNodos(datos: any) {
		this.grupos = datos.nodos.filter(nodo => nodo.data.esGrupo);
		this.grupos.forEach(grupo => console.log(`${grupo.data.id} - ${grupo.data.urlFoto}`));
		const nodos = this.cy.nodes();
		this.cy.remove(nodos);
		this.cy.add(datos.nodos);

		this.cy.layout({
			name: 'grid',
			rows: 3,
			cols: 3,
			padding: 50
		}).run()
	}

	private alguienSeDesconecto(datos: any) {
		console.log('Alguien se desconecto');
	}

	private moverNodo(datos: any) {
		const { nodo } = datos;
		const nodoAMover = this.cy.getElementById(nodo.data.id);
		nodoAMover.position(nodo.position);
	}

	private bloquearNodo(datos: any) {
		datos.nodos.forEach(idNodo => this.cy.getElementById(idNodo).ungrabify());
	}

	private desbloquearNodo(datos: any) {
		datos.nodos.forEach(idNodo => this.cy.getElementById(idNodo).grabify());
	}

	private juntarNodos(datos: any) {
		const idNodoPadre = datos.nodoPadre.data.id;
		const idNodo = datos.nodo.data.id;
		const idNodoVecino = datos.nodoVecino.data ? datos.nodoVecino.data.id : -1;

		const nodoPadre = this.cy.getElementById(idNodoPadre);
		const nodo = this.cy.getElementById(idNodo);
		const nodoVecino = this.cy.getElementById(idNodoVecino);

		if (nodoPadre.isNode()) { //*nodoPadre ya existe
			nodo.move({ parent: nodoPadre.id() }) //* Solo funciona si el padre ya existe
		} else {
			nodo.remove();

			this.cy.add([
				{ data: { id: idNodo, parent: idNodoPadre }, position: nodo.position() },
				{ data: { id: idNodoPadre } }
			]);

			nodoVecino.move({ parent: idNodoPadre });

			//TODO: Actualizando array de grupos

			this.grupos.push({ data: { id: idNodoPadre } });
		}
	}

	private separarNodos(datos: any) {
		const idNodo = datos.nodo.data.id;

		const nodo = this.cy.getElementById(idNodo);

		nodo.move({ parent: null });

		this.removeParentsOfOneChild();
	}

	private conectarNodos(datos: any) {
		const { edge } = datos;

		this.grupos.push(edge);
		this.cy.add(edge);
	}

	private desconectarNodos(datos: any) {
		const { edge } = datos;

		this.eliminar(edge.data.id);
		this.cy.getElementById(edge.data.id).remove();
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
						'border-opacity': 0.5,
						'background-image': 'data(urlFoto)'
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
		this.cy.on('remove', this.removeEvent.bind(this));
		this.cy.on('grabon', this.grabonEvent.bind(this));
		this.cy.on('free', this.freeEvent.bind(this));
		this.cy.on('position', this.positionEvent.bind(this));
		this.cy.on('cdndover', this.cdndoverEvent.bind(this));
		this.cy.on('cdndout', this.cdndoutEvent.bind(this));
	}

	private cdndoverEvent(event, nodoPadre, dropSibling) {
		this.socket.send(JSON.stringify({
			accion: 'Juntar nodos',
			nodoPadre: { data: nodoPadre.data() },
			nodo: { data: event.target.data() },
			nodoVecino: { data: dropSibling.data(), position: dropSibling.position() }
		}));

		this.grupos.push({ data: nodoPadre.data() });
	}

	private cdndoutEvent(event, dropTarget, dropSibling) {
		const nodosHijos = dropTarget.children();
		let nodoVecino;
		switch (nodosHijos.length) {
			case 0:
				nodoVecino = { data: { id: dropSibling.data().id, parent: dropTarget.id() } };
				break;
			case 1:
				nodoVecino = { data: { id: dropTarget.children()['0'].id(), parent: dropTarget.id() } };
				break;
			default:
				nodoVecino = {};
				break;
		}

		this.socket.send(JSON.stringify({
			accion: 'Separar nodos',
			nodo: { data: event.target.data() },
			nodoVecino
		}))

		if (this.isParentOfOneChild(dropTarget)) {
			this.removeParent(dropTarget);
		}
	}

	private removeEvent(event) {
		this.removeParentsOfOneChild();
	}

	private grabonEvent(event) {
		const nodo = event.target;
		this.idNodoAgarrado = nodo.id();
		const nodos = [event.target.id()];
		if (nodo.isParent()) { nodo.descendants().forEach(e => nodos.push(e.id())); }

		this.socket.send(JSON.stringify({
			accion: 'Bloquear',
			nodos
		}))
	}

	private freeEvent(event) {


		const nodo = event.target;
		const nodos = [event.target.id()];
		if (nodo.isParent()) { nodo.descendants().forEach(e => nodos.push(e.id())); }

		this.socket.send(JSON.stringify({
			accion: 'Desbloquear',
			nodos
		}))

		this.idNodoAgarrado = '';
	}

	private positionEvent(event) {
		const nodo = event.target;
		if (this.idNodoAgarrado !== event.target.id()) return;

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
			nodo: { data: nodo.data(), position: nodo.position() },
			nodosHijos: hijos.jsons()
		}))
	}

	private enviarMover(nodo) {
		this.socket.send(JSON.stringify({
			accion: 'Mover',
			nodo: { data: nodo.data(), position: nodo.position() }
		}));
	}

	private isParentOfOneChild(node) {
		return node.isParent() && node.children().length === 1;
	};

	private removeParent(parent) {
		this.eliminar(parent.id())
		parent.children().move({ parent: null });
		parent.remove();
	};

	/**
	 * Eliminar del arreglo de grupos el elemento que coincida
	 * con el id pasado por parametro.
	 **/
	private eliminar(id) {
		this.grupos
			.filter(grupo => grupo.data.esGrupo)
			.some((grupo, indice) => {
				if (grupo.data.id === id) {
					this.grupos.splice(indice, 1)
					return true;
				}
				return false;
			})
	}

	private removeParentsOfOneChild() {
		this.cy.nodes().filter(this.isParentOfOneChild).forEach(this.removeParent);
	};

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
		const tieneOtroPadre = this.grupos.find(grupo => this.esEdge(`${grupo.id}${idNodo}`)) !== undefined
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

		this.socket.send(JSON.stringify({
			accion: 'Conectar grupos',
			edge
		}));
	}

	desconectar(edge) {
		const idEdge = edge.id();

		this.eliminar(edge.id());
		this.cy.getElementById(edge.id()).remove();

		console.log(edge.data());

		this.socket.send(JSON.stringify({
			accion: 'Desconectar grupos',
			edge: { data: edge.data() }
		}));
	}

	darGruposIterables() {
		return this.grupos.length > 0 ? this.grupos.filter(grupo => grupo.data.esGrupo) : [];
	}

	ngOnDestroy() {
		if (this.socket) {
			this.socket.close();
		}
	}

}