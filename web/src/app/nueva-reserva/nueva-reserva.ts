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

  async hacerReserva() {
    try {
      const res = await fetch(environment.apiBaseUrl + 'nueva-reserva/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // credentials para enviar cookies de sesión
        // ya que en el backend, esta puesto como que requiere autenticacion
        credentials: 'include',
        body: JSON.stringify({
          paquete_id: this.paqueteId,
          fecha_reservada: this.fechaReservada
        })
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Reserva creada:', data);
      }
      if (!res.ok) {
        const error = await res.json();
        console.error('Error al crear reserva:', error);
      }
    } catch (err) {
      console.log('Haciendo reserva con paquete_id:', this.paqueteId, 'y fecha_reservada:', this.fechaReservada);
      console.error('Error al crear reserva', err);
    }
  }
}