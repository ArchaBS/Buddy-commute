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
  
  // Test mode properties
  isTestMode: boolean = false;
  simulatedLat: number = 10.0;
  simulatedLng: number = 76.0;
  private simulationInterval: any = null;
  
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
    this.stopLocationSimulation();
  }

  initMap(): void {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found!');
      return;
    }
  
    mapContainer.style.height = '500px';
    mapContainer.style.width = '100%';
  
    if (this.map) {
      this.map.remove();
    }
  
    this.map = L.map('map', {
      center: [10.0, 76.0],
      zoom: 13
    });
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';

    const DefaultIcon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = DefaultIcon;
  
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize(true);
        console.log('🗺️ Map resized');
      }
    }, 100);
  
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize(true);
      }
    }, 500);
  
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize(true);
      }
    }, 1000);
  
    console.log('🗺️ Map initialized');
  }

  loadRideData(): void {
    this.notificationService.getActiveRide(this.rideId).subscribe({
      next: (response) => {
        console.log('✅ Ride data loaded:', response);
        this.rideData = response;
        this.isLoading = false;
        
        setTimeout(() => {
          if (!this.map) {
            this.initMap();
          }
          this.updateMapMarkers();
          this.calculateDistanceAndTime();
        }, 500);
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
  
    this.fitMapToMarkers();
    
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, i * 200);
    }
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
    console.log('🧮 Calculating distance...');
    console.log('👤 Requester data:', this.rideData?.requester);
    console.log('🚗 Accepter data:', this.rideData?.accepter);
    
    const requester = this.rideData?.requester;
    const accepter = this.rideData?.accepter;
    
    console.log('📍 Requester location:', requester?.latitude, requester?.longitude);
    console.log('📍 Accepter location:', accepter?.latitude, accepter?.longitude);

    if (!requester?.latitude || !accepter?.latitude) {
      this.estimatedTime = 'Waiting for location...';
      this.distance = 'Waiting for location...';
      console.log('❌ Missing location data!');
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
    
    console.log('✅ Distance calculated:', this.distance, 'ETA:', this.estimatedTime);
  }

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  startLocationTracking(): void {
    if ('geolocation' in navigator) {
      console.log('📍 Starting location tracking...');
      alert('Starting location tracking...'); // Debug alert
      
      this.watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          console.log(`📍 Current location: ${latitude}, ${longitude}`);
          alert(`Location captured: ${latitude}, ${longitude}`); // Debug alert
          
          // Send location to backend
          this.notificationService.updateRideLocation(this.rideId, {
            user_id: this.currentUser.id,
            latitude: latitude,
            longitude: longitude
          }).subscribe({
            next: () => {
              console.log('✅ Location updated on server');
              alert('Location sent to server!'); // Debug alert
            },
            error: (error) => {
              console.error('❌ Error updating location:', error);
              alert('Error sending location: ' + error.message); // Debug alert
            }
          });
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          alert('Geolocation error: ' + error.message); // Debug alert
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

  // Test Mode Methods
  toggleTestMode(): void {
    this.isTestMode = !this.isTestMode;
    
    if (this.isTestMode) {
      console.log('🧪 TEST MODE ENABLED - Simulating movement');
      alert('Test mode enabled! Simulating movement.');
      this.startLocationSimulation();
    } else {
      console.log('✅ TEST MODE DISABLED - Using real GPS');
      this.stopLocationSimulation();
      this.startLocationTracking();
    }
  }

  startLocationSimulation(): void {
    // Stop real location tracking
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }

    // Get initial position from ride data
    if (this.rideData?.accepter) {
      this.simulatedLat = this.rideData.accepter.latitude || 10.0;
      this.simulatedLng = this.rideData.accepter.longitude || 76.0;
    }

    // Simulate movement every 3 seconds
    this.simulationInterval = setInterval(() => {
      const latChange = (Math.random() - 0.5) * 0.002;
      const lngChange = (Math.random() - 0.5) * 0.002;
      
      // Bias movement toward the requester
      if (this.rideData?.requester) {
        const targetLat = this.rideData.requester.latitude;
        const targetLng = this.rideData.requester.longitude;
        
        if (targetLat && targetLng) {
          const toTargetLat = (targetLat - this.simulatedLat) * 0.1;
          const toTargetLng = (targetLng - this.simulatedLng) * 0.1;
          
          this.simulatedLat += toTargetLat + latChange;
          this.simulatedLng += toTargetLng + lngChange;
        } else {
          this.simulatedLat += latChange;
          this.simulatedLng += lngChange;
        }
      } else {
        this.simulatedLat += latChange;
        this.simulatedLng += lngChange;
      }

      console.log(`🧪 Simulated location: ${this.simulatedLat}, ${this.simulatedLng}`);

      // Send simulated location to backend
      this.notificationService.updateRideLocation(this.rideId, {
        user_id: this.currentUser.id,
        latitude: this.simulatedLat,
        longitude: this.simulatedLng
      }).subscribe({
        next: () => {
          console.log('✅ Simulated location updated');
        },
        error: (error) => {
          console.error('❌ Error updating simulated location:', error);
        }
      });
    }, 3000);
  }

  stopLocationSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
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