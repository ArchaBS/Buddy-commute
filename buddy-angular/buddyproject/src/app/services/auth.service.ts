import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Register new user
  registerUser(userData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post(
      `${this.apiUrl}register/`,
      userData,
      { headers }
    ).pipe(
      tap((response: any) => {
        // Auto-save session after registration
        if (response.user) {
          this.saveUserSession(response.user);
        }
      })
    );
  }

  // Login user
  loginUser(loginData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post(
      `${this.apiUrl}login/`,
      loginData,
      { headers }
    ).pipe(
      tap((response: any) => {
        // Auto-save session after login
        if (response.user) {
          this.saveUserSession(response.user);
        }
      })
    );
  }

  // Save user session
  saveUserSession(user: any): void {
    console.log('💾 Saving user session:', user);
    
    // Make sure we have all required fields
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('✅ User session saved');
  }

  // Check if logged in
  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  // Get current user
  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      console.warn('⚠️ No user in localStorage');
      return null;
    }
    
    try {
      const user = JSON.parse(userStr);
      console.log('👤 Current user:', user);
      return user;
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      return null;
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem('user');
    console.log('👋 User logged out');
  }
}