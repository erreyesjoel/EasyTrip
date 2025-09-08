import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  cupo_maximo: number;
}

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-detalles-paquete',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalles-paquete.html',
  styleUrl: './detalles-paquete.scss'
})
export class DetallesPaquete implements OnInit {
  paquete: Paquete | null = null;
  cargando = true;
  fotoActual = 0;
  predeterminadaUrl = (() => {
    const urlObj = new URL(environment.apiBaseUrl);
    return `${urlObj.protocol}//${urlObj.host}/static/img/paquetePredeterminada.webp`;
  })();

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPaquete(id);
    }
  }

  cambiarFoto(direccion: number) {
    if (!this.paquete) return;
    const total = this.paquete.imagenes.length;
    this.fotoActual = Math.max(0, Math.min(this.fotoActual + direccion, total - 1));
  }

  corregirUrl(url: string): string {
    if (url.startsWith('http')) return url;
    const urlObj = new URL(environment.apiBaseUrl);
    const base = `${urlObj.protocol}//${urlObj.host}`;
    return url.startsWith('/') ? base + url : base + '/' + url;
  }

  async cargarPaquete(id: string) {
    try {
      const res = await fetch(environment.apiBaseUrl + 'paquetes/' + id);
      if (res.ok) {
        const paquete = await res.json();
        paquete.imagenes = (paquete.imagenes || []).map((img: ImagenesPaquete) => ({
          ...img,
          imagen_url: this.corregirUrl(img.imagen_url)
        }));
        this.paquete = paquete;
        this.fotoActual = 0;
      } else {
        this.paquete = null;
      }
    } catch (e) {
      this.paquete = null;
    }
    this.cargando = false;
  }
}