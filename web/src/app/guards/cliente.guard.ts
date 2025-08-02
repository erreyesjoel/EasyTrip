import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const ClienteGuard: CanActivateFn = async () => {
  const router = inject(Router);
  try {
    const res = await fetch((window as any)['NG_APP_API_BASE_URL'] + 'usuario/', {
      credentials: 'include'
    });
    if (res.ok) {
      const usuario = await res.json();
      if (usuario.rol === 'cliente') {
        return true;
      }
    }
  } catch {}
  router.navigate(['/']);
  return false;
};