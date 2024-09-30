import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../common/api'

const ManagePetitions = ({ fetchAcademicPeriod, academicPeriod, isPetitionEnabled }) => {
    const [enabled, setEnabled] = useState(false);
    const [openDialog, setOpenDialog] = useState(false)

    const handleCheck = (event) => {
        setEnabled(event.target.checked)
    }

    const handleEnable = async () => {
        try {
            setOpenDialog(false)
            const semester = academicPeriod._id

            if (enabled) {
                const response = await api.enablePetitions(semester)
                if (response.status === 200) {
                    toast.success('Petitions has been enabled', {
                        duration: 4000,
                        position: 'top-right',
                        style: {
                            background: '#4caf50',
                            color: '#fff',
                        }
                    })
                } else {
                    toast.error('Failed to enable petitions', {
                        duration: 4000,
                        position: 'top-right',
                        style: {
                            background: '#f44336',
                            color: '#fff',
                        }
                    })
                }

            } else {
                const response = await api.disablePetitions(semester)
                if (response.status === 200) {
                    toast.success('Petitions has been disabled', {
                        duration: 4000,
                        position: 'top-right',
                        style: {
                            background: '#4caf50',
                            color: '#fff',
                        }
                    })
                } else {
                    toast.error('Failed to disable petitions', {
                        duration: 4000,
                        position: 'top-right',
                        style: {
                            background: '#f44336',
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

    useEffect(() => {
        setEnabled(isPetitionEnabled)
    }, [isPetitionEnabled])

    return (
        <div>
            <Grid container spacing={2} p={2}>
                <Grid item xs={12}>
                    <Typography className='text-cyan-600 font-bold text-lg'>
                        Configure Petitions
                    </Typography>
                    <Divider />
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={10}>
                            <Box className='flex items-center p-3'>
                                <Switch
                                    checked={enabled}
                                    onChange={handleCheck}
                                    color='primary'
                                />

                                <Typography className='text-gray-500 font-semibold '>
                                    Enabling this will allow students to make petitions.
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

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth='xs'
            >
                <DialogContent className='p-2'>
                    <DialogTitle>
                        Are you sure you want to {enabled ? 'enable' : 'disable'} petitions?
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

export default ManagePetitions