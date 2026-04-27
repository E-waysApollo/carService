import { db } from '../../../db'

export const getEventsByCarId = async (carId) => {
  if (!carId) {
    return []
  }

  const items = await db.events.where('carId').equals(carId).toArray()
  items.sort((a, b) => new Date(b.date) - new Date(a.date))
  return items
}

export const createEvent = async (payload) => db.events.add(payload)

export const updateEvent = async (id, payload) => db.events.update(id, payload)

export const deleteEventById = async (id) => db.events.delete(id)
