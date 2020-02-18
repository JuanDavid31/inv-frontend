import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LocalStorageService } from '@services/localstorage/local-storage.service';
import { PublicService } from '@app/services/public.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  email: string;
  password: string;

  mensaje: string = '';
  botonBloqueado: boolean = false;

	constructor(private serviciosPublicos: PublicService,
				private serviciosLocalStorage: LocalStorageService,
				private router: Router) { }

	login() {
		this.botonBloqueado = true;
		this.serviciosPublicos.login(this.email, this.password)
		.subscribe((res: any) => {
			this.botonBloqueado = false;
			if (res.error) {
				this.mensaje = res.error.errors[0];
			} else {
				this.serviciosLocalStorage.guardarDatos(res);
				this.router.navigateByUrl("/dashboard");
			}
		})
	}
}