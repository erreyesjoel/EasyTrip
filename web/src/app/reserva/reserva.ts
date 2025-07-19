import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <--- IMPORTANTE
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reserva',
  imports: [CommonModule, RouterModule, FormsModule], // <--- AGREGA FormsModule AQUÍ
  templateUrl: './reserva.html',
  styleUrl: './reserva.scss'
})
export class Reserva {
  paquete = {
    nombre: 'Aventura en Cancún',
    descripcion: 'Disfruta de 5 días y 4 noches en Cancún con todo incluido.',
    duracion_dias: 5,
    precio_base: 1200
  };
  nombre: string = '';
  apellido: string = '';
  email: string = '';
  fechaReservada: Date | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log(`ID del paquete a reservar: ${id}`);
  }
}