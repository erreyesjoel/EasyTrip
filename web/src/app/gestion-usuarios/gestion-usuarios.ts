import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar';
import { environment } from '../../environments/environment';

// Interfaz para el usuario
// Representa la estructura de un usuario en el sistema
interface Usuario {
  id: number;
  username: string;
  email: string;
  rol: string;
  estado: string;
  first_name: string;
  last_name: string;
  last_login: Date;
  data_joined: Date;

}

@Component({
  selector: 'app-gestion-usuarios',
  imports: [SidebarComponent],
  templateUrl: './gestion-usuarios.html',
  styleUrls: ['./gestion-usuarios.scss']
})

export class GestionUsuarios {

  // cuando se "renderiza el componente", se hara peticion a la api gestion-usuarios
  // por eso ngOnInit porque es el ciclo de vida del componente que se ejecuta al inicializar
  async ngOnInit() {
    const res = await fetch(environment.apiBaseUrl + 'gestion-usuarios');
    // si la respuesta de la api gestion-usuarios es exitosa (200)
    // consultaremos los usuarios con depuracion en console.log
    if (res.status === 200) {
      const usuarios: Usuario[] = await res.json();
      console.log("Usuarios de la bbdd:", usuarios);
    } else {
      console.log("Error en la peticion");
    }
  }
}