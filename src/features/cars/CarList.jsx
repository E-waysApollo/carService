import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { LocalizationProvider, YearCalendar } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { createEmptyCar } from '../../db'
import { CarCard } from './components/CarCard'
import { createCar, deleteCarById, getCarsDesc, updateCarById } from './services/carsService'

const REQUIRED_MESSAGE = 'Марка, модель и пробег обязательны'
const VIN_INVALID_MESSAGE = 'VIN должен содержать 17 символов'
const LICENSE_PLATE_INVALID_MESSAGE = 'Госномер должен соответствовать шаблону A 123 BC 77'
const BRAND_LENGTH_MESSAGE = 'Марка слишком длинная'
const MODEL_LENGTH_MESSAGE = 'Модель слишком длинная'
const MILEAGE_LENGTH_MESSAGE = 'Пробег слишком длинный'
const LICENSE_PLATE_REGEX = /^[A-Z] \d{3} [A-Z]{2} \d{2,3}$/
const MAX_BRAND_LENGTH = 40
const MAX_MODEL_LENGTH = 40
const MAX_MILEAGE_LENGTH = 9

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [carToDelete, setCarToDelete] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(createEmptyCar())
  const [error, setError] = useState('')
  const [yearDialogOpen, setYearDialogOpen] = useState(false)

  const isEditing = useMemo(() => editingId !== null, [editingId])
  const brandLengthError = form.brand.length > MAX_BRAND_LENGTH
  const modelLengthError = form.model.length > MAX_MODEL_LENGTH
  const mileageLengthError = String(form.currentMileage).length > MAX_MILEAGE_LENGTH
  const vinError = form.vin.length > 0 && form.vin.length < 17
  const licensePlateError =
    form.licensePlate.length > 0 && !LICENSE_PLATE_REGEX.test(form.licensePlate)

  const loadCars = async () => {
    const items = await getCarsDesc()
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
    if (field === 'brand') {
      setForm((prev) => ({ ...prev, brand: value.slice(0, MAX_BRAND_LENGTH) }))
      return
    }
    if (field === 'model') {
      setForm((prev) => ({ ...prev, model: value.slice(0, MAX_MODEL_LENGTH) }))
      return
    }
    if (field === 'currentMileage') {
      const mileage = value.replace(/\D/g, '').slice(0, MAX_MILEAGE_LENGTH)
      setForm((prev) => ({ ...prev, currentMileage: mileage }))
      return
    }
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
    if (brandLengthError) {
      setError(BRAND_LENGTH_MESSAGE)
      return false
    }
    if (modelLengthError) {
      setError(MODEL_LENGTH_MESSAGE)
      return false
    }
    if (mileageLengthError) {
      setError(MILEAGE_LENGTH_MESSAGE)
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
      await updateCarById(editingId, payload)
    } else {
      await createCar(payload)
    }

    await loadCars()
    if (onCarsChanged) {
      await onCarsChanged()
    }
    closeDialog()
  }

  const requestDeleteCar = (car) => {
    setCarToDelete(car)
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setCarToDelete(null)
  }

  const confirmDeleteCar = async () => {
    if (!carToDelete) {
      return
    }
    await deleteCarById(carToDelete.id)
    await loadCars()
    if (onCarsChanged) {
      await onCarsChanged()
    }
    closeDeleteDialog()
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
        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
          <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '22%' }}>Марка</TableCell>
                <TableCell sx={{ width: '22%' }}>Модель</TableCell>
                <TableCell sx={{ width: '10%' }}>Год</TableCell>
                <TableCell sx={{ width: '18%' }}>Госномер</TableCell>
                <TableCell sx={{ width: '12%' }}>Пробег</TableCell>
                <TableCell align="right" sx={{ width: '16%' }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  onEdit={() => openEditDialog(car)}
                  onDelete={() => requestDeleteCar(car)}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Редактировать автомобиль' : 'Новый автомобиль'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Марка"
              value={form.brand}
              onChange={handleChange('brand')}
              error={brandLengthError}
              helperText={
                brandLengthError
                  ? `${BRAND_LENGTH_MESSAGE} (максимум ${MAX_BRAND_LENGTH})`
                  : `${form.brand.length}/${MAX_BRAND_LENGTH}`
              }
              inputProps={{ maxLength: MAX_BRAND_LENGTH }}
              required
              autoFocus
            />
            <TextField
              label="Модель"
              value={form.model}
              onChange={handleChange('model')}
              error={modelLengthError}
              helperText={
                modelLengthError
                  ? `${MODEL_LENGTH_MESSAGE} (максимум ${MAX_MODEL_LENGTH})`
                  : `${form.model.length}/${MAX_MODEL_LENGTH}`
              }
              inputProps={{ maxLength: MAX_MODEL_LENGTH }}
              required
            />
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
              type="text"
              value={form.currentMileage}
              onChange={handleChange('currentMileage')}
              error={mileageLengthError}
              helperText={
                mileageLengthError
                  ? `${MILEAGE_LENGTH_MESSAGE} (максимум ${MAX_MILEAGE_LENGTH})`
                  : `${String(form.currentMileage).length}/${MAX_MILEAGE_LENGTH}`
              }
              inputProps={{ inputMode: 'numeric', maxLength: MAX_MILEAGE_LENGTH }}
              required
            />
            {error ? <Typography color="error">{error}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Отмена</Button>
          <Button
            onClick={saveCar}
            variant="contained"
            disabled={
              vinError ||
              licensePlateError ||
              brandLengthError ||
              modelLengthError ||
              mileageLengthError
            }
          >
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

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>Вы точно хотите удалить выбранный автомобиль?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Нет</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteCar}>
            Да
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
