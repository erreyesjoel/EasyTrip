import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import { PaginacionCliente } from '../paginacion-cliente/paginacion-cliente';

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
  imports: [CommonModule, RouterModule, PaginacionCliente],
  templateUrl: './paquetes.html',
  styleUrl: './paquetes.scss'
})
export class Paquetes {
  paquetes: Paquete[] = [];
  paquetesPorPagina = 3;
  paginaActual = 1;

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.paquetes.length / this.paquetesPorPagina));
  }

  get paquetesPaginados(): Paquete[] {
    const inicio = (this.paginaActual - 1) * this.paquetesPorPagina;
    return this.paquetes.slice(inicio, inicio + this.paquetesPorPagina);
  }

  predeterminadaUrl = (() => {
    const urlObj = new URL(environment.apiBaseUrl);
    return `${urlObj.protocol}//${urlObj.host}/static/img/paquetePredeterminada.webp`;
  })();

  async ngOnInit() {
    await this.obtenerPaquetesActivos();
  }

  async obtenerPaquetesActivos(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'paquetes?estado=activo');
      if (res.status === 200) {
        const dataPaquetes = await res.json();
        this.paquetes = Array.isArray(dataPaquetes) ? dataPaquetes : (dataPaquetes.results || []);
        this.paginaActual = 1; // Reinicia a la primera página al cargar
      }
    } catch (error) {
      console.error('Error fetching paquetes:', error);
    }
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
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
}