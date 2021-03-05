import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '@environment/environment';

@Injectable({
  providedIn: 'root'
})
export class NodoService {
	
	url: string = `${environment.apiUrl}/nodos`;

	constructor(private http: HttpClient) { }
	
	eliminarNodo(idNodo: number){
		return this.http
            .delete(`${this.url}/${idNodo}`)
            .pipe(catchError(err => of(err)));
	}
	
	conectarNodos(idNodo: number, idNodoPadre: number){
		return this.conectar(idNodo, idNodoPadre, true)
	}
	
	desconectarNodos(idNodo: number, idNodoPadre: number){
		return this.conectar(idNodo, idNodoPadre, false);
	}
	
	private conectar(idNodo: number, idNodoPadre: number, apadrinar: boolean){
		return this.http.put(`${this.url}/${idNodo}?id-padre=${idNodoPadre}&apadrinar=${apadrinar}`, {})
            .pipe(catchError(err => of(err)))		
	}
}
