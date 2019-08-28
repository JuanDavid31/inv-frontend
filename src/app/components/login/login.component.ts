import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../services/localstorage/local-storage.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  email: string;
  password: string;

  constructor(private http: HttpClient,
    private serviciosLocalStorage: LocalStorageService,
    private router: Router) {



  }

  login() {
    this.http.post('http://3.130.29.100:8080/auth', {
      email: this.email,
      pass: this.password
    }).pipe(catchError(err => of(err)))
      .subscribe((res: any) => {
        if (res.error) {
          alert("Contraseña o usuario incorrectos")
        } else {
          this.serviciosLocalStorage.guardarDatos(res);
          this.router.navigateByUrl("/dashboard");
        }
      })
  }
}
