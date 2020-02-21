import { Injectable } from '@angular/core';
import { environment } from '@environment/environment';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LocalStorageService } from '@app/services/localstorage/local-storage.service';
import { Escrito } from '@app/classes/Escrito';

@Injectable({
	providedIn: 'root'
})
export class ProblematicaPersonaService {

	url : string = environment.apiUrl;

	constructor(private http: HttpClient,
				private serviciosLocalStorage: LocalStorageService) { }
	
	darUsuariosPorPatron(patron: string, idProblematica: number){
		const url = `${this.darUrl(idProblematica)}?email=${patron}&email-remitente=${this.serviciosLocalStorage.darEmail()}`;
		
		return this.http.get(url).pipe(catchError(err => of(err)));
	}
	
	darInvitados(idProblematica: number){
		const url = `${this.darUrl(idProblematica)}/${this.serviciosLocalStorage.darEmail()}/invitaciones`;
		
		return this.http.get(url).pipe(catchError(err => of(err)))
	}
	
	darEscritosPorProblematicaYPersona(idProblematica: number){
		return this.http
			.get(`${this.darUrl(idProblematica)}/${this.serviciosLocalStorage.darEmail()}/escritos`)
			.pipe(catchError(err => of(err)));
	}
	
	agregarEscrito(idProblematica: number, escrito: Escrito){
		return this.http
			.post(`${this.darUrl(idProblematica)}/${this.serviciosLocalStorage.darEmail()}/escritos`, escrito)
			.pipe(catchError(err => of(err)));
	}
	
	actualizarEscrito(idProblematica: number, escrito: Escrito){
		const url = `${this.darUrl(idProblematica)}/${this.serviciosLocalStorage.darEmail()}/escritos/${escrito.id}`;
		
		return this.http.put(url, escrito).pipe(catchError(err => of(err)));
	}
	
	eliminarEscrito(idProblematica: number, idEscrito: number){
		const url = `${this.darUrl(idProblematica)}/${this.serviciosLocalStorage.darEmail()}/escritos/${idEscrito}`;

		return this.http.delete(url).pipe(catchError(err => of(err)))
	}
	
	private darUrl(idProblematica: number){
		return `${this.url}/problematicas/${idProblematica}/personas`;
	}
	
}