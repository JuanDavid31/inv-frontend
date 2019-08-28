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

  nombreX: string
  descripcionX: string

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
          //* Llegaron las problematicas.
          console.log(res);
        }
      })
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
        if (res.error) { //Si contiene error, contraseña o usuario incorrecto.
          alert("Hubo un error")
        } else {
          alert("Se ha creado correctamente")

        }
      })
  }


}
