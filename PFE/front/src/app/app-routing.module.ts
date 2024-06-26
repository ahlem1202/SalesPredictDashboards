import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminComponent } from './theme/layouts/admin/admin.component';
import { GuestComponent } from './theme/layouts/guest/guest.component';
import { AuthGuard } from './auth.guard';
import { RoleGuard } from './role.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: '/dashboard/default', pathMatch: 'full' },
      {
        path: 'dashboard-admin',
        loadComponent: () => import('./demo/default/dashboard/dashboard.component'),
        canActivate: [RoleGuard],
        data: { role: 'admin', title: 'ZaiDash Plus' }
      },
      {
        path: 'dashboard-manager',
        loadComponent: () => import('./demo/dashboard-manager/dashboard-manager.component').then(m => m.DashboardManagerComponent),
        canActivate: [RoleGuard],
        data: { role: 'manager', title: 'ZaiDash Plus' }
      },
      {
        path: 'dashboard-employee',
        loadComponent: () => import('./demo/dashboard-employee/dashboard-employee.component'),
        canActivate: [RoleGuard],
        data: { role: 'employee', title: 'ZaiDash Plus' }
      },
      {
        path: 'create-account',
        loadComponent: () => import('./demo/authentication/register/register.component'),
        canActivate: [RoleGuard],
        data: { role: 'admin', title: 'ZaiDash Plus' }
      },
      {
        path: 'create-database',
        loadComponent: () => import('./demo/authentication/baseform/baseform.component').then(m => m.BaseformComponent),
        canActivate: [RoleGuard],
        data: { role: 'admin', title: 'ZaiDash Plus' }
      },
      {
        path: 'upload-data',
        loadComponent: () => import('./demo/authentication/baseupdate/baseupdate.component').then(m => m.BaseupdateComponent),
        canActivate: [RoleGuard],
        data: { role: 'manager', title: 'ZaiDash Plus' }
      },
      { path: 'typography', loadComponent: () => import('./demo/ui-component/typography/typography.component'), data: { title: 'ZaiDash Plus' } },
      { path: 'card', loadComponent: () => import('./demo/component/card/card.component'), data: { title: 'ZaiDash Plus' } },
      { path: 'breadcrumb', loadComponent: () => import('./demo/component/breadcrumb/breadcrumb.component'), data: { title: 'ZaiDash Plus' } },
      { path: 'spinner', loadComponent: () => import('./demo/component/spinner/spinner.component'), data: { title: 'ZaiDash Plus' } },
      { path: 'color', loadComponent: () => import('./demo/ui-component/ui-color/ui-color.component'), data: { title: 'ZaiDash Plus' } },
      { path: 'sample-page', loadComponent: () => import('./demo/other/sample-page/sample-page.component'), data: { title: 'ZaiDash Plus' } }
    ]
  },
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./demo/authentication/login/login.component'),
        data: { title: 'ZaiDash Plus' }
      },
      {
        path: 'forget-password',
        loadComponent: () => import('./demo/authentication/forget-password/forget-password.component'),
        data: { title: 'ZaiDash Plus' }
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./demo/authentication/reset-password/reset-password.component'),
        data: { title: 'ZaiDash Plus' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

