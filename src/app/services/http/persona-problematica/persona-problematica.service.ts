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
	
	constructor(private http: HttpClient,
				private serviciosLocalStorage: LocalStorageService) { }
	
	darProblematicas(){
		return this.http.get(this.darUrl()).pipe(catchError(err => of(err)));
	}
	
	darProblematicasTerminadas(){
		return this.http.get(`${this.darUrl()}?fase=5`).pipe(catchError(err => of(err)));
	}
	
	crearProblematica(nombre: string, descripcion: string){
		return this.http.post(this.darUrl(), { nombre, descripcion }).pipe(catchError(err => of(err)));
	}
	
	darNodos(idProblematica: number){
		return this.http.get(`${this.darUrl()}/${idProblematica}/nodos`)
            .pipe(catchError(err => of(err)))
	}
	
	agregarNodo(idProblematica: number, form: FormData, extensionFoto: string){
		const options = {
            headers: new HttpHeaders({
                'extension': extensionFoto
            })
        }
        
        return this.http.post(`${this.darUrl()}/${idProblematica}/nodos`, form, options)
        		.pipe(catchError(err => of(err)));
	}
	
	darGrupos(idProblematica: number){
		return this.http
            .get(`${this.darUrl()}/${idProblematica}/grupos`)
            .pipe(catchError(err => of(err)))
	}
	
	reaccionar(idProblematica: number, idGrupo: number, valorReaccion: number){
        return this.http.post(`${this.darUrl()}/${idProblematica}/grupos/${idGrupo}/reacciones`, new Reaccion(valorReaccion))
            .pipe(catchError(err => of(err)))
	}
	
	private darUrl(){
		return `${environment.apiUrl}/personas/${this.serviciosLocalStorage.darEmail()}/problematicas`;
	}
}

class Reaccion{
    valor: number
    idGrupo: number
    idPersonaProblematica: string
    
    constructor(valor: number){
    	this.valor = valor;
    }
}
