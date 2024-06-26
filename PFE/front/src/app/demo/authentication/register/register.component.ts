// angular import
import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule,FormBuilder,FormGroup,Validators } from '@angular/forms';
import { HttpClient} from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Title } from '@angular/platform-browser';


interface BasenameOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export default class RegisterComponent implements OnInit{
  @ViewChild('registerForm', { static: false }) registerFormDirective: NgForm;
  registerForm: FormGroup;
  firstName: string;
  lastName: string;
  company: string;
  emailAddress: string;
  password: string;
  Type: string = 'admin';
  localisation: string;
  baseName: string; // Declare selectedCountry property
  basenameOptions: BasenameOption[] = [];

 showError: boolean = false;
  hidePassword: boolean = true; // Add a boolean variable to track the password visibility
  hidePassword2: boolean = true; // Add a boolean variable to track the password visibility

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword; // Toggle the boolean value
  }
  togglePasswordVisibility2(): void {
    this.hidePassword2 = !this.hidePassword2; // Toggle the boolean value
  }


  constructor( private formBuilder: FormBuilder,private http: HttpClient,private toastr: ToastrService,private cdr: ChangeDetectorRef,  private titleService: Title) {}
  
  
  ngOnInit(): void {
    this.titleService.setTitle('Create Account | ZaiDash Plus');

    this.fetchBasenameOptions();
   //this.fetchBaseNames();
    this.registerForm = this.formBuilder.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        emailAddress: ['', [Validators.required, Validators.email]],/*, this.validateEmailExists.bind(this)],*/ // Add the async validator here
        //password: ['', Validators.required, Validators.minLength(8), Validators.maxLength(15)],
        password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(15)]], // Validators array should be within square brackets
        company: [''], 
        localisation: [''],
        baseName: [''],
        Type: ['admin']
      });
      
    }

    

    createAccount(): void {
      const userData = {
        Type: this.Type,
        firstName: this.firstName,
        lastName: this.lastName,
        company: this.company,
        emailAddress: this.emailAddress,
        password: this.password,
        localisation: this.localisation,
        baseName: this.baseName
        
      };
      console.log('Submit button clicked');
      // Trigger validation
      Object.values(this.registerForm.controls).forEach(control => {
          control.markAsTouched();
          control.updateValueAndValidity();
      });
      
      console.log('Form validity:', this.registerForm.valid);
      const url = 'http://localhost:3000/register';
    
      this.http.post(url, userData)
        .subscribe(response => {
          console.log('Account created successfully!', response);
          this.toastr.success('You have created an account!', 'User registered successfully!');
         //this.registerForm.reset();
        }, error => {
          if (error.status === 400 && error.error && error.error.error === 'Email already exists') {        
            this.showError = true;
          } else {
            console.error('Failed to create account:', error);
            this.toastr.error('Something went wrong. Please try again later.', 'Error registering user!');
            this.showError = false;
          }
        });
    }
    
  
  logrole():void{
    console.log('current Role',this.Type)  
  }
  onRoleChange(event: any): void {
    this.Type = event.target.value;
    console.log('Selected Role:', this.Type);
  }

  resetForm(): void {
    this.registerForm.reset();
    this.registerFormDirective.resetForm(); 
    // Additionally, you may want to reset any other form-related variables
    this.firstName = '';
    this.lastName = '';
    this.emailAddress = '';
    this.password = '';
    this.company = '';
    this.localisation = '';
    this.baseName = '';
    this.Type = 'admin'; // Reset to default role
  }
  fetchBasenameOptions(): void {
    const url = 'http://localhost:3000/basenameOptions';
    this.http.get<any[]>(url).subscribe(
      (data: any[]) => {
        // Extract basename values and remove duplicates using a Set
        const uniqueBasenames = Array.from(new Set(data.map(item => item.baseName)));
        console.log(uniqueBasenames);
        console.log(data);
        // Create BasenameOption objects from the unique basename values
        this.basenameOptions = uniqueBasenames.map(baseName => ({ value: baseName, label: baseName }));
      },
      error => {
        console.error('Error fetching basename options:', error);
        this.toastr.error('Failed to fetch basename options. Please try again later.', 'Error');
      }
    );
  }/*
  fetchBaseNames(): void {
    this.http.get<{ baseNames: string[] }>('http://localhost:3000/api/baseNames').subscribe(data => {
      this.basenameOptions = data.baseNames.map(baseName => ({ label: baseName, value: baseName }));
    }, error => {
      console.error('Error fetching baseNames:', error);
      // Handle error
    });
  }*/
}