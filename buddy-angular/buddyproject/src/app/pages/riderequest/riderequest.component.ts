import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-riderequest',
  templateUrl: './riderequest.component.html',
  styleUrls: ['./riderequest.component.css']
})
export class RiderequestComponent {
  pickupLocation: string = '';
  destination: string = '';
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private router: Router) {}

  // Use current location for pickup or destination
  useCurrentLocation(field: 'pickup' | 'destination') {
    if (navigator.geolocation) {
      this.errorMessage = '';
      this.successMessage = 'Getting your location...';
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const locationString = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
          
          if (field === 'pickup') {
            this.pickupLocation = locationString;
            this.successMessage = 'Pickup location set to current location!';
          } else {
            this.destination = locationString;
            this.successMessage = 'Destination set to current location!';
          }
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        (error) => {
          this.successMessage = '';
          this.errorMessage = 'Unable to get your location. Please enable location services.';
          console.error('Error getting location:', error);
        }
      );
    } else {
      this.errorMessage = 'Geolocation is not supported by your browser.';
    }
  }

  // Search for rides
  searchRides() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.pickupLocation || !this.destination) {
      this.errorMessage = 'Please fill in both pickup and destination';
      this.isLoading = false;
      return;
    }

    console.log('Searching rides with:', {
      pickup: this.pickupLocation,
      destination: this.destination
    });

    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/group'], {
        queryParams: {
          pickup: this.pickupLocation,
          destination: this.destination
        }
      });
    }, 1000);
  }

  // Go back to home page
  goBack() {
    this.router.navigate(['/home']);
  }
}