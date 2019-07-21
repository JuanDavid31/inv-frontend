import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  
  email:string;
  password:string;

  constructor(private http:HttpClient) { }
  
  login(){
    this.http.post('http://192.168.0.2:8080/auth',{
         email:this.email,
         pass:this.password,
         nombre:'Diego'
    }).subscribe((data:any) => {
      console.log(data)
    })
  }

  ngOnInit() {
  }

}
