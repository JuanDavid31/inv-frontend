import { Component, OnInit } from '@angular/core';
import * as Chartist from 'chartist';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Http, Headers } from '@angular/http';
import { of } from 'rxjs';
import { LocalStorageService } from '../services/localstorage/local-storage.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  problematicas = [];
  invitaciones=[];
  nombreX: string
  descripcionX: string
  correoAInvitar:string;
  esInter:boolean;
  elId;
  elIdInvi:number;
  nombreProblematica:string;

  constructor(
    private http: HttpClient,
    private serviciosLocalStorage: LocalStorageService) { }

  ngOnInit() {
    this.cargarProblematicas();
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
  
  cargarInvitados(id,nombre){
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http
      .get('http://3.130.29.100:8080/problematicas/'+id +'/personas/'+ this.serviciosLocalStorage.darEmail() + '/invitaciones', options)
      .pipe(catchError(err => of(err)))
      .subscribe(res => {
        console.log(res);
        if (res.error) {
          alert("Hubo un error");
        } else {
          this.invitaciones = res;
        }
      })
      this.elId=id;
      this.nombreProblematica=nombre;
      
      
    
    
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
  
  cambiarCorreoAInvitar(emailUsuarioAInvitar: string){
    
    this.correoAInvitar=emailUsuarioAInvitar;
    
  }
  
  prueba(id){
    this.elIdInvi=id;
     console.log(this.elIdInvi);
    
  }
  
  eliminarInvitacion(id){
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });


    const options = {
      headers: headers
    }
    this.http.delete('http://3.130.29.100:8080/invitaciones/'+id, {
      
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
  
  invitar(){
    
    console.log(this.correoAInvitar)
    
    const headers = new HttpHeaders({ 'Authorization': this.serviciosLocalStorage.darToken() });

    const options = {
      headers: headers
    }
    this.http.post('http://3.130.29.100:8080/invitaciones', {
      idProblematica: this.elId,
      emailRemitente: this.serviciosLocalStorage.darEmail() ,
      emailDestinatario:this.correoAInvitar,
      paraInterventor:this.esInter
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
  
  buscarUsuarios(patron){
    if(patron.length < 5)return;
    
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
          this.usuariosBuscados = res
          //TODO: Cerrar modal.
        }
      })
  }
}