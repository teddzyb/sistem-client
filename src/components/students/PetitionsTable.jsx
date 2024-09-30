import React, { useCallback, useEffect, useState } from 'react'
import Table from '../shared/Table';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { AiOutlineEye } from 'react-icons/ai';
import moment from 'moment';
import { useRouter } from 'next/navigation';

const PetitionsTable = ({rows, isLoading}) => {
    const router = useRouter();

    const columns = [
        {
            field: 'courseStatus',
            headerName: 'Course Status',
            flex: 1.25,
            headerClassName: 'bg-teal-600 text-white',
            align: 'center',
            headerAlign: 'center',
        },
        {
            field: 'course',
            headerName: 'Course',
            flex: 2,
            headerClassName: 'bg-teal-600 text-white',
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: 'dateCreated',
            headerName: 'Date Created',
            flex: 1,
            headerClassName: 'bg-teal-600 text-white',
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                return (
                    <Typography className='text-sm'>
                        {moment(params.value).format('ll')}
                    </Typography>
                )
            }
        },
        {
            field: 'studentsJoined',
            headerName: 'Number of Students Joined',
            flex: 1,
            headerClassName: 'bg-teal-600 text-white',
            align: 'center',
            headerAlign: 'center',
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            headerClassName: 'bg-teal-600 text-white',
            align: 'center',
            headerAlign: 'center',
            sortable: false,
            renderCell: (params) => {
                const row = params.row;
                let textColor = row.status === 'Rejected' ? 'red' : row.status === 'Endorsed by Coordinator' ? 'green' : (row.status === 'Approved by Chair' ? 'green' : 'black');
                return (
                    <Typography className='text-sm' sx={{ color: textColor }}>
                        {row.approvedBy == null ? <span style={{ color: 'black' }}> Pending </span> : (row.status)}
                    </Typography>
                )
            }
        },

        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1,
            align: 'center',
            headerAlign: 'center',
            sortable: false,
            headerClassName: 'bg-teal-600 text-white',
            renderCell: (params) => {
                const row = params.row;
                return (
                    <Box className='flex justify-between'>
                        <Tooltip title='View Details'>
                            <IconButton
                                onClick={() => {
                                    router.push(`/enrollment/petitions-tutorials/${row.id}`);
                                }}
                            >
                                <AiOutlineEye className='text-green-600' />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];

  return (
    <div>
        <Table rows={rows} columns={columns} isLoading={isLoading} />
    </div>
  )
}

export default PetitionsTable