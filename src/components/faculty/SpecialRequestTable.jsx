import { Box } from '@mui/material'
import { DataGrid, GridOverlay } from '@mui/x-data-grid'
import CustomToolbar from '../shared/CustomToolbar'

const NoRowsOverlay = () => {
    return (
        <GridOverlay>
            <div style={{ padding: '10px' }}>No rows to display</div>
        </GridOverlay>
    );
};

const SpecialRequestTable = ({ rows, columns, isLoading, filterValue }) => {

  return (
      <Box className='overflow-auto' boxShadow={1}>
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
              filterModel={{
                  items: [{ field: 'concern', operator: 'contains', value: filterValue }],
              }}
          />
        </Box>
  )
}

export default SpecialRequestTable