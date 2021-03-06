import { Component, OnInit, OnDestroy } from '@angular/core';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from 'app/services/toast/toast.service';
import { map, takeUntil } from 'rxjs/operators';
import { EventosSseService } from '@services/http/eventos-sse/eventos-sse.service';
import { Subject } from 'rxjs';
import { environment } from '@environment/environment';
declare var cytoscape;
declare var $;

@Component({
	selector: 'app-fase-grupal',
	templateUrl: './fase-grupal.component.html',
	styleUrls: ['./fase-grupal.component.scss']
})
export class FaseGrupalComponent implements OnInit, OnDestroy {

	idProblematicaActual: number;

	idNodoAgarrado: any;

	/**
	 * Contiene grupos y edges.
	 */
	gruposYNodos: any[] = [];

	grupoDe: any;
	grupoA: any;

	nodoSeleccionado: any;

	grupoSeleccionado: any;
	nuevoNombreGrupo = '';

	cy: any = {};
	cdnd: any = {};

	solicitandoOrganizacion = false;

	ejecucionEnMensajeRecibido = false;

	bloqueo = false;

	msInicioAnimacion = 400;

	usuarios: any[] = [{
		nombre: `${this.serviciosLocalStorage.darNombres()} ${this.serviciosLocalStorage.darApellidos()} (Tú)`,
		email: this.serviciosLocalStorage.darEmail(),
		solicitandoOrganizacion: false
	}];

	socket: WebSocket;

	modalCambioNombreGrupo: any
	modalVisualizacionImagenNodo: any;

	private menuVisible: String = '';

	private menu = { conectarGrupos: 'Conectar grupos', ordenarNodos: 'Ordenar nodos' };

	private componentDestroyed$: Subject<boolean> = new Subject()

	constructor(private serviciosLocalStorage: LocalStorageService,
		private activatedRoute: ActivatedRoute,
		private router: Router,
		private serviciosToast: ToastService,
		private serviciosEventosSse: EventosSseService) { }

