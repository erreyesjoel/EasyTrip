import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginacion-cliente',
  templateUrl: './paginacion-cliente.html',
  styleUrls: ['./paginacion-cliente.scss'],
  imports: [CommonModule]
})
export class PaginacionCliente {
  @Input() paginaActual: number = 1;
  @Input() totalPaginas: number = 1;
  @Output() paginaCambiada = new EventEmitter<number>();

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas && pagina !== this.paginaActual) {
      this.paginaCambiada.emit(pagina);
    }
  }
}