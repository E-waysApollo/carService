import {
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation'
import BuildIcon from '@mui/icons-material/Build'

const getEventTypeConfig = (type) => {
  switch (type) {
    case 'maintenance':
      return {
        label: 'ТО',
        color: 'success',
        icon: <BuildIcon fontSize="small" />,
      }
    case 'repair':
      return {
        label: 'Ремонт',
        color: 'warning',
        icon: <BuildIcon fontSize="small" />,
      }
    case 'refuel':
      return {
        label: 'Заправка',
        color: 'info',
        icon: <LocalGasStationIcon fontSize="small" />,
      }
    default:
      return { label: type, color: 'default', icon: null }
  }
}

export function EventCard({ event, expanded, onToggleExpand, onEdit, onDelete }) {
  const typeConfig = getEventTypeConfig(event.type)
  const hasNotes = !!event.notes?.trim()

  const formattedDate = new Date(event.date)
    .toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .replace(' г.', '')

  const formattedMileage = event.mileage ? event.mileage.toLocaleString('ru-RU') : '—'
  const formattedCost = event.totalCost ? `${event.totalCost.toLocaleString('ru-RU')} ₽` : '—'

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ pb: 2 }}>
        <Stack spacing={1.75}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack>
              <Typography variant="h5" component="div" fontWeight={700} sx={{ fontSize: '1.35rem' }}>
                {formattedDate}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {new Date(event.date).toLocaleDateString('ru-RU', { weekday: 'long' })}
              </Typography>
            </Stack>

            <Chip
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {typeConfig.icon}
                  {typeConfig.label}
                </Stack>
              }
              color={typeConfig.color}
              variant="filled"
              sx={{ fontWeight: 600, px: 2, py: 1.5 }}
            />
          </Stack>

          <Divider />

          <Typography variant="h6" sx={{ fontSize: '1.1rem', lineHeight: 1.35, fontWeight: 600 }}>
            {event.title}
          </Typography>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <DirectionsCarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Пробег
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formattedMileage} км
                </Typography>
              </Stack>
            </Stack>

            <Stack alignItems="flex-end">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Сумма
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.main" sx={{ fontSize: '1.35rem' }}>
                {formattedCost}
              </Typography>
            </Stack>
          </Stack>

          {hasNotes && (
            <>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                onClick={onToggleExpand}
                sx={{
                  cursor: 'pointer',
                  py: 1.5,
                  px: 2,
                  mt: 1,
                  backgroundColor: 'background.default',
                  borderRadius: 2,
                  border: 'none',
                  '&.MuiStack-root': {
                    paddingLeft: 0,
                    paddingBottom: 0,
                    border: 'none',
                  },
                }}
              >
                <Stack direction="row" alignItems="center">
                  <ExpandMoreIcon
                    sx={{
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                      color: 'text.secondary',
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1.5 }}>
                    Примечание
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                    title="Редактировать"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    title="Удалить"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>

              <Collapse
                in={expanded}
                timeout="auto"
                unmountOnExit
                sx={{
                  '& .MuiCollapse-wrapperInner': {
                    backgroundColor: '#f3eaea',
                    borderRadius: '12px',
                    marginTop: '8px',
                  },
                }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    '&.MuiPaper-root': {
                      backgroundColor: 'transparent',
                      border: 'none',
                      boxShadow: 'none',
                    },
                  }}
                >
                  <CardContent sx={{ py: 2.5, px: 3, backgroundColor: 'transparent' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.7,
                        color: 'text.primary',
                      }}
                    >
                      {event.notes}
                    </Typography>
                  </CardContent>
                </Card>
              </Collapse>
            </>
          )}

          {!hasNotes && (
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
              <IconButton color="primary" onClick={onEdit} title="Редактировать">
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={onDelete} title="Удалить">
                <DeleteIcon />
              </IconButton>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
