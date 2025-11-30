import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = 'http://127.0.0.1:8000/api/';

  constructor(private http: HttpClient) {}

  // Get all groups
  getAllGroups(reset: boolean = false): Observable<any> {
    const url = reset ? `${this.apiUrl}groups/?reset=true` : `${this.apiUrl}groups/`;
    return this.http.get(url);
  }

  // Get group details
  getGroupDetails(groupId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}groups/${groupId}/`);
  }

  // Search user by phone
  searchUserByPhone(phone: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post(
      `${this.apiUrl}search-user/`,
      { phone: phone },
      { headers }
    );
  }

  // Add member to group
  addMemberToGroup(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post(
      `${this.apiUrl}groups/${data.group_id}/add-member/`,
      { user_id: data.user_id },
      { headers }
    );
  }

  // Remove member from group
  removeMemberFromGroup(groupId: string, userId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}groups/${groupId}/remove-member/${userId}/`
    );
  }

  // Send ride request to group
  sendRideRequest(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post(
      `${this.apiUrl}send-ride-request/`,
      data,
      { headers }
    );
  }
}