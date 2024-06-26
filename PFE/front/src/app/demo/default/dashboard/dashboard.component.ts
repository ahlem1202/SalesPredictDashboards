// angular import
import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient,HttpHeaders,HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {switchMap, catchError } from 'rxjs/operators';
import { throwError ,Observable } from 'rxjs';
import {Chart} from '../../../../../../node_modules/chart.js/auto'
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { ToastrService } from 'ngx-toastr';
import { Location } from '@angular/common'; // Import Location
import {AuthService} from '../../authentication/auth.service'
import { PaginationModule } from '../../pagination/PaginationModule'; // Adjust the path as needed
import { ChartComponent } from 'ng-apexcharts';  // Import ChartComponent
import { NgApexchartsModule } from 'ng-apexcharts';
import { Title } from '@angular/platform-browser';


interface User {
  id:number;
  firstName: string;
  lastName: string;
  company: string;
  Type: string;
  localisation: string;
  last_reset_password_action: string; // Add the action property
  last_reset_password_timestamp: string;
  password :string;
  password_strength: string; // Add password strength property

}
interface ApiResponse {
  rows: User[]; // Define the structure of the response
  // Add other properties if your API response contains more than just 'rows'
 
}




@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,    FormsModule ,PaginationModule,NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export default class DashboardComponent implements OnInit {
  userData: any[] = []; // Initialize an empty array to hold user data
  employeeData: any[] = [];
  userList1: User[] = [];
  searchQuery: string = '';
  sortBy: string = "company"; // default sort by name or any field you prefer
  sortOrder: string = 'asc'; // or 'desc'

  searchQueryUsersActions: string = '';
  sortByUsersActions: string = "company";
  sortOrderUsersActions: string = 'asc'; // or 'desc'
  currentPageUsersActions: number = 1;
  rowsPerPageUsersActions: number = 3;
  totalPagesUsersActions: number = 0;
  paginatedUsersActions: User[] = [];

  userList2: User[] = [];
  baseNames: { idBase: number, baseName: string }[] = [];
  activeUsersCount: number = 0;
  userLoginCounts: { user_id: number, logincount: number }[]=[];
  managerCount: number = 0;
  totalUsers: number;
  nbDBs: number;

  pieChartLabels = ['Manager', 'Employee', 'Admin'];
  pieChartData: number[] = [];
  pieChartType = 'pie';

  id: number | null = null;
  company: string | null = null;

  paginatedUsers: User[] = [];
  currentPageUsers: number = 1;
  rowsPerPageUsers: number = 4;
  totalPagesUsers: number = 0;

constructor(private http: HttpClient,private toastr: ToastrService, private location: Location,private authService: AuthService,private titleService: Title) { 
 
}
  
ngOnInit(): void {
  this.company = this.authService.getUserData().company;
  this.titleService.setTitle('ZaiDash Plus Admin');
      this.fetchUserUsersActions();
      this.fetchUsers();
      this.fetchBaseNames();
      this.fetchActiveUsersCount();
      this.fetchLoginCounts();
      this.fetchTotalUsers() ;
      this.fetchTotalDBs();
      this.fetchManagersCounts();
      this.initPieChart();
     
}



fetchUserUsersActions(): void {
  const params = new HttpParams()
    .set('search', this.searchQueryUsersActions)
    .set('sortBy', this.sortByUsersActions)
    .set('sortOrder', this.sortOrderUsersActions)
    .set('page', this.currentPageUsersActions.toString())
    .set('rowsPerPage', this.rowsPerPageUsersActions.toString());

  this.http.get<any>('http://localhost:3000/api/users', { params }).subscribe(
    (response) => {
      console.log('Data from backend:', response);

      // Assuming response structure gives you query1_results, query2_results, etc.
      const query1Results = response.query1_results;
      const query2Results = response.query2_results;
      const query3Results = response.query3_results;
      const query4Results = response.query4_results;

      // Combine all results into a single array
      let allResults = [...query1Results, ...query2Results, ...query3Results, ...query4Results];

      // Optionally filter out entries where last_reset_password_action and last_reset_password_timestamp are both null
      // allResults = allResults.filter(user => !(user.last_reset_password_action === null && user.last_reset_password_timestamp === null));

      // Update userList1 with the combined results
      this.userList1 = allResults;

      // Update total pages based on rowsPerPageUsersActions
      this.totalPagesUsersActions = Math.ceil(this.userList1.length / this.rowsPerPageUsersActions);

      // Update paginatedUsersActions based on currentPageUsersActions
      this.updatePaginatedUsers();
    },
    (error) => {
      console.error('Error fetching user data:', error);
    }
  );
}

updatePaginatedUsers(): void {
  const startIndex = (this.currentPageUsersActions - 1) * this.rowsPerPageUsersActions;
  this.paginatedUsersActions = this.userList1.slice(startIndex, startIndex + this.rowsPerPageUsersActions);
}

onPageChangeUsersActions(page: number): void {
  if (page >= 1 && page <= this.totalPagesUsersActions) {
    this.currentPageUsersActions = page;
    this.fetchUserUsersActions();
  }
}


onSortChangeUsersActions(sortByUsersActions: string): void {
    this.sortByUsersActions = sortByUsersActions;
    this.sortOrderUsersActions = this.sortOrderUsersActions === 'ASC' ? 'DESC' : 'ASC';
  this.fetchUserUsersActions();
}

onSearchChangeUsersActions(event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  this.searchQueryUsersActions = inputElement.value;
  this.fetchUserUsersActions();
}


fetchUsers(): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString());

  let params = new HttpParams()
    .set('search', this.searchQuery)
    .set('sortBy', this.sortBy)
    .set('sortOrder', this.sortOrder)
    .set('page', this.currentPageUsers.toString())
    .set('rowsPerPage', this.rowsPerPageUsers.toString());

  //console.log('Fetching users with parameters:', params.toString());

  this.http.get<any>('http://localhost:3000/api/users2', { params, headers }).subscribe(
    (response: any) => {
      //console.log("users table 2",response)
      this.userList2 = response.users;
      this.totalPagesUsers = Math.ceil(response.total / this.rowsPerPageUsers);
      this.paginatedUsers= this.userList2; // Directly assign the fetched orders
    },
    (error) => {
      console.error('Error fetching user data:', error);
    }
  );
}

