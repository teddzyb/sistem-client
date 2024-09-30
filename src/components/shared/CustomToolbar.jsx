import { GridToolbarContainer, GridToolbarFilterButton, GridToolbarQuickFilter } from "@mui/x-data-grid";

 const CustomToolbar = () => {
    return (
        <GridToolbarContainer className='flex justify-between items-center p-4'>
            <GridToolbarFilterButton />
        </GridToolbarContainer>
    );
}

export default CustomToolbar