import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notificacion {
  mensaje: string;
  tipo: 'success' | 'error';
}

@Component({
  standalone: true,
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.scss',
  imports: [CommonModule]
})
export class Notificaciones {
  notificaciones: Notificacion[] = [];

  mostrar(mensaje: string, tipo: 'success' | 'error' = 'success', duracion = 3000) {
    console.log('Mostrando notificación:', mensaje, tipo);
    const noti: Notificacion = { mensaje, tipo };
    this.notificaciones.push(noti);
    setTimeout(() => this.eliminar(noti), duracion);
  }

  eliminar(noti: Notificacion) {
    this.notificaciones = this.notificaciones.filter(n => n !== noti);
  }
}