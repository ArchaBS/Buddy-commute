import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RideService } from '../../services/ride.service';

@Component({
  selector: 'app-groupview',
  templateUrl: './groupview.component.html',
  styleUrls: ['./groupview.component.css']
})
export class GroupviewComponent implements OnInit {
  groupId: number = 0;
  groupName: string = '';
  groupDescription: string = '';
  activeRides: number = 0;
  members: any[] = [];
  phoneNumber: string = '';
  searchedUser: any = null;
  searchNotFound: boolean = false;
  isSearching: boolean = false;
  isAdding: boolean = false;
  isLoading: boolean = true;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rideService: RideService  // Inject RideService
  ) {}

  ngOnInit() {
    console.log('=== GroupviewComponent loaded ===');
    this.route.params.subscribe(params => {
      this.groupId = +params['id'];
      console.log('Group ID from route:', this.groupId);
      
      // Load real data from backend
      this.loadGroupDetails();
    });
  }

  loadGroupDetails() {
    this.isLoading = true;
    console.log('🔍 Loading group details for ID:', this.groupId);
    
    // Call backend API to get group details
    this.rideService.getGroupDetails(this.groupId).subscribe({
      next: (response) => {
        console.log('✅ Group details from backend:', response);
        
        this.groupName = response.groupname;
        this.groupDescription = response.description;
        this.activeRides = response.active_rides || 0;
        
        // Transform members data
        this.members = response.members.map((member: any) => ({
          id: member.id,
          username: member.username,
          phone: member.phone || '',
          email: member.email || '',
          location: '',
          isAdmin: false
        }));
        
        console.log('📋 Loaded members:', this.members);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading group details:', error);
        console.error('Full error:', error);
        this.errorMessage = 'Failed to load group details';
        this.isLoading = false;
      }
    });
  }

  // Fallback static data if backend fails
  loadStaticData() {
    const staticGroups = [
      {
        id: 1,
        groupName: 'Office Group',
        description: 'Colleagues commuting to work',
        activeRides: 3,
        members: [
          { id: 1, username: 'Django', phone: '+91 9876543210', isAdmin: true },
          { id: 2, username: 'Vishnu', phone: '+91 9876543211', isAdmin: false },
          { id: 3, username: 'Amina', phone: '+91 9876543212', isAdmin: false }
        ]
      },
      {
        id: 2,
        groupName: 'College Group',
        description: 'University friends carpooling',
        activeRides: 2,
        members: [
          { id: 6, username: 'Pooja', phone: '+91 9876543220', isAdmin: true },
          { id: 7, username: 'Nikitha', phone: '+91 9876543221', isAdmin: false }
        ]
      }
    ];

    const group = staticGroups.find(g => g.id === this.groupId);
    
    if (group) {
      this.groupName = group.groupName;
      this.groupDescription = group.description;
      this.activeRides = group.activeRides;
      this.members = [...group.members];
      console.log('Using static data for group:', this.groupName);
    }
  }

  searchMember() {
    if (!this.phoneNumber || this.phoneNumber.trim() === '') {
      this.errorMessage = 'Please enter a phone number';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isSearching = true;
    this.searchedUser = null;
    this.searchNotFound = false;

    console.log('Searching for phone:', this.phoneNumber);

    // Call backend API to search user by phone
    this.rideService.searchUserByPhone(this.phoneNumber).subscribe({
      next: (response) => {
        console.log('Search response:', response);
        this.isSearching = false;
        
        if (response.found) {
          // Check if user is already a member
          const alreadyMember = this.members.some(
            member => member.id === response.user.id
          );
          
          if (alreadyMember) {
            this.errorMessage = 'This user is already a member of the group';
            setTimeout(() => this.errorMessage = '', 3000);
            this.searchedUser = null;
          } else {
            this.searchedUser = {
              id: response.user.id,
              username: response.user.username,
              phone: response.user.phone,
              location: response.user.location
            };
          }
        } else {
          this.searchNotFound = true;
        }
      },
      error: (error) => {
        console.error('Search error:', error);
        this.isSearching = false;
        this.searchNotFound = true;
        this.errorMessage = 'Failed to search user. Please try again.';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  addMember(user: any) {
    if (!user) return;

    // Check if already exists (double check)
    const exists = this.members.find(m => m.id === user.id);
    if (exists) {
      this.errorMessage = 'This user is already a member';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isAdding = true;
    console.log('Adding member:', user, 'to group:', this.groupId);

    // Call backend API to add member to group
    this.rideService.addMemberToGroup(this.groupId, user.id).subscribe({
      next: (response) => {
        console.log('Member added response:', response);
        
        // Add member to local list
        this.members.push({
          id: user.id,
          username: user.username,
          phone: user.phone,
          email: user.email || '',
          location: user.location || '',
          isAdmin: false
        });
        
        this.successMessage = `${user.username} added successfully!`;
        
        // Reset form
        this.phoneNumber = '';
        this.searchedUser = null;
        this.isAdding = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error adding member:', error);
        this.errorMessage = 'Failed to add member to group';
        this.isAdding = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  removeMember(member: any) {
    if (member.isAdmin) {
      alert('Cannot remove admin from the group');
      return;
    }

    if (confirm(`Remove ${member.username} from the group?`)) {
      // TODO: Add backend API call to remove member
      this.members = this.members.filter(m => m.id !== member.id);
      this.successMessage = `${member.username} removed from group`;
      setTimeout(() => this.successMessage = '', 3000);
    }
  }

  goBack() {
    this.router.navigate(['/group']);
  }
}