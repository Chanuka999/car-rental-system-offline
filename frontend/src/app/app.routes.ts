import { Routes } from '@angular/router';
import { VehicleList } from './features/vehicles/vehicle-list/vehicle-list';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'vehicles',
    pathMatch: 'full'
  },
  {
    path: 'vehicles',
    component: VehicleList
  },
  {
    path: '**',
    redirectTo: 'vehicles'
  }
];