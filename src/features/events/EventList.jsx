import { Box, Button, Typography } from '@mui/material'

export function EventList({ currentCar }) {
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

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Журнал событий
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Выбран автомобиль: {currentCar.brand} {currentCar.model}. Здесь будет список ТО, ремонтов и
        заправок.
      </Typography>
      <Button variant="contained">Добавить событие</Button>
    </Box>
  )
}
