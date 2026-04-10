import Dexie from 'dexie'

export const db = new Dexie('carServiceDb')

db.version(1).stores({
  cars: '++id, brand, model, year, vin, licensePlate, currentMileage',
  events: '++id, carId, date, type, mileage',
})

export const createEmptyCar = () => ({
  brand: '',
  model: '',
  year: '',
  vin: '',
  licensePlate: '',
  currentMileage: '',
})

export const createEmptyEvent = (carId = null) => ({
  carId,
  date: new Date().toISOString().slice(0, 10),
  type: 'maintenance',
  mileage: '',
  title: '',
  notes: '',
  totalCost: '',
})
