import { Injectable } from '@angular/core';
import { environment } from '@environment/environment';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
	providedIn: 'root'
})
export class ProblematicaReaccionService {
	
	url: string = `${environment.apiUrl}/problematicas`;

	constructor(private http: HttpClient) { }
	
	darGruposConReacciones(idProblematica: number){
		return this.http
			.get(`${this.url}/${idProblematica}/reacciones`)
			.pipe(catchError(err => of(err)));
	}
}