onPageChange(page: number): void {
  if (page >= 1 && page <= this.totalPagesUsers) {
    this.currentPageUsers = page;
    this.fetchUsers();
  }
}

onSearchChange(event: any): void {
  this.searchQuery = event.target.value;
  this.currentPageUsers = 1; // Reset to first page on search
  this.fetchUsers();
}

onSortChange(sortBy: string): void {
  this.sortBy = sortBy;
  this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  this.fetchUsers();
}

fetchBaseNames(): void {
      this.http.get<any[]>(`http://localhost:3000/basenameOptions`)
        .pipe(
          catchError(error => {
            console.error('Error fetching base names:', error);
            return throwError(error);
          })
        )
        .subscribe(
          (response) => {
            this.baseNames = response;
          }
        );
}  
deleteAction(user: User): void {
  console.log('Deleting user:', user);
  const loggedInUserId = this.authService.getUserData()?.id; // Retrieve user ID from AuthService

  if (!loggedInUserId) {
    console.error('Logged-in User ID is not available.');
    return;
  }

  if (!user.id) {
    console.error('User ID is undefined:', user);
    return;
  }

  // Include the user ID from AuthService in the request headers
  const headers = new HttpHeaders({ 'logged-in-user-id': loggedInUserId.toString() });
  this.http.delete(`http://localhost:3000/api/actions/${user.id}`, { headers }).subscribe(() => {
    this.userList1 = this.userList1.filter(u => u !== user);
    console.log('User deleted successfully:', user);
    this.toastr.success('You have deleted a user!', 'User deleted successfully!').onHidden.subscribe(() => {
      window.location.reload(); // Refresh the page after the toast is hidden
    });
  }, error => {
    console.error('Error deleting user:', error);
    this.toastr.error('Something went wrong. Please try again later.', 'Error deleting user!');
  });
}

deleteUser(user: User): void {
  console.log('Deleting user:', user);
  const loggedInUserId = this.authService.getUserData()?.id; // Retrieve user ID from AuthService

  if (!loggedInUserId) {
    console.error('Logged-in User ID is not available.');
    return;
  }

  if (!user.id) {
    console.error('User ID is undefined:', user);
    return;
  }

  // Include the user ID from AuthService in the request headers
  const headers = new HttpHeaders({ 'logged-in-user-id': loggedInUserId.toString() });
  this.http.delete(`http://localhost:3000/api/users/${user.id}`, { headers }).subscribe(() => {
    this.userList2 = this.userList2.filter(u => u !== user);
    console.log('User deleted successfully:', user);
    this.toastr.success('You have deleted a user!', 'User deleted successfully!').onHidden.subscribe(() => {
      window.location.reload(); // Refresh the page after the toast is hidden
    });
  }, error => {
    console.error('Error deleting user:', error);
    this.toastr.error('Something went wrong. Please try again later.', 'Error deleting user!');
  });
}

