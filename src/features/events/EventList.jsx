import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
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
import { createEmptyEvent, db } from '../../db'

const REQUIRED_MESSAGE = 'Дата, тип и заголовок обязательны'
const MAX_TITLE_LENGTH = 80
const EVENT_TYPE_OPTIONS = [
  { value: 'maintenance', label: 'ТО' },
  { value: 'repair', label: 'Ремонт' },
  { value: 'refuel', label: 'Заправка' },
]

const toNullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const normalized = String(value).replace(',', '.')
  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

export function EventList({ currentCar }) {
  const [events, setEvents] = useState([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(createEmptyEvent())
  const [error, setError] = useState('')

  const isEditing = useMemo(() => editingId !== null, [editingId])

  const loadEvents = async (carId) => {
    if (!carId) {
      setEvents([])
      return
    }
    const items = await db.events.where('carId').equals(carId).toArray()
    items.sort((a, b) => new Date(b.date) - new Date(a.date))
    setEvents(items)
  }

  useEffect(() => {
    if (currentCar?.id) {
      loadEvents(currentCar.id)
      return
    }
    setEvents([])
  }, [currentCar?.id])

  if (!currentCar) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Журнал событий
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Сначала добавь автомобиль во вкладке "Автомобили".
        </Typography>
      </Box>
    )
  }

  const resetForm = () => {
    setForm(createEmptyEvent(currentCar.id))
    setEditingId(null)
    setError('')
  }

  const openCreateDialog = () => {
    resetForm()
    setOpen(true)
  }

  const openEditDialog = (event) => {
    setEditingId(event.id)
    setForm({
      carId: event.carId,
      date: event.date ?? new Date().toISOString().slice(0, 10),
      type: event.type ?? 'maintenance',
      mileage: event.mileage ?? '',
      title: event.title ?? '',
      notes: event.notes ?? '',
      totalCost: event.totalCost ?? '',
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
    if (field === 'title') {
      setForm((prev) => ({ ...prev, title: value.slice(0, MAX_TITLE_LENGTH) }))
      return
    }
    if (field === 'mileage') {
      const nextMileage = value.replace(/\D/g, '').slice(0, 9)
      setForm((prev) => ({ ...prev, mileage: nextMileage }))
      return
    }
    if (field === 'totalCost') {
      const nextCost = value.replace(/[^0-9.,]/g, '').slice(0, 12)
      setForm((prev) => ({ ...prev, totalCost: nextCost }))
      return
    }
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const hasRequired = form.date && form.type && form.title.trim()
    if (!hasRequired) {
      setError(REQUIRED_MESSAGE)
      return false
    }
    setError('')
    return true
  }

  const saveEvent = async () => {
    if (!validateForm()) {
      return
    }

    const payload = {
      carId: currentCar.id,
      date: form.date,
      type: form.type,
      mileage: toNullableNumber(form.mileage),
      title: form.title.trim(),
      notes: form.notes.trim(),
      totalCost: toNullableNumber(form.totalCost),
    }

    if (isEditing) {
      await db.events.update(editingId, payload)
    } else {
      await db.events.add(payload)
    }

    await loadEvents(currentCar.id)
    closeDialog()
  }

  const deleteEvent = async (id) => {
    await db.events.delete(id)
    await loadEvents(currentCar.id)
  }

  const getTypeLabel = (value) => {
    const match = EVENT_TYPE_OPTIONS.find((option) => option.value === value)
    return match ? match.label : value
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Журнал событий
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Выбран автомобиль: {currentCar.brand} {currentCar.model}.
      </Typography>

      <Button variant="contained" onClick={openCreateDialog} sx={{ mb: 2 }}>
        Добавить событие
      </Button>

      {events.length === 0 ? (
        <Typography color="text.secondary">Пока нет событий для этого автомобиля.</Typography>
      ) : (
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '14%' }}>Дата</TableCell>
              <TableCell sx={{ width: '12%' }}>Тип</TableCell>
              <TableCell sx={{ width: '26%' }}>Заголовок</TableCell>
              <TableCell sx={{ width: '12%' }}>Пробег</TableCell>
              <TableCell sx={{ width: '14%' }}>Сумма</TableCell>
              <TableCell sx={{ width: '22%' }} align="right">
                Действия
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.date}</TableCell>
                <TableCell>{getTypeLabel(event.type)}</TableCell>
                <TableCell title={event.title}>
                  <Box
                    component="span"
                    sx={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {event.title}
                  </Box>
                </TableCell>
                <TableCell>{event.mileage ?? '-'}</TableCell>
                <TableCell>{event.totalCost ?? '-'}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => openEditDialog(event)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" color="error" onClick={() => deleteEvent(event.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Редактировать событие' : 'Новое событие'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Дата"
              type="date"
              value={form.date}
              onChange={handleChange('date')}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Тип события"
              select
              value={form.type}
              onChange={handleChange('type')}
              required
            >
              {EVENT_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Заголовок"
              value={form.title}
              onChange={handleChange('title')}
              helperText={`${form.title.length}/${MAX_TITLE_LENGTH}`}
              inputProps={{ maxLength: MAX_TITLE_LENGTH }}
              required
            />
            <TextField
              label="Пробег"
              value={form.mileage}
              onChange={handleChange('mileage')}
              inputProps={{ inputMode: 'numeric', maxLength: 9 }}
            />
            <TextField
              label="Сумма"
              value={form.totalCost}
              onChange={handleChange('totalCost')}
              helperText="Можно вводить число с точкой или запятой"
              inputProps={{ inputMode: 'decimal' }}
            />
            <TextField
              label="Примечание"
              value={form.notes}
              onChange={handleChange('notes')}
              multiline
              minRows={3}
            />
            {error ? <Typography color="error">{error}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Отмена</Button>
          <Button onClick={saveEvent} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
