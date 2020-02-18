import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PublicService } from '@app/services/public.service';

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

  constructor(private serviciosPublicos: PublicService) { }

  recuperar() {
    this.botonBloqueado = true;
    this.serviciosPublicos.recuperarPass(this.correo)
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
