import { useCallback, useEffect, useState } from 'react'
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  FormControl,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material'
import './App.css'
import { CarList } from './features/cars/CarList'
import { EventList } from './features/events/EventList'
import { getCars } from './features/cars/services/carsService'

const STORAGE_KEY = 'carService.currentCarId'

function App() {
  const [tab, setTab] = useState('journal')
  const [cars, setCars] = useState([])
  const [currentCarId, setCurrentCarId] = useState(null)

  const handleChange = (_event, value) => {
    setTab(value)
  }

  const loadCars = useCallback(async () => {
    const items = await getCars()
    setCars(items)
    return items
  }, [])

  useEffect(() => {
    const init = async () => {
      const items = await loadCars()
      if (items.length === 0) {
        setCurrentCarId(null)
        localStorage.removeItem(STORAGE_KEY)
        return
      }

      const storedId = Number(localStorage.getItem(STORAGE_KEY))
      const hasStored = items.some((car) => car.id === storedId)
      const selectedId = hasStored ? storedId : items[0].id
      setCurrentCarId(selectedId)
      localStorage.setItem(STORAGE_KEY, String(selectedId))
    }

    init()
  }, [loadCars])

  const handleCurrentCarChange = (event) => {
    const nextId = Number(event.target.value)
    setCurrentCarId(nextId)
    localStorage.setItem(STORAGE_KEY, String(nextId))
  }

  const syncCarsAndSelection = async () => {
    const items = await loadCars()
    if (items.length === 0) {
      setCurrentCarId(null)
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    const exists = items.some((car) => car.id === currentCarId)
    if (!exists) {
      const firstId = items[0].id
      setCurrentCarId(firstId)
      localStorage.setItem(STORAGE_KEY, String(firstId))
    }
  }

  const currentCar = cars.find((car) => car.id === currentCarId) ?? null

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar sx={{ alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            Car Service Journal
          </Typography>
          {cars.length > 0 ? (
            <FormControl
              size="small"
              sx={{
                width: 300,
                maxWidth: '100%',
                bgcolor: 'white',
                borderRadius: 1,
              }}
            >
                <Select
                  value={currentCarId ?? ''}
                  onChange={handleCurrentCarChange}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Текущий автомобиль' }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return 'Текущий автомобиль'
                    }
                    const selectedCar = cars.find((car) => car.id === selected)
                    return selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : 'Текущий автомобиль'
                  }}
                  MenuProps={{
                    disablePortal: false,
                    slotProps: { paper: { sx: { maxHeight: 320 } } },
                  }}
                >
                  {cars.map((car) => (
                    <MenuItem key={car.id} value={car.id}>
                      {car.brand} {car.model}
                    </MenuItem>
                  ))}
                </Select>
            </FormControl>
          ) : null}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Tabs value={tab} onChange={handleChange} sx={{ mb: 2 }}>
          <Tab label="Журнал" value="journal" />
          <Tab label="Автомобили" value="cars" />
        </Tabs>

        <Box sx={{ minHeight: 220 }}>
          {tab === 'journal' ? (
            <EventList currentCar={currentCar} />
          ) : (
            <CarList onCarsChanged={syncCarsAndSelection} />
          )}
        </Box>
      </Container>
    </Box>
  )
}

export default App
