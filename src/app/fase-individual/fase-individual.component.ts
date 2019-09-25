import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

    constructor() { }

    ngOnInit() {

    }

}