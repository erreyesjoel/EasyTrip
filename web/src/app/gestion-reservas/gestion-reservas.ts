import { Component, ViewChild } from '@angular/core';
import { SidebarComponent} from '../sidebar/sidebar';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Notificaciones } from '../notificaciones/notificaciones'; // importar componente
import { validacionFormatoEmail } from '../../form-validations'; // Importar la función de validación
import { MensajesComponent } from '../mensajes/mensajes';

interface Reserva {
  id: number;
  fecha_reservada: Date;
  estado: string;
  usuario: string;
  usuario_gestor: string;
  paquete: string;
  fecha_creacion: string; // Añadido para mostrar la fecha de creación
  duracion_dias: number;
}


@Component({
  selector: 'app-gestion-reservas',
  imports: [SidebarComponent, CommonModule, FormsModule, Notificaciones, MensajesComponent], 
  templateUrl: './gestion-reservas.html',
  styleUrl: './gestion-reservas.scss'
})
export class GestionReservas {

  // array en el que se almacenan las reservas
  // declarado en el for each, ngFor en el html
  reservas: Reserva[] = [];
  agentes: { email: string, nombre: string }[] = [];
  modalAsignarAbierto = false;
  reservaSeleccionada: Reserva | null = null;
  agenteSeleccionado: string = '';

  // Variables de filtro (deben estar aquí)
  filtroEstado: string = '';
  filtroCliente: string = '';
  filtroPaquete: string = '';
  filtroGestor: string = '';
  filtroFecha: string = '';

  modalEditarAbierto = false;
  reservaEditada: Reserva | null = null;

  modalCrearReservaAbierto = false;
  nuevaReserva = { email: '', paquete_id: '', fecha_reservada: '', estado: 'pendiente' };
  // ARRAY DE PAQUETES
  // importante para mostrar el nombre del paquete en las notificaciones
  paquetes: { id: number, nombre: string }[] = [];

  @ViewChild('notificaciones') notificacionesRef!: Notificaciones;

  // por defecto, para que hoy sea la fecha actual, en formato YYYY-MM-DD
  // esto en el input de fecha
  hoy: string = new Date().toISOString().slice(0, 10);

  // ngOnInit porque se utiliza para inicializar la carga de datos al inicio del componente
  // nada mas renderizar el componente, llamamos de forma asincrona a la funcion obtenerReservas
  async ngOnInit() {
    await this.obtenerReservas();
    await this.obtenerAgentes();
    await this.obtenerPaquetes();
  }

  async obtenerReservas(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'gestion-reservas/', {
      });

