import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from '@app/services/localstorage/local-storage.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@environment/environment';

@Injectable({
	providedIn: 'root'
})
export class InvitacionService {
	
	url : string = `${environment.apiUrl}/invitaciones`;
	
	options = { withCredentials: true }

	constructor(private http: HttpClient,
				private serviciosLocalStorage: LocalStorageService) { }
  
	invitar(idProblematica: number, emailDestinatario: string, paraInterventor: boolean){
		const emailRemitente = this.serviciosLocalStorage.darEmail();

		return this.http.post(this.url, { 
			idProblematica, emailRemitente, 
			emailDestinatario, paraInterventor 
		}, this.options).pipe(catchError(err => of(err)))
	}
	
	eliminarInvitacion(idInvitacion: number){
		return this.http.delete(`${this.url}/${idInvitacion}`)
			.pipe(catchError(err => of(err)))
	}
	
	responderInvitacion(invitacion: InvitacionRespondida, decision: boolean){
		const { idInvitacion, idProblematica, emailRemitente, paraInterventor } = invitacion;
		
		return this.http.put(`${this.url}/${idInvitacion}?aceptar=${decision}`, {
			idProblematica,
			emailRemitente,
			emailDestinatario: this.serviciosLocalStorage.darEmail(),
			paraInterventor
		}, this.options).pipe(catchError(err => of(err)))
	}
}

interface InvitacionRespondida{
	idInvitacion: number
	idProblematica: number
	emailRemitente: string,
	paraInterventor: boolean
}