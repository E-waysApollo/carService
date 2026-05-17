import { db } from '../../../db'

const sortByDateDesc = (a, b) => {
  const byDate = new Date(b.date) - new Date(a.date)
  if (byDate !== 0) {
    return byDate
  }
  return (b.id ?? 0) - (a.id ?? 0)
}

const sortByDateAsc = (a, b) => {
  const byDate = new Date(a.date) - new Date(b.date)
  if (byDate !== 0) {
    return byDate
  }
  return (a.id ?? 0) - (b.id ?? 0)
}

const isYyyyMm = (value) => typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)

const pad2 = (n) => String(n).padStart(2, '0')

const getLocalYyyyMm = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`

const addMonthsYyyyMm = (yyyyMm, deltaMonths) => {
  const [yRaw, mRaw] = yyyyMm.split('-')
  const year = Number(yRaw)
  const monthIndex0 = Number(mRaw) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex0)) {
    return yyyyMm
  }

  const d = new Date(year, monthIndex0, 1)
  d.setMonth(d.getMonth() + deltaMonths)
  return getLocalYyyyMm(d)
}

const monthRangeLocal = (yyyyMm) => {
  const [yRaw, mRaw] = yyyyMm.split('-')
  const year = Number(yRaw)
  const monthIndex0 = Number(mRaw) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex0)) {
    return { start: null, endExclusive: null }
  }

  const start = new Date(year, monthIndex0, 1, 0, 0, 0, 0)
  const endExclusive = new Date(year, monthIndex0 + 1, 1, 0, 0, 0, 0)
  return { start, endExclusive }
}

const eventTime = (event) => {
  const t = new Date(event.date).getTime()
  return Number.isFinite(t) ? t : NaN
}

const toFiniteNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

const sumCostForTypes = (events, types) => {
  let sum = 0
  for (const event of events) {
    if (!types.includes(event.type)) {
      continue
    }
    const cost = toFiniteNumber(event.totalCost)
    if (!Number.isFinite(cost)) {
      continue
    }
    sum += cost
  }
  return sum
}

const computeSpendBreakdown = (events) => {
  const maintenance = sumCostForTypes(events, ['maintenance'])
  const repair = sumCostForTypes(events, ['repair'])
  const refuel = sumCostForTypes(events, ['refuel'])
  const total = maintenance + repair + refuel

  const pct = (part) => {
    if (total <= 0) {
      return 0
    }
    return Math.round((part / total) * 100)
  }

  return {
    total,
    maintenance,
    repair,
    refuel,
    maintenancePct: pct(maintenance),
    repairPct: pct(repair),
    refuelPct: pct(refuel),
  }
}

const computeMileageDeltaKm = (allEventsSortedDesc, monthStart, monthEndExclusive) => {
  if (!monthStart || !monthEndExclusive) {
    return { mileageDeltaKm: 0, mileageMethod: 'none' }
  }

  const inMonth = allEventsSortedDesc
    .filter((e) => {
      const t = eventTime(e)
      return Number.isFinite(t) && t >= monthStart.getTime() && t < monthEndExclusive.getTime()
    })
    .slice()
    .sort(sortByDateAsc)

  const monthWithMileage = inMonth
    .map((e) => ({ event: e, mileage: toFiniteNumber(e.mileage) }))
    .filter((x) => Number.isFinite(x.mileage))

  if (monthWithMileage.length >= 2) {
    const mileages = monthWithMileage.map((x) => x.mileage)
    const min = Math.min(...mileages)
    const max = Math.max(...mileages)
    return { mileageDeltaKm: Math.max(0, max - min), mileageMethod: 'minmax_in_month' }
  }

  if (monthWithMileage.length === 1) {
    const only = monthWithMileage[0].mileage
    const baselineEvent = allEventsSortedDesc.find((e) => {
      const t = eventTime(e)
      if (!Number.isFinite(t) || t >= monthStart.getTime()) {
        return false
      }
      const m = toFiniteNumber(e.mileage)
      return Number.isFinite(m)
    })

    if (baselineEvent) {
      const baseline = toFiniteNumber(baselineEvent.mileage)
      if (Number.isFinite(baseline)) {
        return { mileageDeltaKm: Math.max(0, only - baseline), mileageMethod: 'single_vs_prev' }
      }
    }

    return { mileageDeltaKm: 0, mileageMethod: 'single_no_baseline' }
  }

  return { mileageDeltaKm: 0, mileageMethod: 'none' }
}

const INVALID_MONTH_KEY = 'invalid-date'

const getMonthLabelRu = (monthKey) => {
  if (monthKey === INVALID_MONTH_KEY) {
    return 'Без даты'
  }

  const [yearRaw, monthRaw] = String(monthKey).split('-')
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return 'Без даты'
  }

  const date = new Date(year, monthIndex, 1)
  const monthName = date.toLocaleString('ru-RU', { month: 'long' })
  const capitalizedMonth = monthName ? monthName[0].toUpperCase() + monthName.slice(1) : monthName
  return `${capitalizedMonth} ${year}`
}

const toMonthKey = (dateValue) => {
  const parsedDate = new Date(dateValue)
  const time = parsedDate.getTime()
  if (!Number.isFinite(time)) {
    return INVALID_MONTH_KEY
  }
  return `${parsedDate.getFullYear()}-${pad2(parsedDate.getMonth() + 1)}`
}

const toValidNumberOrNull = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

export const buildEventMonthSections = (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    return []
  }

  const sectionsMap = new Map()

  for (const event of events) {
    const monthKey = toMonthKey(event?.date)
    if (!sectionsMap.has(monthKey)) {
      sectionsMap.set(monthKey, {
        monthKey,
        monthLabel: getMonthLabelRu(monthKey),
        events: [],
        stats: {
          count: 0,
          totalCost: 0,
          mileageDelta: null,
        },
      })
    }

    const section = sectionsMap.get(monthKey)
    section.events.push(event)
  }

  const validSections = []
  let invalidSection = null

  for (const section of sectionsMap.values()) {
    const validMileages = []
    let totalCost = 0

    for (const event of section.events) {
      const cost = toValidNumberOrNull(event?.totalCost)
      if (cost !== null) {
        totalCost += cost
      }

      const mileage = toValidNumberOrNull(event?.mileage)
      if (mileage !== null) {
        validMileages.push(mileage)
      }
    }

    section.stats.count = section.events.length
    section.stats.totalCost = totalCost
    section.stats.mileageDelta =
      validMileages.length >= 2 ? Math.max(...validMileages) - Math.min(...validMileages) : null

    if (section.monthKey === INVALID_MONTH_KEY) {
      invalidSection = section
    } else {
      validSections.push(section)
    }
  }

  validSections.sort((a, b) => b.monthKey.localeCompare(a.monthKey))

  if (invalidSection) {
    validSections.push(invalidSection)
  }

  return validSections
}

export const getMonthlyReport = async (carId, monthYear) => {
  if (!carId) {
    return null
  }

  const month = isYyyyMm(monthYear) ? monthYear : getLocalYyyyMm(new Date())
  const prevMonth = addMonthsYyyyMm(month, -1)

  const { start, endExclusive } = monthRangeLocal(month)
  const prevRange = monthRangeLocal(prevMonth)

  const all = await db.events.where('carId').equals(carId).toArray()
  all.sort(sortByDateDesc)

  const currentMonthEvents = all.filter((e) => {
    const t = eventTime(e)
    return Number.isFinite(t) && start && endExclusive && t >= start.getTime() && t < endExclusive.getTime()
  })

  const prevMonthEvents = all.filter((e) => {
    const t = eventTime(e)
    return (
      Number.isFinite(t) &&
      prevRange.start &&
      prevRange.endExclusive &&
      t >= prevRange.start.getTime() &&
      t < prevRange.endExclusive.getTime()
    )
  })

  const currentSpend = computeSpendBreakdown(currentMonthEvents)
  const prevSpend = computeSpendBreakdown(prevMonthEvents)

  const prevTotal = prevSpend.total
  const currentTotal = currentSpend.total

  let monthOverMonthPct = null
  if (prevTotal > 0) {
    monthOverMonthPct = Math.round(((currentTotal - prevTotal) / prevTotal) * 100)
  } else if (prevTotal === 0 && currentTotal > 0) {
    monthOverMonthPct = null
  } else {
    monthOverMonthPct = 0
  }

  const mileage = computeMileageDeltaKm(all, start, endExclusive)
  const costPerKm =
    mileage.mileageDeltaKm > 0 && currentSpend.total > 0 ? currentSpend.total / mileage.mileageDeltaKm : null

  return {
    monthYear: month,
    prevMonthYear: prevMonth,
    spend: currentSpend,
    prevSpendTotal: prevSpend.total,
    monthOverMonthPct,
    mileageDeltaKm: mileage.mileageDeltaKm,
    mileageMethod: mileage.mileageMethod,
    costPerKm,
  }
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
