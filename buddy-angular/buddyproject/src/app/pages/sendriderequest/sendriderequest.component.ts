import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sendriderequest',
  templateUrl: './sendriderequest.component.html',
  styleUrls: ['./sendriderequest.component.css']
})
export class SendriderequestComponent {
  groupId: string = '';
  groupName: string = '';
  memberCount: number = 0;
  
  pickupLocation: string = '';
  destination: string = '';
  preferredTime: string = '';
  notes: string = '';
  
  isSending: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get group ID from URL
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    
    // Get group name and member count from route params (passed from groups page)
    this.route.queryParams.subscribe(params => {
      this.groupName = params['groupName'] || 'Group';
      this.memberCount = params['memberCount'] || 0;
    });
    
    console.log('📋 Send request page loaded for group:', this.groupId);
  }

  onSendRequest(): void {
    console.log('📤 Sending ride request');
    
    // Validation
    if (!this.pickupLocation || !this.destination) {
      alert('Please enter both pickup location and destination');
      return;
    }

    // Get current user
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      alert('Please login first');
      this.router.navigate(['/login']);
      return;
    }

    this.isSending = true;

    const requestData = {
      requester_id: currentUser.id,
      group_id: parseInt(this.groupId),
      pickup_location: this.pickupLocation,
      destination: this.destination,
      preferred_time: this.preferredTime || null,
      notes: this.notes || null
    };

    console.log('Sending data:', requestData);

    this.groupService.sendRideRequest(requestData).subscribe({
      next: (response) => {
        console.log('✅ Ride request sent:', response);
        
        alert(`Ride request sent successfully! ${response.notifications_sent} members notified.`);
        
        // Go back to groups page
        this.router.navigate(['/group']);
        
        this.isSending = false;
      },
      error: (error) => {
        console.error('❌ Error sending request:', error);
        this.isSending = false;
        
        alert(error.error?.message || 'Failed to send ride request. Please try again.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/group']);  // ✅ Use this
  }

}