	ngOnInit() {
		this.activatedRoute
			.paramMap
			.pipe(map(() => window.history.state))
			.subscribe(params => {
				this.idProblematicaActual = params.idProblematica;
				if (!this.idProblematicaActual) {
					this.router.navigateByUrl('/dashboard')
					return;
				}

				this.serviciosEventosSse.eventoCambioFaseProblematica$
					.pipe(takeUntil(this.componentDestroyed$))
					.subscribe(this.evaluarProblematicaActualizada.bind(this));

				this.prepararCytoscape();
				this.prepararMenuEdges();
				this.prepararMenuGrupos();

				this.socket = new WebSocket(`ws://${environment.rawApiUrlWithPort}/colaboracion?idProblematica=${this.idProblematicaActual}`);
				this.socket.onopen = this.onopenEvent.bind(this);
				this.socket.onmessage = this.onmessageEvent.bind(this);
				this.socket.onerror = this.onWebsocketError.bind(this);
				this.socket.onclose = this.onWebSocketClose.bind(this);
			});

		this.modalCambioNombreGrupo = $('#modal-cambio-nombre');
		this.modalVisualizacionImagenNodo = $('#modal-visualizacion-imagen-nodo');
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
			container: document.getElementById('cy'),

			style: [
				{
					selector: 'node',
					style: {
						'font-size': '40',
						'height': 200,
						'width': 200,
						'background-fit': 'cover',
						'border-color': '#2980b9',
						'border-width': 3,
						'border-opacity': 0.5,
						'label': 'data(nombre)'
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
			],
			minZoom: 0.1,
			maxZoom: 2
		});


		const options = {
			grabbedNode: node => true, // filter function to specify which nodes are valid to grab and drop into other nodes
			dropTarget: node => true, // filter function to specify which parent nodes are valid drop targets
			dropSibling: node => true, // filter function to specify which orphan nodes are valid drop siblings
			newParentNode: (grabbedNode, dropSibling) => {
				return ({ data: { esGrupo: true, nombre: `Nombre - ${Math.ceil(Math.random() * 10000)}` } })
			}, // specifies element json for parent nodes added by dropping an orphan node on another orphan (a drop sibling)
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
	}

	private addEvent(event) {
		console.log('add');
		const elemento = event.target;
		this.agregarAGruposYNodos(elemento);

		if (this.bloqueo) {
			this.bloqueo = false;
			return;
		}

		this.socket.send(JSON.stringify({
			accion: 'Agregar elemento',
			elemento: { data: elemento.data() }
		}));
	}

	private moveEvent(event) {
		console.log('move');
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
		console.log('remove');
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
		this.gruposYNodos
			.some((grupo, indice) => { //ForEach que si retorna true entonces termina.
				if (grupo.data.id === id) {
					this.gruposYNodos.splice(indice, 1);
					return true;
				}
				return false;
			})
	}

	private grabonEvent({ target }) {
		console.log('grabon');
		if (this.bloqueo) {
			this.bloqueo = false;
			return;
		}

		this.idNodoAgarrado = target.id();
		const nodos = [{ id: target.id(), esHijo: target.isChild() }];
		if (target.isParent()) { target.descendants().forEach(e => nodos.push({ id: e.id(), esHijo: true })); }

		this.socket.send(JSON.stringify({
			accion: 'Bloquear',
			nodos,
			nombreUsuario: `${this.serviciosLocalStorage.darNombres()} ${this.serviciosLocalStorage.darApellidos()}`
		}))
	}

	private freeEvent(event) {
		console.log('free');
		if (this.bloqueo) {
			this.bloqueo = false;
			return;
		}

		const nodo = event.target;
		const nodos = [{ id: event.target.id(), esHijo: false }];
		if (nodo.isParent()) { nodo.descendants().forEach(e => nodos.push({ id: e.id(), esHijo: true })); }

		this.socket.send(JSON.stringify({
			accion: 'Desbloquear',
			nodos
		}))

		this.idNodoAgarrado = '';
	}

	private positionEvent(event) {
		console.log('position');
		const nodo = event.target;
		if (nodo.data().esGrupo) {
			this.refrescarEdges();
		}
		if (this.bloqueo) {
			this.bloqueo = false;
			return;
		}
		if (this.idNodoAgarrado !== event.target.id()) {
			return;
		}
		if (nodo.isParent()) {
			this.enviarMoverPadre(nodo);
		} else {
			this.enviarMover(nodo);
		}
	}

	private refrescarEdges() {
		const edges = this.cy.edges();
		edges.forEach(edge => {
			const data = edge.data();
			this.bloqueo = true;
			edge.remove();
			this.bloqueo = true;
			this.cy.add({ data });
		})
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

	}

	private cdndoutEvent(event, dropTarget, dropSibling) {
		const idNodoPadre = dropTarget.data().id;
		this.refrescarEdgesQueEstuvieronEnMovimiento(idNodoPadre);
		this.removeParentsOfOneChild();
	}

	/**
	 * Workaround para bug. Cuando hay 2 o 3 grupos de nodos conectados por 1 o 2 edges
	 * respectivamente, si seleccionanos un nodo hijo de alguno de los grupos;
	 * lo movemos libremente y extraemos del grupo (Siempre y cuando este grupo tenga 3 o más
	 * nodos. Si el grupo se elimina entonces el bug no sera visible)
	 * entonces los edges no se refrescaran de manera visual. Esto se ve fatal para el usuario.
	 */
	private refrescarEdgesQueEstuvieronEnMovimiento(idNodoPadre) {
		const query = `edge[target = "${idNodoPadre}"], edge[source = "${idNodoPadre}"]`;
		const edges = this.cy.edges(query);
		edges.forEach(edge => {
			const data = edge.data();
			this.bloqueo = true;
			edge.remove();
			this.bloqueo = true;
			this.cy.add({ data });
		})
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
					content: '<span class="fa fa-check fa-2x"></span>',
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
					select: this.abrirModalCambioNombreGrupo.bind(this)
				},
				{
					content: '<span class="fa fa-eye fa-2x"></span>',
					select: this.abrirModalImagenNodo.bind(this) //this.cambiarNombreGrupo.bind(this)
				},
				{
					content: '<span class="fa fa-check fa-2x"></span>',
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
		console.log(`Llego un evento  -> ${json.accion}`, json);
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
			case 'Cambiar nombre':
				this.cambioUnNombre(json);
				break;
			case 'Bloquear':
				this.bloquearNodo(json);
				break;
			case 'Desbloquear':
				this.desbloquearNodo(json);
				break;
			case 'Cambio solicitud de organizacion':
				this.cambioUnaSolicitud(json);
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

	private alguienSeConecto({ nombre, email, solicitandoOrganizacion }) {
		this.usuarios.push({ nombre, email, solicitandoOrganizacion });
		this.serviciosToast.mostrarToast(undefined, `${nombre} se ha conectado.`);
	}

	/**
	 * @param {any[]} solicitantes usuarios que contienen a este mismo usuario.
	 */
	private cargarNodos({ nodos, solicitantes }) {
		// nodos = nodos.map(nodo => {
		// 	delete nodo.data.parent;
		// 	return nodo;
		// })
		console.log(nodos);
		this.gruposYNodos = nodos.filter(nodo => nodo.data.source === undefined);
		const nodosCytoscape = this.cy.nodes();

		this.bloqueo = true;
		this.cy.remove(nodosCytoscape);

		this.cargarNodosPadre(nodos);
		this.cargarNodosHijos(nodos);
		this.bloquearNodosSiLosHay(nodos);

		if (solicitantes.length === 1) {
			this.activarLayoutCose();
		} else {
			this.activarLayoutPreset();
		}

		this.validarUsuarioActual(solicitantes);
	}

	private cargarNodosPadre(nodos) {
		nodos.filter(nodo => nodo.data.esGrupo)
			.forEach(grupo => {
				this.bloqueo = true;
				this.cy.add(grupo);
			});
	}

	private cargarNodosHijos(nodos) {
		nodos.filter(nodo => !nodo.data.esGrupo)
			.forEach(nodo => {
				this.bloqueo = true;
				this.cy.add(nodo);
				this.cy.style()
					.selector(`#${nodo.data.id}`)
					.css({ 'background-image': `${nodo.data.urlFoto}` })
					.update();
			});
	}

	private bloquearNodosSiLosHay(nodos) {
		nodos.filter(nodo => nodo.data.bloqueado)
			.forEach(nodo => {
				const nodoCy = this.cy.getElementById(nodo.data.id);
				nodoCy.ungrabify();
				nodoCy.style({
					'border-color': 'purple',
					'border-width': 10
				});
			})
	}

	/**
	 * El layout cose asigna posiciones a nodos normales y compuestos
	 */
	private activarLayoutCose() {
		this.cy.layout({ name: 'cose-bilkent', nodeRepulsion: 2000, idealEdgeLength: 150, animationDuration: this.msInicioAnimacion }).run();
		// this.cy.layout({
		// 	name: 'cose',
		// 	nodeOverlap: 1,
		// 	boundingBox: { x1: 0, y1: 0, w: 800, h: 1500 }
		// }).run();
		this.enviarActualizacionDePosiciones()
	}

	private enviarActualizacionDePosiciones() {
		const nodos = this.cy.nodes();
		//el setTimeout espera a que el layout este listo antes de
		//pedir las posiciones.
		const that = this;
		setTimeout(() => {
			that.socket.send(JSON.stringify({
				accion: 'Actualizar posiciones',
				nodos: nodos.jsons()
			}));
		}, this.msInicioAnimacion + 1);
	}

	/**
	 * El layout preset permite agregar nodos con posiciones definidas de manera manual.
	 */
	private activarLayoutPreset() {
		this.cy.layout({
			name: 'preset'
		}).run();
	}

	private validarUsuarioActual(solicitantes) {
		const conexionesDeEsteUsuario = solicitantes
			.filter(solicitante => solicitante.email === this.serviciosLocalStorage.darEmail())
			.length;

		//Por ahora solo se permite una conexión por usuario a la fase grupal.
		if (conexionesDeEsteUsuario === 2) {
			this.serviciosToast.mostrarToast('Error', 'Ya estas conectado desde otro pestaña o navegador.', 'danger')
			this.router.navigateByUrl('/dashboard');
		} else {
			solicitantes = solicitantes
				.filter(solicitante => solicitante.email !== this.serviciosLocalStorage.darEmail());
			this.usuarios = this.usuarios.concat(solicitantes);
		}
	}

	private agregarElemento(json) {
		this.bloqueo = true;
		this.cy.add(json.elemento);
	}

	private moverElemento(json) {
		const { elemento } = json;
		this.bloqueo = true;
		this.cy.getElementById(elemento.data.id)
			.move({
				parent: elemento.data.parent ? elemento.data.parent : null
			})
	}

	/**
	* Elimina edges y nodos padre.
	* */
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

	private bloquearNodo({ nodos, nombreUsuario }) {

		if (nodos.length === 1) {
			this.bloquearNodoUnico(nodos, nombreUsuario);
		} else {
			this.bloquearConjuntoDeNodos(nodos, nombreUsuario);
		}

	}

	/**
	 * Al bloquear un solo nodo es necesario poner en el label
	 * el nombre del usuario que lo bloquea.
	 */
	private bloquearNodoUnico(nodos, nombreUsuario) {
		nodos.forEach(nodo => {
			const nodoBloqueado = this.cy.getElementById(nodo.id);
			nodoBloqueado.ungrabify()
			nodoBloqueado.style({
				'border-color': 'purple',
				'border-width': 10,
				'label': `${nombreUsuario} - ${nodoBloqueado.data().nombre}`
			});
		})
	}

	private bloquearConjuntoDeNodos(nodos, nombreUsuario) {
		nodos.filter(nodo => nodo.esHijo)
			.forEach((nodo) => {
				const nodoBloqueado = this.cy.getElementById(nodo.id);
				nodoBloqueado.ungrabify()
				nodoBloqueado.style({
					'border-color': 'purple',
					'border-width': 10,
				});
			})

		nodos.filter(nodo => !nodo.esHijo)
			.forEach(nodo => {
				const nodoBloqueado = this.cy.getElementById(nodo.id);
				nodoBloqueado.ungrabify()
				nodoBloqueado.style({
					'border-color': 'purple',
					'border-width': 10,
					'label': `${nombreUsuario} - ${nodoBloqueado.data().nombre}`
				});
			});
	}

	private desbloquearNodo({ nodos }) {
		if (nodos.length === 1) {
			this.desbloquearNodoUnico(nodos);
		} else {
			this.desbloquearConjuntoDeNodos(nodos);
		}
	}

	private desbloquearNodoUnico(nodos) {
		nodos.forEach(nodo => {
			const nodoBloqueado = this.cy.getElementById(nodo.id);
			nodoBloqueado.grabify()
			nodoBloqueado.style({
				'border-color': '#2980b9',
				'border-width': 3,
				'label': nodoBloqueado.data().nombre
			});
		})
	}

	private desbloquearConjuntoDeNodos(nodos) {
		nodos.filter(nodo => nodo.esHijo)
			.forEach(nodo => {
				const nodoDesbloqueado = this.cy.getElementById(nodo.id);
				nodoDesbloqueado.grabify()
				nodoDesbloqueado.style({
					'border-color': '#2980b9',
					'border-width': 3
				})
			})

		nodos.filter(nodo => !nodo.esHijo)
			.forEach(nodo => {
				const nodoDesbloqueado = this.cy.getElementById(nodo.id);
				nodoDesbloqueado.grabify()
				nodoDesbloqueado.style({
					'label': nodoDesbloqueado.data().nombre,
					'border-color': '#2980b9',
					'border-width': 3
				})
			});
	}

	private cambioUnaSolicitud({ email, solicitandoOrganizacion }) {
		this.usuarios.find(solicitante => {
			return solicitante.email === email
		}).solicitandoOrganizacion = solicitandoOrganizacion;
	}

	private reiniciarSolicitudes({ nodos }) {
		this.solicitandoOrganizacion = false;
		this.usuarios.forEach(solicitante => solicitante.solicitandoOrganizacion = false);

		nodos.filter(nodo => !nodo.data.source) //Que no sean edges.
			.forEach(nodo => {
				const nodoCy = this.cy.getElementById(nodo.data.id);
				if (!nodoCy.isNode()) { return; }
				this.bloqueo = true;
				nodoCy.position(nodo.position);
			})

		this.cy.center();

		this.serviciosToast.mostrarToast(undefined, 'Los nodos han vuelto a su posición original.');
	}

	private alguienSeDesconecto({ email }) {

		const usuarioEliminado = this.usuarios.some((usuario, indice) => {
			if (usuario.email === email && usuario.nombre.substr(usuario.nombre.length - 4) !== '(Tú)') {
				this.serviciosToast.mostrarToast(undefined, `${usuario.nombre} se desconecto.`);
				this.usuarios.splice(indice, 1);
				return true;
			}
			return false;
		})

		if (usuarioEliminado && this.usuarios.length === 1) { this.solicitandoOrganizacion = false; }
	}

	conectar() {
		const idPadre = this.grupoDe ? this.grupoDe.id : undefined;
		const id = this.grupoA ? this.grupoA.id : undefined;

		if (!this.nodosValidos(idPadre, id)) {return; }
		if (!this.nodosDiferentes(idPadre, id)) {return; }
		if (!this.existeNodo(idPadre) || !this.existeNodo(id)) {return; }
		if (this.yaExisteRelacion(idPadre, id)) {return; }
		if (this.tieneOtroPadre(id)) {return; }
		if (this.tieneOtroHijo(idPadre)) {return; }
		if (this.esConexion(idPadre, id)) {return; }
		if (this.sonGrupoYNodo(idPadre, id)) { return; }

		this.crearEdge(id, idPadre);
	}

	private nodosValidos(idPadre, id) {
		if (!idPadre || !id) {
			this.serviciosToast.mostrarToast('Error', 'Debe seleccionar 2 nodos diferentes', 'danger')
			return false;
		}
		return true;
	}

	private nodosDiferentes(idPadre, id) {
		if (idPadre !== id) { return true; }
		this.serviciosToast.mostrarToast('Error', 'Debe seleccionar 2 nodos diferentes', 'danger');
		return false;
	}

	private existeNodo(id) {
		const nodo = this.cy.getElementById(id);
		const existe = nodo.length > 0;
		if (!existe) {
			this.serviciosToast.mostrarToast('Error', 'Debe seleccionar 2 nodos diferentes', 'danger')
		}
		return existe;
	}

	private yaExisteRelacion(idPadre, id) {
		if (this.esEdge(`${idPadre}${id}`) || this.esEdge(`${id}${idPadre}`)) {
			this.serviciosToast.mostrarToast('Error', 'Ya existe una relación', 'danger')
			return true;
		}
		return false;
	}

	private esEdge(id) {
		const posibleEdge = this.cy.getElementById(id);
		return posibleEdge.length > 0 && posibleEdge.isEdge();
	}

	private tieneOtroPadre(idNodo) {
		const tieneOtroPadre = this.gruposYNodos.find(grupo => this.esEdge(`${grupo.data.id}${idNodo}`)) !== undefined;
		if (tieneOtroPadre) {
			this.serviciosToast.mostrarToast('Error', 'Un nodo no puede tener 2 padres.', 'danger');
			return true;
		}
		return false;
	}

	private tieneOtroHijo(idPadre) {
		const tieneOtroHijo = this.gruposYNodos.find(grupo => this.esEdge(`${idPadre}${grupo.id}`)) !== undefined;
		if (tieneOtroHijo) {
			this.serviciosToast.mostrarToast('Error', 'Un nodo no puede tener 2 hijos.', 'danger');
			return true;
		}
		return false;
	}

	private esConexion(idPadre, id) {
		const ob = this.cy.getElementById(`${idPadre}${id}`);
		if (ob.length > 0 && ob[0].isEdge()) {
			this.serviciosToast.mostrarToast('Error', 'Ya existe la conexión', 'danger');
			return true;
		}
		return false;
	}

	private sonGrupoYNodo(idPadre, id){
		const grupoEsPadre = this.esGrupo(idPadre);
		const nodoEsHijo = this.esNodo(id);
		const nodoEsPadre = this.esNodo(idPadre);
		const grupoEsHijo = this.esGrupo(id);
		if ((grupoEsPadre && nodoEsHijo) || (nodoEsPadre && grupoEsHijo)) {
			this.serviciosToast.mostrarToast('Error', 'No se puede conectar un grupo con un nodo', 'danger');
			return true;
		}
	}

	private esGrupo(id: string) {
		const idString = id + "";
		return idString.length >= 5; //* 10000 tiene 5 digitos y los ids autogenerados tienen mñas de 5.
	}
	
	private esNodo(id: string) {
		const idString = id + "";
		return idString.length < 5;
	}

	private crearEdge(idNodo, idPadre) {
		const edge = { data: { id: `${idPadre}${idNodo}`, source: `${idPadre}`, target: `${idNodo}` } };
		this.cy.add(edge);
	}

	desconectar(edge) {
		this.cy.getElementById(edge.id()).remove();
	}

	cambioSolicitud() {
		//Cambio la solicitud de este usuario.
		this.usuarios.find(solicitante => {
			return solicitante.email === this.serviciosLocalStorage.darEmail()
		}).solicitandoOrganizacion = this.solicitandoOrganizacion;

		this.socket.send(JSON.stringify({
			accion: 'Cambio solicitud de organizacion',
			email: this.serviciosLocalStorage.darEmail(),
			solicitandoOrganizacion: this.solicitandoOrganizacion
		}));
	}

	cambiarNombreGrupo(id, nuevoNombre) {
		this.gruposYNodos
			.find(grupo => grupo.data.id === id)
			.data.nombre = nuevoNombre;

		this.cy.getElementById(id).data({ nombre: nuevoNombre });

		this.modalCambioNombreGrupo.modal('toggle');

		//Esto puede ir aquí o en un dataEvent.
		this.socket.send(JSON.stringify({
			accion: 'Cambiar nombre',
			grupo: { data: { id, nombre: nuevoNombre } }
		}));
	}

	atenderCambioDeSolicitud(datos) {
		this.usuarios
			.find(solicitante => solicitante.email === datos.email)
			.solicitandoOrganizacion = datos.solicitandoOrganizacion;
	}

	cambioUnNombre(datos) {
		const { id, nombre } = datos.grupo.data;

		const nodoEncontrado = this.gruposYNodos.find(grupo => grupo.data.id === id);
		const nombreAntiguo = nodoEncontrado.data.nombre;
		nodoEncontrado.data.nombre = nombre;
		const nodoCy = this.cy.getElementById(id);
		nodoCy.data({ nombre });
		nodoCy.style({ label: nombre });

		this.serviciosToast.mostrarToast(undefined, `El grupo "${nombreAntiguo}" ahora se llama "${nombre}".`);
	}

	darCantidadSolicitantes() {
		return this.usuarios
			.filter(solicitante => solicitante.solicitandoOrganizacion)
			.length;
	}

	darGruposIterables() {
		return this.gruposYNodos;
	}

	/**
	 * Recibe un objeto tipo nodo o edge de cytoscape.
	 */
	private agregarAGruposYNodos(elemento) {
		const existe = this.gruposYNodos.find(nodo => nodo.data.id === elemento.data().id);
		const esEdge = elemento.data().source !== undefined;
		if (existe) {return; }
		if (esEdge) {return; }
		this.gruposYNodos.push({ data: elemento.data() });
	}

	private abrirModalCambioNombreGrupo(elemento) {
		if (!elemento.data().esGrupo) {
			this.serviciosToast.mostrarToast('Error', 'El cambio de nombre es solo para grupos.', 'danger');
			return;
		}
		this.grupoSeleccionado = elemento.data();
		this.modalCambioNombreGrupo.modal('toggle');
	}

	private abrirModalImagenNodo(elemento) {
		if (elemento.data().esGrupo || !elemento.isNode()) {
			this.serviciosToast.mostrarToast('Error', 'Solo se pueden visualizar las imagenes de los nodos o individuales.', 'danger');
			return;
		}
		this.nodoSeleccionado = elemento.data();
		this.modalVisualizacionImagenNodo.modal('toggle');
	}

	private onWebSocketClose(event) {
		if (!this.socket) {
			this.serviciosToast.mostrarToast('Error', 'Fuiste expulsado dada tu inactividad.', 'danger');
			this.router.navigateByUrl('/dashboard');
		}
	}

	private onWebsocketError(err) {
		this.serviciosToast.mostrarToast('Error', 'Un error inesperado ha ocurrido, por favor vuelve a ingresar.', 'danger');
		this.router.navigateByUrl('/dashboard');
	}

	hayMenuVisible() {
		return this.menuVisible !== '';
	}

	alternarVisibilidadAccionesConectarGrupos() {
		if (this.menuVisible === this.menu.conectarGrupos) {
			this.menuVisible = '';
		} else {
			this.menuVisible = this.menu.conectarGrupos;
		}
	}

	esAccionesConectarGruposVisible() {
		return this.menuVisible === this.menu.conectarGrupos;
	}

	alternarVisibilidadAccionerOrdenarNodos() {
		if (this.menuVisible === this.menu.ordenarNodos) {
			this.menuVisible = '';
		} else {
			this.menuVisible = this.menu.ordenarNodos;
		}
	}

	esAccionesOrdenarNodosVisible() {
		return this.menuVisible === this.menu.ordenarNodos;
	}

	ngOnDestroy() {
		if (this.socket) {
			this.socket.close();
		}

		this.componentDestroyed$.next(true)
		this.componentDestroyed$.complete()
	}

}
