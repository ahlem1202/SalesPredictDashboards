import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth.service'; // Import AuthService for managing authentication
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule
    
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export default class LoginComponent implements OnInit {
  form: FormGroup;
  hidePassword: boolean = true;
  emailErrorMessage: string = '';
  passwordErrorMessage: string = '';
  
  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService ,
    private toastr: ToastrService 
    ,private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('ZaiDash Plus');
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
  
  submit(): void {
    // Trigger validation
    Object.values(this.form.controls).forEach(control => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });
  
    // Check if the form is valid
    if (this.form.valid) {
      // Proceed with login
      this.http.post('http://localhost:3000/login', this.form.getRawValue(), { withCredentials: true })
        .subscribe(
          (response: any) => {
            const token = response.token;
            const { firstName, lastName, Type, company, localisation, baseName, id } = response.userData;
            this.authService.setUserData(id, firstName, lastName, Type, baseName, company, localisation); 
            this.authService.setToken(true);
            
            
              // Directly navigate for admin
              this.navigateByRole(Type);
            
          },
          (error: any) => {
            console.error('Login error:', error);
            this.toastr.error('Login error!', 'ERROR!');
          }
        );
    } else {
      // Display error messages
      this.emailErrorMessage = this.getEmailErrorMessage();
      this.passwordErrorMessage = this.getPasswordErrorMessage();
    }
  }

  navigateByRole(Type: string): void {
    switch (Type) {
      case 'admin':
        this.router.navigate(['/dashboard-admin']);
        break;
      case 'manager':
        this.router.navigate(['/dashboard-manager']);
        break;
      case 'employee':
        this.router.navigate(['/dashboard-employee']);
        break;
      default:
        console.error('Unknown role:', Type);
        break;
    }
  }
  
  getEmailErrorMessage(): string {
    const emailControl = this.form.get('email');
    if (emailControl && emailControl.touched && emailControl.errors) {
      if (emailControl.errors['required']) {
        return 'Email is required!';
      } else if (emailControl.errors['email']) {
        return 'Please enter a valid email address!';
      }
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.form.get('password');
    if (passwordControl && passwordControl.touched && passwordControl.errors) {
      if (passwordControl.errors['required']) {
        return 'Password is required!';
      }
    }
    return '';
  }

  navigateToForgetPassword(): void {
   // const emailEntered = this.form.get('email').value; // Get the email entered from the login form
    this.router.navigate(['/forget-password']/*, { queryParams: { email: emailEntered } }*/);
  } 
}