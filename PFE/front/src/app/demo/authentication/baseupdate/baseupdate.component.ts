import { Component,ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule,NgForm} from '@angular/forms'; // Importez FormsModule et NgModel
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../auth.service';
import { Title } from '@angular/platform-browser';


@Component({
  selector: 'app-baseupdate',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './baseupdate.component.html',
  styleUrl: './baseupdate.component.scss'
})
export class BaseupdateComponent {
  databases: string[] = [];
  selectedDatabase: string = ''; // Variable to store the selected database name
  userId: number | null = null;
  @ViewChild('updateForm', { static: false }) updateForm: NgForm; // Reference to the form


  constructor(private http: HttpClient, private toastr: ToastrService, private authService: AuthService,  private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('Upload Database| ZaiDash Plus');
    const userData = this.authService.getUserData();
    if (userData) {
      this.userId = userData.id;
    }

    const roles = this.authService.getUserData();
    const storedDatabaseName = roles.baseName;
    //const storedDatabaseName = localStorage.getItem('baseName');
    if (storedDatabaseName) {
      this.selectedDatabase = storedDatabaseName;
    } else {
      this.toastr.error('Failed to retrieve database name from local storage.', 'Error');
    }
  }

  updateDatabase() {
  // Check if userId is available
  if (!this.userId) {
    console.error('User ID not available');
    return;
  }else{
  }
  const formData = new FormData();
  const fileInputs = document.querySelectorAll('input[type="file"]');

  fileInputs.forEach((input: HTMLInputElement) => {
    if (input.files.length > 0) {
      formData.append(input.name, input.files[0]);
    }
  });

  formData.append('databaseName', this.selectedDatabase);
  formData.append('userId', this.userId.toString()); // Convert userId to string before appending

  this.http.post<any>('http://localhost:3000/insert-data', formData).subscribe(
    (res) => {
      console.log('Response:', res);
      // Handle response
      this.toastr.success('Database updated successfully.', 'Success');
      ///this.resetFormExcludingFields(['databaseName']);
      // Clear file input fields
      fileInputs.forEach((input: HTMLInputElement) => {
        input.value = null;
      });
    },
    (err) => {
      console.log('Error:', err);
      // Handle error
      this.toastr.error('Failed to update database. Please try again later.', 'Error');
    }
  );
  }
}

