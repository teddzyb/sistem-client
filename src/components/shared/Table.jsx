import { Box } from '@mui/material'
import { DataGrid, GridOverlay } from '@mui/x-data-grid'
import CustomToolbar from './CustomToolbar'

const NoRowsOverlay = () => {
    return (
        <GridOverlay>
            <div style={{ padding: '10px' }}>No rows to display</div>
        </GridOverlay>
    );
};

const Table = ({ rows, columns, isLoading }) => {

  return (
      <Box className='overflow-auto' sx={{ height: '100%', width: '100%', marginTop: '1em' }} boxShadow={1}>
          <DataGrid
            loading={isLoading}
               autoHeight
              rows={rows}
              columns={columns}
              slots={{
                  toolbar: CustomToolbar,
                  noRowsOverlay: NoRowsOverlay
              }}
              initialState={{
                  pagination: {
                      paginationModel: {
                          pageSize: 7,
                      },
                  },
                }}
              pageSizeOptions={[5, 7, 10]}
          />
        </Box>
  )
}

export default Table