import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LocalStorageService } from '../services/localstorage/local-storage.service';
import { NotificacionesService } from 'app/services/notificaciones/notificaciones.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

  invitaciones = [];
  decision: boolean;
  idProblematica;

  constructor(private http: HttpClient,
    private serviciosLocalStorage: LocalStorageService,
    private serviciosNotificaciones: NotificacionesService) { }

  ngOnInit() {
    this.cargarInvitaciones();
  }

  cargarInvitaciones() {
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http
      .get('http://localhost:8080/personas/' + this.serviciosLocalStorage.darEmail() + '/invitaciones', options)
      .pipe(catchError(err => of(err)))
      .subscribe(res => {
        console.log(res);
        if (res.error) {
          alert("Hubo un error");
        } else {
          this.invitaciones = res;
        }
      })
  }

  aceptarInvitacion(invitacion, decision: boolean) {
    console.log(invitacion, decision);

    const { idInvitacion, idProblematica, emailRemitente, emailDestinatario, paraInterventor } = invitacion;

    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }

    this.http.put(`http://localhost:8080/invitaciones/${idInvitacion}?aceptar=${decision}`, {
      idProblematica,
      emailRemitente,
      emailDestinatario: this.serviciosLocalStorage.darEmail(),
      paraInterventor
    }, options).pipe(catchError(err => of(err)))
      .subscribe(res => {
        console.log(res)
        if (res.error) {
          alert("Error")
        } else {
          alert("has aceptado la invitacion");
          //TODO: Eliminar del arreglo usuariosBuscados a la persona invitada.
          //TODO: Arreglar la persona invitada al array invitaciones
          this.eliminarNotificacion(res.id);
        }
      })
  }

  rechazarInvitacion(invitacion) {

    this.decision = false;

    const { idInvitacion, idProblematica, emailRemitente, paraInterventor } = invitacion;

    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }

    this.http.put(`http://localhost:8080/invitaciones/${idInvitacion}?aceptar=${this.decision}`, {
      idProblematica,
      emailRemitente,
      emailDestinatario: this.serviciosLocalStorage.darEmail(),
      paraInterventor
    }, options).pipe(catchError(err => of(err)))
      .subscribe((res: any) => {
        console.log(res)
        if (res.error) {
          alert("Error")
        } else {
          alert("has rechazadoo la invitacion");
          //TODO: Eliminar del arreglo usuariosBuscados a la persona invitada.
          //TODO: Arreglar la persona invitada al array invitaciones
          this.eliminarNotificacion(res.id);
        }
      })
  }

  eliminarNotificacion(idInvitacion) {
    this.serviciosNotificaciones
      .emitChange(idInvitacion);
  }
}