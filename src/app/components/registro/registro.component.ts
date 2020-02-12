import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';

@Component({
	selector: 'app-registro',
	templateUrl: './registro.component.html',
	styleUrls: ['./registro.component.scss']
})
export class RegistroComponent {

	nombres: string;
	apellidos: string;
	correo: string;
	password: string;
	password2: string;

	mensaje: string = '';
	botonBloqueado: boolean = false;

	constructor(private http: HttpClient,
		private serviciosLocalStorage: LocalStorageService,
		private router: Router) { }

	register() {
		this.botonBloqueado = true;
		this.http.post('http://3.130.29.100:8080/personas', {
			nombres: this.nombres,
			apellidos: this.apellidos,
			email: this.correo,
			pass: this.password,
		}).pipe(catchError(err => of(err)))
			.subscribe((data: any) => {
				this.botonBloqueado = false;
				if (data.error) {
					this.mensaje = data.error.errors[0];
				} else {
					this.serviciosLocalStorage.guardarDatos(data);
					this.router.navigateByUrl("/dashboard");
				}
			})
	}

	esPassValido() {
		return this.password === this.password2;
	}
}