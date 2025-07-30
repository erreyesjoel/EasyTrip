import { Component } from '@angular/core';
import { SidebarComponent} from '../sidebar/sidebar';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './gestion-reservas.html',
  styleUrl: './gestion-reservas.scss'
})
export class GestionReservas {

  // array en el que se almacenan las reservas
  // declarado en el for each, ngFor en el html
  reservas: Reserva[] = [];
  agentes: { email: string, nombre: string }[] = [];
  modalAsignarAbierto = false;
  reservaSeleccionada: Reserva | null = null;
  agenteSeleccionado: string = '';

  // ngOnInit porque se utiliza para inicializar la carga de datos al inicio del componente
  // nada mas renderizar el componente, llamamos de forma asincrona a la funcion obtenerReservas
  async ngOnInit() {
    await this.obtenerReservas();
    await this.obtenerAgentes();
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
  async asignarGestor(reservaId: number, agenteEmail: string) {
  // Llama a tu API para actualizar la reserva y asignar el agente
  const res = await fetch(environment.apiBaseUrl + `asignar-gestor-reserva/${reservaId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario_gestor: agenteEmail })
  });
  if (res.status === 200) {
    await this.obtenerReservas(); // Recarga la lista
  }
}
  async obtenerAgentes() {
    // Llama a tu API para obtener los agentes
    const res = await fetch(environment.apiBaseUrl + 'usuarios-agentes/');
    if (res.status === 200) {
      this.agentes = await res.json();
    }
  }

  abrirModalAsignar(reserva: Reserva) {
    this.reservaSeleccionada = reserva;
    this.agenteSeleccionado = '';
    this.modalAsignarAbierto = true;
  }

  cerrarModalAsignar() {
    this.modalAsignarAbierto = false;
    this.reservaSeleccionada = null;
    this.agenteSeleccionado = '';
  }
    async guardarAsignacion() {
    if (this.reservaSeleccionada && this.agenteSeleccionado) {
      await this.asignarGestor(this.reservaSeleccionada.id, this.agenteSeleccionado);
      this.cerrarModalAsignar();
    }
  }

}
