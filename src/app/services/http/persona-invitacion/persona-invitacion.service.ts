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

	constructor(private http: HttpClient,
				private serviciosLocalStorage: LocalStorageService) { }
	
	darInvitacionesVigentesRecibidas(){
		return this.http.get(`${environment.apiUrl}/personas/${this.serviciosLocalStorage.darEmail()}/invitaciones`)
			.pipe(catchError(err => of(err)));
	}
}