// angular import
import {Component, OnInit,HostListener } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import { DashboardService } from '../../../../../demo/authentication/dashboard.service';
import { AuthService } from '../../../../../../app/demo/authentication/auth.service';

@Component({
  selector: 'app-nav-right',
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent implements OnInit {
  firstName: string;
  lastName: string;
  Type:string;

  // Track user activity
  activityTimer: any;
  //readonly INACTIVITY_TIMEOUT = 120000; // 10 minutes
  readonly INACTIVITY_TIMEOUT = 3600000; //1hour 
  constructor(
    private http: HttpClient,
    private router: Router ,// Inject Router service here;
    private dashboardService: DashboardService ,// Inject DashboardService here
    private authService: AuthService
  ) {
  }
  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:keypress', ['$event'])
 
  ngOnInit(): void {
  this.firstName = this.authService.getUserData()?.firstName;
  this.lastName = this.authService.getUserData()?.lastName;
  this.Type = this.authService.getUserData()?.Type;
    //this.Type=localStorage.getItem('id');
    // Start the initial activity timer
  this.resetActivityTimer();
  }
  resetActivityTimer() {
    clearTimeout(this.activityTimer);
    this.activityTimer = setTimeout(() => {
      // Initiate logout process when there's no activity
      this.logout();
    }, this.INACTIVITY_TIMEOUT);
  }
  logout(): void {
    
    this.authService.logout();
    this.router.navigate(['/login']); // Redirect to login page
  }
 // public method
  profile = [
    {
      icon: 'ti ti-edit-circle',
      title: 'Edit Profile'
    },
    {
      icon: 'ti ti-user',
      title: 'View Profile'
    },
    {
      icon: 'ti ti-clipboard',
      title: 'Social Profile'
    },
    {
      icon: 'ti ti-edit-circle',
      title: 'Billing'
    },
    {
      icon: 'ti ti-power',
      title: 'Logout'
    }
  ];
  setting = [
    {
      icon: 'ti ti-help',
      title: 'Support'
    },
    {
      icon: 'ti ti-user',
      title: 'Account Settings'
    },
    {
      icon: 'ti ti-lock',
      title: 'Privacy Center'
    },
    {
      icon: 'ti ti-messages',
      title: 'Feedback'
    },
    {
      icon: 'ti ti-list',
      title: 'History'
    }
  ];
  toggleDropdown(): void {
    // Toggle the dropdown menu manually
    const dropdownMenu = document.querySelector('.dropdown.pc-h-item.header-user-profile .dropdown-menu');
    dropdownMenu.classList.toggle('show');
  }
}
