import { Injectable, Type } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
//import jwt_decode from 'jwt-decode';


// Define an interface to represent the token payload
interface TokenPayload {
  exp: number; // Expiration time (UNIX timestamp)
  // Add other properties from the token payload as needed
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userData: any; // Store user data
  private readonly tokenKey = 'authToken';
  private readonly sessionCheckInterval = 60000; // Check session every minute
  private readonly userDataKey = 'userData';

  constructor(private router: Router,private http: HttpClient) {}
 /* setUserData(userData: any): void {
    this.userData = userData; // Set user data
  }*/
/*setUserData( id:number, firstName:string, lastName:string, Type:string, baseName:string, company?:string, localisation?:string ): void {
    // Initialize userData object
    let userData: any;
  
    // Check if the user is not an admin
    if (Type == 'admin') {
      // If admin, only include id ,firstname , lastname and company
      userData = {id, firstName, lastName, Type, baseName ,company};
    } else {
      if (Type == 'manager') {
        // If not admin, include additional data 
        userData = { id, firstName, lastName, Type, baseName, company};
      } else {
        // If not admin, include additional data 
        userData = {id, firstName, lastName, Type, baseName, localisation, company}
      }
    }
  
    // Store userData in local storage after converting to JSON string
    localStorage.setItem(this.userDataKey, JSON.stringify(userData));
    //console.log('User data saved:', userData);
}
*/
setUserData(
  id: number,
  firstName: string,
  lastName: string,
  Type: string,
  baseName: string,
  company?: string,  // Ensure company is properly set
  localisation?: string
): void {
  let userData: any;

  if (Type === 'admin') {
    userData = { id, firstName, lastName, Type, baseName, company };
  } else if (Type === 'manager') {
    userData = { id, firstName, lastName, Type, baseName, company };
  } else {
    userData = { id, firstName, lastName, Type, baseName, company, localisation };
  }

  localStorage.setItem(this.userDataKey, JSON.stringify(userData));
}
/*
getUserData(): { id:number,firstName: string, lastName: string, Type: string, baseName:string , company?: string , localisation?: string} | null {
    const userDataString = localStorage.getItem(this.userDataKey);
    return userDataString ? JSON.parse(userDataString) : null;
}*/
getUserData(): {
  id: number,
  firstName: string,
  lastName: string,
  Type: string,
  baseName: string,
  company?: string,
  localisation?: string
} | null {
  const userDataString = localStorage.getItem(this.userDataKey);
  return userDataString ? JSON.parse(userDataString) : null;
}


getBaseName(): string | null {
  const userData = this.getUserData();
  return userData ? userData.baseName : null;
}

getCompany(): string | null {
  const userData = this.getUserData();
  return userData ? userData.company || null : null;
}

getLocalisation(): string | null {
  const userData = this.getUserData();
  return userData ? userData.localisation || null : null;
}

setToken(token: boolean): void {
  localStorage.setItem(this.tokenKey, token.toString());
}

getToken(): string | null {
  return localStorage.getItem(this.tokenKey);
}  

isLoggedIn(): boolean {
  return !!this.getToken();
}

logout(): void {
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem(this.userDataKey);

 
    this.http.post('http://localhost:3000/logout', { }).subscribe(
      response => {
        console.log('Connection closed', response);
        this.router.navigate(['/login']); // Redirect to login page
      },
      error => console.error('Error closing connection', error)
    );
}
/* logout(id: string): Observable<any> {
      // Send a request to log the user out on the server
      return this.http.post('http://localhost:3000/logout', { userId: id });
    }*/
// Add method to check token expiration 
isTokenExpired(): boolean {
      const token = this.getToken();
      return true; // If token is not available or invalid, consider it as expired
} 
}

