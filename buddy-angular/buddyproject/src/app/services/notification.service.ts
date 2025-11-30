import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://127.0.0.1:8000/api/';

  constructor(private http: HttpClient) {}

  // Get all notifications for a user
  getUserNotifications(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}notifications/user/${userId}/`);
  }

  // Mark notification as read
  markNotificationRead(notificationId: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.put(
      `${this.apiUrl}notifications/${notificationId}/read/`,
      {},
      { headers }
    );
  }

  // Get ride requests for a user (requests sent to their groups)
  getRideRequestsForUser(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}ride-requests/user/${userId}/`);
  }

  // Accept a ride request
  acceptRideRequest(requestId: number, data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post(
      `${this.apiUrl}ride-requests/accept/${requestId}/`,
      data,
      { headers }
    );
  }
  // Decline a ride request
declineRideRequest(requestId: number, data: any): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  
  return this.http.post(
    `${this.apiUrl}ride-requests/decline/${requestId}/`,
    data,
    { headers }
  );
}
// Get active ride details
getActiveRide(rideId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}rides/${rideId}/`);
}

// Update user location
updateRideLocation(rideId: number, data: any): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  
  return this.http.post(
    `${this.apiUrl}rides/${rideId}/location/`,
    data,
    { headers }
  );
}

// Cancel ride
cancelRide(rideId: number, data: any): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  
  return this.http.post(
    `${this.apiUrl}rides/${rideId}/cancel/`,
    data,
    { headers }
  );
}
}
