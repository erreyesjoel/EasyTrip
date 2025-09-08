import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-reserva',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reserva.html',
  styleUrl: './reserva.scss'
})
export class Reserva {
  paquete: { id: string | null, nombre: string | null } = { id: null, nombre: null };
  nombre: string = '';
  apellido: string = '';
  email: string = '';
  fechaReservada: Date | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const nombre = this.route.snapshot.paramMap.get('nombre');
    this.paquete = { id, nombre };
  }

  async reservarPaqueteId() {
    const res = await fetch(environment.apiBaseUrl + 'crear-reserva/' + this.paquete.id + '/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // porque hay que estar logeado para reservar
      body: JSON.stringify({
        fecha_reservada: this.fechaReservada
      })
    });
    if (res.status === 201) {
      alert('Reserva creada correctamente');
      this.fechaReservada = null;
    } else {
      console.log('Error al crear la reserva');
    }
  }
}
