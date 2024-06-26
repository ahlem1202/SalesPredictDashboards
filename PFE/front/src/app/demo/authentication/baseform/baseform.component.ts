// angular import
import { Component, ViewChild,OnInit  } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';


@Component({
  selector: 'app-baseform',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './baseform.component.html',
  styleUrl: './baseform.component.scss'
})
export class BaseformComponent implements OnInit {
  constructor(private http: HttpClient,private toastr: ToastrService,  private titleService: Title
  ) { }
  ngOnInit(): void {
    this.titleService.setTitle('Create Database | ZaiDash Plus');
    
  }
  baseName: string;
  @ViewChild('databaseForm', { static: false }) databaseForm: NgForm; // Reference to the form


 

  createDatabase() {
    const dbName = { baseName: this.baseName }; // Sending dbName as an object
    console.log(dbName);

    // Envoi des données au backend
    this.http.post<any>('http://localhost:3000/create-database', dbName).subscribe(
      response => {
        console.log('Database created successfully:', response);
        this.toastr.success('You have created a database!', 'Database created successfully!');

        // Reset form after successful submission
        this.databaseForm.resetForm();
      },
      error => {
        console.error('Error creating database:', error);
        this.toastr.error('Something went wrong. Please try again later.', 'Error creating database!');

        // Gérer les erreurs
      }
    );
  }
}

