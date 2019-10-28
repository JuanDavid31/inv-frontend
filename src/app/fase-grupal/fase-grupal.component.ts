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

	cy: any = {};
	cdnd: any = {};

	socket: WebSocket;

	constructor(private serviciosLocalStorage: LocalStorageService) { }

	ngOnInit() {
		this.prepararCytoscape();

		this.socket = new WebSocket("ws://localhost:8080/colaboracion?idProblematica=1");
		this.socket.onopen = this.onopenEvent.bind(this);
		this.socket.onmessage = this.onmessageEvent.bind(this);
	}

	private onopenEvent(event) {
		this.socket.send(JSON.stringify({
			accion: 'Conectarse',
			nombre: this.serviciosLocalStorage.darNombres(),
			email: this.serviciosLocalStorage.darEmail()
		}));
	}

	private onmessageEvent(event) {
		console.log('Llego un mensaje');
		const json = JSON.parse(event.data);

		switch (json.accion) {
			case 'Conectarse':
				this.alguienSeConecto(json);
			case 'Desconectarse':
				this.alguienSeDesconecto(json);
		}
	}

	private alguienSeConecto(datos) {
		console.log('Alguien se desconecto')
	}

	private alguienSeDesconecto(datos) {
		console.log('Alguien se desconecto');
	}

	prepararCytoscape() {
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
						'label': ''
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

		this.cdnd = this.cy.compoundDragAndDrop();

		// custom handler to remove parents with only 1 child on drop
		this.cy.on('cdndout', this.cdndoutEvent.bind(this));

		// custom handler to remove parents with only 1 child (on remove of drop target or drop sibling)
		this.cy.on('remove', this.removeEvent.bind(this));

		this.cy.on('lock', function (event) {
			console.log('lock');
		})

		this.cy.on('grabon', function (event) { //al agarrar multiples elementos
			console.log('grabon');
			console.log(event.target.id());
		});

		this.cy.on('free', function (event) { //Soltar multiples elementos
			console.log('free');
		});

		// this.cy.on('grab', function (event) { //Al agarrar un elemento
		// 	console.log('grab');
		// });

		// this.cy.on('drag', function (event) { //Al mover el elemento
		// 	console.log('drag');
		// })

		// this.cy.on('position', function (event) {
		// 	console.log('position');
		// })
	}

	private cdndoutEvent(event, dropTarget) {
		if (this.isParentOfOneChild(dropTarget)) {
			this.removeParent(dropTarget);
		}
	}

	private removeEvent(event) {
		this.removeParentsOfOneChild();
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