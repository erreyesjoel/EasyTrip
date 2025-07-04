import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';

interface ImagenesPaquete {
  id: number;
  imagen_url: string;
  descripcion: string;
}

interface Paquete {
  id: number;
  nombre: string;
  descripcion: string;
  precio_base: number;
  duracion_dias: number;
  estado: string;
  imagenes: ImagenesPaquete[];
}

@Component({
  selector: 'app-mostrar-paquetes',
  imports: [CommonModule],
  templateUrl: './mostrar-paquetes.html',
  styleUrl: './mostrar-paquetes.scss'
})
export class MostrarPaquetes {

  paquetesLanding: Paquete[] = []; // inicializamos el array de paquetes
  imagenActual: number[] = []; // inicializamos el array de imagenes actuales
  predeterminadaUrl = (() => {
    const urlObj = new URL(environment.apiBaseUrl);
    return `${urlObj.protocol}//${urlObj.host}/static/img/paquetePredeterminada.webp`;
  })();

  constructor() {
    console.log('MostrarPaquetes component se esta ejecutando');
  }

  async ngOnInit() {
    console.log("ngOnInit, prueba");
    await this.mostrarPaquetesLanding(); // llamamos a la función para mostrar paquetes, nada mas inicializar el componente
  }

  // Función para asegurarnos de que las URLs de imágenes sean absolutas y correctas
  corregirUrl(url: string): string {
    if (url.startsWith('http')) {
      // Si ya es una URL completa, la devolvemos tal cual
      return url;
    } else {
      // Extraemos solo el protocolo y host, sin el path /api
      const urlObj = new URL(environment.apiBaseUrl);
      const base = `${urlObj.protocol}//${urlObj.host}`;
      return url.startsWith('/') ? base + url : base + '/' + url;
    }
  }

  async mostrarPaquetesLanding(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'paquetes?estado=activo');
      if (res.status === 200) {
        const paquetes = await res.json(); // convertimos la respuesta a JSON

        this.paquetesLanding = paquetes.slice(0, 3); // obtenemos los primeros 3 paquetes activos

       this.paquetesLanding.forEach((paquete: Paquete) => {
  paquete.imagenes = paquete.imagenes.map((img: ImagenesPaquete) => {
    const urlCorregida = this.corregirUrl(img.imagen_url);
    console.log('URL imagen corregida:', urlCorregida);
    return {
      ...img,
      imagen_url: urlCorregida
    };
  });
});

        // Inicializamos el índice de imagen actual para cada paquete en 0
        this.imagenActual = this.paquetesLanding.map(() => 0);

        console.log("Paquetes activos:", this.paquetesLanding);
      }
    } catch (error: any) {
      console.error('Error al cargar los paquetes:', error);
    }
  }
    // Cambia la imagen mostrada en el carrusel de un paquete
 cambiarImagen(paqueteIdx: number, direccion: number) {
  const total = this.paquetesLanding[paqueteIdx].imagenes.length;
  if (total === 0) return; // seguridad extra
  this.imagenActual[paqueteIdx] =
    (this.imagenActual[paqueteIdx] + direccion + total) % total;
}
}
