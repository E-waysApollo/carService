import { db } from '../../../db'

export const getCars = async () => db.cars.orderBy('id').toArray()

export const getCarsDesc = async () => db.cars.orderBy('id').reverse().toArray()

export const createCar = async (payload) => db.cars.add(payload)

export const updateCarById = async (id, payload) => db.cars.update(id, payload)

export const deleteCarById = async (id) => db.cars.delete(id)
