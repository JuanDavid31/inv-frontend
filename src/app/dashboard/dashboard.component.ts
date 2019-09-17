import { Component, OnInit } from '@angular/core';
import * as Chartist from 'chartist';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Http, Headers } from '@angular/http';
import { of } from 'rxjs';
import { LocalStorageService } from '../services/localstorage/local-storage.service';
declare var $;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  problematicas = [];
  invitaciones = [];
  nombreX: string
  descripcionX: string
  correoAInvitar: string;
  esInter: boolean;
  elId;
  elIdInvi: number;

  constructor(
    private http: HttpClient,
    private serviciosLocalStorage: LocalStorageService) { }

  autoCompletadoUsuariosAInvitar: any;
  resultadosCb: any;
  usuarioAInvitarSeleccioando;

  states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
    'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
    'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
    'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  ngOnInit() {
    this.cargarProblematicas();
    this.autoCompletadoUsuariosAInvitar = $(document.getElementById('pac-input'))
      .typeahead({ source: this.activateAutoCompletadoUsuariosAInvitar.bind(this), minLength: 4 })
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

    const url = `http://3.130.29.100:8080/problematicas/${this.elId}/personas` +
      `?email=${patron}&email-remitente=${this.serviciosLocalStorage.darEmail()}`;

    this.http.get(url, options)
      .pipe(catchError(err => of(err)))
      .subscribe((res: any) => {
        console.log(res);
        if (res.error) { //Si contiene error, contraseña o usuario incorrecto.
          alert(res.error);
        } else {
          //this.usuariosBuscados = res
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
        console.log(res);
        if (res.error) {
          alert("Hubo un error");
        } else {
          this.problematicas = res;
        }
      })
  }

  cargarInvitados(id) {
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http
      .get('http://3.130.29.100:8080/problematicas/' + id + '/personas/' + this.serviciosLocalStorage.darEmail() + '/invitaciones', options)
      .pipe(catchError(err => of(err)))
      .subscribe(res => {
        console.log(res);
        if (res.error) {
          alert("Hubo un error");
        } else {
          this.invitaciones = res;
        }
      })
    this.elId = id;


  }

  crearProblematica() {
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http.post('http://3.130.29.100:8080/personas/' + this.serviciosLocalStorage.darEmail() + '/problematicas', {
      nombre: this.nombreX,
      descripcion: this.descripcionX
    }, options).pipe(catchError(err => of(err)))
      .subscribe((res: any) => {
        console.log(res);
        if (res.error) { //Si contiene error, contraseña o usuario incorrecto.
          alert("Hubo un error")
        } else {
          this.problematicas.unshift(res);
          alert("Se ha creado correctamente")
          //TODO: Cerrar modal.
        }
      })
  }

  cambiarCorreoAInvitar(emailUsuarioAInvitar: string) {

    this.correoAInvitar = emailUsuarioAInvitar;

  }

  prueba(id) {
    this.elIdInvi = id;
    console.log(this.elIdInvi);

  }

  eliminarInvitacion(id) {
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });


    const options = {
      headers: headers
    }
    this.http.delete('http://3.130.29.100:8080/invitaciones/' + id, {

    }).pipe(catchError(err => of(err)))
      .subscribe((res: any) => {
        if (res.error) {
          alert("no papi")
        } else {
          alert("Se ha eliminado correctamente");
          //TODO: Eliminar del arreglo usuariosBuscados a la persona invitada.
          //TODO: Arreglar la persona invitada al array invitaciones
        }
      })
  }

  invitar() {

    console.log(this.correoAInvitar)

    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http.post('http://3.130.29.100:8080/invitaciones', {
      idProblematica: this.elId,
      emailRemitente: this.serviciosLocalStorage.darEmail(),
      emailDestinatario: this.correoAInvitar,
      paraInterventor: this.esInter
    }).pipe(catchError(err => of(err)))
      .subscribe((res: any) => {
        if (res.error) {
          alert("Pailas")
        } else {
          alert("Se ha invitado correctamente");
          //TODO: Eliminar del arreglo usuariosBuscados a la persona invitada.
          //TODO: Arreglar la persona invitada al array invitaciones
        }
      })
  }

  usuariosBuscados = []


}