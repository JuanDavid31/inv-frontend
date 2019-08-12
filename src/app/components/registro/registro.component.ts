import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent implements OnInit {

  nombres:string;
  apellidos:string;
  correo:string;
  password:string;
  password2:string;
  constructor(private http:HttpClient) { }

  register(){
    this.http.post('http://3.130.29.100:8080/personas',{
         nombres:this.nombres,
         apellidos:this.apellidos,
         email:this.correo,
         pass:this.password,
         
         
    })/* .pipe(
       
      catchError(err => of([]))

    ) */.subscribe((data:any) => {
      
      console.log(data)
      

     

    })
  }
  

  ngOnInit() {
  }

}
