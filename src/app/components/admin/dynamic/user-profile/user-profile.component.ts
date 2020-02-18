import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../services/localstorage/local-storage.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  
  nombreUsuario:string;
  apellido:string;

  constructor(private serviciosLocalStorage: LocalStorageService) { }

  ngOnInit() {
    this.nombreUsuario=this.serviciosLocalStorage.darNombres();
    this.apellido=" "+this.serviciosLocalStorage.darApellidos();
    
  }
  
  
}
