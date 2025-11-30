import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  isLoading = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    console.log('🔵 Login started');
    
    // Validation
    if (!this.username || !this.password) {
      alert('Please enter both username and password');
      return;
    }
  
    this.isLoading = true;
  
    const loginData = {
      username: this.username,
      password: this.password
    };
  
    console.log('📤 Sending login data');
  
    this.authService.loginUser(loginData).subscribe({
      next: (response) => {
        console.log('✅ Login SUCCESS:', response);
        
        // Make sure user object has ID
        if (response.user && response.user.id) {
          console.log('💾 Saving user with ID:', response.user.id);
          this.authService.saveUserSession(response.user);
          
          // Verify it was saved
          const savedUser = this.authService.getCurrentUser();
          console.log('✓ Verified saved user:', savedUser);
          
          console.log('🔄 Navigating to home...');
          this.router.navigate(['/home']);
        } else {
          console.error('❌ Response missing user ID');
          alert('Login succeeded but user data is incomplete');
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.log('❌ Login ERROR:', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          alert('❌ Invalid username or password');
        } else if (error.status === 0) {
          alert('❌ Cannot connect to server. Is Django running?');
        } else {
          alert(error.error?.message || 'Login failed');
        }
      }
    });
  }
}