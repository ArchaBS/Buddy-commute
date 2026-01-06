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
  routeLine: any = null;
  
  estimatedTime: string = 'Calculating...';
  distance: string = 'Calculating...';
  
  isLoading: boolean = true;
  isCancelling: boolean = false;
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
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      alert('Please login first');
      this.router.navigate(['/login']);
      return;
    }
  
    this.route.params.subscribe(params => {
      this.rideId = +params['id'];
      this.loadRideData();
      this.startLocationTracking();
      this.startAutoRefresh();
    });
  }
  
  ngOnDestroy(): void {
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
      console.error('❌ Map container not found!');
      return;
    }
  
    mapContainer.style.height = '500px';
    mapContainer.style.width = '100%';
  
    if (this.map) {
      this.map.remove();
    }
  
    // Initialize map at center of India
    this.map = L.map('map', {
      center: [10.5, 76.2],
      zoom: 10
    });
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  
    const DefaultIcon = L.icon({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = DefaultIcon;
  
    setTimeout(() => {
      this.map?.invalidateSize(true);
      console.log('✅ Map initialized');
    }, 100);
  }

  loadRideData(): void {
    this.notificationService.getActiveRide(this.rideId).subscribe({
      next: (response) => {
        console.log('🔄 Ride data loaded:', response);
        this.rideData = response;
        this.isLoading = false;
        
        setTimeout(() => {
          if (!this.map) {
            this.initMap();
          }
          this.updateMapMarkersAndLine();
        }, 500);
      },
      error: (error) => {
        console.error('❌ Error loading ride:', error);
        this.router.navigate(['/notifications']);
      }
    });
  }

  updateMapMarkersAndLine(): void {
    if (!this.rideData || !this.map) {
      console.error('❌ No map or ride data');
      return;
    }

    const req = this.rideData.requester;
    const acc = this.rideData.accepter;

    console.log('📍 Updating markers:', {
      requester: req ? `${req.username} at [${req.latitude}, ${req.longitude}]` : 'missing',
      accepter: acc ? `${acc.username} at [${acc.latitude}, ${acc.longitude}]` : 'missing'
    });

    // Create/update requester marker (Blue - Passenger)
    if (req?.latitude && req?.longitude) {
      const icon = L.divIcon({
        className: 'custom-marker-requester',
        html: `<div style="background-color: #3b82f6; width: 35px; height: 35px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${req.username.charAt(0).toUpperCase()}</div>`,
        iconSize: [35, 35]
      });

      if (this.requesterMarker) {
        this.requesterMarker.setLatLng([req.latitude, req.longitude]);
      } else {
        this.requesterMarker = L.marker([req.latitude, req.longitude], { icon })
          .addTo(this.map)
          .bindPopup(`<b>Pickup: ${req.username}</b>`);
        console.log('✅ Created requester marker');
      }
    }

    // Create/update accepter marker (Green - Driver)
    if (acc?.latitude && acc?.longitude) {
      const icon = L.divIcon({
        className: 'custom-marker-accepter',
        html: `<div style="background-color: #10b981; width: 35px; height: 35px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${acc.username.charAt(0).toUpperCase()}</div>`,
        iconSize: [35, 35]
      });

      if (this.accepterMarker) {
        const oldLatLng = this.accepterMarker.getLatLng();
        const newLatLng = L.latLng(acc.latitude, acc.longitude);
        this.animateMarker(this.accepterMarker, oldLatLng, newLatLng, 2000);
      } else {
        this.accepterMarker = L.marker([acc.latitude, acc.longitude], { icon })
          .addTo(this.map)
          .bindPopup(`<b>Driver: ${acc.username}</b>`);
        console.log('✅ Created accepter marker');
      }
    }

    // DRAW THE LINE - This is the critical part
    if (req?.latitude && req?.longitude && acc?.latitude && acc?.longitude) {
      console.log('🔴 Drawing line between:', {
        from: [acc.latitude, acc.longitude],
        to: [req.latitude, req.longitude]
      });

      // Remove old line if exists
      if (this.routeLine) {
        this.map.removeLayer(this.routeLine);
      }

      // Draw a BOLD, VISIBLE line
      this.routeLine = L.polyline(
        [
          [acc.latitude, acc.longitude],
          [req.latitude, req.longitude]
        ],
        {
          color: '#ef4444',        // Bright red
          weight: 8,               // Thick line
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round',
          dashArray: '15, 10',     // Dashed for visibility
          className: 'route-line'
        }
      ).addTo(this.map);

      console.log('✅✅✅ LINE DRAWN ON MAP!');

      // Calculate distance
      this.calculateDistance(req, acc);
    } else {
      console.warn('⚠️ Cannot draw line - missing coordinates');
    }

    // Fit map to show both markers and line
    this.fitMapToShowRoute();
  }

  animateMarker(marker: any, startLatLng: L.LatLng, endLatLng: L.LatLng, duration: number): void {
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      
      const lat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * progress;
      const lng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * progress;
      
      marker.setLatLng([lat, lng]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  calculateDistance(req: any, acc: any): void {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(acc.latitude - req.latitude);
    const dLon = this.toRad(acc.longitude - req.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(req.latitude)) * Math.cos(this.toRad(acc.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    this.distance = `${distanceKm.toFixed(1)} km`;
    this.estimatedTime = `${Math.round((distanceKm / 40) * 60)} min`;

    console.log(`📏 Distance: ${this.distance}, ETA: ${this.estimatedTime}`);
  }

  fitMapToShowRoute(): void {
    if (!this.requesterMarker || !this.accepterMarker) return;

    const bounds = L.latLngBounds([
      this.requesterMarker.getLatLng(),
      this.accepterMarker.getLatLng()
    ]);

    this.map.fitBounds(bounds, { 
      padding: [80, 80],
      maxZoom: 14,
      animate: true
    });

    console.log('🗺️ Map fitted to show route');
  }

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  startLocationTracking(): void {
    if (!('geolocation' in navigator)) {
      console.error('❌ Geolocation not supported');
      return;
    }

    console.log('📍 Starting real location tracking...');

    this.watchPositionId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        console.log(`📍 Real location: ${lat}, ${lng}`);

        this.notificationService.updateRideLocation(this.rideId, {
          user_id: this.currentUser.id,
          latitude: lat,
          longitude: lng
        }).subscribe({
          next: () => console.log('✅ Location sent to server'),
          error: (err) => console.error('❌ Failed to update location:', err)
        });
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        alert('Could not get your location. Please enable location permissions.');
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 
      }
    );
  }

  startAutoRefresh(): void {
    // Refresh every 5 seconds
    this.locationUpdateInterval = interval(5000).subscribe(() => {
      console.log('🔄 Auto-refreshing ride data...');
      this.loadRideData();
    });
  }

  toggleTestMode(): void {
    this.isTestMode = !this.isTestMode;
    
    if (this.isTestMode) {
      console.log('🧪 Test mode ENABLED');
      this.startLocationSimulation();
    } else {
      console.log('📍 Test mode DISABLED - using real location');
      this.stopLocationSimulation();
      this.startLocationTracking();
    }
  }

  startLocationSimulation(): void {
    // Stop real tracking
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }

    // Set initial simulated position
    if (this.rideData?.accepter) {
      this.simulatedLat = this.rideData.accepter.latitude || 10.0;
      this.simulatedLng = this.rideData.accepter.longitude || 76.0;
    }

    console.log('🧪 Simulation started at:', this.simulatedLat, this.simulatedLng);

    // Move toward requester every 3 seconds
    this.simulationInterval = setInterval(() => {
      if (this.rideData?.requester) {
        const targetLat = this.rideData.requester.latitude;
        const targetLng = this.rideData.requester.longitude;
        
        if (targetLat && targetLng) {
          // Move 10% closer + small random movement
          this.simulatedLat += (targetLat - this.simulatedLat) * 0.1 + (Math.random() - 0.5) * 0.001;
          this.simulatedLng += (targetLng - this.simulatedLng) * 0.1 + (Math.random() - 0.5) * 0.001;

          console.log('🧪 Simulated move to:', this.simulatedLat, this.simulatedLng);

          this.notificationService.updateRideLocation(this.rideId, {
            user_id: this.currentUser.id,
            latitude: this.simulatedLat,
            longitude: this.simulatedLng
          }).subscribe();
        }
      }
    }, 3000);
  }

  stopLocationSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      console.log('🧪 Simulation stopped');
    }
  }

  cancelRide(): void {
    if (!confirm('Are you sure you want to cancel this ride?')) return;
    
    this.isCancelling = true;
    this.notificationService.cancelRide(this.rideId, {
      user_id: this.currentUser.id
    }).subscribe({
      next: () => {
        console.log('✅ Ride cancelled');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('❌ Cancel failed:', err);
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
    return this.isRequester() 
      ? (this.rideData.accepter?.username || 'Driver')
      : (this.rideData.requester?.username || 'Passenger');
  }
}