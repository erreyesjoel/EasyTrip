import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  cupo_maximo: number;
}

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-detalles-paquete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalles-paquete.html',
  styleUrl: './detalles-paquete.scss'
})
export class DetallesPaquete implements OnInit {
  paquete: Paquete | null = null;
  cargando = true;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPaquete(id);
    }
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
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Respuesta cruda:', text);

    if (res.ok) {
      const paquete = JSON.parse(text);
      paquete.imagenes = (paquete.imagenes || []).map((img: ImagenesPaquete) => ({
        ...img,
        imagen_url: this.corregirUrl(img.imagen_url)
      }));
      console.log('Paquete cargado:', paquete);
      this.paquete = paquete;
    } else {
      this.paquete = null;
    }
  } catch (e) {
    console.error('Error al cargar el paquete:', e);
    this.paquete = null;
  }
  this.cargando = false;
}
}