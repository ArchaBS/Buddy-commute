import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.css']
})
export class LogoComponent implements OnInit {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Show logo for 2 seconds, then check if user is logged in
    setTimeout(() => {
      if (this.authService.isLoggedIn()) {
        // User is already logged in → Go to Home
        console.log('✅ User already logged in, going to home');
        this.router.navigate(['/home']);
      } else {
        // User not logged in → Go to Login
        console.log('❌ User not logged in, going to login');
        this.router.navigate(['/login']);
      }
    }, 2000); // Wait 2 seconds (2000 milliseconds)
  }
}