import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { LocalStorageService } from '../services/localstorage/local-storage.service';
import { ToastService } from 'app/services/toast/toast.service';
declare var $;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  problematicas = [];
  invitaciones = [];
  nombreNuevaProblematica: string = '';
  descripcionNuevaProblematica: string = '';
  correoAInvitar: string;
  invitacionParaInterventor: boolean = false;
  problematicaSeleccionada: any = {};
  datosProblematica: any = {};

  autoCompletadoUsuariosAInvitar: any;
  resultadosCb: any;
  usuarioAInvitarSeleccioando;

  modal: any;
  ventanaMensajes: any;

  estadosInvitacion = {
    PENDIENTE: 'Pendiente',
    ACEPTADA: 'Aceptada',
    RECHAZADA: 'Rechazada'
  }

  constructor(
    private http: HttpClient,
    private serviciosLocalStorage: LocalStorageService,
    private serviciosToast: ToastService,
    private router: Router) { }

  ngOnInit() {
    this.cargarProblematicas();
    this.autoCompletadoUsuariosAInvitar = $(document.getElementById('pac-input'))
      .typeahead({ source: this.activateAutoCompletadoUsuariosAInvitar.bind(this), minLength: 4 })
    this.modal = $('#mi-modal');
  }

  activateAutoCompletadoUsuariosAInvitar(query: string, result) {
    this.resultadosCb = result;
    this.buscarUsuarios(query);
  }

  buscarUsuarios(patron) {
    if (patron.length < 5) return;

    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }

    const url = `http://3.130.29.100:8080/problematicas/${this.problematicaSeleccionada.id}/personas` +
      `?email=${patron}&email-remitente=${this.serviciosLocalStorage.darEmail()}`;

    this.http.get(url, options)
      .pipe(catchError(err => of(err)))
      .subscribe((res: any) => {
        if (res.error) {
          this.serviciosToast.mostrarToast({
            titulo: 'Error',
            cuerpo: 'Ocurrió un error al buscar los usuarios, intentelo de nuevo.',
            esMensajeInfo: false
          });
        } else {
          this.prepareData(res);
        }
      })
  }

  prepareData(usuariosAInvitar) {
    usuariosAInvitar.forEach(usuario => usuario.name = `${usuario.email}`);
    this.resultadosCb(usuariosAInvitar);
    this.autoCompletadoUsuariosAInvitar.change(this.onChangeautoCompletadoUsuariosAInvitar.bind(this))
  }

  /**
   * Default behaviour will call this several times.
   */
  onChangeautoCompletadoUsuariosAInvitar() {
    let current = this.autoCompletadoUsuariosAInvitar.typeahead("getActive");
    if (current) {
      if (current.name == this.autoCompletadoUsuariosAInvitar.val()) {
        this.usuarioAInvitarSeleccioando = current;
        this.correoAInvitar = this.usuarioAInvitarSeleccioando.email;
      } else {
        this.usuarioAInvitarSeleccioando = {}
      }
    } else {
      this.usuarioAInvitarSeleccioando = {};
    }
  }

  cargarProblematicas() {
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http
      .get('http://3.130.29.100:8080/personas/' + this.serviciosLocalStorage.darEmail() + '/problematicas', options)
      .pipe(catchError(err => of(err)))
      .subscribe(res => {
        if (res.error) {
          this.serviciosToast.mostrarToast({
            titulo: 'Error',
            cuerpo: 'Ocurrió un error al cargar las problematicas, intentelo de nuevo.',
            esMensajeInfo: false
          });
        } else {
          this.problematicas = res;
        }
      })
  }

  cargarInvitados(problematica) {
    const { id } = problematica;

    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http
      .get(`http://3.130.29.100:8080/problematicas/${id}/personas/${this.serviciosLocalStorage.darEmail()}/invitaciones`, options)
      .pipe(catchError(err => of(err)))
      .subscribe(res => {
        if (res.error) {
          this.serviciosToast.mostrarToast({
            titulo: 'Error',
            cuerpo: 'Ocurrió un error alcargar los invitados, intentelo de nuevo.',
            esMensajeInfo: false
          });
        } else {
          this.invitaciones = res;
        }
      })
    this.problematicaSeleccionada = problematica;
  }

  abrirModal() {
    this.modal.modal('toggle');
  }

  crearProblematica() {
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http.post(`http://3.130.29.100:8080/personas/${this.serviciosLocalStorage.darEmail()}/problematicas`, {
      nombre: this.nombreNuevaProblematica,
      descripcion: this.descripcionNuevaProblematica
    }, options).pipe(catchError(err => of(err)))
      .subscribe((res: any) => {
        if (res.error) {
          this.serviciosToast.mostrarToast({
            titulo: 'Error',
            cuerpo: 'Ocurrió un error al agregar la problematica, intentelo de nuevo.',
            esMensajeInfo: false
          });
        } else {
          this.problematicas.unshift(res);
          this.modal.modal('toggle');
          this.serviciosToast.mostrarToast({ cuerpo: 'Problematica agregada' });
        }
      })
  }

  invitar() {
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }

    this.http.post('http://3.130.29.100:8080/invitaciones', {
      idProblematica: this.problematicaSeleccionada.id,
      emailRemitente: this.serviciosLocalStorage.darEmail(),
      emailDestinatario: this.correoAInvitar,
      paraInterventor: this.invitacionParaInterventor
    }, options).pipe(catchError(err => of(err)))
      .subscribe((res: any) => {
        if (res.error) {
          this.serviciosToast.mostrarToast({
            titulo: 'Error',
            cuerpo: 'Ocurrió un error al invitar, intentelo de nuevo.',
            esMensajeInfo: false
          });
        } else {
          this.serviciosToast.mostrarToast({ cuerpo: 'Usuario invitado.' });
          this.invitaciones.push(res);
          this.correoAInvitar = '';
        }
      })
  }

  eliminarInvitacion(id) {
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http.delete(`http://3.130.29.100:8080/invitaciones/${id}`, options)
      .pipe(catchError(err => of(err)))
      .subscribe((res: any) => {
        if (res.error) {
          this.serviciosToast.mostrarToast({
            titulo: 'Error',
            cuerpo: 'Ocurrió un error al eliminar la invitación, intentelo de nuevo.',
            esMensajeInfo: false
          });
        } else {
          this.serviciosToast.mostrarToast({ cuerpo: 'Invitación eliminada' });
          this.invitaciones = this.invitaciones.filter(invitacion => invitacion.id !== id);
        }
      })
  }

  avanzarFase() {
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http
      .post(`http://3.130.29.100:8080/problematicas/${this.problematicaSeleccionada.id}?avanzar=${true}`, options)
      .pipe(catchError(err => of(err)))
      .subscribe(res => {
        if (res.error) {
          this.serviciosToast.mostrarToast({
            titulo: 'Error',
            cuerpo: 'Hubo un error al avanzar la fase, intentelo de nuevo',
            esMensajeInfo: false
          });
        } else {
          this.serviciosToast.mostrarToast({ cuerpo: 'Se avanzo a la siguiente fase' });
        }
      })
  }

  darFaseProblematica() {
    switch (this.problematicaSeleccionada.fase) {
      case 0:
        return "Invitando participantes";
      case 1:
        return "Manipulando Nodos (Individual)"
      case 2:
        return "Manipulando Nodos (Grupal)";
      case 3:
        return "Reaccionando a nodos";
      case 4:
        return "Elaborando escritos";
        case 5:
        return "Terminada";
      default:
        return 'esta mal';
    }
  }

  participar() {
    this.serviciosLocalStorage.guardarProblematicaActual(this.problematicaSeleccionada.id);
    this.router.navigateByUrl("/fase-individual");
  }

  darClassEstado(invitacionVigente, estaRechazada) {
    const estado = this.darEstadoInvitacion(invitacionVigente, estaRechazada);

    switch (estado) {
      case this.estadosInvitacion.PENDIENTE:
        return 'bg-light';
      case this.estadosInvitacion.RECHAZADA:
        return 'bg-danger';
      case this.estadosInvitacion.ACEPTADA:
        return 'bg-success';
      default:
        return '';
    }
  }

  invitacionBorrable(invitacionVigente, estaRechazada) {
    const estado = this.darEstadoInvitacion(invitacionVigente, estaRechazada);
    if (estado === this.estadosInvitacion.ACEPTADA) { return false; }
    return true
  }

  darEstadoInvitacion(invitacionVigente, estaRechazada) {
    if (invitacionVigente && !estaRechazada) {
      return this.estadosInvitacion.PENDIENTE;
    } else if (!invitacionVigente && estaRechazada) {
      return this.estadosInvitacion.RECHAZADA;
    } else if (!invitacionVigente && !estaRechazada) {
      return this.estadosInvitacion.ACEPTADA;
    }
  }
  
  darInfoAlAvanzar(){
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http
      .get(`http://3.130.29.100:8080/problematicas/${this.problematicaSeleccionada.id}?estado=${true}`, options)
      .pipe(catchError(err => of(err)))
      .subscribe(res => {
        if (res.error) {
          this.serviciosToast.mostrarToast({
            titulo: 'Error',
            cuerpo: 'Hubo un error al avanzar la fase, intentelo de nuevo',
            esMensajeInfo: false
          });
        } else {
          this.datosProblematica=res;
          console.log(this.datosProblematica)
        }
      })
    
  }
  
  estaEnFase0(){
   switch (this.problematicaSeleccionada.fase) {
      case 0:
        return true;
      
      default:
        return false;
    }
  }
  estaEnFase1(){
   switch (this.problematicaSeleccionada.fase) {
      case 1:
        return true;
      
      default:
        return false;
    }
  }

  
}