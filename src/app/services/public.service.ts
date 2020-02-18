import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environment/environment';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicService {
	
	url : string = environment.apiUrl;

	constructor(private http: HttpClient) { }
	
	login(email: string, pass: string){
		return this.http.post(`${this.url}/auth`, { email, pass })
				.pipe(catchError(err => of(err)))
	}
	
	registrar(nombres: string, apellidos: string, email: string, pass: string){
		return this.http.post(`${this.url}/personas`, { nombres, apellidos, email, pass })
				.pipe(catchError(err => of(err)))
	}
	
	recuperarPass(correo: string){
		return this.http.post(`${this.url}/auth/pass?email=${correo}`, {})
    			.pipe(catchError(error => of(error)))
	}
  
}