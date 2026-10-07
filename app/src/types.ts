export type VehicleType = 'car' | 'bike';
export type FuelType = 'Petrol' | 'Premium Petrol' | 'Diesel' | 'CNG';
export const FUEL_TYPES: FuelType[] = ['Petrol', 'Premium Petrol', 'Diesel', 'CNG'];

export interface Vehicle {
  id: string;
  type: VehicleType;
  make: string;
  model: string;
  reg: string;
  createdAt: number;
  updatedAt: number;
}

export interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string;          // YYYY-MM-DD
  odo: number;           // km
  fuelType: FuelType;
  qty: number;           // litres (kg for CNG)
  pricePerUnit: number;  // Rs per litre / kg
  total: number;         // Rs
  full: boolean;         // filled to full tank
  station: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface DB {
  schema: 1;
  selectedVehicleId: string | null;
  vehicles: Vehicle[];
  entries: FuelEntry[];
}
