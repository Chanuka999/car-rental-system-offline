<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VehicleController extends Controller
{
    /**
     * Display all vehicles with search and pagination.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => [
                'nullable',
                Rule::in(['available', 'rented', 'maintenance']),
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $vehicles = Vehicle::query()
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('vehicle_name', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('registration_number', 'like', "%{$search}%");
                });
            })
            ->when($validated['status'] ?? null, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'success' => true,
            'message' => 'Vehicles retrieved successfully.',
            'data' => $vehicles,
        ]);
    }

    /**
     * Store a new vehicle.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_name' => ['required', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:100'],
            'model' => ['required', 'string', 'max:100'],
            'registration_number' => [
                'required',
                'string',
                'max:50',
                'unique:vehicles,registration_number',
            ],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'manufacture_year' => [
                'nullable',
                'integer',
                'min:1900',
                'max:' . (date('Y') + 1),
            ],
            'seating_capacity' => ['required', 'integer', 'min:1', 'max:100'],
            'daily_rate' => ['required', 'numeric', 'min:0.01'],
            'fuel_type' => ['nullable', 'string', 'max:50'],
            'transmission' => ['nullable', 'string', 'max:50'],
            'image' => ['nullable', 'string', 'max:2048'],
            'status' => [
                'sometimes',
                Rule::in(['available', 'rented', 'maintenance']),
            ],
            'description' => ['nullable', 'string'],
        ]);

        $vehicle = Vehicle::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle created successfully.',
            'data' => $vehicle,
        ], 201);
    }

    /**
     * Display a single vehicle.
     */
    public function show(Vehicle $vehicle)
    {
        return response()->json([
            'success' => true,
            'message' => 'Vehicle retrieved successfully.',
            'data' => $vehicle,
        ]);
    }

    /**
     * Update an existing vehicle.
     */
    public function update(Request $request, Vehicle $vehicle)
    {
        $validated = $request->validate([
            'vehicle_name' => ['sometimes', 'required', 'string', 'max:255'],
            'brand' => ['sometimes', 'required', 'string', 'max:100'],
            'model' => ['sometimes', 'required', 'string', 'max:100'],
            'registration_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('vehicles', 'registration_number')
                    ->ignore($vehicle->id),
            ],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'manufacture_year' => [
                'nullable',
                'integer',
                'min:1900',
                'max:' . (date('Y') + 1),
            ],
            'seating_capacity' => ['sometimes', 'required', 'integer', 'min:1', 'max:100'],
            'daily_rate' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'fuel_type' => ['nullable', 'string', 'max:50'],
            'transmission' => ['nullable', 'string', 'max:50'],
            'image' => ['nullable', 'string', 'max:2048'],
            'status' => [
                'sometimes',
                Rule::in(['available', 'rented', 'maintenance']),
            ],
            'description' => ['nullable', 'string'],
        ]);

        $vehicle->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle updated successfully.',
            'data' => $vehicle->fresh(),
        ]);
    }

    /**
     * Soft delete a vehicle.
     */
    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vehicle deleted successfully.',
        ]);
    }
}