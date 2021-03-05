import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, Router } from '@angular/router';
import { LocalStorageService } from '../services/localstorage/local-storage.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicoGuard implements CanActivate {

  constructor(private router: Router,
    private serviciosLocalStorage: LocalStorageService) { }

  canActivate(): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    if (this.serviciosLocalStorage.darToken()) {
      this.router.navigateByUrl('/dashboard')
      return false;
    }
    return true;
  }
}
