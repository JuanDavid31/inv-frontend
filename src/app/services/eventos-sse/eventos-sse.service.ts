import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventosSseService {


    private cambioFaseProblematicaSubject = new Subject<any>();
	eventoCambioFaseProblematica$ = this.cambioFaseProblematicaSubject.asObservable();
	
	private invitacionRecibidaSubject = new Subject<any>();
	eventoInvitacionRecibida$ = this.invitacionRecibidaSubject.asObservable();
	
	private invitacionRespondidaSubject = new Subject<any>();
	eventoInvitacionRespondida$ = this.invitacionRespondidaSubject.asObservable();

    constructor() { }
  
    dispersarEventoCambioFaseProblematica(json){
        this.cambioFaseProblematicaSubject.next(json);
    }
    
    dispersarEventoInvitacionRecibida(invitacion){
        this.invitacionRecibidaSubject.next(invitacion);
    }
    
    dispersarEventoInvitacionRespondida(invitacion){
        this.invitacionRespondidaSubject.next(invitacion);
    }
  
}