import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RideService {
  private apiUrl = 'http://127.0.0.1:8000/api';  // Remove the trailing slash and '/api/' at end

  constructor(private http: HttpClient) {}

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Get all groups
  getGroups(): Observable<any> {
    return this.http.get(`${this.apiUrl}/groups/`, { headers: this.getHeaders() });
  }

  // Get group details with members - FIX THIS
  // Get group details with members
getGroupDetails(groupId: number): Observable<any> {
  const url = `${this.apiUrl}/groups/${groupId}/details/`;
  console.log('🔍 Full API URL being called:', url);
  console.log('🔍 apiUrl base:', this.apiUrl);
  console.log('🔍 groupId:', groupId);
  return this.http.get(url, { headers: this.getHeaders() });
}

  // Search user by phone
  searchUserByPhone(phone: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/search-by-phone/`,
      { phone },
      { headers: this.getHeaders() }
    );
  }

  // Add member to group
  addMemberToGroup(groupId: number, userId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/groups/${groupId}/add-member/`,
      { user_id: userId },
      { headers: this.getHeaders() }
    );
  }

  // Create ride request
  createRideRequest(data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/riderequests/create/`,
      data,
      { headers: this.getHeaders() }
    );
  }

  // Get user notifications
  getNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications/`, { headers: this.getHeaders() });
  }
}