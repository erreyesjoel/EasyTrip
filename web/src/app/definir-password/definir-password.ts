import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-definir-password',
  templateUrl: './definir-password.html',
  styleUrl: './definir-password.scss',
  standalone: true,
  imports: [FormsModule] 
})
export class DefinirPassword {
  password = '';
  confirmPassword = '';

  getParamsFromUrl(): { user_id: string, token: string } {
    const params = new URLSearchParams(window.location.search);
    const user_id = params.get('user_id') || '';
    const token = params.get('token') || '';
    console.log('URL params:', { user_id, token });
    return { user_id, token };
  }

  async guardarPassword() {
    const { user_id, token } = this.getParamsFromUrl();
    console.log('Intentando enviar:', { user_id, token, password: this.password, confirmPassword: this.confirmPassword });

    if (!user_id || !token || !this.password || !this.confirmPassword) {
      console.log('Faltan datos');
      return;
    }
    if (this.password !== this.confirmPassword) {
      console.log('Las contraseñas no coinciden');
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
      console.log('Respuesta HTTP:', res.status);
      const data = await res.json().catch(() => ({}));
      console.log('Respuesta JSON:', data);
    } catch (err) {
      console.error('Error en fetch:', err);
    }
  }
}