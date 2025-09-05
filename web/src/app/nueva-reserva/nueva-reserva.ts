import { Component, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Notificaciones } from '../notificaciones/notificaciones';

interface Paquete {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-nueva-reserva',
  imports: [CommonModule, FormsModule, Notificaciones],
  templateUrl: './nueva-reserva.html',
  styleUrl: './nueva-reserva.scss'
})
export class NuevaReserva {
  paquetes: Paquete[] = [];
  paqueteId: number | null = null;
  fechaReservada: string = this.getHoy();

  @ViewChild('notificaciones') notificaciones!: Notificaciones;

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
    // Validación previa para evitar errores por campos vacíos
    if (!this.paqueteId || !this.fechaReservada) {
      this.notificaciones.mostrar(
        'Debes seleccionar un paquete y una fecha para reservar.',
        'error'
      );
      return;
    }

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
        // Busca el nombre del paquete seleccionado
        const paqueteNombre = this.paquetes.find(p => p.id === this.paqueteId)?.nombre || '';
        this.notificaciones.mostrar(`¡Has reservado "${paqueteNombre}" con éxito!`, 'success');
        console.log('Reserva creada:', data);
      }
      if (!res.ok) {
        const error = await res.json();
        const paqueteNombre = this.paquetes.find(p => p.id === this.paqueteId)?.nombre || '';
        this.notificaciones.mostrar(
          error?.error
            ? `Error al reservar "${paqueteNombre}": ${error.error}`
            : `Error al reservar "${paqueteNombre}"`,
          'error'
        );
        console.error(error);
      }
    } catch (err) {
      this.notificaciones.mostrar('Error de red al crear la reserva', 'error');
      console.log('Haciendo reserva con paquete_id:', this.paqueteId, 'y fecha_reservada:', this.fechaReservada);
      console.error('Error al crear reserva', err);
    }
  }

  getHoy(): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}