import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import * as L from 'leaflet';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-ridetracking',
  templateUrl: './ridetracking.component.html',
  styleUrls: ['./ridetracking.component.css']
})
export class RideTrackingComponent implements OnInit, OnDestroy {
  map: any;
  rideId: number = 0;
  rideData: any = null;
  currentUser: any = null;
  
  requesterMarker: any;
  accepterMarker: any;
  pickupMarker: any;
  destinationMarker: any;
  
  estimatedTime: string = 'Calculating...';
  distance: string = 'Calculating...';
  
  isLoading: boolean = true;
  isCancelling: boolean = false;
  
  private locationUpdateInterval: Subscription | null = null;
  private watchPositionId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🔔 Ride Tracking component loaded');
    console.log('🔍 Getting current user...');
    
    this.currentUser = this.authService.getCurrentUser();
    
    console.log('👤 Current user:', this.currentUser);
    
    if (!this.currentUser) {
      console.log('❌ No user found, redirecting to login');
      alert('Please login first');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('✅ User found, continuing...');
  
    // Get ride ID from route
    this.route.params.subscribe(params => {
      this.rideId = +params['id'];
      console.log('🚗 Tracking ride:', this.rideId);
      
      this.loadRideData();
      this.startLocationTracking();
      this.startAutoRefresh();
    });
  }

  ngOnDestroy(): void {
    // Clean up
    if (this.locationUpdateInterval) {
      this.locationUpdateInterval.unsubscribe();
    }
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
    }
  }

  initMap(): void {
    // Default center (will be updated when data loads)
    this.map = L.map('map').setView([10.0, 76.0], 13);
  
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
  
    // Fix for default marker icon issue in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
    });
  
    // Force map to recalculate its size
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  
    console.log('🗺️ Map initialized');
  }

  loadRideData(): void {
    this.notificationService.getActiveRide(this.rideId).subscribe({
      next: (response) => {
        console.log('✅ Ride data loaded:', response);
        this.rideData = response;
        this.isLoading = false;
        
        // Only initialize map if it doesn't exist yet
        if (!this.map) {
          setTimeout(() => {
            this.initMap();
            this.updateMapMarkers();
            this.calculateDistanceAndTime();
          }, 100);
        } else {
          // Map already exists, just update markers
          this.updateMapMarkers();
          this.calculateDistanceAndTime();
        }
      },
      error: (error) => {
        console.error('❌ Error loading ride data:', error);
        alert('Failed to load ride details');
        this.router.navigate(['/notifications']);
      }
    });
  }

  updateMapMarkers(): void {
    if (!this.rideData) return;

    const requester = this.rideData.requester;
    const accepter = this.rideData.accepter;

    // Requester marker (blue)
    if (requester.latitude && requester.longitude) {
      const requesterIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${requester.username.charAt(0).toUpperCase()}</div>`,
        iconSize: [30, 30]
      });

      if (this.requesterMarker) {
        this.requesterMarker.setLatLng([requester.latitude, requester.longitude]);
      } else {
        this.requesterMarker = L.marker([requester.latitude, requester.longitude], { icon: requesterIcon })
          .addTo(this.map)
          .bindPopup(`<b>${requester.username}</b><br>Requester`);
      }
    }

    // Accepter marker (green)
    if (accepter && accepter.latitude && accepter.longitude) {
      const accepterIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #10b981; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${accepter.username.charAt(0).toUpperCase()}</div>`,
        iconSize: [30, 30]
      });

      if (this.accepterMarker) {
        this.accepterMarker.setLatLng([accepter.latitude, accepter.longitude]);
      } else {
        this.accepterMarker = L.marker([accepter.latitude, accepter.longitude], { icon: accepterIcon })
          .addTo(this.map)
          .bindPopup(`<b>${accepter.username}</b><br>Driver`);
      }
    }

    // Fit map to show all markers
    this.fitMapToMarkers();
    
    // ✅ ADDED: Force map to resize after updating markers
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  fitMapToMarkers(): void {
    const bounds = L.latLngBounds([]);
    
    if (this.requesterMarker) bounds.extend(this.requesterMarker.getLatLng());
    if (this.accepterMarker) bounds.extend(this.accepterMarker.getLatLng());
    
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  calculateDistanceAndTime(): void {
    const requester = this.rideData?.requester;
    const accepter = this.rideData?.accepter;

    if (!requester?.latitude || !accepter?.latitude) {
      this.estimatedTime = 'Waiting for location...';
      this.distance = 'Waiting for location...';
      return;
    }

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(accepter.latitude - requester.latitude);
    const dLon = this.toRad(accepter.longitude - requester.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(requester.latitude)) * Math.cos(this.toRad(accepter.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    this.distance = `${distanceKm.toFixed(1)} km`;

    // Estimate time (assuming average speed of 40 km/h)
    const estimatedMinutes = Math.round((distanceKm / 40) * 60);
    this.estimatedTime = `${estimatedMinutes} min`;
  }

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  startLocationTracking(): void {
    if ('geolocation' in navigator) {
      console.log('📍 Starting location tracking...');
      
      this.watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          console.log(`📍 Current location: ${latitude}, ${longitude}`);
          
          // Send location to backend
          this.notificationService.updateRideLocation(this.rideId, {
            user_id: this.currentUser.id,
            latitude: latitude,
            longitude: longitude
          }).subscribe({
            next: () => {
              console.log('✅ Location updated on server');
            },
            error: (error) => {
              console.error('❌ Error updating location:', error);
            }
          });
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          alert('Please enable location services to use tracking');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  }

  startAutoRefresh(): void {
    // Refresh ride data every 10 seconds
    this.locationUpdateInterval = interval(10000).subscribe(() => {
      console.log('🔄 Refreshing ride data...');
      this.loadRideData();
    });
  }

  cancelRide(): void {
    if (!confirm('Are you sure you want to cancel this ride?')) {
      return;
    }

    this.isCancelling = true;

    this.notificationService.cancelRide(this.rideId, {
      user_id: this.currentUser.id
    }).subscribe({
      next: (response) => {
        console.log('✅ Ride cancelled:', response);
        alert('Ride cancelled successfully');
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('❌ Error cancelling ride:', error);
        alert('Failed to cancel ride');
        this.isCancelling = false;
      }
    });
  }

  goBack(): void {
    if (confirm('Are you sure you want to leave tracking?')) {
      this.router.navigate(['/notifications']);
    }
  }

  isRequester(): boolean {
    return this.rideData?.requester?.id === this.currentUser?.id;
  }

  getOtherUserName(): string {
    if (!this.rideData) return '';
    
    if (this.isRequester()) {
      return this.rideData.accepter?.username || 'Driver';
    } else {
      return this.rideData.requester?.username || 'Passenger';
    }
  }
}