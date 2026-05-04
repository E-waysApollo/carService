import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import BuildIcon from '@mui/icons-material/Build'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import SpeedIcon from '@mui/icons-material/Speed'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { getMonthlyReport } from '../services/eventsService'

const pad2 = (n) => String(n).padStart(2, '0')

const getLocalYyyyMm = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`

const formatMonthTitleRu = (yyyyMm) => {
  const [yRaw, mRaw] = yyyyMm.split('-')
  const year = Number(yRaw)
  const monthIndex0 = Number(mRaw) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex0)) {
    return 'Сводка за месяц'
  }

  const d = new Date(year, monthIndex0, 1)
  const monthName = d.toLocaleString('ru-RU', { month: 'long' })
  const capitalized = monthName.length ? monthName[0].toUpperCase() + monthName.slice(1) : monthName
  return `Сводка за ${capitalized} ${year}`
}

const formatMoneyRu = (value) => {
  if (!Number.isFinite(value)) {
    return '—'
  }
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`
}

const formatKm = (value) => {
  if (!Number.isFinite(value)) {
    return '—'
  }
  return `${Math.round(value).toLocaleString('ru-RU')} км`
}

const formatMoneyPerKm = (value) => {
  if (!Number.isFinite(value)) {
    return '—'
  }
  return `${value.toFixed(2).replace('.', ',')} ₽/км`
}

const SummaryPill = ({ icon, label, value, subValue, iconBg = 'primary.main', iconColor = 'primary.contrastText' }) => {
  return (
    <Card elevation={2} sx={{ borderRadius: 3, flex: '1 1 220px' }}>
      <CardContent sx={{ py: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              bgcolor: iconBg,
              color: iconColor,
              flex: '0 0 auto',
            }}
          >
            {icon}
          </Box>

          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.15 }}>
              {value}
            </Typography>
            {subValue ? (
              <Box sx={{ typography: 'caption', color: 'text.secondary' }}>{subValue}</Box>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function MonthlySummary({ carId, eventsVersion }) {
  const monthOptions = useMemo(() => {
    const now = new Date()
    const current = getLocalYyyyMm(now)
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prev = getLocalYyyyMm(prevDate)
    return [
      { value: current, label: formatMonthTitleRu(current).replace('Сводка за ', '') },
      { value: prev, label: formatMonthTitleRu(prev).replace('Сводка за ', '') },
    ]
  }, [])

  const [selectedMonth, setSelectedMonth] = useState(() => monthOptions[0]?.value ?? getLocalYyyyMm(new Date()))
  const [report, setReport] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const next = await getMonthlyReport(carId, selectedMonth)
      if (!cancelled) {
        setReport(next)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [carId, selectedMonth, eventsVersion])

  const mom = report?.monthOverMonthPct
  const momIcon =
    mom === null ? (
      <TrendingFlatIcon fontSize="small" />
    ) : mom > 0 ? (
      <TrendingUpIcon fontSize="small" />
    ) : mom < 0 ? (
      <TrendingDownIcon fontSize="small" />
    ) : (
      <TrendingFlatIcon fontSize="small" />
    )

  const momColor =
    mom === null ? 'text.secondary' : mom > 0 ? 'error.main' : mom < 0 ? 'success.main' : 'text.secondary'

  const momText =
    mom === null
      ? 'Нет данных за прошлый месяц'
      : `${mom > 0 ? '+' : ''}${mom}% к прошлому месяцу`

  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Typography variant="h6" fontWeight={800}>
          Месячная сводка
        </Typography>

        <TextField
          select
          size="small"
          label="Период"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarMonthIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        >
          {monthOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={1.25}>
        <Box sx={{ flex: '1 1 320px', minWidth: 260 }}>
          <SummaryPill
            icon={<AccountBalanceWalletIcon />}
            label="Общие расходы"
            value={formatMoneyRu(report?.spend?.total)}
            subValue={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box sx={{ color: momColor, display: 'grid', placeItems: 'center' }}>{momIcon}</Box>
                <Box sx={{ color: momColor, fontWeight: 800 }}>{momText}</Box>
              </Stack>
            }
            iconBg="primary.main"
            iconColor="primary.contrastText"
          />
        </Box>

        <SummaryPill
          icon={<BuildIcon />}
          label="ТО"
          value={formatMoneyRu(report?.spend?.maintenance)}
          subValue={`${report?.spend?.maintenancePct ?? 0}%`}
          iconBg="#e8f5e9"
          iconColor="#2e7d32"
        />

        <SummaryPill
          icon={<BuildIcon />}
          label="Ремонт"
          value={formatMoneyRu(report?.spend?.repair)}
          subValue={`${report?.spend?.repairPct ?? 0}%`}
          iconBg="#fff3e0"
          iconColor="#ef6c00"
        />

        <SummaryPill
          icon={<LocalGasStationIcon />}
          label="Заправки"
          value={formatMoneyRu(report?.spend?.refuel)}
          subValue={`${report?.spend?.refuelPct ?? 0}%`}
          iconBg="#e3f2fd"
          iconColor="#1565c0"
        />
      </Stack>

      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack direction="row" flexWrap="wrap" gap={2} alignItems="stretch" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: '1 1 240px', minWidth: 220 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'grey.100',
                  color: 'text.primary',
                  flex: '0 0 auto',
                }}
              >
                <SpeedIcon />
              </Box>
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Пробег за месяц
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.15 }}>
                  {formatKm(report?.mileageDeltaKm)}
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: '1 1 240px', minWidth: 220 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'grey.100',
                  color: 'text.primary',
                  flex: '0 0 auto',
                }}
              >
                <ShowChartIcon />
              </Box>
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Стоимость 1 км
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.15 }}>
                  {formatMoneyPerKm(report?.costPerKm)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  По сумме расходов месяца и пробегу за месяц
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
