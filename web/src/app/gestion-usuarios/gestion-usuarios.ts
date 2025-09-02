import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar';
import { environment } from '../../environments/environment';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms'; 
import { validacionFormatoEmail, validarCrearUsuario } from '../../form-validations';
import { MensajesComponent } from '../mensajes/mensajes';
import { Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Notificaciones } from '../notificaciones/notificaciones'; // Importar componente de notificaciones
import { ViewChild } from '@angular/core';
import { PaginacionGestion } from '../paginacion-gestion/paginacion-gestion';

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

const emailFormatoValidator = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const resultado = validacionFormatoEmail(value);
  return resultado.validacion ? null : { formatoEmail: resultado.message };
};

@Component({
  selector: 'app-gestion-usuarios',
  imports: [CommonModule, SidebarComponent, ReactiveFormsModule, FormsModule, MensajesComponent, Notificaciones, PaginacionGestion],
  templateUrl: './gestion-usuarios.html',
  styleUrls: ['./gestion-usuarios.scss']
})

export class GestionUsuarios {

  // viewChild para acceder al componente de notificaciones

  @ViewChild('notificaciones') notificacionesRef!: Notificaciones;

  // cuando se "renderiza el componente", se hara peticion a la api gestion-usuarios
  // por eso ngOnInit porque es el ciclo de vida del componente que se ejecuta al inicializar

  usuarios: Usuario[] = [];
  roles: { value: string, label: string }[] = [];

  modalUsuarioAbierto = false; // Controla la visibilidad del modal de crear/editar
  modalEliminarUsuarioAbierto = false; // Controla la visibilidad del modal de eliminar
  modalEstadoUsuarioAbierto = false; // Controla la visibilidad del modal de cambiar estado
  modoCreacionUsuario = false; // true = crear, false = editar
  usuarioActual: Usuario | null = null; // Usuario seleccionado para editar/eliminar
  usuarioEstadoActual: any = null; // Usuario seleccionado para cambiar estado

  formularioUsuario: FormGroup;

  // Filtros visuales
  filtroEmail: string = '';
  filtroRol: string = '';
  filtroEstado: string = '';

  // Ordenación de la tabla
  ordenCampo: string = 'username'; // Campo actual de ordenación
  ordenAsc: boolean = true;        // true = ascendente, false = descendente

  mensajesErroresUsuario: string[] = [];

  /* paginacion */

  paginaActual: number = 1;
  totalPaginas: number = 1;
  pageSize: number = 7; // Tamaño de página por defecto
  opcionesPageSize: number[] = [7, 14, 21, 0]; // Opciones de tamaño de página, 0 = todos

  constructor(private fb: FormBuilder) {
    this.formularioUsuario = this.fb.group({
      username: [''],
      first_name: [''],
      last_name: [''],
      email: ['', [Validators.required, emailFormatoValidator]],
      rol: ['usuario']
    });
  }

  async ngOnInit() {
    await this.cargarRoles();
    await this.cargarUsuarios();

    // de esta forma nos aseguramos de que el formulario este limpio desde el inicio
    // y que no tenga valores previos
    this.formularioUsuario = this.fb.group({
      username: [''],
      first_name: [''],
      last_name: [''],
      email: ['', [Validators.required, emailFormatoValidator]],
      rol: ['usuario']
    });
  }

  /* Carga los usuarios desde la API 
  funcion independiente, que llamaremos desde ngOnInit */
  async cargarUsuarios(): Promise<void> {
    // Construye la query string con paginación
    const params = new URLSearchParams();
    params.append('page', String(this.paginaActual));
    params.append('page_size', String(this.pageSize === 0 ? 9999 : this.pageSize));

    // Realiza una petición a la API para obtener los usuarios
    const res = await fetch(environment.apiBaseUrl + 'gestion-usuarios?' + params.toString());
    if (res.status === 200) {
      // Convierte la respuesta JSON a un array de objetos Usuario
      // Si la API devuelve { results, total_pages, page, page_size }
      const data = await res.json();
      this.usuarios = Array.isArray(data) ? data : (data.results || []);
      this.totalPaginas = data.total_pages || 1;
      this.paginaActual = data.page || 1;
      this.pageSize = data.page_size || this.pageSize;
      console.log("Usuarios de la bbdd:", this.usuarios);
    } else {
      console.log("Error en la peticion");
    }
  }

