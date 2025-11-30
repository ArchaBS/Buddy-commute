import { Component, OnInit, OnDestroy } from '@angular/core';  // ✅ Add OnDestroy here
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';  // ✅ ADD THIS
import { interval } from 'rxjs';  // ✅ ADD THIS for Step 4

@Component({
  selector: 'app-home',
  templateUrl: './homes.component.html',
  styleUrls: ['./homes.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {  // ✅ Add OnDestroy
  
  unreadCount: number = 0;
  private notificationInterval: any;  // ✅ ADD THIS for Step 4
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService  // ✅ ADD THIS
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/signup']);
      return;
    }

    // Load initial notification count
    this.loadNotificationCount();
    
    // ✅ STEP 4: Auto-refresh every 30 seconds
    this.notificationInterval = interval(30000).subscribe(() => {
      this.loadNotificationCount();
    });
  }

  // ✅ STEP 4: Clean up when component is destroyed
  ngOnDestroy(): void {
    if (this.notificationInterval) {
      this.notificationInterval.unsubscribe();
    }
  }

  // ✅ STEP 1: Load real notification count from API
  loadNotificationCount(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.notificationService.getUserNotifications(currentUser.id).subscribe({
        next: (response) => {
          this.unreadCount = response.unread_count;
          console.log('📬 Unread notifications:', this.unreadCount);
        },
        error: (error) => {
          console.error('❌ Error loading notification count:', error);
          this.unreadCount = 0;
        }
      });
    }
  }

  getUsername(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.username : 'User';
  }

  // ✅ STEP 2: Reset count when clicking bell
  goToNotifications(): void {
    // Reset the badge count immediately
    this.unreadCount = 0;
    
    // Navigate to notifications page
    this.router.navigate(['/notifications']);
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/signup']);
    }
  }
}