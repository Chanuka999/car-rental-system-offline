import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { Vehicle, VehiclePayload } from '../../../models/vehicle';
import { VehicleService } from '../../../services/vehicle';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.css'
})
export class VehicleList implements OnInit {

  private vehicleService = inject(VehicleService);
  private fb = inject(FormBuilder);

  vehicles = signal<Vehicle[]>([]);

  loading = signal(false);
  showForm = signal(false);
  editingVehicleId = signal<number | null>(null);

  searchTerm = signal('');
  statusFilter = signal('');

  currentPage = signal(1);
  lastPage = signal(1);
  total = signal(0);

  successMessage = signal('');
  errorMessage = signal('');

  currentYear = new Date().getFullYear();

  vehicleForm = this.fb.group({
    vehicle_name: ['', Validators.required],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    registration_number: ['', Validators.required],
    vehicle_type: [''],
    manufacture_year: [
      this.currentYear,
      [
        Validators.min(1900),
        Validators.max(this.currentYear + 1)
      ]
    ],
    seating_capacity: [
      5,
      [Validators.required, Validators.min(1)]
    ],
    daily_rate: [
      0,
      [Validators.required, Validators.min(0.01)]
    ],
    fuel_type: [''],
    transmission: [''],
    status: ['available' as Vehicle['status']],
    description: ['']
  });

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(page: number = 1): void {

    this.loading.set(true);
    this.errorMessage.set('');

    this.vehicleService.getVehicles(
      page,
      this.searchTerm(),
      this.statusFilter()
    ).subscribe({
      next: (response) => {

        const result = response.data;

        this.vehicles.set(result.data);
        this.currentPage.set(result.current_page);
        this.lastPage.set(result.last_page);
        this.total.set(result.total);

        this.loading.set(false);
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message || 'Unable to load vehicles.'
        );

        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {

    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
    this.loadVehicles(1);
  }

  onStatusChange(event: Event): void {

    const value = (event.target as HTMLSelectElement).value;

    this.statusFilter.set(value);
    this.loadVehicles(1);
  }

  openCreateForm(): void {

    this.editingVehicleId.set(null);

    this.vehicleForm.reset({
      vehicle_name: '',
      brand: '',
      model: '',
      registration_number: '',
      vehicle_type: '',
      manufacture_year: this.currentYear,
      seating_capacity: 5,
      daily_rate: 0,
      fuel_type: '',
      transmission: '',
      status: 'available',
      description: ''
    });

    this.successMessage.set('');
    this.errorMessage.set('');
    this.showForm.set(true);
  }

  editVehicle(vehicle: Vehicle): void {

    this.editingVehicleId.set(vehicle.id);

    this.vehicleForm.patchValue({
      vehicle_name: vehicle.vehicle_name,
      brand: vehicle.brand,
      model: vehicle.model,
      registration_number: vehicle.registration_number,
      vehicle_type: vehicle.vehicle_type || '',
      manufacture_year: vehicle.manufacture_year || this.currentYear,
      seating_capacity: vehicle.seating_capacity,
      daily_rate: Number(vehicle.daily_rate),
      fuel_type: vehicle.fuel_type || '',
      transmission: vehicle.transmission || '',
      status: vehicle.status,
      description: vehicle.description || ''
    });

    this.successMessage.set('');
    this.errorMessage.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingVehicleId.set(null);
    this.vehicleForm.reset();
  }

  saveVehicle(): void {

    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    const raw = this.vehicleForm.getRawValue();

    const payload: VehiclePayload = {
      vehicle_name: raw.vehicle_name!,
      brand: raw.brand!,
      model: raw.model!,
      registration_number: raw.registration_number!,
      vehicle_type: raw.vehicle_type || null,
      manufacture_year: raw.manufacture_year
        ? Number(raw.manufacture_year)
        : null,
      seating_capacity: Number(raw.seating_capacity),
      daily_rate: Number(raw.daily_rate),
      fuel_type: raw.fuel_type || null,
      transmission: raw.transmission || null,
      status: raw.status!,
      description: raw.description || null
    };

    const editingId = this.editingVehicleId();

    const request = editingId
      ? this.vehicleService.updateVehicle(editingId, payload)
      : this.vehicleService.createVehicle(payload);

    request.subscribe({
      next: (response) => {

        this.successMessage.set(response.message);
        this.errorMessage.set('');

        this.closeForm();
        this.loadVehicles(this.currentPage());
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message || 'Unable to save vehicle.'
        );
      }
    });
  }

  deleteVehicle(vehicle: Vehicle): void {

    const confirmed = window.confirm(
      `Are you sure you want to delete ${vehicle.vehicle_name}?`
    );

    if (!confirmed) return;

    this.vehicleService.deleteVehicle(vehicle.id).subscribe({
      next: (response) => {

        this.successMessage.set(response.message);

        const page = this.vehicles().length === 1 &&
          this.currentPage() > 1
            ? this.currentPage() - 1
            : this.currentPage();

        this.loadVehicles(page);
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message || 'Unable to delete vehicle.'
        );
      }
    });
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.loadVehicles(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.lastPage()) {
      this.loadVehicles(this.currentPage() + 1);
    }
  }

  getStatusClass(status: string): string {

    switch (status) {
      case 'available':
        return 'status-available';

      case 'rented':
        return 'status-rented';

      case 'maintenance':
        return 'status-maintenance';

      default:
        return '';
    }
  }
}