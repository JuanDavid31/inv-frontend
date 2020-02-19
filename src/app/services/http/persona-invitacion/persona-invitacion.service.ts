import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environment/environment';
import { LocalStorageService } from '@app/services/localstorage/local-storage.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class PersonaInvitacionService {

	url: string = `${environment.apiUrl}/personas`;

	constructor(private http: HttpClient,
				private serviciosLocalStorage: LocalStorageService) { }
	
	darInvitacionesVigentesRecibidas(){
		return this.http.get(`${this.url}/${this.serviciosLocalStorage.darEmail()}/invitaciones`)
			.pipe(catchError(err => of(err)));
	}
}