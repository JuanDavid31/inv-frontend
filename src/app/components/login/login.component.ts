import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError} from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  
  email:string;
  password:string;

  constructor(private http:HttpClient,private router:Router) { }
  
  login(){
    this.http.post('http://3.130.29.100:8080/auth',{
         email:this.email,
         pass:this.password,
         
    })/* .pipe(
       
      catchError(err => of([]))

    ) */.subscribe((data:any) => {
      
      console.log(data)
      this.router.navigate(["/dashboard"]);

     

    })
  }

  ngOnInit() {
  }

}
