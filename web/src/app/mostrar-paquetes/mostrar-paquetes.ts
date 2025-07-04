import { Component } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-mostrar-paquetes',
  imports: [],
  templateUrl: './mostrar-paquetes.html',
  styleUrl: './mostrar-paquetes.scss'
})
export class MostrarPaquetes {
  constructor() {
    console.log('MostrarPaquetes component se esta ejecutando');
  }

  async ngOnInit() {
    console.log("ngOnInit, prueba");
    await this.mostrarPaquetesLanding(); // llamamos a la función para mostrar paquetes, nada mas inicializar el componente
  }

  async mostrarPaquetesLanding(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'paquetes?estado=activo');
      if (res.status === 200) {
        const paquetes = await res.json(); // convertimos la respuesta a JSON
        this.mostrarPaquetesLanding = paquetes.slice(0, 3); // obtenemos los primeros 3 paquetes activos
        console.log("Paquetes activos:", this.mostrarPaquetesLanding); // depuracion para probar, que funcione la peticion get a la api
      }
    } catch (error: any) {
      console.error('Error al cargar los paquetes:', error);
    }
  }
}
