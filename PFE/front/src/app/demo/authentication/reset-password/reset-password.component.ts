import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Add this import
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export default class ResetPasswordComponent implements OnInit {
  password: string;
  confirmPassword: string;
  formReset : FormGroup;
  passwordErrorMessage: string = '';
  emailErrorMessage: string = '';
  hidePassword: boolean = true; // Add a boolean variable to track the password visibility
  hidePassword2: boolean = true; // Add a boolean variable to track the password visibility
  showError: boolean = false;
  email: string = '';
  tokenExpiredError: boolean = false;
  
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword; // Toggle the boolean value
  }
  togglePasswordVisibility2(): void {
    this.hidePassword2 = !this.hidePassword2; // Toggle the boolean value
  }
  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || ''; // Get the email from the query parameters
      console.log(this.email);
  
      this.formReset = this.formBuilder.group({
        email: [this.email, [Validators.required, Validators.email]], // Set the default value for email
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required]
      });
    });
  }
  
  
  resetPassword(): void {
    // Trigger validation
    Object.values(this.formReset.controls).forEach(control => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });
  
    // Check if the form is valid
    if (this.formReset.valid && this.passwordsMatch()) {
      // Proceed with password reset
      const newPassword = this.formReset.get('password').value;
      const email = this.formReset.get('email').value; // Get the email from the form
  
      // Example: Send a request to the backend to reset the password
      this.http.post('http://localhost:3000/reset-password', { newPassword, email }).subscribe(
        (response: any) => {
          // Handle success response
          console.log('Password reset successful:', response);
          this.toastr.success('Success!', 'Password reset successful!');

          this.router.navigate(['/login']); // Navigate to login page after password reset
        },
        (error: any) => {
          // Handle error response
          console.error('Error resetting password:', error);
          // Display error message to the user
          if (error.status === 404) {
            // Email address not found - display error message in red
            this.showError = true;
          } else if (error.status === 401 && error.error && error.error.message === 'Token expired') {
            // Token expired - display error message to the user
            this.tokenExpiredError = true;
            // Optionally, you can provide a way for the user to request a new password reset link
          }
        }
      );
    } else {
      // Display error messages for invalid form controls
      this.emailErrorMessage = this.getEmailErrorMessage();
      this.passwordErrorMessage = this.getPasswordErrorMessage();
    }
  }
  holdTimer: any;
  holdDuration: number = 1000; 
  
  startHoldTimer() {
      this.holdTimer = setTimeout(() => {
          this.togglePasswordVisibility();
          this.stopHoldTimer();
      }, this.holdDuration);
  }
  stopHoldTimer() {
    clearTimeout(this.holdTimer);
}
/*
  resetPassword(): void {
    // Trigger validation
    Object.values(this.formReset.controls).forEach(control => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });

    // Check if the form is valid
    if (this.formReset.valid && this.passwordsMatch()) {
      // Proceed with password reset
      const newPassword = this.formReset.get('password').value;
      const email = this.formReset.get('email').value; // Get the email from the form

      // Example: Send a request to the backend to reset the password
        this.http.post('http://localhost:3000/reset-password', { newPassword, email }).subscribe(

        (response: any) => {
          // Handle success response
          console.log('Password reset successful:', response);
          this.router.navigate(['/login']); // Navigate to login page after password reset
        },
        (error: any) => {
          // Handle error response
          console.error('Error resetting password:', error);
          // Display error message to the user
          if (error.status === 404) {
            // Email address not found - display error message in red
            this.showError = true;

          }
        }
      );
    } else {
      // Display error messages for invalid form controls
      this.emailErrorMessage = this.getEmailErrorMessage();
      this.passwordErrorMessage = this.getPasswordErrorMessage();
    }
  }*/


  getPasswordErrorMessage(): string {
    const passwordControl = this.formReset.get('password');
    if (passwordControl && passwordControl.touched && passwordControl.errors) {
      if (passwordControl.errors['required']) {
        return 'Password is required!';
      }
    }
    return '';
  }

getEmailErrorMessage(): string {
  const emailControl = this.formReset.get('email');
  if (emailControl && emailControl.touched && emailControl.errors) {
    if (emailControl.errors['required']) {
      return 'Email is required!';
    } else if (emailControl.errors['email']) {
      return 'Please enter a valid email address!';
    }
  }
  return '';
}

passwordsMatch(): boolean {
  const password = this.formReset.get('password').value;
  const confirmPassword = this.formReset.get('confirmPassword').value;
  return password === confirmPassword;
}



}