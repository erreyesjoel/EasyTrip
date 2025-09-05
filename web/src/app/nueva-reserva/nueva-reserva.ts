import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Paquete {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-nueva-reserva',
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-reserva.html',
  styleUrl: './nueva-reserva.scss'
})
export class NuevaReserva {
  paquetes: Paquete[] = [];
  paqueteId: number | null = null;
  fechaReservada: string = '';

  async ngOnInit() {
    await this.cargarPaquetes();
  }

  async cargarPaquetes() {
    try {
      // querystring para filtrar por estado=activo
      const res = await fetch(environment.apiBaseUrl + 'paquetes?estado=activo');
      if (res.ok) {
        const data = await res.json();
        // data.results es el array de paquetes
        this.paquetes = data.results.map((p: any) => ({
          id: p.id,
          nombre: p.nombre
        }));
        console.log('Paquetes activos cargados:', this.paquetes);
      }
    } catch (err) {
      console.error('Error al cargar paquetes', err);
    }
  }
}