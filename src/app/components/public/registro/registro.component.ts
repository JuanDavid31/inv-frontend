import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { PublicService } from '@services/http/public/public.service';

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

	constructor(private serviciosPublicos: PublicService,
		private serviciosLocalStorage: LocalStorageService,
		private router: Router) { }

	register() {
		this.botonBloqueado = true;
		this.serviciosPublicos
			.registrar(this.nombres, this.apellidos, this.correo, this.password)
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