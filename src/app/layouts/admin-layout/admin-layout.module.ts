import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminLayoutRoutes } from './admin-layout.routing';
import { DashboardComponent } from '@app/components/admin/dynamic/dashboard/dashboard.component';
import { UserProfileComponent } from '@app/components/admin/dynamic/user-profile/user-profile.component';
import { FaseReaccionesComponent } from '@app/components/admin/dynamic/fase-reacciones/fase-reacciones.component';
import { FaseIndividualComponent } from '@app/components/admin/dynamic/fase-individual/fase-individual.component';
import { FaseGrupalComponent } from '@app/components/admin/dynamic/fase-grupal/fase-grupal.component';
import { NotificationsComponent } from '@app/components/admin/dynamic/notifications/notifications.component';
import { FaseEscritosComponent } from '@app/components/admin/dynamic/fase-escritos/fase-escritos.component';
import { ResultadosComponent } from '@app/components/admin/dynamic/resultados/resultados.component';

import {
  MatButtonModule,
  MatInputModule,
  MatRippleModule,
  MatFormFieldModule,
  MatTooltipModule,
  MatSelectModule
} from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  declarations: [
    DashboardComponent,
    UserProfileComponent,
    FaseReaccionesComponent,
    FaseIndividualComponent,
    FaseGrupalComponent,
    FaseEscritosComponent,
    NotificationsComponent,
    ResultadosComponent
  ]
})

export class AdminLayoutModule { }