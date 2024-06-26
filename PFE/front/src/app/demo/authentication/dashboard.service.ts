// dashboard.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  getDashboardData(): void {
    const token = localStorage.getItem('token');
    if (token) {
      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.get('http://localhost:3000/dashboard/default', { headers })
        .subscribe(
          (response: any) => {
            console.log('Dashboard data:', response);
            // Process dashboard data here
            this.router.navigate(['/dashboard/default']);
          },
          (error: any) => {
            console.error('Error fetching dashboard data:', error);
            // Handle error
          }
        );
    } else {
      console.error('Token not found, user not authenticated.');
      // Handle unauthenticated access
    }
  }
}
