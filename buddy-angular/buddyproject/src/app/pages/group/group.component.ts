import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit {
  pickup: string = '';
  destination: string = '';
  isLoading: boolean = true;  // Changed to true
  successMessage: string = '';
  errorMessage: string = '';
  
  friendGroups: any[] = [];  // Start empty, will load from backend
  expandedGroupId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private groupService: GroupService,
    private authService: AuthService
  ) {}

  
  ngOnInit() {
    console.log('ngOnInit called');
    
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      this.pickup = params['pickup'] || '';
      this.destination = params['destination'] || '';
      console.log('Pickup:', this.pickup);
      console.log('Destination:', this.destination);
    });
    
    // Load real groups from backend
    this.loadGroups();
    this.autoJoinGroups();
  }
  

  autoJoinGroups(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return;
    }
    
    // Wait for groups to load first
    setTimeout(() => {
      this.friendGroups.forEach(group => {
        const data = {
          user_id: currentUser.id
        };
        
        this.groupService.addMemberToGroup({
          group_id: group.id,
          user_id: currentUser.id
        }).subscribe({
          next: (response) => {
            console.log(`✅ Joined ${group.groupName}`);
          },
          error: (error) => {
            // Ignore errors (probably already a member)
          }
        });
      });
    }, 1000);
  }
  loadGroups(): void {
    this.isLoading = true;
    
    // Add ?reset=true to force recreate groups with test users
    // Remove this after first successful load
    const resetParam = localStorage.getItem('groups_initialized') ? '' : '?reset=true';
    
    this.groupService.getAllGroups().subscribe({
      next: (response) => {
        console.log('✅ Groups loaded from backend:', response);
        
        // Mark as initialized
        if (resetParam) {
          localStorage.setItem('groups_initialized', 'true');
        }
        
        // Map backend data to frontend format
        this.friendGroups = response.map((group: any) => ({
          id: group.id,
          groupName: group.groupname,
          description: group.description,
          memberCount: group.member_count || 0,
          members: group.member_usernames || [],
          activeRides: 0,
          icon: this.getGroupIcon(group.groupname)
        }));
        
        console.log('Formatted groups:', this.friendGroups);
        
        // Auto-add current user to all groups
        this.autoJoinCurrentUser();
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading groups:', error);
        this.errorMessage = 'Failed to load groups';
        this.isLoading = false;
      }
    });
  }
  
  autoJoinCurrentUser(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      console.warn('⚠️ No current user, skipping auto-join');
      return;
    }
    
    if (!currentUser.id) {
      console.error('❌ Current user missing ID:', currentUser);
      alert('User data is incomplete. Please login again.');
      return;
    }
    
    console.log(`➕ Adding user ${currentUser.username} (ID: ${currentUser.id}) to all groups...`);
    
    // Add current user to all groups
    this.friendGroups.forEach((group, index) => {
      setTimeout(() => {
        const data = {
          group_id: group.id,
          user_id: currentUser.id
        };
        
        console.log(`Joining group ${group.groupName}:`, data);
        
        this.groupService.addMemberToGroup(data).subscribe({
          next: (response) => {
            console.log(`✅ Joined ${group.groupName}:`, response);
          },
          error: (error) => {
            console.error(`❌ Failed to join ${group.groupName}:`, error);
            console.error('Error details:', error.error);
          }
        });
      }, index * 500); // Stagger requests by 500ms
    });
  }
  getGroupIcon(groupName: string): string {
    // Assign icons based on group name
    const icons: any = {
      'Office Group': '💼',
      'College Group': '🎓',
      'Homies': '💪',
      'Neighborhood Group': '🏘️',
      'Weekend Warriors': '🎉'
    };
    return icons[groupName] || '👥';  // Default icon
  }

  sendRequest(group: any) {
    console.log('Send request clicked for:', group);
    this.successMessage = `Ride request sent to ${group.groupName}!`;
    
    setTimeout(() => {
      this.successMessage = '';
      this.router.navigate(['/home']);
    }, 2000);
  }

  viewGroupDetails(group: any) {
    console.log('View details for:', group.groupName);
    console.log('Navigating to groupview with ID:', group.id);
    this.router.navigate(['/groupview', group.id]);
  }

  goBack() {
    this.router.navigate(['/riderequest']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  onSendRequest(group: any): void {
    console.log('🔵 Send Request clicked for group:', group);
    
    this.router.navigate(['/sendriderequest', group.id], {
      queryParams: {
        groupName: group.groupName,
        memberCount: group.memberCount
      }
    });
  }
  toggleMembers(groupId: number): void {
    if (this.expandedGroupId === groupId) {
      this.expandedGroupId = null; // Collapse if already expanded
    } else {
      this.expandedGroupId = groupId; // Expand this group
    }
  }

  getVisibleMembers(group: any): string[] {
    if (this.expandedGroupId === group.id) {
      return group.members; // Show all members
    }
    return group.members.slice(0, 3); // Show only first 3
  }

  getRemainingCount(group: any): number {
    return group.members.length - 3;
  }

  isGroupExpanded(groupId: number): boolean {
    return this.expandedGroupId === groupId;
  }
}




