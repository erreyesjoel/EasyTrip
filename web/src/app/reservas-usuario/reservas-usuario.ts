import { Component } from '@angular/core';
import { environment } from '../../environments/environment';

// interface para definir la estructura de una reserva
interface ReservaUsuario {
  id: number;
  paquete: string;
  fecha_reservada: Date;
  estado: string;
}

@Component({
  selector: 'app-reservas-usuario',
  imports: [],
  templateUrl: './reservas-usuario.html',
  styleUrl: './reservas-usuario.scss'
})
export class ReservasUsuario {

  async ngOnInit():Promise<void> {
    console.log('API URL:', environment.apiBaseUrl);
    await this.mostrarReservas();
  }

  async mostrarReservas() {
    const res = await fetch(environment.apiBaseUrl + 'reservas-usuario/', {
      credentials: 'include'
    });
    if (res.status === 200) {
      const reservas: ReservaUsuario[] = await res.json();
      console.log(reservas);
      // this.reservas = reservas; // para mostrar en el HTML
    } else {
      console.error('Error al obtener las reservas');
    }
  }
}
