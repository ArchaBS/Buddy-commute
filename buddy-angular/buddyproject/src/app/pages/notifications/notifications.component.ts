import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  activeTab: string = 'notifications';
  
  notifications: any[] = [];
  rideRequests: any[] = [];
  
  unreadCount: number = 0;
  isLoading: boolean = false;
  isAccepting: boolean = false;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load notifications and ride requests
    this.loadNotifications();
    this.loadRideRequests();
  }

  loadNotifications(): void {
    const currentUser = this.authService.getCurrentUser();
    
    console.log('🔍 Current user:', currentUser);  // ← ADD THIS
    
    if (!currentUser) {
      console.log('❌ No user found, redirecting to login');  // ← ADD THIS
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;

    this.notificationService.getUserNotifications(currentUser.id).subscribe({
      next: (response) => {
        console.log('✅ Notifications loaded:', response);
        this.notifications = response.notifications;
        this.unreadCount = response.unread_count;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }

  loadRideRequests(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return;
    }

    this.isLoading = true;

    this.notificationService.getRideRequestsForUser(currentUser.id).subscribe({
      next: (response) => {
        console.log('✅ Ride requests loaded:', response);
        this.rideRequests = response.ride_requests;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading ride requests:', error);
        this.isLoading = false;
      }
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    
    if (tab === 'notifications' && this.notifications.length === 0) {
      this.loadNotifications();
    } else if (tab === 'requests' && this.rideRequests.length === 0) {
      this.loadRideRequests();
    }
  }

  markAsRead(notification: any): void {
    if (notification.is_read) {
      return; // Already read
    }

    this.notificationService.markNotificationRead(notification.id).subscribe({
      next: (response) => {
        console.log('✅ Notification marked as read');
        notification.is_read = true;
        this.unreadCount--;
      },
      error: (error) => {
        console.error('❌ Error marking notification as read:', error);
      }
    });
  }

  acceptRequest(request: any): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      alert('Please login first');
      return;
    }
  
    if (confirm(`Accept ride request from ${request.requester}?`)) {
      this.isAccepting = true;
  
      const data = {
        responder_id: currentUser.id
      };
  
      // ✅ CORRECT: Call acceptRideRequest, not getUserNotifications!
      this.notificationService.acceptRideRequest(request.id, data).subscribe({
        next: (response) => {
          console.log('✅ Request accepted:', response);
          
          // ✅ Navigate to tracking page
          this.router.navigate(['/ride-tracking', response.ride_request_id]);
          
          this.isAccepting = false;
        },
        error: (error) => {
          console.error('❌ Error accepting request:', error);
          alert(error.error?.message || 'Failed to accept request. Please try again.');
          this.isAccepting = false;
        }
      });
    }
  }
  declineRequest(request: any): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      alert('Please login first');
      return;
    }
  
    if (confirm(`Decline ride request from ${request.requester}?`)) {
      const data = {
        responder_id: currentUser.id
      };
  
      this.notificationService.declineRideRequest(request.id, data).subscribe({
        next: (response) => {
          console.log('✅ Request declined:', response);
          alert(`You declined ${request.requester}'s ride request. They have been notified.`);
          
          // Mark as responded
          request.already_responded = true;
          
          // Reload notifications to show the decline notification
          this.loadNotifications();
        },
        error: (error) => {
          console.error('❌ Error declining request:', error);
          alert('Failed to decline request. Please try again.');
        }
      });
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
  viewRide(rideId: number | null, event: Event): void {
    if (!rideId) return;
    
    // Prevent the click from bubbling up to mark as read
    event.stopPropagation();
    
    console.log('🚗 Navigating to ride tracking:', rideId);
    
    // Navigate to tracking page
    this.router.navigate(['/ride-tracking', rideId]);
  }
  getRideIdFromMessage(message: string): number | null {
    const match = message.match(/\|RIDE:(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
  
}


