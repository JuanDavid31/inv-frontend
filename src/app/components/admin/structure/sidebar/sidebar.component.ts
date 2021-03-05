import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from 'app/services/localstorage/local-storage.service';
import { Router } from '@angular/router';


declare const $: any;
declare interface RouteInfo {
	path: string;
	title: string;
	icon: string;
	class: string;
}
export const ROUTES: RouteInfo[] = [
	{ path: '/dashboard', title: 'Problemáticas', icon: 'dashboard', class: '' },
	{ path: '/user-profile', title: 'Perfil', icon: 'person', class: '' },
	{ path: '/notifications', title: 'Invitaciones', icon: 'notifications', class: '' }
];

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
	menuItems: any[];

	constructor(private serviciosLocalStorage: LocalStorageService,
		private router: Router) { }

	ngOnInit() {
		this.menuItems = ROUTES.filter(menuItem => menuItem);
	}
	isMobileMenu() {
		if ($(window).width() > 991) {
			return false;
		}
		return true;
	};

	cerrarSesion() {
		this.serviciosLocalStorage.eliminarDatos();
		this.router.navigateByUrl("/login");
	}
}
