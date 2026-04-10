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
import { db, createEmptyCar } from '../../db'

const REQUIRED_MESSAGE = 'Марка, модель и пробег обязательны'

const toNullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

export function CarList() {
  const [cars, setCars] = useState([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(createEmptyCar())
  const [error, setError] = useState('')

  const isEditing = useMemo(() => editingId !== null, [editingId])

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
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const hasRequired = form.brand.trim() && form.model.trim() && String(form.currentMileage).trim()
    if (!hasRequired) {
      setError(REQUIRED_MESSAGE)
      return false
    }
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
    closeDialog()
  }

  const deleteCar = async (id) => {
    await db.cars.delete(id)
    await loadCars()
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
              type="number"
              value={form.year}
              onChange={handleChange('year')}
            />
            <TextField label="VIN" value={form.vin} onChange={handleChange('vin')} />
            <TextField
              label="Госномер"
              value={form.licensePlate}
              onChange={handleChange('licensePlate')}
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
          <Button onClick={saveCar} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
