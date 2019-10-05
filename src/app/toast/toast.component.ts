import { Component, OnInit } from '@angular/core';
import { ToastService } from '../services/toast/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {

  private contenedorToasts: any;
  private contador = 0;
  titulo = '';
  cuerpo = '';
  esMensajeInfo = true;

  private toast: any;

  constructor(private serviciosToast: ToastService) { }

  ngOnInit() {
    this.contador = 0;
    this.contenedorToasts = document.getElementById('toasts-container');
    this.serviciosToast.changeEmitted$.subscribe(datos => this.mostrarToast(datos.titulo, datos.cuerpo, datos.esMensajeInfo));
  }

  mostrarToast(titulo = 'Información', cuerpo = 'Este es un mensaje de información', esMensajeInfo = true) {
    this.titulo = titulo;
    this.cuerpo = cuerpo;
    this.esMensajeInfo = esMensajeInfo;

    this.contenedorToasts.style.visibility = 'visible';

    const toastHtmlString = `<div id="toast${this.contador}" class="toast" style="bottom: 5px; right: 25px; z-index:100">` +
      `<div class="toast-header">` +
      `<div class="${esMensajeInfo ? 'bg-info' : 'bg-danger'} rounded mr-2"` +
      `style="height: 20px; width: 20px; border-radius: 4px;"></div>` +
      `<strong class="mr-auto">${titulo}</strong>` +
      `<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">` +
      `<span aria-hidden="true">&times;</span>` +
      `</button>` +
      `</div>` +
      `<div class="toast-body">` +
      cuerpo +
      `</div>` +
      `</div>`;

    const nodo = this.htmlToElement(toastHtmlString);
    this.contenedorToasts.appendChild(nodo);
    this.toast = (<any>$(`#toast${this.contador}`)).toast({ delay: 3000 })
    this.toast.toast('show')

    setTimeout(() => {
      const nodoToast = document.getElementById(`toast${this.contador}`)
      if (nodoToast) nodoToast.remove();
      if (!this.contenedorToasts.hasChildNodes()) this.contenedorToasts.style.visibility = 'hidden';
    }, 3000)

    this.contador++;
  }


  /**
   * @param {String} HTML representing a single element
   * @return {Element}
   */
  htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  }

}
