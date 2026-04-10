import { Box, Button, Typography } from '@mui/material'

export function CarList() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Автомобили
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Здесь будет список автомобилей и форма добавления/редактирования.
      </Typography>
      <Button variant="contained">Добавить автомобиль</Button>
    </Box>
  )
}
