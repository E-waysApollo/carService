import { IconButton, TableCell, TableRow } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

const ELLIPSIS_CELL_SX = {
  maxWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

export function CarCard({ car, onEdit, onDelete }) {
  return (
    <TableRow>
      <TableCell title={car.brand} sx={ELLIPSIS_CELL_SX}>
        {car.brand}
      </TableCell>
      <TableCell title={car.model} sx={ELLIPSIS_CELL_SX}>
        {car.model}
      </TableCell>
      <TableCell>{car.year || '-'}</TableCell>
      <TableCell title={car.licensePlate || '-'} sx={ELLIPSIS_CELL_SX}>
        {car.licensePlate || '-'}
      </TableCell>
      <TableCell title={String(car.currentMileage)} sx={ELLIPSIS_CELL_SX}>
        {car.currentMileage}
      </TableCell>
      <TableCell align="right">
        <IconButton aria-label="edit" onClick={onEdit}>
          <EditIcon />
        </IconButton>
        <IconButton aria-label="delete" color="error" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}
