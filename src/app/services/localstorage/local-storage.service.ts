import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  guardarDatos(usuario: any) {
    const { token, data } = usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('nombres', data.nombres);
    localStorage.setItem('apellidos', data.apellidos);
    localStorage.setItem('email', data.email);
  }

  darToken() {
    return localStorage.getItem('token');
  }

  darEmail() {
    return localStorage.getItem('email');
  }

  darNombres() {
    return localStorage.getItem('nombres');
  }

  darApellidos() {
    return localStorage.getItem('apellidos');
  }

  eliminarDatos() {
    localStorage.removeItem('token');
    localStorage.removeItem('nombres');
    localStorage.removeItem('apellidos');
    localStorage.removeItem('email');
  }
}
