import { Box, Typography } from '@mui/material'

const formatCount = (count) => {
  const absCount = Math.abs(Number(count) || 0)
  const mod100 = absCount % 100
  const mod10 = absCount % 10

  if (mod100 >= 11 && mod100 <= 14) {
    return `${count} событий`
  }
  if (mod10 === 1) {
    return `${count} событие`
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} события`
  }
  return `${count} событий`
}

const formatMoneyRu = (value) => `${Math.round(value).toLocaleString('ru-RU')} ₽`

const formatMileageDeltaRu = (value) => {
  if (!Number.isFinite(value)) {
    return '—'
  }
  return `${Math.round(value).toLocaleString('ru-RU')} км`
}

export function MonthSectionHeader({ monthLabel, stats }) {
  const countText = formatCount(stats?.count ?? 0)
  const totalCostText = formatMoneyRu(stats?.totalCost ?? 0)
  const mileageDeltaText = formatMileageDeltaRu(stats?.mileageDelta)

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 8,
        zIndex: (theme) => theme.zIndex.appBar - 2,
        bgcolor: 'primary.main',
        border: 1,
        borderColor: 'primary.dark',
        borderRadius: 3,
        px: 1.5,
        py: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <Typography variant="body2" fontWeight={700} color="primary.contrastText">
        {`${monthLabel} • ${countText} • ${totalCostText} • ${mileageDeltaText}`}
      </Typography>
    </Box>
  )
}
