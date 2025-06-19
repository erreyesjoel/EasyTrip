import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: any): Observable<T> {
    return this.http.get<T>(this.baseUrl + endpoint, { params });
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(this.baseUrl + endpoint, data);
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(this.baseUrl + endpoint, data);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.baseUrl + endpoint);
  }
}