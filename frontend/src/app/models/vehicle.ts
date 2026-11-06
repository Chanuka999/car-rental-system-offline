export interface Vehicle {
  id: number;
  vehicle_name: string;
  brand: string;
  model: string;
  registration_number: string;
  vehicle_type: string | null;
  manufacture_year: number | null;
  seating_capacity: number;
  daily_rate: number | string;
  fuel_type: string | null;
  transmission: string | null;
  image: string | null;
  status: 'available' | 'rented' | 'maintenance';
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VehiclePayload {
  vehicle_name: string;
  brand: string;
  model: string;
  registration_number: string;
  vehicle_type: string | null;
  manufacture_year: number | null;
  seating_capacity: number;
  daily_rate: number;
  fuel_type: string | null;
  transmission: string | null;
  status: 'available' | 'rented' | 'maintenance';
  description: string | null;
}

export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}