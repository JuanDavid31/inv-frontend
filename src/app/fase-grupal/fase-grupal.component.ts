import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
declare var cytoscape;

declare var $;

@Component({
	selector: 'app-fase-grupal',
	templateUrl: './fase-grupal.component.html',
	styleUrls: ['./fase-grupal.component.scss']
})
export class FaseGrupalComponent implements OnInit {

	idNodoAgarrado: any;

	cy: any = {};
	cdnd: any = {};

	socket: WebSocket;

	constructor(private serviciosLocalStorage: LocalStorageService) { }

	ngOnInit() {
		this.prepararCytoscape();
		this.socket = new WebSocket("ws://localhost:8080/colaboracion?idProblematica=1");
		this.socket.onopen = this.onopenEvent.bind(this);
		this.socket.onmessage = this.onmessageEvent.bind(this);

		const cy = this.cy;

		setTimeout(function () {
			cy.add([{ data: { id: 'e', parent: 'h' } }, { data: { id: 'h' } }]);
		}, 2000);

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
		console.log('Llego un mensaje - ' + event.data);
		const json = JSON.parse(event.data);

		switch (json.accion) {
			case 'Conectarse':
				this.alguienSeConecto(json);
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
			default:
				return;
		}
	}

	private alguienSeConecto(datos) {
		console.log('Alguien se conecto');
	}

	private alguienSeDesconecto(datos) {
		console.log('Alguien se desconecto');
	}

	private moverNodo(datos) {
		if (this.idNodoAgarrado === datos.nodo) return;
		const nodoAMover = this.cy.getElementById(datos.nodo);
		nodoAMover.position(datos.posicion);
	}

	private bloquearNodo(datos) {
		datos.nodos.forEach(idNodo => this.cy.getElementById(idNodo).ungrabify());
	}

	private desbloquearNodo(datos) {
		datos.nodos.forEach(idNodo => this.cy.getElementById(idNodo).grabify());
	}

	private juntarNodos(datos) {
		const idNodoPadre = datos.nodoPadre;
		const idNodo = datos.nodo;
		const idNodoVecino = datos.nodoVecino;

		const nodoPadre = this.cy.getElementById(idNodoPadre);
		const nodo = this.cy.getElementById(idNodo);
		const nodoVecino = this.cy.getElementById(idNodoVecino);

		console.log(nodo.data());

		if (nodoPadre.length !== 0) { //*nodoPadre ya existe
			nodo.move({ parent: nodoPadre.id() }) //* Solo funciona si el padre ya existe
		} else {
			nodo.remove();

			this.cy.add([
				{ data: { id: idNodo, parent: idNodoPadre }, position: nodo.position() },
				{ data: { id: idNodoPadre } }
			]);

			nodoVecino.move({ parent: idNodoPadre });
		}
		console.log(nodo.data());
	}

	private prepararCytoscape() {
		this.cy = cytoscape({
			container: document.getElementById('cy'),

			style: [
				{
					selector: 'node',
					style: {
						'label': 'data(id)'
					}
				},
				{
					selector: 'node:parent',
					style: {
						'label': 'data(id)' //*Estaba vacio
					}
				},
				{
					selector: 'edge',
					style: {
						'curve-style': 'bezier',
						'target-arrow-shape': 'triangle'
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
			],
			elements: {
				nodes: [
					{ data: { id: 'a' } },
					{ data: { id: 'b' } },
					{ data: { id: 'c' } },
					{ data: { id: 'd', parent: 'p' } },
					{ data: { id: 'p' } }
				],
				edges: [

				]
			}
		});

		const options = {
			grabbedNode: node => true, // filter function to specify which nodes are valid to grab and drop into other nodes
			dropTarget: node => true, // filter function to specify which parent nodes are valid drop targets
			dropSibling: node => true, // filter function to specify which orphan nodes are valid drop siblings
			newParentNode: (grabbedNode, dropSibling) => ({}), // specifies element json for parent nodes added by dropping an orphan node on another orphan (a drop sibling)
			overThreshold: 10, // make dragging over a drop target easier by expanding the hit area by this amount on all sides
			outThreshold: 10 // make dragging out of a drop target a bit harder by expanding the hit area by this amount on all sides
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

		console.log(`cdndover -> ${nodoPadre.id()} - ${event.target.id()}`);

		this.socket.send(JSON.stringify({
			accion: 'Juntar nodos',
			nodoPadre: nodoPadre.id(),
			nodo: event.target.id(),
			nodoVecino: dropSibling.id()
		}));
	}

	private cdndoutEvent(event, dropTarget) {
		console.log('cdndoout');



		if (this.isParentOfOneChild(dropTarget)) {
			this.removeParent(dropTarget);
		}
	}

	private removeEvent(event) {
		console.log('remove');
		this.removeParentsOfOneChild();
	}

	private grabonEvent(event) {
		console.log('grabon');

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
		this.socket.send(JSON.stringify({
			accion: 'Mover',
			nodo: nodo.id(),
			posicion: nodo.position()
		}))
	}

	private isParentOfOneChild(node) {
		return node.isParent() && node.children().length === 1;
	};

	private removeParent(parent) {
		parent.children().move({ parent: null });
		parent.remove();
	};

	private removeParentsOfOneChild() {
		this.cy.nodes().filter(this.isParentOfOneChild).forEach(this.removeParent);
	};

}