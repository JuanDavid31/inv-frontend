import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { LoginComponent } from '@app/components/public/login/login.component';
import { RegistroComponent } from '@app/components/public/registro/registro.component';
import { RecuperarComponent } from '@app/components/public/recuperar/recuperar.component';

import { PublicoGuard } from './guards/publico.guard';
import { PrivadoGuard } from './guards/privado.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  }, {
    path: '',
    component: AdminLayoutComponent,
    canActivateChild: [PrivadoGuard],
    children: [{
      path: '',
      loadChildren: './layouts/admin-layout/admin-layout.module#AdminLayoutModule'
    }]
  },
  { path: 'login', component: LoginComponent, canActivate: [PublicoGuard] },
  { path: 'registro', component: RegistroComponent, canActivate: [PublicoGuard] },
  { path: 'recuperar', component: RecuperarComponent, canActivate: [PublicoGuard] }

];


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(routes, {
      
    })
  ],
  exports: [
  ],
})
export class AppRoutingModule { }
