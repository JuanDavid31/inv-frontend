import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalStorageService } from '@app/services/localstorage/local-storage.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '@environment/environment';

@Injectable({
	providedIn: 'root'
})
export class PersonaProblematicaService {
	
	url : string = `${environment.apiUrl}/personas/${this.serviciosLocalStorage.darEmail()}/problematicas`;

	constructor(private http: HttpClient,
				private serviciosLocalStorage: LocalStorageService) { }
	
	darProblematicas(){
		return this.http.get(this.url).pipe(catchError(err => of(err)));
	}
	
	darProblematicasTerminadas(){
		return this.http.get(`${this.url}?fase=5`).pipe(catchError(err => of(err)));
	}
	
	crearProblematica(nombre: string, descripcion: string){
		return this.http.post(this.url, { nombre, descripcion }).pipe(catchError(err => of(err)));
	}
	
	darNodos(idProblematica: number){
		return this.http.get(`${this.url}/${idProblematica}/nodos`)
            .pipe(catchError(err => of(err)))
	}
	
	agregarNodo(idProblematica: number, form: FormData, extensionFoto: string){
		const options = {
            headers: new HttpHeaders({
                'extension': extensionFoto
            })
        }
        
        return this.http.post(`${this.url}/${idProblematica}/nodos`, form, options)
        		.pipe(catchError(err => of(err)));
	}
}
