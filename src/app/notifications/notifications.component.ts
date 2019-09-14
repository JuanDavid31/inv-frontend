import { Component, OnInit } from '@angular/core';
import * as Chartist from 'chartist';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Http, Headers } from '@angular/http';
import { of } from 'rxjs';
import { LocalStorageService } from '../services/localstorage/local-storage.service';

declare var $: any;
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  
  invitaciones=[];
  decision:boolean;
  idProblematica;

  

  constructor( private http: HttpClient,
    private serviciosLocalStorage: LocalStorageService) { }
  showNotification(from, align){
      const type = ['','info','success','warning','danger'];

      const color = Math.floor((Math.random() * 4) + 1);

      $.notify({
          icon: "notifications",
          message: "Welcome to <b>Material Dashboard</b> - a beautiful freebie for every web developer."

      },{
          type: type[color],
          timer: 4000,
          placement: {
              from: from,
              align: align
          },
          template: '<div data-notify="container" class="col-xl-4 col-lg-4 col-11 col-sm-4 col-md-4 alert alert-{0} alert-with-icon" role="alert">' +
            '<button mat-button  type="button" aria-hidden="true" class="close mat-button" data-notify="dismiss">  <i class="material-icons">close</i></button>' +
            '<i class="material-icons" data-notify="icon">notifications</i> ' +
            '<span data-notify="title">{1}</span> ' +
            '<span data-notify="message">{2}</span>' +
            '<div class="progress" data-notify="progressbar">' +
              '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
            '</div>' +
            '<a href="{3}" target="{4}" data-notify="url"></a>' +
          '</div>'
      });
  }
  ngOnInit() {
    this.cargarInvitaciones();
  }
  
  cargarInvitaciones(){
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http
    .get('http://3.130.29.100:8080/personas/'+ this.serviciosLocalStorage.darEmail() + '/invitaciones', options)
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
  
  aceptarInvitacion(invitacion, decision: boolean){
    console.log(invitacion, decision);

    const { idInvitacion, idProblematica, emailRemitente, emailDestinatario, paraInterventor } = invitacion;

    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    
    this.http.put(`http://3.130.29.100:8080/invitaciones/${idInvitacion}?aceptar=${decision}`, {
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
       alert("has aceptado la invirtacion");
        //TODO: Eliminar del arreglo usuariosBuscados a la persona invitada.
        //TODO: Arreglar la persona invitada al array invitaciones
      }
    })
  }
}