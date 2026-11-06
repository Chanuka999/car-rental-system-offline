import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import {
  Vehicle,
  VehiclePayload,
  ApiResponse,
  PaginatedData
} from '../models/vehicle';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  private http = inject(HttpClient);

  private apiUrl = 'http://127.0.0.1:8000/api/vehicles';

  getVehicles(
    page: number = 1,
    search: string = '',
    status: string = ''
  ): Observable<ApiResponse<PaginatedData<Vehicle>>> {

    let params = new HttpParams()
      .set('page', page)
      .set('per_page', 10);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<PaginatedData<Vehicle>>>(
      this.apiUrl,
      { params }
    );
  }

  getVehicle(id: number): Observable<ApiResponse<Vehicle>> {
    return this.http.get<ApiResponse<Vehicle>>(
      `${this.apiUrl}/${id}`
    );
  }

  createVehicle(
    vehicle: VehiclePayload
  ): Observable<ApiResponse<Vehicle>> {

    return this.http.post<ApiResponse<Vehicle>>(
      this.apiUrl,
      vehicle
    );
  }

  updateVehicle(
    id: number,
    vehicle: VehiclePayload
  ): Observable<ApiResponse<Vehicle>> {

    return this.http.put<ApiResponse<Vehicle>>(
      `${this.apiUrl}/${id}`,
      vehicle
    );
  }

  deleteVehicle(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/${id}`
    );
  }
}