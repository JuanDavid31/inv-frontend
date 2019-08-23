import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  email: string;
  password: string;

  constructor(private http: HttpClient, private router: Router) { }

  login() {
    this.http.post('http://3.130.29.100:8080/auth', {
      email: this.email,
      pass: this.password
    }).pipe(catchError(err => of(err)))
      .subscribe((data: any) => {
        console.log(data.nombres)
        if (data.error) { //Si contiene error, contraseña o usuario incorrecto.
          alert("Contraseña o usuario incorrectos")
        } else {
          //* Loggeo exitoso.
          //TODO: Guardar el TOKEN en el localstorage
          /*this.router.navigateByUrl("/dashboard");*/
        }
      })
  }
}
