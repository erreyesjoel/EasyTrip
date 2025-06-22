import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar'; // Importa el sidebar

@Component({
  selector: 'app-gestion-paquetes',
  imports: [SidebarComponent], // Agrégalo aquí
  templateUrl: './gestion-paquetes.html',
  styleUrl: './gestion-paquetes.scss'
})
export class GestionPaquetes {

}
