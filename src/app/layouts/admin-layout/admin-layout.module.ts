import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminLayoutRoutes } from './admin-layout.routing';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { UserProfileComponent } from '../../user-profile/user-profile.component';
import { FaseReaccionesComponent } from '../../fase-reacciones/fase-reacciones.component';
import { FaseIndividualComponent } from '../../fase-individual/fase-individual.component';
import { FaseGrupalComponent } from '../../fase-grupal/fase-grupal.component';
import { NotificationsComponent } from '../../notifications/notifications.component';

import {
  MatButtonModule,
  MatInputModule,
  MatRippleModule,
  MatFormFieldModule,
  MatTooltipModule,
  MatSelectModule
} from '@angular/material';
import { FaseEscritosComponent } from 'app/fase-escritos/fase-escritos.component';
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
    NotificationsComponent
  ]
})

export class AdminLayoutModule { }
