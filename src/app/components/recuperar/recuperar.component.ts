import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-recuperar',
  templateUrl: './recuperar.component.html',
  styleUrls: ['./recuperar.component.scss']
})
export class RecuperarComponent implements OnInit {

  correo: string;

  botonBloqueado = false;
  mensaje = '';
  esMensajeExito = false;

  constructor(private http: HttpClient) { }

  recuperar() {
    this.botonBloqueado = true;
    this.http.post(`http://3.130.29.100:8080/auth/pass?email=${this.correo}`, {})
      .pipe(catchError(error => of(error)))
      .subscribe((data: any) => {
        this.botonBloqueado = false;
        if (data.error) {
          this.mensaje = data.error.errors[0];
        } else {
          this.esMensajeExito = true;
          this.mensaje = 'Revisa tu correo electronico.';
        }
      })
  }

  cerrarAlert() {
    this.mensaje = '';
    this.esMensajeExito = false;
  }

  ngOnInit() {
  }

}
