import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ProblematicaService {
	
	url : string = `${environment.apiUrl}/problematicas`;

	constructor(private http: HttpClient) { }
	
	avanzarFase(idProblematica: number){
		return this.http
			.put(`${this.url}/${idProblematica}?avanzar=${true}`, {}, { withCredentials: true })
			.pipe(catchError(err => of(err)))
	}
	
	darInfoProblematica(idProblematica: number){
		return this.http.get(`${this.url}/${idProblematica}?estado=true`)
			.pipe(catchError(err => of(err)))
	}
}