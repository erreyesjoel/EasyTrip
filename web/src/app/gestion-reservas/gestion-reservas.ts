import { Component } from '@angular/core';
import { SidebarComponent} from '../sidebar/sidebar';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';

interface Reserva {
  id: number;
  fecha_reservada: Date;
  estado: string;
  usuario: string;
  usuario_gestor: string;
  paquete: string;
}

@Component({
  selector: 'app-gestion-reservas',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './gestion-reservas.html',
  styleUrl: './gestion-reservas.scss'
})
export class GestionReservas {

  // array en el que se almacenan las reservas
  // declarado en el for each, ngFor en el html
  reservas: Reserva[] = [];

  // ngOnInit porque se utiliza para inicializar la carga de datos al inicio del componente
  // nada mas renderizar el componente, llamamos de forma asincrona a la funcion obtenerReservas
  async ngOnInit() {
    await this.obtenerReservas();
  }

  async obtenerReservas(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'gestion-reservas/', {
      });

      // si la respuesta es exitosa, 200, como es get
      if (res.status === 200) {
        const data = await res.json();
        this.reservas = data; // Asignar los datos a la propiedad reservas
        // console log para depuracion
        console.log('Reservas obtenidas:', data);
      }
    } catch (error) {
      console.error('Error al obtener reservas:', error);
    }
  }
}
