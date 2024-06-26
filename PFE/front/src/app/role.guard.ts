// role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../app/demo/authentication/auth.service'; // Import your AuthService

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private router: Router,private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const roles = this.authService.getUserData();
    const userRole = roles.Type;
    //console.log(userRole)
    if (!userRole) {
      this.router.navigate(['/login']);
      return false;
    }

    const expectedRole = route.data['role'];
    if (userRole === expectedRole) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
