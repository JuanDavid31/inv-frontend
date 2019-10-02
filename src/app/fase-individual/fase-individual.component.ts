import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

declare var $;

interface Marker {
    lat: number;
    lng: number;
    label?: string;
    draggable?: boolean;
}

@Component({
    selector: 'app-fase-individual',
    templateUrl: './fase-individual.component.html',
    styleUrls: ['./fase-individual.component.css']
})

export class FaseIndividualComponent implements OnInit {

    toast:any;

    constructor() { }

    ngOnInit() {
        this.toast = $(document.getElementById('alerta'));
    }
    
    abrirToast(){
        this.toast.toast('show');
    }
    
  
}