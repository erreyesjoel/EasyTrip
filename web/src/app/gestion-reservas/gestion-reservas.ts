import { Component } from '@angular/core';
import { SidebarComponent} from '../sidebar/sidebar';
import { environment } from '../../environments/environment';

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
  imports: [SidebarComponent],
  templateUrl: './gestion-reservas.html',
  styleUrl: './gestion-reservas.scss'
})
export class GestionReservas {

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
        // console log para depuracion
        console.log('Reservas obtenidas:', data);
      }
    } catch (error) {
      console.error('Error al obtener reservas:', error);
    }
  }
}
