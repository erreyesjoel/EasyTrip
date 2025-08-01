import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';

interface ImagenesPaquete {
  id: number;
  imagen_url: string;
  descripcion: string;
}
interface Paquete {
  id: number;
  nombre: string;
  imagenes: ImagenesPaquete[];
}

@Component({
  selector: 'app-paquetes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './paquetes.html',
  styleUrl: './paquetes.scss'
})
export class Paquetes {
  paquetes: Paquete[] = [];
  predeterminadaUrl = (() => {
    const urlObj = new URL(environment.apiBaseUrl);
    return `${urlObj.protocol}//${urlObj.host}/static/img/paquetePredeterminada.webp`;
  })();

  async ngOnInit() {
    await this.obtenerPaquetesActivos();
  }

  corregirUrl(url: string): string {
    if (url.startsWith('http')) return url;
    const urlObj = new URL(environment.apiBaseUrl);
    const base = `${urlObj.protocol}//${urlObj.host}`;
    return url.startsWith('/') ? base + url : base + '/' + url;
  }

  getImagenPrincipal(paquete: Paquete): string {
    if (paquete.imagenes && paquete.imagenes.length > 0) {
      return this.corregirUrl(paquete.imagenes[0].imagen_url);
    }
    return this.predeterminadaUrl;
  }

  async obtenerPaquetesActivos(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'paquetes?estado=activo');
      if (res.status === 200) {
        const dataPaquetes = await res.json();
        this.paquetes = dataPaquetes;
      }
    } catch (error) {
      console.error('Error fetching paquetes:', error);
    }
  }
}