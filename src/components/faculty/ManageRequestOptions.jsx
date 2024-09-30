'use client'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, FormHelperText, Grid, IconButton, InputAdornment,  Switch,  TextField, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import api from '../../common/api'
import { Controller, set, useForm } from 'react-hook-form'
import { AddCircleOutline, DeleteOutlineOutlined, ModeEditOutlined } from '@mui/icons-material'
import Table from '../shared/Table'
import toast from 'react-hot-toast'

const ManageRequestOptions = ({ fetchRequests, isLoading, specialRequests, fetchAcademicPeriod, academicPeriod, isEnabledRequest }) => {

    const [isOpenForm, setIsOpenForm] = useState(false)
    const [eligibleYearLevels, setEligibleYearLevels] = useState(['1st Years', '2nd Years', '3rd Years', '4th Years'])
    const [selectedEligibleYearLevels, setSelectedEligibleYearLevels] = useState([])
    const [isEditing, setIsEditing] = useState(false)
    const [row, setRow] = useState({})
    const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)
    const [rowToDelete, setRowToDelete] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [enabled, setEnabled] = useState(isEnabledRequest)
    const [openDialog, setOpenDialog] = useState(false)

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        clearErrors,
        reset,
    } = useForm()

    const removeEligibleYearLevels = (year) => {
        setSelectedEligibleYearLevels(selectedEligibleYearLevels.filter((y) => y !== year))
    }

    const addEligibleYearLevels = (year) => {
        setSelectedEligibleYearLevels([...selectedEligibleYearLevels, year])
    }

    const handleSelectRow = (row) => {
        setRow(row)
        setSelectedEligibleYearLevels(row.eligibleYearLevels)
    }

    const handleCheck = (event) => {
        setEnabled(event.target.checked)
    }

    const handleEnable = async () => {
        try {
            setOpenDialog(false)
            const semester = academicPeriod._id

            if (!enabled){
                const response = await api.disableSpecialRequests(semester)

                if (response.status === 200) {
                    setOpenDialog(false)
                    toast.success('Special requests has been disabled', {
                        duration: 4000, position: 'top-right', style: {
                            backgroundColor: '#4caf50',
                            color: '#fff',
                        }
                    })
                } else {
                    toast.error('Failed to disable special requests', {
                        duration: 4000, position: 'top-right', style: {
                            backgroundColor: '#f44336',
                            color: '#fff',
                        }
                    })
                }
            } else {
                const response = await api.enableSpecialRequests(semester)

                if (response.status === 200) {
                    setOpenDialog(false)
                    toast.success('Special requests has been enabled', {
                        duration: 4000, position: 'top-right', style: {
                            backgroundColor: '#4caf50',
                            color: '#fff',
                        }
                    })
                } else {
                    toast.error('Failed to enable special requests', {
                        duration: 4000, position: 'top-right', style: {
                            backgroundColor: '#f44336',
                            color: '#fff',
                        }
                    })
                }
            }
           fetchAcademicPeriod()
        } catch (error) {
            console.log(error)
        }
    }

    const handleDeleteRequest = async () => {
        const response = await api.deleteSpecialRequestOption(rowToDelete.id)
        if (response.status === 200) {
            fetchRequests()
            setIsOpenDeleteDialog(false)
            toast.success('Successfully deleted special request', {
                duration: 4000, position: 'bottom-right', style: {
                    backgroundColor: '#4caf50',
                    color: '#fff',
                }
            })
        } else {
            toast.error('Failed to delete special request', {
                duration: 4000, position: 'bottom-right', style: {
                    backgroundColor: '#f44336',
                    color: '#fff',
                }
            })
        }
    }

    const onSubmit = async (data) => {
        try {
            setIsSubmitting(true)
            const formData = {
                requestTitle: data.requestTitle,
                eligibleYearLevels: selectedEligibleYearLevels,
            }

            if (data.requestTitle === '' || selectedEligibleYearLevels.length === 0) {
                toast.error('Please fill out all fields', {
                    duration: 4000, position: 'bottom-right', style: {
                        backgroundColor: '#f44336',
                        color: '#fff',
                    }
                })
                return
            }

            let response

            if (isEditing) {

                response = await api.updateSpecialRequestOption(row.id, formData)
                if (response.status === 200) {
                    setIsEditing(false)
                    toast.success('Successfully updated special request', {
                        duration: 4000, position: 'bottom-right', style: {
                            backgroundColor: '#4caf50',
                            color: '#fff',
                        }
                    })
                } else {
                    toast.error('Failed to update special request', {
                        duration: 4000, position: 'bottom-right', style: {
                            backgroundColor: '#f44336',
                            color: '#fff',
                        }
                    })
                }
            } else {

                const isRequestTitleExist = specialRequests.filter((request) => request.requestTitle === data.requestTitle).length > 0
                if (isRequestTitleExist) {
                    toast.error('Request Title already exists', {
                        duration: 4000, position: 'bottom-right', style: {
                            backgroundColor: '#f44336',
                            color: '#fff',
                        }
                    })
                    return
                }

                response = await api.createSpecialRequestOption(formData)
                if (response.status === 200) {

                    toast.success('Successfully created special request', {
                        duration: 4000, position: 'bottom-right', style: {
                            backgroundColor: '#4caf50',
                            color: '#fff',
                        }
                    })
                } else {
                    toast.error('Failed to create special request', {
                        duration: 4000, position: 'bottom-right', style: {
                            backgroundColor: '#f44336',
                            color: '#fff',
                        }
                    })
                }
            }

            fetchRequests()
            setSelectedEligibleYearLevels([])
            reset()
            setIsOpenForm(false)
            setIsSubmitting(false)

        } catch (error) {
            console.log(error)
        }
    }

    const handleCancel = () => {
        setIsOpenForm(false)
        setIsEditing(false)
        setSelectedEligibleYearLevels([])
        reset()
        clearErrors()
    }

    const columns = [
        {
            field: 'requestTitle',
            headerName: 'Request Title',
            flex: 1,
            headerClassName: 'bg-cyan-600 text-white',
            align: 'center', // This will center the cell content
            headerAlign: 'center',
        },
        {
            field: 'eligibleYearLevels',
            headerName: 'Eligible Year Levels',
            flex: 1,
            headerClassName: 'bg-cyan-600 text-white',
            align: 'center', // This will center the cell content
            headerAlign: 'center',
            renderCell: (params) => {
                const row = params.row;
                return (
                    <>
                        {
                            row.eligibleYearLevels.map((year, index) => (
                                <Chip key={index} label={year} variant="outlined" />
                            ))
                        }
                    </>
                )
            }
        },

        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1,
            align: 'center', // This will center the cell content
            headerAlign: 'center',
            headerClassName: 'bg-cyan-600 text-white',
            renderCell: (params) => {
                const row = params.row;
                return (
                    <Box className='flex justify-between'>
                        <Tooltip title='Edit Details'>
                            <IconButton
                                onClick={() => {
                                    setIsOpenForm(true);
                                    setIsEditing(true);
                                    handleSelectRow(row);
                                }}
                            >
                                <ModeEditOutlined color='warning' />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Delete'>
                            <IconButton
                                onClick={() => {
                                    setRowToDelete(row);
                                    setIsOpenDeleteDialog(true);
                                }}
                            >
                                <DeleteOutlineOutlined color='error' />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )
            }
        }
    ];

    useEffect(() => {
        setEnabled(isEnabledRequest)
     }, [isEnabledRequest])

    return (
        <div>
            <Box>
                <Grid container spacing={2} p={2}>
                    <Grid item xs={12}>
                        <Typography className='text-cyan-600 font-bold text-lg'>
                            Configure Special Requests
                        </Typography>
                        <Divider />
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={10}>
                                <Box className='flex items-center p-3'>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={enabled}
                                                onChange={handleCheck}
                                                color='primary'
                                            />
                                        }
                                    />
                                    <Typography className='text-gray-500 font-semibold '>
                                        Enabling this will allow students to make special requests.
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={2} className='flex items-center justify-center'>
                                <Button
                                    onClick={() => setOpenDialog(true)}
                                    className='bg-cyan-600 text-white hover:bg-cyan-700 ml-5'
                                >
                                    Save
                                </Button>
                            </Grid>
                        </Grid>
                        
                        <Divider />
                    </Grid>
                </Grid>
            </Box>
            <Box className='w-full h-auto'>
                <Grid container spacing={2} p={3}>
                    <Grid item xs={12} sm={9}>
                        <Typography className='text-gray-500 font-semibold'>
                            List of all special requests that can be chosen by students when making a request.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                            <Button
                                variant='contained'
                                className='bg-cyan-600 text-white hover:bg-cyan-700'
                                onClick={() => setIsOpenForm(prev => !prev)}
                                startIcon={<AddCircleOutline />}
                            >
                                Create New
                            </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Table rows={specialRequests} columns={columns} isLoading={isLoading} />
                    </Grid>
                </Grid>
            </Box>

            <Dialog
                maxWidth='sm'
                open={isOpenForm}
                onClose={() => setIsOpenForm(false)}
            >
                <DialogTitle>
                    {
                        isEditing ? 'Edit Special Reques t' : 'Create New Special Request'
                    }
                </DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={2} p={1}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <Controller
                                        name='requestTitle'
                                        control={control}
                                        rules={{
                                            required: isEditing ? false : 'Request Title is required',
                                        }}
                                        render={({ field: { onChange } }) => (
                                            <TextField
                                                label='Request Title'
                                                fullWidth
                                                required
                                                onChange={onChange}
                                                defaultValue={isEditing ? row.requestTitle : ''}
                                            // error={!!errors.requestTitle}
                                            // helperText={errors?.requestTitle?.message}
                                            />
                                        )}
                                    />
                                    {
                                        errors.requestTitle && (
                                            <FormHelperText error>
                                                {errors.requestTitle.message}
                                            </FormHelperText>
                                        )
                                    }
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <Typography mb={2}>Select Eligible Year Levels Below</Typography>
                                    <TextField
                                        label='Eligible Year Levels'
                                        fullWidth
                                        helperText={errors?.eligibleYearLevels?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position='start'>
                                                    {
                                                        selectedEligibleYearLevels.map((year, index) => (
                                                            <Chip label={year} key={index} variant="outlined" onDelete={() => removeEligibleYearLevels(year)} />
                                                        ))
                                                    }
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                {
                                    eligibleYearLevels.filter((year) => !selectedEligibleYearLevels.includes(year)).map((year, index) => (
                                        <Chip label={year} key={index} variant="outlined" onClick={() => addEligibleYearLevels(year)} />
                                    ))
                                }
                            </Grid>
                            <Grid item xs={6}>
                                <Button fullWidth variant='outlined' color='inherit' onClick={handleCancel}>Cancel</Button>

                            </Grid>
                            <Grid item xs={6}>
                                <Button fullWidth variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || (!isValid && !isEditing)}>
                                    Submit
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isOpenDeleteDialog}
                onClose={() => setIsOpenDeleteDialog(false)}
                maxWidth='xs'
            >
                <Box className='p-2'>
                    <DialogTitle>
                        Are you sure you want to delete this request?
                    </DialogTitle>
                    <DialogActions >
                        <Button variant='outlined' onClick={() => setIsOpenDeleteDialog(false)}>Cancel</Button>
                        <Button variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={handleDeleteRequest}>Confirm</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth='xs'
            >
                <DialogContent className='p-2'>
                    <DialogTitle>
                        Are you sure you want to {enabled ? 'enable' : 'disable'} special requests applications?
                    </DialogTitle>
                    <DialogActions>
                        <Button variant='outlined' onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={() => handleEnable()}>Confirm</Button>
                    </DialogActions>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ManageRequestOptions