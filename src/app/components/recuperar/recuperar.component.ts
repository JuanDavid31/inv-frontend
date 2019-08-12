import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-recuperar',
  templateUrl: './recuperar.component.html',
  styleUrls: ['./recuperar.component.scss']
})
export class RecuperarComponent implements OnInit {

  correo:string;

  constructor(private http:HttpClient) { }

  recuperar(){
    this.http.post('http://3.130.29.100:8080/auth/pass?email=this.correo',{
         
    email:this.correo,
         
         
    }).subscribe((data:any) => {
      
      console.log(data)

    
    })
  } 

  ngOnInit() {
  }

}
