import { Routes } from '@angular/router';

import { DashboardComponent } from '@app/components/admin/dynamic/dashboard/dashboard.component';
import { UserProfileComponent } from '@app/components/admin/dynamic/user-profile/user-profile.component';
import { FaseReaccionesComponent } from '@app/components/admin/dynamic/fase-reacciones/fase-reacciones.component';
import { FaseIndividualComponent } from '@app/components/admin/dynamic/fase-individual/fase-individual.component';
import { FaseGrupalComponent } from '@app/components/admin/dynamic/fase-grupal/fase-grupal.component';
import { NotificationsComponent } from '@app/components/admin/dynamic/notifications/notifications.component';
import { FaseEscritosComponent } from '@app/components/admin/dynamic/fase-escritos/fase-escritos.component';
import { ResultadosComponent } from '@app/components/admin/dynamic/resultados/resultados.component';

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
    { path: 'resultados', component: ResultadosComponent },
    { path: 'notifications', component: NotificationsComponent }
];