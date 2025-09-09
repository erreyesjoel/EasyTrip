import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface CuerpoMensaje {
  nombre: string;
  email: string;
  mensaje: string;
}

@Component({
  selector: 'app-contacto',
  imports: [FormsModule, CommonModule],
  templateUrl: './contacto.html',
  styleUrl: './contacto.scss'
})
export class Contacto {
  datos: CuerpoMensaje = { nombre: '', email: '', mensaje: '' };
  enviando = false;
  enviado = false;
  error: string | null = null;

  async ngOnInit(): Promise<void> {
    // comprovar que la url es la correcta
    console.log(environment.apiBaseUrl + 'contacto');
  }

  async enviarFormulario(event: Event) {
    event.preventDefault();
    this.enviando = true;
    this.enviado = false;
    this.error = null;

    try {
      const res = await fetch(environment.apiBaseUrl + 'contacto/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.datos)
      });
      const data = await res.json();
      if (res.ok) {
        this.enviado = true;
        console.log('Mensaje enviado con éxito:', data);
        this.datos = { nombre: '', email: '', mensaje: '' };
      } else {
        this.error = data?.error || 'Error al enviar el mensaje.';
        console.log(this.error);
      }
    } catch (e) {
      this.error = 'No se pudo conectar con el servidor.';
      console.log(this.error);
    } finally {
      this.enviando = false;
    }
  }
}