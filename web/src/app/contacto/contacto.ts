import { Component, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Notificaciones } from '../notificaciones/notificaciones';

interface CuerpoMensaje {
  nombre: string;
  email: string;
  mensaje: string;
}

@Component({
  selector: 'app-contacto',
  imports: [FormsModule, CommonModule, Notificaciones],
  templateUrl: './contacto.html',
  styleUrl: './contacto.scss'
})
export class Contacto {
  datos: CuerpoMensaje = { nombre: '', email: '', mensaje: '' };
  enviando = false;
  enviado = false;

  @ViewChild(Notificaciones) notificaciones?: Notificaciones;

  async ngOnInit(): Promise<void> {
    console.log(environment.apiBaseUrl + 'contacto');
  }

  validarEmail(email: string): boolean {
    // Expresión regular simple para email
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async enviarFormulario(event: Event) {
    event.preventDefault();
    this.enviando = true;
    this.enviado = false;

    // Validación de campos obligatorios
    if (
      !this.datos.nombre.trim() ||
      !this.datos.email.trim() ||
      !this.datos.mensaje.trim()
    ) {
      this.notificaciones?.mostrar('Todos los campos son obligatorios.', 'error');
      this.enviando = false;
      return;
    }

    // Validaciones de longitud
    if (this.datos.nombre.length > 150) {
      this.notificaciones?.mostrar('El nombre no puede superar 150 caracteres.', 'error');
      this.enviando = false;
      return;
    }
    if (this.datos.email.length > 150) {
      this.notificaciones?.mostrar('El email no puede superar 150 caracteres.', 'error');
      this.enviando = false;
      return;
    }
    if (this.datos.mensaje.length > 150) {
      this.notificaciones?.mostrar('El mensaje no puede superar 150 caracteres.', 'error');
      this.enviando = false;
      return;
    }
    // Validación de formato de email
    if (!this.validarEmail(this.datos.email)) {
      this.notificaciones?.mostrar('El email no tiene un formato válido.', 'error');
      this.enviando = false;
      return;
    }

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
        this.notificaciones?.mostrar('¡Mensaje enviado correctamente!', 'success');
      } else {
        // Si el error es "Todos los campos son obligatorios", lo mostramos igual
        const errorMsg = data?.error || 'Error al enviar el mensaje.';
        console.log(errorMsg);
        this.notificaciones?.mostrar(errorMsg, 'error');
      }
    } catch (e) {
      const errorMsg = 'No se pudo conectar con el servidor.';
      console.log(errorMsg);
      this.notificaciones?.mostrar(errorMsg, 'error');
    } finally {
      this.enviando = false;
    }
  }
}