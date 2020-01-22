import { Routes } from '@angular/router';

import { DashboardComponent } from '../../dashboard/dashboard.component';
import { UserProfileComponent } from '../../user-profile/user-profile.component';
import { FaseReaccionesComponent } from '../../fase-reacciones/fase-reacciones.component';
import { FaseIndividualComponent } from '../../fase-individual/fase-individual.component';
import { FaseGrupalComponent } from '../../fase-grupal/fase-grupal.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { FaseEscritosComponent } from 'app/fase-escritos/fase-escritos.component';

export const AdminLayoutRoutes: Routes = [
    // {
    //   path: '',
    //   children: [ {
    //     path: 'dashboard',
    //     component: DashboardComponent
    // }]}, {
    // path: '',
    // children: [ {
    //   path: 'userprofile',
    //   component: UserProfileComponent
    // }]
    // }, {
    //   path: '',
    //   children: [ {
    //     path: 'icons',
    //     component: IconsComponent
    //     }]
    // }, {
    //     path: '',
    //     children: [ {
    //         path: 'notifications',
    //         component: NotificationsComponent
    //     }]
    // }, {
    //     path: '',
    //     children: [ {
    //         path: 'maps',
    //         component: MapsComponent
    //     }]
    // }, {
    //     path: '',
    //     children: [ {
    //         path: 'typography',
    //         component: TypographyComponent
    //     }]
    // }, {
    //     path: '',
    //     children: [ {
    //         path: 'upgrade',
    //         component: UpgradeComponent
    //     }]
    // }
    { path: 'dashboard', component: DashboardComponent },
    { path: 'user-profile', component: UserProfileComponent },
    { path: 'fase-reacciones', component: FaseReaccionesComponent },
    { path: 'fase-individual', component: FaseIndividualComponent },
    { path: 'fase-grupal', component: FaseGrupalComponent },
    { path: 'fase-escritos', component: FaseEscritosComponent },
    { path: 'notifications', component: NotificationsComponent }
];