deleteDatabase(databaseId: number,baseName: string): void {
  console.log(baseName)
  this.http.delete(`http://localhost:3000/deleteDatabase`, {body: { databaseId, baseName }})
  .pipe(
      switchMap(() => this.http.get<any[]>(`http://localhost:3000/basenameOptions`)),
      catchError(error => {
        console.error('Error deleting database:', error);
        this.toastr.error('Something went wrong. Please try again later.', 'Error deleting database!');
        return throwError(error);
      })
    )
    .subscribe(
      (response) => {
        if (Array.isArray(response)) {
          this.baseNames = response;
          console.log(`Database with ID ${databaseId} deleted successfully`);
          // Optionally, update your UI or perform any additional actions after deletion
          this.toastr.success('You have deleted a database!', 'Database deleted successfully!');

        } else {
          console.error('Unexpected response format:', response);
          // Handle unexpected response format
        }
      }
    );
}
fetchActiveUsersCount() {
  // Fetch active users count from backend API
  this.http.get<{ activeUsersCount: number }>('http://localhost:3000/api/user/activecount')
    .subscribe((response: { activeUsersCount: number }) => {
      
      this.activeUsersCount = response.activeUsersCount;
      //console.log(this.activeUsersCount);
    });
}
formatDate(last_reset_password_timestamp: string): string {
  // Convert timestamp to a Date object
  const date = new Date(last_reset_password_timestamp);
  // Format the date as "YYYY-MM-DD"
  return `${date.getFullYear()}-${this.padZero(date.getMonth() + 1)}-${this.padZero(date.getDate())}`;
}
formatTime(last_reset_password_timestamp: string): string {
  // Convert timestamp to a Date object
  const date = new Date(last_reset_password_timestamp);
  // Format the time as "HH:MM:SS AM/PM"
  const hours = date.getHours() % 12 || 12;
  const minutes = this.padZero(date.getMinutes());
  const seconds = this.padZero(date.getSeconds());
  const ampm = date.getHours() < 12 ? 'AM' : 'PM';
  return `${hours}:${minutes}:${seconds} ${ampm}`;
}
private padZero(num: number): string {
  return num < 10 ? '0' + num : num.toString();
}

card = [
  {
    title: 'Active Users Count :',
  },
  {
    title: 'Nb of Users:',
  },
  {
    title: 'Nb of Databases:',
  },
  {
    title: 'Nb of managers:',
  }
];

fetchLoginCounts(): void {
  this.http.get<{ loginCounts: { user_id: number, logincount: number }[] }>('http://localhost:3000/api/user/login/count')
    .subscribe(
      (response) => {
        this.userLoginCounts = response.loginCounts;
        //console.log('Data received for login counts:', this.userLoginCounts);
      },
      (error) => { 
        console.error('Error fetching user login counts:', error);
      }
    );
}
getUserLoginCount(userId: number): number {
  const userLogin = this.userLoginCounts.find(login => login.user_id === userId);
  return userLogin ? userLogin.logincount : 0; // Return login count if found, otherwise return 0
}
fetchTotalUsers(): void {
  this.http.get<{ nbUsers: number }>('http://localhost:3000/api/Totalusers/count')
    .subscribe(
      (response) => {
        this.totalUsers = response.nbUsers;
        //console.log('Total number of users:', this.totalUsers);
      },
      (error) => {
        console.error('Error fetching total number of users:', error);
        // Handle error
      }
    );
}
fetchTotalDBs(): void {
  this.http.get<{ nbdb: number }>('http://localhost:3000/api/Totaldbs/count')
    .subscribe(
      (response) => {
        this.nbDBs = response.nbdb;
        //console.log('Total number of db:', this.nbDBs);
      },
      (error) => {
        console.error('Error fetching total number of db:', error);
        // Handle error
      }
    );
}
fetchManagersCounts(): void {
  this.http.get<any>('http://localhost:3000/api/manager/count').subscribe(
    (response) => {
      this.managerCount = response.managerCount;
      //console.log("managerCount",this.managerCount)
    },
   
    (error) => {
      console.error('Error fetching manager count:', error);
    }
  );
}
initPieChart(): void {
  this.fetchUserCounts();
}
fetchUserCounts(): void {
  this.http.get<{ managercount: number, employeecount: number, admincount: number }>('http://localhost:3000/api/user/count')
    .subscribe(
      (response) => {
        this.updatePieChart([response.managercount, response.employeecount, response.admincount]);
       // console.log('User countssssss:', this.pieChartData);
      },
      (error) => {
        console.error('Error fetching user counts:', error);
        // Handle error
      }
    );
}
updatePieChart(data: number[]): void {
  const pieChart = new Chart('pieChart', {
    type: 'pie',
    data: {
      labels: ['Manager', 'Employee', 'Admin'],
      datasets: [{
        label: 'User Types Distribution',
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)', // Red
          'rgba(54, 162, 235, 0.7)', // Blue
          'rgba(255, 206, 86, 0.7)' // Yellow
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'User Types Distribution',
          font: {
            size: 16
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 14,
              style: 'italic', // Apply italic style
              weight: 'bold'   // Apply bold weight
            }
          }
        }
      }
    }
  });
}

fetchUserPasswords(): void {
  this.http.get<User[]>('http://localhost:3000/api/userPasswords')
      .subscribe(
          (response) => {
              this.userList1 = response;
              console.log('Users with passwords:', this.userList1);
          },
          (error) => {
              console.error('Error fetching user passwords:', error);
          }
      );
}
// Function to calculate progress bar width based on password strength
calculateProgressBarWidth(password_strength: string): number {
  switch (password_strength) {
      case 'Normal':
          return 25; // Set the width to 25% for weak passwords
      case 'Medium':
          return 50; // Set the width to 50% for medium passwords
      case 'Strong':
          return 100; // Set the width to 100% for strong passwords
      default:
          return 0; // Set default width to 0% for unknown strength
  }
}
}