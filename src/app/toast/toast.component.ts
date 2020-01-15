import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastService } from '../services/toast/toast.service';
import { Subscription } from 'rxjs';
declare var $: any;

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {

  private contenedorToasts: any;
  private subscripcion: Subscription;
  private contador = 0;
  titulo = '';
  cuerpo = '';
  esMensajeInfo = true;

  private toast: any;

  constructor(private serviciosToast: ToastService) { }

  ngOnInit() {
    this.contador = 0;
    this.contenedorToasts = document.getElementById('toasts-container');
    this.subscripcion = this.serviciosToast.changeEmitted$
      .subscribe(datos => this.mostrarToast(datos.titulo, datos.cuerpo, datos.esMensajeInfo));
  }

  mostrarToast(titulo = 'Información', cuerpo = 'Este es un mensaje de información', esMensajeInfo = true) {
    this.titulo = titulo;
    this.cuerpo = cuerpo;
    this.esMensajeInfo = esMensajeInfo;

    const type = ['', 'info', 'success', 'warning', 'danger'];

    const color = Math.floor((Math.random() * 4) + 1);

    $.notify({
      icon: "notifications",
      message: "Welcome to <b>Material Dashboard</b> - a beautiful freebie for every web developer."

    }, {
      type: type[color],
      timer: 2000,
      placement: {
        from: 'bottom',
        align: 'right'
      },
      template: '<div data-notify="container" class="col-xl-4 col-lg-4 col-11 col-sm-4 col-md-4 alert alert-{0} alert-with-icon" role="alert">' +
        '<button mat-button  type="button" aria-hidden="true" class="close mat-button" data-notify="dismiss">  <i class="material-icons">close</i></button>' +
        '<i class="material-icons" data-notify="icon">notifications</i> ' +
        '<span data-notify="title">{1}</span> ' +
        '<span data-notify="message">{2}</span>' +
        '<div class="progress" data-notify="progressbar">' +
        '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
        '</div>' +
        '<a href="{3}" target="{4}" data-notify="url"></a>' +
        '</div>'
    });


    // this.contenedorToasts.style.visibility = 'visible';

    // const toastHtmlString = `<div id="toast${this.contador}" class="toast" style="bottom: 5px; right: 25px; z-index:100">` +
    //   `<div class="toast-header">` +
    //   `<div class="${esMensajeInfo ? 'bg-info' : 'bg-danger'} rounded mr-2"` +
    //   `style="height: 20px; width: 20px; border-radius: 4px;"></div>` +
    //   `<strong class="mr-auto">${titulo}</strong>` +
    //   `<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">` +
    //   `<span aria-hidden="true">&times;</span>` +
    //   `</button>` +
    //   `</div>` +
    //   `<div class="toast-body">` +
    //   cuerpo +
    //   `</div>` +
    //   `</div>`;

    // const nodo = this.htmlToElement(toastHtmlString);
    // this.contenedorToasts.appendChild(nodo);
    // this.toast = (<any>$(`#toast${this.contador}`)).toast({ delay: 4000 })
    // this.toast.toast('show')

    // setTimeout(() => {
    //   const nodoToast = document.getElementById(`toast${this.contador}`)
    //   if (nodoToast) nodoToast.remove();
    //   if (!this.contenedorToasts.hasChildNodes()) this.contenedorToasts.style.visibility = 'hidden';
    // }, 4000)

    // this.contador++;
  }


  /**
   * @param {String} HTML representing a single element
   * @return {Element}
   */
  private htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  }

  ngOnDestroy() {
    this.subscripcion.unsubscribe();
  }

}
