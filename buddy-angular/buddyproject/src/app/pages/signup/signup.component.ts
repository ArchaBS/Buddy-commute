import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  
  isLoading = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  isPasswordValid(): boolean {
    const p = this.password;
    const hasMinLength = p.length >= 8;
    const hasUpperCase = /[A-Z]/.test(p);
    const hasLowerCase = /[a-z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSpecial = /[!@#$%^&*]/.test(p);
    
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial;
  }

  doPasswordsMatch(): boolean {
    return this.password === this.confirmPassword && this.confirmPassword !== '';
  }

  onSignup(): void {
    console.log('🔵 Signup started');
    
    // Validation
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      alert('Please fill in all fields');
      return;
    }
    
    if (!this.isPasswordValid()) {
      alert('Password must be at least 8 characters with uppercase, lowercase, number & special character');
      return;
    }

    if (!this.doPasswordsMatch()) {
      alert('Passwords do not match!');
      return;
    }

    this.isLoading = true;

    const userData = {
      username: this.username,
      email: this.email,
      password: this.password
    };

    console.log('📤 Sending signup data:', userData);

    this.authService.registerUser(userData).subscribe({
      next: (response) => {
        console.log('✅ Signup SUCCESS:', response);
        
        if (response.user) {
          this.authService.saveUserSession(response.user);
          console.log('💾 User session saved');
        }
        
        console.log('🔄 Navigating to home...');
        this.router.navigate(['/home']);
        this.isLoading = false;
      },
      error: (error) => {
        console.log('❌ Signup ERROR:', error);
        this.isLoading = false;
        
        if (error.status === 400) {
          alert(error.error?.message || 'Signup failed. Please check your information.');
        } else if (error.status === 0) {
          alert('❌ Cannot connect to server. Is Django running?');
        } else {
          alert('Signup failed. Please try again.');
        }
      }
    });
  }
}