  async cargarRoles() {
    // Llama a la API para obtener los roles
    const res = await fetch(environment.apiBaseUrl + 'roles-usuario/');
    if (res.status === 200) {
      this.roles = await res.json();
    } else {
      this.roles = [];
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
    /* al cerrar el modal, limpiamos el formulario
    de mensajes de error */
    this.mensajesErroresUsuario = [];
  }

  // Guardar usuario (solo visual/funcional)
  async guardarUsuario() {
    // Llama a las validaciones antes de enviar a la API
    const datos = this.formularioUsuario.value;
    this.mensajesErroresUsuario = validarCrearUsuario(datos);

    if (this.mensajesErroresUsuario.length > 0) {
      // Si hay errores, no envía la petición y muestra los mensajes
      return;
    }

    if (this.modoCreacionUsuario) {
      
      // Si es creación
      // Recoge los datos del formulario
      const res = await fetch(environment.apiBaseUrl + 'crear-usuario/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (res.status === 201) {

        // Recarga la tabla de usuarios
        await this.cargarUsuarios();
        this.notificacionesRef.mostrar(`Usuario ${datos.username} creado correctamente`, 'success');
        this.cerrarModalUsuario();
      } else {
        const error = await res.json();
        // muestra error, pero de mensaje, no notifiaciones
        // es porque queria mostrar la validacion de django, de 'este email ya existe'
        this.mensajesErroresUsuario.push(error.error || 'Error al crear usuario');
      }
    } else if (this.usuarioActual) {
      // Editar usuario
      const res = await fetch(environment.apiBaseUrl + 'editar-usuario/' + this.usuarioActual.id + '/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (res.status === 200) {
        await this.cargarUsuarios();
        this.notificacionesRef.mostrar(`Usuario ${this.usuarioActual.username} editado correctamente`, 'success');
        this.cerrarModalUsuario();
      } else {
        const error = await res.json();
        this.mensajesErroresUsuario.push(error.error || 'Error al editar usuario');
      }
    }
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
  async eliminarUsuario() {
    if (this.usuarioActual) {
      const res = await fetch(environment.apiBaseUrl + 'eliminar-usuario/' + this.usuarioActual.id + '/', {
        method: 'DELETE'
      });
      if (res.status === 200) {
        await this.cargarUsuarios();
        this.notificacionesRef.mostrar(`Usuario ${this.usuarioActual.username} eliminado correctamente`, 'success');
        this.cerrarModalEliminarUsuario();
      } else {
        const error = await res.json();
        this.notificacionesRef.mostrar(error.error || 'Error al eliminar usuario', 'error');
      }
    }
  }

  // Abre el modal para cambiar estado de usuario
  abrirModalEstadoUsuario(usuario: any) {
    this.usuarioEstadoActual = usuario;
    this.modalEstadoUsuarioAbierto = true;
  }

  // Cierra el modal de cambiar estado de usuario
  cerrarModalEstadoUsuario() {
    this.modalEstadoUsuarioAbierto = false;
    this.usuarioEstadoActual = null;
  }

  // Confirma el cambio de estado de un usuario
async confirmarCambioEstadoUsuario() {
  // Aquí llamas a tu API para cambiar el estado (alta/baja)
  if (!this.usuarioEstadoActual) return;

  // Prepara el nuevo estado (activo/inactivo)
  const nuevoEstado = !this.usuarioEstadoActual.is_active;

  // Guarda el username antes de cerrar el modal
  const username = this.usuarioEstadoActual.username;

  // Llama a la API PATCH para cambiar el estado en backend
  const res = await fetch(
    environment.apiBaseUrl + 'cambiar-estado-usuario/' + this.usuarioEstadoActual.id + '/',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: nuevoEstado })
    }
  );

  if (res.status === 200) {
    // Tras éxito: recarga la lista de usuarios y muestra notificación
    await this.cargarUsuarios();
    this.cerrarModalEstadoUsuario();
    this.notificacionesRef.mostrar(
      nuevoEstado
        ? `Usuario ${username} activado correctamente`
        : `Usuario ${username} desactivado correctamente`,
      'success'
    );
  } else {
    // Si hay error, muestra notificación de error
    const error = await res.json();
    this.notificacionesRef.mostrar(error.error || 'Error al cambiar el estado del usuario', 'error');
    this.cerrarModalEstadoUsuario();
  }
}

  // Método para aplicar los filtros y la ordenación
  async aplicarFiltros() {
    // Construye la query string con filtros y orden
    const params = new URLSearchParams();
    if (this.filtroEmail) params.append('email', this.filtroEmail);
    if (this.filtroRol) params.append('rol', this.filtroRol);
    if (this.filtroEstado) params.append('estado', this.filtroEstado);
    if (this.ordenCampo) params.append('ordering', (this.ordenAsc ? '' : '-') + this.ordenCampo);
    params.append('page', String(this.paginaActual));
    params.append('page_size', String(this.pageSize === 0 ? 9999 : this.pageSize));

    const url = environment.apiBaseUrl + 'gestion-usuarios?' + params.toString();
    const res = await fetch(url);
    if (res.status === 200) {
      const data = await res.json();
      this.usuarios = Array.isArray(data) ? data : (data.results || []);
      this.totalPaginas = data.total_pages || 1;
      this.paginaActual = data.page || 1;
      this.pageSize = data.page_size || this.pageSize;
    }
  }

    onPaginaCambiada(nuevaPagina: number) {
    this.paginaActual = nuevaPagina;
    this.aplicarFiltros();
  }

  onPageSizeCambiado(nuevoSize: number) {
    this.pageSize = nuevoSize;
    this.paginaActual = 1;
    this.aplicarFiltros();
  }

  // Método para reiniciar los filtros
  reiniciarFiltros() {
    this.ordenCampo = 'username'; // Reinicia al campo por defecto
    this.ordenAsc = true; // Reinicia a orden ascendente
    this.filtroEmail = '';
    this.filtroRol = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  // Cambia el campo y sentido de ordenación
  ordenarPor(campo: string) {
    if (this.ordenCampo === campo) {
      this.ordenAsc = !this.ordenAsc; // Alterna asc/desc
    } else {
      this.ordenCampo = campo;
      this.ordenAsc = true; // Por defecto ascendente al cambiar de campo
    }
    this.aplicarFiltros();
  }

  // Método para obtener los mensajes de error de un campo específico
  // y mostrarlos debajo de cada input
  getErroresCampo(campo: string): string[] {
  if (campo === 'nombre') {
    // Solo errores que realmente sean de nombre, no de usuario
    return this.mensajesErroresUsuario.filter(msg =>
      msg.toLowerCase().includes('nombre') &&
      !msg.toLowerCase().includes('usuario')
    );
  }
  if (campo === 'usuario') {
    return this.mensajesErroresUsuario.filter(msg =>
      msg.toLowerCase().includes('usuario')
    );
  }
  return this.mensajesErroresUsuario.filter(msg => msg.toLowerCase().includes(campo));
}

  actualizarErroresUsuario() {
    const datos = this.formularioUsuario.value;
    this.mensajesErroresUsuario = validarCrearUsuario(datos);
  }
}