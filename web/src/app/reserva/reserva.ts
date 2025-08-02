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
    // llamar a la api para reservar el paquete por id
    const res = await fetch(environment.apiBaseUrl + 'crear-reserva/' + this.paquete.id + '/', {
      method: 'POST', // metodo POST para crear la reserva
      headers: {
        'Content-Type': 'application/json'
      },
      // cuerpo de la peticion, se envia el nombre, apellido, email y fecha reservada
      body: JSON.stringify({
        nombre: this.nombre,
        apellido: this.apellido,
        email: this.email,
        fecha_reservada: this.fechaReservada
      })
    });
    if (res.status === 201) {
      alert('Reserva creada correctamente');
      console.log('Reserva creada correctamente:', this.email);
      this.email = ''; // Limpiar el campo de email
      this.fechaReservada = null; // Limpiar la fecha reservada
    } else {
      console.log(environment.apiBaseUrl + 'crear-reserva/' + this.paquete.id + '/');
      console.log('ID del paquete:', this.paquete.id);
      console.log('Error al crear la reserva');
    }
  }
}
