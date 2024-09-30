'use client'

import React, { useState } from 'react'
import { Dialog, Typography, DialogTitle, DialogContent, Slide, Button, FormControl, TextField, DialogActions } from '@mui/material'
import Table from '../shared/Table';
import api from '@/src/common/api';
import toast from 'react-hot-toast'
import { AddCircleOutline, Close } from '@mui/icons-material';

const ManageMOATypes = ({ manageTypesDialogOpen, moaTypes, setManageTypesDialogOpen, fetchMOATypes }) => {
    const [moaType, setMoaType] = useState('')
    const [addMOATypeDialogOpen, setAddMOATypeDialogOpen] = useState(false)
    const [row, setRow] = useState()
    const [isEditing, setIsEditing] = useState(false)
    const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = useState(false)

    const columns = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            headerClassName: 'bg-cyan-600 text-white',
            align: 'center', // This will center the cell content
            headerAlign: 'center',

        },
        {
            field: 'action', headerName: 'Action', flex : 1,
            headerClassName: 'bg-cyan-600 text-white',
            align: 'center',
            headerAlign: 'center',

            renderCell: (params) => (
                <>
                    <Button
                        onClick={() => {
                            setIsEditing(true);
                            setRow(params.row);
                            setAddMOATypeDialogOpen(true);
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        onClick={() => {
                            // Delete MOA Type
                            setRow(params.row);
                            setDeleteConfirmationDialogOpen(true);
                        }}
                    >
                        Delete
                    </Button>
                </>
            )
        },
    ]

    const handleAddMOATypeDialogOpen = () => {
        setAddMOATypeDialogOpen(true)
        setManageTypesDialogOpen(false)
    }

    const handleCloseAddMOATypeDialog = () => {
        setAddMOATypeDialogOpen(false)
        setManageTypesDialogOpen(true)
    }

    const handleEditMOAType = async () => {
        try {
            const formData = {
                name: moaType === '' ? row.name : moaType
            }
            const response = await api.editMOAType(row.id, formData)

            if (response.status === 200) {
                toast.success('Edited successfully', {
                    position: 'bottom-right',
                    duration: 3000,
                    style: {
                        backgroundColor: '#4caf50',
                        color: '#fff',
                    }
                })
                setAddMOATypeDialogOpen(false)
                fetchMOATypes()

            } else {
                toast.error('Failed to edit', {
                    position: 'bottom-right',
                    duration: 3000,
                    style: {
                        backgroundColor: '#f44336',
                        color: '#fff',
                    }
                })
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleAddMOAType = async () => {
        try {
            const formData = {
                name: moaType
            }
            const response = await api.createMOAType(formData)
            if (response.status === 201) {
                toast.success('Added successfully', {
                    position: 'bottom-right',
                    duration: 3000,
                    style: {
                        backgroundColor: '#4caf50',
                        color: '#fff',
                    }
                })
                setAddMOATypeDialogOpen(false)
                fetchMOATypes()
            } else {
                toast.error('Failed to add', {
                    position: 'bottom-right',
                    duration: 3000,
                    style: {
                        backgroundColor: '#f44336',
                        color: '#fff',
                    }
                })
            }


        } catch (error) {
            console.log(error)
        }
    }

    const handleDeleteMOAType = async () => {
        try {
            const response = await api.deleteMOAType(row.id)
            if (response.status === 200) {
                toast.success('Deleted successfully', {
                    position: 'bottom-right',
                    duration: 3000,
                    style: {
                        backgroundColor: '#4caf50',
                        color: '#fff',
                    }
                })
                setDeleteConfirmationDialogOpen(false)
                fetchMOATypes()
            } else {
                toast.error('Failed to delete', {
                    position: 'bottom-right',
                    duration: 3000,
                    style: {
                        backgroundColor: '#f44336',
                        color: '#fff',
                    }
                })
            }
        } catch (error) {
            console.log(error)
        }
    }


    return (
        <>
            <Dialog
                fullWidth
                maxWidth='md'
                open={manageTypesDialogOpen}
            >
                <DialogTitle className='flex items-center justify-between'>
                    <Typography className='text-cyan-600 font-bold text-lg'>
                        Manage Agreement Types
                    </Typography>
                    <Button
                        size='small'
                        onClick={() => setManageTypesDialogOpen(false)}
                    >
                        <Close />
                    </Button>
                </DialogTitle>
                <DialogContent>
                    <Button
                        size='small'
                        className='bg-cyan-600 text-white hover:bg-cyan-700'
                        onClick={handleAddMOATypeDialogOpen}
                        startIcon={<AddCircleOutline />}
                    >Add New Agreement
                    </Button>
                    <Table columns={columns} rows={moaTypes} />
                </DialogContent>

            </Dialog>
            <Dialog
                fullWidth
                maxWidth='sm'
                open={addMOATypeDialogOpen}
                onClose={handleCloseAddMOATypeDialog}
            >
                <DialogTitle>
                    <Typography className='text-cyan-600 font-bold text-lg'>
                        {isEditing ? 'Edit MOA Type' : 'Add MOA Type'}
                    </Typography>
                </DialogTitle>
                <DialogContent className='flex flex-col items-center justify-center space-y-2 p-4'>
                    <FormControl fullWidth>
                        <TextField
                            defaultValue={isEditing ? row.name : ''}
                            onChange={(e) => setMoaType(e.target.value)}
                            label='Type of MOA'
                            required={isEditing ? false : true}
                        />
                </FormControl>
                <Button
                    disabled={moaType === '' ? true : false}
                    variant='contained'
                    className='bg-cyan-600 text-white hover:bg-cyan-700'
                    onClick={isEditing ? handleEditMOAType : handleAddMOAType}
                >
                    {isEditing ? 'Edit' : 'Add'}
                </Button>
                </DialogContent>
            </Dialog>

            <Dialog
                fullWidth
                maxWidth='sm'
                open={deleteConfirmationDialogOpen}
                onClose={() => setDeleteConfirmationDialogOpen(false)}
            >
                <DialogTitle>
                    Are you sure you want to delete {row?.name}?
                </DialogTitle>
                <DialogActions>
                    <Button variant='outlined' onClick={() => setDeleteConfirmationDialogOpen(false)}>Cancel</Button>
                    <Button variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={handleDeleteMOAType}>Confirm</Button>
                </DialogActions>
            </Dialog>
        </>

    )
}

export default ManageMOATypes