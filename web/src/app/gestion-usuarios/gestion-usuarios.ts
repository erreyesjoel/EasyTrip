import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar';
import { environment } from '../../environments/environment';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';


// Interfaz para el usuario
// Representa la estructura de un usuario en el sistema
interface Usuario {
  id: number;
  username: string;
  email: string;
  rol: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
  last_login: Date;
  date_joined: Date;

}

@Component({
  selector: 'app-gestion-usuarios',
  imports: [CommonModule, SidebarComponent, ReactiveFormsModule],
  templateUrl: './gestion-usuarios.html',
  styleUrls: ['./gestion-usuarios.scss']
})

export class GestionUsuarios {

  // cuando se "renderiza el componente", se hara peticion a la api gestion-usuarios
  // por eso ngOnInit porque es el ciclo de vida del componente que se ejecuta al inicializar

  usuarios: Usuario[] = [];

  modalUsuarioAbierto = false; // Controla la visibilidad del modal de crear/editar
  modalEliminarUsuarioAbierto = false; // Controla la visibilidad del modal de eliminar
  modoCreacionUsuario = false; // true = crear, false = editar
  usuarioActual: Usuario | null = null; // Usuario seleccionado para editar/eliminar

  formularioUsuario: FormGroup;

  constructor(private fb: FormBuilder) {
    this.formularioUsuario = this.fb.group({
      username: [''],
      first_name: [''],
      last_name: [''],
      email: [''],
      rol: ['usuario']
    });
  }

  ngOnInit() {
      this.cargarUsuarios();
  }

  /* Carga los usuarios desde la API 
  funcion independiente, que llamaremos desde ngOnInit */
  async cargarUsuarios(): Promise<void> {
    // Realiza una petición a la API para obtener los usuarios
    // Utiliza la URL base definida en el entorno para construir la URL completa (variable de entorno, que indica donde se ejecuta el backend)
    const res = await fetch(environment.apiBaseUrl + 'gestion-usuarios');
    if (res.status === 200) { // Si la respuesta es exitosa (código 200)
      // Convierte la respuesta JSON a un array de objetos Usuario
      // Utiliza la interfaz Usuario para tipar los datos obtenidos
      // Esto asegura que los datos cumplen con la estructura definida en la interfaz Usuario
      // Esto es una promesa, por eso usamos await
      // res.json() devuelve una promesa que se resuelve con el cuerpo de la respuesta
      // En este caso, esperamos que sea un array de usuarios
      const usuarios: Usuario[] = await res.json();
      this.usuarios = usuarios; // 
      // Ahora this.usuarios contiene los usuarios obtenidos de la API
      console.log("Usuarios de la bbdd:", usuarios);
    } else {
      console.log("Error en la peticion");
    }
  }

  // Abre el modal para crear usuario
  abrirModalCrearUsuario() {
    this.modoCreacionUsuario = true;
    this.formularioUsuario.reset({ rol: 'usuario' });
    this.usuarioActual = null;
    this.modalUsuarioAbierto = true;
  }

  // Abre el modal para editar usuario
  abrirModalEditarUsuario(usuario: Usuario) {
    this.modoCreacionUsuario = false;
    this.usuarioActual = usuario;
    this.formularioUsuario.patchValue(usuario);
    this.modalUsuarioAbierto = true;
  }

  // Cierra el modal de crear/editar
  cerrarModalUsuario() {
    this.modalUsuarioAbierto = false;
    this.usuarioActual = null;
  }

  // Guardar usuario (solo visual/funcional)
  guardarUsuario() {
    // Aquí iría la lógica para crear o editar usuario
    this.cerrarModalUsuario();
  }

  // Abre el modal de eliminar usuario
  abrirModalEliminarUsuario(usuario: Usuario) {
    this.usuarioActual = usuario;
    this.modalEliminarUsuarioAbierto = true;
  }

  // Cierra el modal de eliminar usuario
  cerrarModalEliminarUsuario() {
    this.modalEliminarUsuarioAbierto = false;
    this.usuarioActual = null;
  }

  // Eliminar usuario (solo visual/funcional)
  eliminarUsuario() {
    // Aquí iría la lógica para eliminar usuario
    this.cerrarModalEliminarUsuario();
  }

  toggleEstado(usuario: Usuario) {
    // Aquí irá la lógica para activar/desactivar usuario
  }
}