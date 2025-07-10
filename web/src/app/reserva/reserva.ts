import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <---- import RouterModule
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reserva',
  imports: [CommonModule, RouterModule],
  templateUrl: './reserva.html',
  styleUrl: './reserva.scss'
})

export class Reserva {
 constructor(private route: ActivatedRoute) {}
 ngOnInit() {
   const id = this.route.snapshot.paramMap.get('id');
   // Usa el id para cargar los datos del paquete o la lógica de reserva
   console.log(`ID del paquete a reservar: ${id}`);
   // Aquí podrías llamar a un servicio para obtener los detalles del paquete y mostrar un formulario de reserva
 }
}
