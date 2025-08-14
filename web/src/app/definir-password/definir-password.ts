import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms';
import { MensajesComponent } from '../mensajes/mensajes';

@Component({
  selector: 'app-definir-password',
  templateUrl: './definir-password.html',
  styleUrl: './definir-password.scss',
  standalone: true,
  imports: [FormsModule, MensajesComponent]
})
export class DefinirPassword {
  password = ''; // input para la nueva contraseña
  confirmPassword = ''; // input para la confirmación de la contraseña
  mensajeError = '';
  mensajeExito = '';

  getParamsFromUrl(): { user_id: string, token: string } {
    const params = new URLSearchParams(window.location.search);
    const user_id = params.get('user_id') || '';
    const token = params.get('token') || '';
    console.log('URL params:', { user_id, token });
    return { user_id, token };
  }

  async guardarPassword() {

    this.mensajeError = '';
    this.mensajeExito = '';
    
    const { user_id, token } = this.getParamsFromUrl();
    console.log('Intentando enviar:', { user_id, token, password: this.password, confirmPassword: this.confirmPassword });

    if (!user_id || !token || !this.password || !this.confirmPassword) {
      console.log('Faltan datos');
      return;
    }

    // hacer que las conraseñas coincidan
    if (this.password !== this.confirmPassword) {
      this.mensajeError = 'Las contraseñas no coinciden';
      return;
    }

    try {
      const res = await fetch(environment.apiBaseUrl + `definicion-password/${user_id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: this.password
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        this.mensajeExito = 'Contraseña definida correctamente.';
        this.password = ''; // limpiar el campo de contraseña
        this.confirmPassword = ''; // limpiar el campo de confirmación

      } else {
        this.mensajeError = data.error || 'Error al definir la contraseña.';
      }
    } catch (err) {
      this.mensajeError = 'Error de red o servidor.';
    }
  }
}