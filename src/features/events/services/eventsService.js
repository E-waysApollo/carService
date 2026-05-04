import { db } from '../../../db'

const sortByDateDesc = (a, b) => {
  const byDate = new Date(b.date) - new Date(a.date)
  if (byDate !== 0) {
    return byDate
  }
  return (b.id ?? 0) - (a.id ?? 0)
}

export const syncCarMileageFromEvents = async (carId) => {
  if (!carId) {
    return
  }

  const events = await db.events.where('carId').equals(carId).toArray()
  const eventsWithMileage = events.filter((event) => event.mileage !== null && event.mileage !== undefined)

  if (eventsWithMileage.length === 0) {
    return
  }

  eventsWithMileage.sort(sortByDateDesc)
  const latestMileage = Number(eventsWithMileage[0].mileage)
  if (Number.isNaN(latestMileage)) {
    return
  }

  await db.cars.update(carId, { currentMileage: latestMileage })
}

export const getEventsByCarId = async (carId) => {
  if (!carId) {
    return []
  }

  const items = await db.events.where('carId').equals(carId).toArray()
  items.sort(sortByDateDesc)
  return items
}

export const createEvent = async (payload) => {
  const id = await db.events.add(payload)
  await syncCarMileageFromEvents(payload.carId)
  return id
}

export const updateEvent = async (id, payload) => {
  const updated = await db.events.update(id, payload)
  await syncCarMileageFromEvents(payload.carId)
  return updated
}

export const deleteEventById = async (id, carId) => {
  await db.events.delete(id)
  await syncCarMileageFromEvents(carId)
}
