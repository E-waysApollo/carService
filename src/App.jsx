import { useState } from 'react'
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material'
import './App.css'
import { CarList } from './features/cars/CarList'
import { EventList } from './features/events/EventList'

function App() {
  const [tab, setTab] = useState('journal')

  const handleChange = (_event, value) => {
    setTab(value)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="h1">
            Car Service Journal
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Tabs value={tab} onChange={handleChange} sx={{ mb: 2 }}>
          <Tab label="Журнал" value="journal" />
          <Tab label="Автомобили" value="cars" />
        </Tabs>

        <Box sx={{ minHeight: 220 }}>
          {tab === 'journal' ? <EventList /> : <CarList />}
        </Box>
      </Container>
    </Box>
  )
}

export default App