      // si la respuesta es exitosa, 200, como es get
      if (res.status === 200) {
        const data = await res.json();
        this.reservas = data; // Asignar los datos a la propiedad reservas
        // console log para depuracion
        console.log('Reservas obtenidas:', data);
      }
    } catch (error) {
      console.error('Error al obtener reservas:', error);
    }
  }
  async asignarGestor(reservaId: number, agenteEmail: string) {
  // Llama a tu API para actualizar la reserva y asignar el agente
  const res = await fetch(environment.apiBaseUrl + `asignar-gestor-reserva/${reservaId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario_gestor: agenteEmail })
  });
  if (res.status === 200) {
    // notificacion success
    this.notificacionesRef.mostrar(`${agenteEmail} gestionará la reserva ${this.reservaSeleccionada?.id}`, 'success');
    await this.obtenerReservas(); // Recarga la lista
  }
}
  async obtenerAgentes() {
    // Llama a tu API para obtener los agentes
    const res = await fetch(environment.apiBaseUrl + 'usuarios-agentes/');
    if (res.status === 200) {
      this.agentes = await res.json();
    }
  }

  abrirModalAsignar(reserva: Reserva) {
    this.reservaSeleccionada = reserva;
    this.agenteSeleccionado = '';
    this.modalAsignarAbierto = true;
  }

  cerrarModalAsignar() {
    this.modalAsignarAbierto = false;
    this.reservaSeleccionada = null;
    this.agenteSeleccionado = '';
  }
    async guardarAsignacion() {
    if (this.reservaSeleccionada && this.agenteSeleccionado) {
      await this.asignarGestor(this.reservaSeleccionada.id, this.agenteSeleccionado);
      this.cerrarModalAsignar();
    }
  }

async aplicarFiltros() {
  const params: string[] = [];
  if (this.filtroCliente) params.push(`usuario=${encodeURIComponent(this.filtroCliente)}`);
  if (this.filtroPaquete) params.push(`paquete=${encodeURIComponent(this.filtroPaquete)}`);
  if (this.filtroGestor) params.push(`usuario_gestor=${encodeURIComponent(this.filtroGestor)}`);
  if (this.filtroEstado) params.push(`estado=${encodeURIComponent(this.filtroEstado)}`);
  if (this.filtroFecha) params.push(`fecha_reservada=${encodeURIComponent(this.filtroFecha)}`);
  const query = params.length ? '?' + params.join('&') : '';
  const res = await fetch(environment.apiBaseUrl + 'gestion-reservas/' + query);
  if (res.status === 200) {
    this.reservas = await res.json();
  }
}

reiniciarFiltros() {
  this.filtroCliente = '';
  this.filtroPaquete = '';
  this.filtroGestor = '';
  this.filtroEstado = '';
  this.filtroFecha = '';
  this.aplicarFiltros();
}

abrirModalEditar(reserva: Reserva) {
  // Clona la reserva para edición
  this.reservaEditada = { ...reserva };
  this.modalEditarAbierto = true;
}

cerrarModalEditar() {
  this.modalEditarAbierto = false;
  this.reservaEditada = null;
}

getFechaFin(reserva: Reserva): string {
  if (!reserva.fecha_reservada || !reserva.duracion_dias) return '';
  const inicio = new Date(reserva.fecha_reservada);
  inicio.setDate(inicio.getDate() + reserva.duracion_dias);
  return inicio.toISOString().slice(0, 10); // yyyy-MM-dd
}

async guardarEdicion() {
  if (!this.reservaEditada) return; // Evita el error si es null

  const res = await fetch(environment.apiBaseUrl + `asignar-gestor-reserva/${this.reservaEditada.id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      estado: this.reservaEditada.estado,
      fecha_reservada: this.reservaEditada.fecha_reservada
    })
  });
  if (res.status === 200) {
    this.notificacionesRef.mostrar(`Reserva ${this.reservaEditada.id} editada con éxito`, 'success');
    await this.obtenerReservas();
    this.cerrarModalEditar();
  }
}

abrirModalCrearReserva() {
  this.nuevaReserva = { email: '', paquete_id: '', fecha_reservada: '', estado: 'pendiente' };
  this.modalCrearReservaAbierto = true;
}

cerrarModalCrearReserva() {
  this.modalCrearReservaAbierto = false;
}

mensajeErrorForm: string | undefined = undefined;
tipoMensajeForm: 'error' | 'exito' | 'error-form' | undefined = undefined;

async guardarNuevaReserva() {
  // Validar formato de email antes de enviar
  // usamos la función de validación importada
const resultado = validacionFormatoEmail(this.nuevaReserva.email);
if (!resultado.validacion) {
  this.mensajeErrorForm = resultado.message;
  this.tipoMensajeForm = 'error-form';
  return;
}
this.mensajeErrorForm = undefined;
this.tipoMensajeForm = undefined;

  const res = await fetch(environment.apiBaseUrl + 'crear-reserva-gestion/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: this.nuevaReserva.email,
      paquete_id: this.nuevaReserva.paquete_id,
      fecha_reservada: this.nuevaReserva.fecha_reservada,
      estado: this.nuevaReserva.estado
    })
  });
  if (res.status === 201 || res.status === 200) {
    // buscamos el paquete por ID, de el array de paquetes
    const paquete = this.paquetes.find(p => String(p.id) === this.nuevaReserva.paquete_id);
    // asi obtenemos el nombre
    const nombrePaquete = paquete ? paquete.nombre : '';
    // notificacion de exito, ponemos 'success', para hacerlo bien, asi esta en el componente
    this.notificacionesRef.mostrar(`Reserva creada con exito para ${nombrePaquete}`, 'success');
    await this.obtenerReservas();
    this.cerrarModalCrearReserva();
  } else {
    this.notificacionesRef.mostrar('Error al crear la reserva', 'error')
  }
}
async obtenerPaquetes() {
  const res = await fetch(environment.apiBaseUrl + 'paquetes/');
  if (res.status === 200) {
    const data = await res.json();
    // Filtra solo los activos
    this.paquetes = data.filter((p: any) => p.estado === 'activo');
    console.log('Paquetes activos:', this.paquetes);
  }
}
}
