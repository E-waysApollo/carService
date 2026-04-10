import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import dayjs from 'dayjs'
import { LocalizationProvider, YearCalendar } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { db, createEmptyCar } from '../../db'

const REQUIRED_MESSAGE = 'Марка, модель и пробег обязательны'
const VIN_INVALID_MESSAGE = 'VIN должен содержать 17 символов'
const LICENSE_PLATE_INVALID_MESSAGE = 'Госномер должен соответствовать шаблону A 123 BC 77'
const LICENSE_PLATE_REGEX = /^[A-Z] \d{3} [A-Z]{2} \d{2,3}$/

const toNullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const LICENSE_PLATE_SLOTS = ['L', 'D', 'D', 'D', 'L', 'L', 'D', 'D', 'D']

const formatLicensePlate = (value) => {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const chars = []
  let slotIndex = 0

  for (const char of clean) {
    if (slotIndex >= LICENSE_PLATE_SLOTS.length) {
      break
    }
    const expected = LICENSE_PLATE_SLOTS[slotIndex]
    const isLetter = /[A-Z]/.test(char)
    const isDigit = /[0-9]/.test(char)
    if ((expected === 'L' && isLetter) || (expected === 'D' && isDigit)) {
      chars.push(char)
      slotIndex += 1
    }
  }

  const first = chars.slice(0, 1).join('')
  const middleDigits = chars.slice(1, 4).join('')
  const middleLetters = chars.slice(4, 6).join('')
  const region = chars.slice(6, 9).join('')
  return [first, middleDigits, middleLetters, region].filter(Boolean).join(' ')
}

const normalizeVin = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17)

export function CarList({ onCarsChanged }) {
  const [cars, setCars] = useState([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(createEmptyCar())
  const [error, setError] = useState('')
  const [yearDialogOpen, setYearDialogOpen] = useState(false)

  const isEditing = useMemo(() => editingId !== null, [editingId])
  const vinError = form.vin.length > 0 && form.vin.length < 17
  const licensePlateError =
    form.licensePlate.length > 0 && !LICENSE_PLATE_REGEX.test(form.licensePlate)

  const loadCars = async () => {
    const items = await db.cars.orderBy('id').reverse().toArray()
    setCars(items)
  }

  useEffect(() => {
    loadCars()
  }, [])

  const resetForm = () => {
    setForm(createEmptyCar())
    setEditingId(null)
    setError('')
    setYearDialogOpen(false)
  }

  const openCreateDialog = () => {
    resetForm()
    setOpen(true)
  }

  const openEditDialog = (car) => {
    setEditingId(car.id)
    setForm({
      brand: car.brand ?? '',
      model: car.model ?? '',
      year: car.year ?? '',
      vin: car.vin ?? '',
      licensePlate: car.licensePlate ?? '',
      currentMileage: car.currentMileage ?? '',
    })
    setError('')
    setOpen(true)
  }

  const closeDialog = () => {
    setOpen(false)
    resetForm()
  }

  const handleChange = (field) => (event) => {
    const value = event.target.value
    if (field === 'licensePlate') {
      setForm((prev) => ({ ...prev, licensePlate: formatLicensePlate(value) }))
      return
    }
    if (field === 'vin') {
      setForm((prev) => ({ ...prev, vin: normalizeVin(value) }))
      return
    }
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleYearChange = (nextValue) => {
    const year = nextValue ? nextValue.year() : ''
    setForm((prev) => ({ ...prev, year }))
    setYearDialogOpen(false)
  }

  const validateForm = () => {
    const hasRequired = form.brand.trim() && form.model.trim() && String(form.currentMileage).trim()
    if (!hasRequired) {
      setError(REQUIRED_MESSAGE)
      return false
    }
    if (vinError) {
      setError(VIN_INVALID_MESSAGE)
      return false
    }
    if (licensePlateError) {
      setError(LICENSE_PLATE_INVALID_MESSAGE)
      return false
    }
    setError('')
    return true
  }

  const saveCar = async () => {
    if (!validateForm()) {
      return
    }

    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: toNullableNumber(form.year),
      vin: form.vin.trim(),
      licensePlate: form.licensePlate.trim(),
      currentMileage: Number(form.currentMileage),
    }

    if (isEditing) {
      await db.cars.update(editingId, payload)
    } else {
      await db.cars.add(payload)
    }

    await loadCars()
    if (onCarsChanged) {
      await onCarsChanged()
    }
    closeDialog()
  }

  const deleteCar = async (id) => {
    await db.cars.delete(id)
    await loadCars()
    if (onCarsChanged) {
      await onCarsChanged()
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Автомобили
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Добавляй, редактируй и удаляй автомобили. Данные сохраняются локально в IndexedDB.
      </Typography>

      <Button variant="contained" onClick={openCreateDialog} sx={{ mb: 2 }}>
        Добавить автомобиль
      </Button>

      {cars.length === 0 ? (
        <Typography color="text.secondary">Пока нет ни одного автомобиля.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Марка</TableCell>
              <TableCell>Модель</TableCell>
              <TableCell>Год</TableCell>
              <TableCell>Госномер</TableCell>
              <TableCell>Пробег</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cars.map((car) => (
              <TableRow key={car.id}>
                <TableCell>{car.brand}</TableCell>
                <TableCell>{car.model}</TableCell>
                <TableCell>{car.year || '-'}</TableCell>
                <TableCell>{car.licensePlate || '-'}</TableCell>
                <TableCell>{car.currentMileage}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => openEditDialog(car)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" color="error" onClick={() => deleteCar(car.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Редактировать автомобиль' : 'Новый автомобиль'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Марка"
              value={form.brand}
              onChange={handleChange('brand')}
              required
              autoFocus
            />
            <TextField label="Модель" value={form.model} onChange={handleChange('model')} required />
            <TextField
              label="Год выпуска"
              value={form.year}
              placeholder="Выбери через календарь"
              InputProps={{ readOnly: true }}
              onClick={() => setYearDialogOpen(true)}
            />
            <TextField
              label="VIN"
              value={form.vin}
              onChange={handleChange('vin')}
              error={vinError}
              helperText={vinError ? VIN_INVALID_MESSAGE : 'До 17 символов: латиница и цифры, без пробелов'}
            />
            <TextField
              label="Госномер"
              value={form.licensePlate}
              onChange={handleChange('licensePlate')}
              placeholder="A 123 BC 77"
              error={licensePlateError}
              helperText={
                licensePlateError
                  ? LICENSE_PLATE_INVALID_MESSAGE
                  : 'Только латиница и цифры, буквы автоматически в верхнем регистре'
              }
            />
            <TextField
              label="Текущий пробег"
              type="number"
              value={form.currentMileage}
              onChange={handleChange('currentMileage')}
              required
            />
            {error ? <Typography color="error">{error}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Отмена</Button>
          <Button onClick={saveCar} variant="contained" disabled={vinError || licensePlateError}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={yearDialogOpen} onClose={() => setYearDialogOpen(false)}>
        <DialogTitle>Выбор года выпуска</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <YearCalendar
              value={form.year ? dayjs(`${form.year}-01-01`) : null}
              onChange={handleYearChange}
              disableFuture
            />
          </LocalizationProvider>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
