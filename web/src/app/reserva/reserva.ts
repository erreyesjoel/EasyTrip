import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { Notificaciones } from '../notificaciones/notificaciones'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-reserva',
  imports: [CommonModule, RouterModule, FormsModule, Notificaciones],
  templateUrl: './reserva.html',
  styleUrl: './reserva.scss'
})
export class Reserva {
  paquete: { id: string | null, nombre: string | null } = { id: null, nombre: null };
  nombre: string = '';
  apellido: string = '';
  email: string = '';
  fechaReservada: string = this.getHoy(); // Cambia Date | null a string

  @ViewChild('notificaciones') notificaciones!: Notificaciones;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const nombre = this.route.snapshot.paramMap.get('nombre');
    this.paquete = { id, nombre };
  }

  getHoy(): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  async reservarPaqueteId() {
    if (!this.fechaReservada) {
      this.notificaciones.mostrar('Debes seleccionar una fecha para reservar', 'error');
      return;
    }

    const res = await fetch(environment.apiBaseUrl + 'crear-reserva/' + this.paquete.id + '/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        fecha_reservada: this.fechaReservada
      })
    });
    if (res.status === 201) {
      this.notificaciones.mostrar('Reserva creada correctamente', 'success');
      this.fechaReservada = this.getHoy();
    } else if (res.status === 401) {
      this.notificaciones.mostrar('Debes iniciar sesión para reservar', 'error');
    } else {
      this.notificaciones.mostrar('Error al crear la reserva', 'error');
    }
  }
}
