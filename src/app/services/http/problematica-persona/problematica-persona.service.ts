import { Injectable } from '@angular/core';
import { environment } from '@environment/environment';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LocalStorageService } from '@app/services/localstorage/local-storage.service';

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
	
	private darUrl(idProblematica: number){
		return `${this.url}/problematicas/${idProblematica}/personas`;
	}
	
}