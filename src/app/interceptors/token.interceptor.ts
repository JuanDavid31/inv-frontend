import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { LocalStorageService } from '@app/services/localstorage/local-storage.service';
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    
  constructor(public serviciosLocalStorage: LocalStorageService) {}
  
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    request = request.clone({
      setHeaders: {
        Authorization: `${this.serviciosLocalStorage.darToken()}`
      }
    });
    return next.handle(request);
  }
}