import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginacion-gestion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './paginacion-gestion.html',
  styleUrl: './paginacion-gestion.scss'
})
export class PaginacionGestion implements OnChanges {
  @Input() paginaActual: number = 1;
  @Input() totalPaginas: number = 1;
  @Input() pageSize: number = 6;
  @Input() opcionesPageSize: number[] = [3, 6, 9, 20];

  @Output() paginaCambiada = new EventEmitter<number>();
  @Output() pageSizeCambiado = new EventEmitter<number>();

  paginas: number[] = [];
  pageSizeInterno: number = 6;

  ngOnChanges() {
    this.paginas = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      this.paginas.push(i);
    }
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas && nuevaPagina !== this.paginaActual) {
      this.paginaCambiada.emit(nuevaPagina);
    }
  }

  cambiarPageSize(event: any) {
    this.pageSizeCambiado.emit(Number(this.pageSizeInterno));
  }
}