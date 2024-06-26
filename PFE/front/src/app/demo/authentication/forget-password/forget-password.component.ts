import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // Import HttpClient
import { Router } from '@angular/router'; // Import Router
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [ CommonModule,ReactiveFormsModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export default class ForgetPasswordComponent implements OnInit {
  hidePassword: boolean = true;
  forgetForm !: FormGroup;
 // fb = inject(FormBuilder);
  emailErrorMessage: string = '';
  showError: boolean = false;

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;

  }
  constructor(
    private fb: FormBuilder,
    private http: HttpClient ,// Inject HttpClient,
    private router: Router,// Inject Router
    private titleService: Title
  ) {}
  ngOnInit(): void {
    this.titleService.setTitle('ZaiDash Plus');
    this.forgetForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, Validators.email])]
    })
  }

  submit(): void {
    // Trigger validation
    Object.values(this.forgetForm.controls).forEach(control => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });
  
    // Check if the form is valid
    if (this.forgetForm.valid) {
      // Proceed with login
      this.http.post('http://localhost:3000/forget-password', this.forgetForm.getRawValue(), { withCredentials: true })
        .subscribe(
          (response: any) => {
            // Reset the error flag
            this.showError = false;
           // console.log('Verification email sent successfully'); // Add this line to log the function call
            window.alert(response.message);
            console.log('Verification email sent successfully:', response.message);
            // Optionally, navigate to a different page or show a success message
          },
          (error: any) => {
            console.error('Error sending password reset email:', error);
            // Handle error - display error message to the user or log it
            if (error.status === 404) {
              // Email address not found - display error message in red
              this.showError = true;
            }
          }
        );
    } else {
      // Display error messages
      this.emailErrorMessage = this.getEmailErrorMessage();
      //this.passwordErrorMessage = this.getPasswordErrorMessage();
    }
  }
  cancel(): void {
    this.router.navigateByUrl('/login'); // Navigate to /login route
  }
  
  clearDangerMessage() {
    this.showError = false; // Clear danger message
}
  getEmailErrorMessage(): string {
    const emailControl = this.forgetForm.get('email');
    if (emailControl && emailControl.touched && emailControl.errors) {
      if (emailControl.errors['required']) {
        return 'Email is required!';
      } else if (emailControl.errors['email']) {
        return 'Please enter a valid email address!';
      }
    }
    return '';
  }
  
}
  

