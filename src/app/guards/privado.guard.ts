import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivateChild, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LocalStorageService } from '../services/localstorage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class PrivadoGuard implements CanActivateChild {

  constructor(private router: Router,
    private serviciosLocalStorage: LocalStorageService) { }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.serviciosLocalStorage.darToken()) {
      return true;
    }
    this.router.navigateByUrl('');
    return false;
  }

}
