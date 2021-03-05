import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environment/environment';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProblematicaEscritoService {
  
	url : string = `${environment.apiUrl}/problematicas`;

	constructor(private http: HttpClient) { }
	
	darEscritosPorProblematica(idProblematica: number){
		return this.http.get(this.darUrl(idProblematica))
			.pipe(catchError(err => of(err)));
	}
	
	private darUrl(idProblematica: number){
		return `${this.url}/${idProblematica}/escritos`
	}

}