import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

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
}