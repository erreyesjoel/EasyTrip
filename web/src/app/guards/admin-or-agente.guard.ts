import { Injectable } from "@angular/core";
import { CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { Router } from "@angular/router";

export const AdminOrAgenteGuard: CanActivateFn = async () => {
  const router = inject(Router);

  try {
    const res = await fetch((window as any)['NG_APP_API_BASE_URL'] + 'usuario/', {
      credentials: 'include'  // importante para enviar cookies (autenticación)
    });

    if (res.ok) {
      const usuario = await res.json();
      if (usuario.rol === 'administrador' || usuario.rol === 'agente') {
        return true;
      }
    }
  } catch {}

  router.navigate(['/']);
  return false;
};
