import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.html',
  styleUrl: './iniciar-sesion.scss',
  imports: [CommonModule, FormsModule]
})
export class IniciarSesion implements OnInit {
  modoRegistro = false; // modo registro false, porque por defecto se muestra el login
  modoRecuperacion = false; // modo recuperacion false, porque por defecto se muestra el login

  // Estados para el registro por pasos
  pasoRegistro: 1 | 2 | 3 = 1; // paso registro 1, porque por defecto se muestra el login

  // datos del registro, los campos del formulario de registro
  registroEmail = ''; // email del registro
  registroCodigo = ''; // codigo del registro
  registroNombre = ''; // nombre del registro
  registroApellido = ''; // apellido del registro
  registroPassword = ''; // password del registro
  registroPassword2 = ''; // password2 del registro

  ngOnInit() {
    // Prueba de fetch usando la variable de entorno para el backend
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    fetch(`${apiBaseUrl}ejemplo/`)
      .then(response => response.json())
      .then(data => console.log('Respuesta de ejemplo:', data))
      .catch(error => console.error('Error en fetch:', error));
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
  enviarEmailRegistro() {
  const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
  fetch(`${apiBaseUrl}registro-codigo/`, { // <-- ahora es 'registro-codigo/'
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: this.registroEmail })
  })
    .then(response => response.json())
    .then(data => {
      console.log('Código enviado:', data);
      this.pasoRegistro = 2; // Mostrar input de código
    })
    .catch(error => {
      console.log('Error enviando email:', error);
    });
}

  // Paso 2: Verificar código (ahora sí consulta el backend)
  verificarCodigoRegistro() {
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    fetch(`${apiBaseUrl}verificar-codigo/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.registroEmail,
        codigo: this.registroCodigo
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.valido) {
          console.log('Código correcto');
          this.pasoRegistro = 3;
        } else {
          console.log('Código incorrecto');
          // No avanza de paso, solo log
        }
      })
      .catch(error => {
        console.log('Error verificando código:', error);
      });
  }

  // Paso 3: Enviar datos finales de registro
  finalizarRegistro() {
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    fetch(`${apiBaseUrl}registro/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.registroEmail,
        codigo: this.registroCodigo,
        nombre: this.registroNombre,
        apellido: this.registroApellido,
        password: this.registroPassword,
        password2: this.registroPassword2
      })
    })
      .then(response => response.json())
      .then(() => {
        this.mostrarLogin(); // Vuelve al login tras registrar
      });
  }
}