import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
declare var $;

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor() { }

	/**
	 * @param { string } Default 'Información'. titulo Cabecera del toast.
	 * @param { string } Default 'Este es un mensaje de información'. cuerpo Cuerpo del toast.
	 * @param { string } Default 'info'. tipo Tipo del mensaje. Opciones disponibles: info, success, danger. 
	 * El color y el icono cambiaran dependiendo del tipo de mensaje.
	 * */
	mostrarToast(titulo = 'Información', cuerpo = 'Este es un mensaje de información', tipo = 'info') {
		
		const icons = {info: 'notifications', danger: 'error_outline', success: 'done'}
		
		$.notify({
			icon: icons[tipo],
			message: cuerpo
		}, {
			type: tipo, //'', 'info', 'success', 'warning', 'danger'
			timer: 1000,
			placement: {
			from: 'bottom',
			align: 'right'
		},
		template: '<div data-notify="container" class="col-xl-4 col-lg-4 col-11 col-sm-4 col-md-4 alert alert-{0} alert-with-icon" role="alert">' +
			'<button mat-button  type="button" aria-hidden="true" class="close mat-button" data-notify="dismiss">  <i class="material-icons">close</i></button>' +
			`<i class="material-icons" data-notify="icon">${icons[tipo]}</i> ` +
			'<span data-notify="title">{1}</span> ' +
			'<span data-notify="message">{2}</span>' +
			'<div class="progress" data-notify="progressbar">' +
			'<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
			'</div>' +
			'<a href="{3}" target="{4}" data-notify="url"></a>' +
			'</div>'
		});
  }
}
