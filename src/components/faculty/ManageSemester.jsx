import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import api from '../../common/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const ManageSemester = ({ fetchAcademicPeriod, academicPeriod }) => {
    const [openDialog, setOpenDialog] = useState(false)
    const [data, setData] = useState({})

    const getMaxDate = () => {
        const currentYear = dayjs().year(); 
        return dayjs(new Date(currentYear, 0, 1)); 
      };
    
    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        reset,
    } = useForm()

    const handleSubmitForm = (data) => {
        setOpenDialog(true)
        setData(data)
    }

    const onSubmit = async () => {
        if (!isValid) {
            errors.showMessages()
        }

        try {
            setOpenDialog(false)
            const date = new Date(data.year);
            const year = date.getFullYear();

            const formData = {
                semester: data.semester,
                year: year,
            }

            const response = await api.createNewSemester(formData)

            if (response.status === 201) {
                toast.success('Academic period has been updated', {
                    duration: 4000,
                    position: 'top-right',
                    style: {
                        background: '#4caf50',
                        color: '#fff',
                    }
                })
            } else {
                toast.error('Failed to update academic period', {
                    duration: 4000,
                    position: 'top-right',
                    style: {
                        background: '#f44336',
                        color: '#fff',
                    }
                })
            }
            fetchAcademicPeriod()
            reset({semester: '', year: null})
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div>
                <Grid container spacing={2} p={2}>
                    <Grid item xs={12}>
                        <Typography className='text-cyan-600 font-bold text-lg'>
                            Configure Academic Period
                        </Typography>
                        <Divider />
                        <Box className='p-3'>
                            <Typography className='text-gray-500 font-semibold'>
                                Configure the academic period for the school year
                            </Typography>
                            <Box className='mt-3 cursor-default'>
                                <Typography className='text-gray-500 font-bold'>
                                    Current Academic Period:&nbsp;
                                    <span className='text-cyan-600 font-bold'>
                                        {academicPeriod?.semester} - {academicPeriod?.year}
                                    </span>
                                </Typography>
                            </Box>

                            <form onSubmit={handleSubmit(handleSubmitForm)}>
                                <Grid container spacing={2} mt={1}>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <Controller
                                                name='semester'
                                                control={control}
                                                rules={{
                                                    required: 'Semester is required',
                                                }}
                                                render={({ field: { value, onChange } }) => (
                                                    <>
                                                        <InputLabel id="semester">Semester</InputLabel>
                                                        <Select
                                                            id="semester"
                                                            label="Semester"
                                                            value={value}
                                                            onChange={onChange}
                                                            error={Boolean(errors.position)}
                                                        >
                                                            <MenuItem value={'1ST SEMESTER'}>1ST SEMESTER</MenuItem>
                                                            <MenuItem value={'2ND SEMESTER'}>2ND SEMESTER</MenuItem>
                                                            <MenuItem value={'SUMMER SEMESTER'}>SUMMER SEMESTER</MenuItem>
                                                        </Select>
                                                    </>
                                                )}
                                            />
                                            {
                                                errors.semester && (
                                                    <Typography className='text-red-500'>
                                                        {errors.semester.message}
                                                    </Typography>
                                                )
                                            }
                                        </FormControl>

                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <Controller
                                                name='year'
                                                control={control}
                                                rules={{
                                                    required: 'School Year is required',
                                                }}
                                                render={({ field: { value, onChange } }) => (
                                                    <>
                                                    <DatePicker
                                                    minDate={dayjs(new Date('2023-01-01'))}
                                                    maxDate={getMaxDate()} 
                                                    views={['year']}
                                                    label='School Year'
                                                    value={value}
                                                    onChange={onChange}
                                                    error={Boolean(errors.schoolYear)}
                                                    inputFormat='YYYY'
                                                />
                                                    </>
                                                )}
                                            />
                                            {
                                                errors.schoolYear && (
                                                    <Typography className='text-red-500'>
                                                        {errors.schoolYear.message}
                                                    </Typography>
                                                )
                                            }
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} className='flex items-center justify-center'>
                                        <Button
                                            className='bg-cyan-600 text-white font-semibold'
                                            variant='contained'
                                            type='submit'
                                        >
                                            Save
                                        </Button>
                                    </Grid>
                                </Grid>
                            </form>
                        </Box>
                        <Divider />
                    </Grid>
                </Grid>

                <Dialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    maxWidth='xs'
                >
                    <DialogContent className='p-2'>
                        <DialogTitle>
                            Are you sure you want to update the academic period?
                        </DialogTitle>
                        <DialogActions>
                            <Button variant='outlined' onClick={() => setOpenDialog(false)}>Cancel</Button>
                            <Button variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={() => onSubmit()}>Confirm</Button>
                        </DialogActions>
                    </DialogContent>
                </Dialog>
            </div>
        </LocalizationProvider>
    )
}

export default ManageSemester