import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RouterModule } from '@angular/router';

// interface para definir la estructura de una reserva
interface ReservaUsuario {
  id: number;
  paquete: string;
  fecha_reservada: Date;
  estado: string;
}


@Component({
  selector: 'app-reservas-usuario',
  imports: [CommonModule, RouterModule],
  templateUrl: './reservas-usuario.html',
  styleUrl: './reservas-usuario.scss'
})
export class ReservasUsuario {
  // reservas, para el for each en el html
  // reserva sera el nombre que le das en el html, pero es of reservas, porque es reservas como aqui en el ts
  reservas: ReservaUsuario[] = [];
  async ngOnInit():Promise<void> {
    console.log('API URL:', environment.apiBaseUrl);
    await this.mostrarReservas();
  }

  async mostrarReservas() {
    const res = await fetch(environment.apiBaseUrl + 'reservas-usuario/', {
      credentials: 'include' // importante para las cookies de sesión, el refresh token de jwt
    });
    if (res.status === 200) {
      const reservas: ReservaUsuario[] = await res.json();
      console.log(reservas);
      this.reservas = reservas; // para mostrar en el HTML
    } else {
      console.error('Error al obtener las reservas');
    }
  }

  // el css o estilos, es de la libreria jspdf-autotable, por defecto
  descargarReservasPDF() {
    const doc = new jsPDF();
    doc.text('Mis reservas', 14, 16);

    autoTable(doc, {
      head: [['Paquete', 'Fecha reservada', 'Estado']],
      body: this.reservas.map(r => [
        r.paquete,
        // Formatea la fecha como quieras:
        new Date(r.fecha_reservada).toLocaleDateString(),
        r.estado
      ]),
      startY: 22
    });

    doc.save('mis_reservas.pdf');
  }
}
