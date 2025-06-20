import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MensajesComponent } from '../mensajes/mensajes';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.html',
  styleUrl: './iniciar-sesion.scss',
  imports: [CommonModule, FormsModule, MensajesComponent]
})
export class IniciarSesion implements OnInit {
  modoRegistro = false; // modo registro false, porque por defecto se muestra el login
  modoRecuperacion = false; // modo recuperacion false, porque por defecto se muestra el login

  // Estados para el registro por pasos
  pasoRegistro: 1 | 2 | 3 = 1; // paso registro 1, porque se ha pulsado el boton de registro

  // datos del registro, los campos del formulario de registro
  registroEmail = ''; // email del registro
  registroCodigo = ''; // codigo del registro
  registroNombre = ''; // nombre del registro
  registroApellido = ''; // apellido del registro
  registroPassword = ''; // password del registro
  registroPassword2 = ''; // password2 del registro
  recuperacionEmail = '';
  recuperacionCodigo = '';
  recuperacionPassword = '';
  recuperacionPassword2 = '';
  recuperacionPaso: 1 | 2 = 1;
  
  loginEmail = '';
  loginPassword = '';

  tipoMensaje: 'error' | 'exito' = 'exito';
  mensaje = '';

  constructor(private router: Router) {}

  async ngOnInit() {
    // Comprueba si hay usuario autenticado
    const res = await fetch(environment.apiBaseUrl + 'usuario/', {
      credentials: 'include'
    });
    if (res.ok) {
      // Si está autenticado, redirige a la home
      this.router.navigate(['/']);
    }

    // Prueba de fetch usando la variable de entorno para el backend
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    try {
      const res = await fetch(`${apiBaseUrl}ejemplo/`);
      const data = await res.json();
      console.log('Respuesta de ejemplo:', data);
    } catch (error) {
      console.error('Error en fetch:', error);
    }
  }

  mostrarRegistro() {
    this.modoRegistro = true; // modo registro true, porque se ha pulsado el boton de registro
    this.modoRecuperacion = false; // modo recuperacion false, porque se ha pulsado el boton de registro, y NO el de recuperacion
    this.pasoRegistro = 1; // paso registro 1, porque se ha pulsado el boton de registro, siempre empezar por el paso 1
  }

  mostrarLogin() {
    this.modoRegistro = false; // modo registro false, porque se ha pulsado el boton de login
    this.modoRecuperacion = false; // modo recuperacion false, porque se ha pulsado el boton de login, y NO el de recuperacion
  }

  mostrarRecuperacion() {
    this.modoRegistro = false; // modo registro false, porque se ha pulsado el boton de recuperacion, y NO el de registro
    this.modoRecuperacion = true; // modo recuperacion true, porque se ha pulsado el boton de recuperacion
  }

  // Paso 1: Enviar email para recibir código
  async enviarEmailRegistro() {
    this.mensaje = '';
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    try {
      const res = await fetch(`${apiBaseUrl}registro-codigo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.registroEmail })
      });
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      if (res.ok) {
        this.tipoMensaje = 'exito';
        this.mensaje = (data as any).mensaje || 'Código enviado al correo';
        this.pasoRegistro = 2;
      } else {
        this.tipoMensaje = 'error';
        this.mensaje = (data as any).error || 'Error enviando código';
      }
    } catch (error) {
      this.tipoMensaje = 'error';
      this.mensaje = 'Error enviando código';
      console.error('Error enviando email:', error);
    }
  }

  // Paso 2: Verificar código
  async verificarCodigoRegistro() {
    this.mensaje = '';
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    try {
      const res = await fetch(`${apiBaseUrl}verificar-codigo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.registroEmail,
          codigo: this.registroCodigo
        })
      });
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      if (res.ok && (data as any).valido) {
        this.tipoMensaje = 'exito';
        this.mensaje = 'Código verificado correctamente';
        this.pasoRegistro = 3;
      } else {
        this.tipoMensaje = 'error';
        this.mensaje = (data as any).error;
      }
    } catch (error) {
      this.tipoMensaje = 'error';
      this.mensaje = 'Error verificando código';
      console.error('Error verificando código:', error);
    }
  }

  // Paso 3: Enviar datos finales de registro
  async finalizarRegistro() {
    if (this.registroPassword !== this.registroPassword2) {
      this.tipoMensaje = 'error';
      this.mensaje = 'Las contraseñas no coinciden';
      return;
    }
    this.mensaje = '';
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    try {
      const res = await fetch(`${apiBaseUrl}registro/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.registroEmail,
          codigo: this.registroCodigo,
          nombre: this.registroNombre,
          apellido: this.registroApellido,
          password: this.registroPassword,
          password2: this.registroPassword2
        }),
        credentials: 'include' // <-- ¡AÑADE ESTO!
      });
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      if (res.ok) {
        this.tipoMensaje = 'exito';
        this.mensaje = (data as any).mensaje || 'Usuario registrado correctamente';
        window.location.href = '/'; // Recarga para que el header detecte el login
      } else {
        this.tipoMensaje = 'error';
        this.mensaje = (data as any).error || 'Error en el registro';
      }
    } catch {
      this.tipoMensaje = 'error';
      this.mensaje = 'Error en el registro';
    }
  }

  // Método para login JWT con cookie HttpOnly
  async iniciarSesion() {
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    try {
      const res = await fetch(`${apiBaseUrl}login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.loginEmail,
          password: this.loginPassword
        }),
        credentials: 'include'
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      if (data.access) {
        this.tipoMensaje = 'exito';
        this.mensaje = 'Login correcto, bienvenido!';
        window.location.href = '/';
      } else {
        this.tipoMensaje = 'error';
        this.mensaje = 'Credenciales incorrectas';
      }
    } catch {
      this.tipoMensaje = 'error';
      this.mensaje = 'Error en login. Intenta de nuevo.';
    }
  }

  // Paso 1: Enviar email para recibir el código de recuperación
  async enviarEmailRecuperacion() {
    this.mensaje = '';
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    try {
      const res = await fetch(`${apiBaseUrl}recuperar-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.recuperacionEmail })
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (res.ok) {
        this.tipoMensaje = 'exito';
        this.mensaje = (data as any).mensaje || 'Código enviado al correo';
        this.recuperacionPaso = 2;
      } else {
        this.tipoMensaje = 'error';
        this.mensaje = (data as any).error || 'Error enviando código';
      }
    } catch {
      this.tipoMensaje = 'error';
      this.mensaje = 'Error enviando código';
    }
  }

  // Paso 2: Cambiar la contraseña usando el código recibido
  async cambiarPasswordRecuperacion() {
    if (this.recuperacionPassword !== this.recuperacionPassword2) {
      this.tipoMensaje = 'error';
      this.mensaje = 'Las contraseñas no coinciden';
      return;
    }
    this.mensaje = '';
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    try {
      const res = await fetch(`${apiBaseUrl}cambiar-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.recuperacionEmail,
          codigo: this.recuperacionCodigo,
          password: this.recuperacionPassword
        })
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (res.ok) {
        this.tipoMensaje = 'exito';
        this.mensaje = (data as any).mensaje || 'Contraseña cambiada correctamente';
        this.mostrarLogin();
      } else {
        this.tipoMensaje = 'error';
        this.mensaje = (data as any).error || 'Error cambiando contraseña';
      }
    } catch {
      this.tipoMensaje = 'error';
      this.mensaje = 'Error cambiando contraseña';
    }
  }
}