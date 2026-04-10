import { Box, Button, Typography } from '@mui/material'

export function EventList() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Журнал событий
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Здесь будет список событий ТО, ремонта и заправок для выбранного автомобиля.
      </Typography>
      <Button variant="contained">Добавить событие</Button>
    </Box>
  )
}
