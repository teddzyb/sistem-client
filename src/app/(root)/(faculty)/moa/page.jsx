'use client'
import api from '@/src/common/api'
import Table from '@/src/components/shared/Table'
import { AddCircleOutline, DeleteOutlineOutlined, FileOpenOutlined, ModeEditOutlineOutlined } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, Grid, IconButton, TextField, Tooltip, Typography, Autocomplete } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { Controller, get, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/src/common/firebaseConfig'
import { adminPageClient, getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient'
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ManageMOATypes from '@/src/components/faculty/ManageMOATypes'

const MOA = () => {
  loginIsRequiredClient()
  adminPageClient()

  const [allMoas, setAllMoas] = useState([])
  const [isOpenForm, setIsOpenForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [row, setRow] = useState({})
  const [isOpenViewDialog, setIsOpenViewDialog] = useState(false)
  const [preview, setPreview] = useState('')

  const [manageTypesDialogOpen, setManageTypesDialogOpen] = useState(false)
  const [moaTypes, setMOATypes] = useState([])

  const [currentUser, setCurrentUser] = useState()

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
    clearErrors,
    setError,
    reset,
  } = useForm()

  const onSubmit = async (data) => {
    try {
      // console.log(data)
      setIsSubmitting(true)

      let file

      if (data.file !== undefined) {
        row?.filePath && await handleDeleteFile()
        file = await handleUpload(data.file)

      } else {
        file = {
          fileURL: row.fileURL,
          filePath: row.filePath,
        }
      }


      const userName = `${currentUser.firstName} ${currentUser.lastName}`

      const form = {
        type: !getValues('type') ? row.type : getValues('type'),
        companyName: !getValues('companyName') ? row.companyName : getValues('companyName'),
        dateSigned: !getValues('dateSigned') ? row.dateSigned : dayjs(getValues('dateSigned')),
        expiryDate: !getValues('expiryDate') ? row.expiryDate : dayjs(getValues('expiryDate')),
        uploadedBy: userName,
        file: file,
      }

      const expiryDate = getValues('expiryDate') ? dayjs(getValues('expiryDate')) : dayjs(row.expiryDate);
      const dateSigned = getValues('dateSigned') ? dayjs(getValues('dateSigned')) : dayjs(row.dateSigned);

      if (expiryDate.isSame(dateSigned) || expiryDate.isBefore(dateSigned)) {
          setError('expiryDate', {
              type: 'manual',
              message: 'Expiry Date must be beyond Date Signed',
          });
          setIsSubmitting(false);
          return;
      }
      let response

      if (isEditing) {

        response = await api.updateMOA(row.id, form)

        if (response.status === 200) {
          setIsEditing(false)
          toast.success('MOA updated successfully', {
            position: 'bottom-right',
            duration: 3000,
            style: {
              color: '#fff',
              backgroundColor: '#4caf50',
            }
            
          })

        } else {
          toast.error('MOA update failed', {
            position: 'bottom-right',
            duration: 3000,
            style: {
              backgroundColor: '#f44336',
              color: '#fff',
            }
          })
        }

      } else {
        response = await api.createMOA(form)

        if (response.status === 201) {
          toast.success('MOA created successfully', {
            position: 'bottom-right',
            duration: 3000,
            style: {
              color: '#fff',
              backgroundColor: '#4caf50',
            }

          })
        } else {
          toast.error('MOA creation failed', {
            position: 'bottom-right',
            duration: 3000,
            style: {
              backgroundColor: '#f44336',
              color: '#fff',
            }
          })
        }
      }

      setIsSubmitting(false)
      setIsOpenForm(false)
      setPreview('')
      fetchAllMoas()
      reset()
    } catch (error) {
      console.log(error)
    }
  }

  const handleUpload = async (file) => {
    if (file) {
      try {
        // Create a storage reference
      const uniqueId = new Date().getTime(); // get the current timestamp
      const storageRef = ref(storage, `sistem-files/moa-files/${uniqueId}-${file.name}`);
        if (file.filePath !== undefined) {
          await handleDeleteFile()
        }

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the file URL
        const fileURL = await getDownloadURL(snapshot.ref);
        const filePath = snapshot.ref.fullPath

        const fileUpload = {
          fileURL: fileURL,
          filePath: filePath,
        }

        return fileUpload
      } catch (error) {
        console.error('Error uploading file:', error.message);
      }
    } else {
      console.warn('No file selected.');
    }
  }

  const handleDeleteFile = async () => {
    const storageRef = ref(storage, row.filePath);
    deleteObject(storageRef).then(() => {
      // console.log('File deleted successfully');
    }).catch((error) => {
      console.error('Error deleting file:', error);
    });
  }

  const handleDeleteMOA = async () => {
    try {

      const response = await api.deleteMOA(row.id)

      await handleDeleteFile()

      if (response.status === 200) {
        toast.success('MOA deleted successfully', {
          position: 'bottom-right',
          duration: 3000,
          style: {
          backgroundColor: '#4caf50',
          color: '#fff',
          }
        })
      } else {
        toast.error('MOA deletion failed', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            backgroundColor: '#f44336',
            color: '#fff',
          }
        })
      }

      setIsOpenDeleteDialog(false)
      fetchAllMoas()
    } catch (error) {
      console.log(error)
    }
  }

  const handleCancel = () => {
    setIsOpenForm(false)
    setIsEditing(false)
    setPreview('')
    reset()
    clearErrors()
  }

  const fetchMOATypes = useCallback(async () => {
    try {
      const response = await api.getMOATypes()

      if (response.status === 200) {
        setMOATypes(response.data?.moaTypes)
        const rows = response.data?.moaTypes.map((row) => ({
          id: row._id,
          name: row.name,
        }))
        setMOATypes(rows)}
    } catch (error) {
      
    }
  }, [])

  const fetchAllMoas = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getMOA()
      const rows = response.data?.moa.map((row) => ({
        id: row._id,
        type: row.type,
        companyName: row.companyName,
        dateSigned: row.dateSigned,
        expiryDate: row.expiryDate,
        uploadedBy: row.uploadedBy,
        uploadedDate: row.updatedAt,
        fileURL: row.file.fileURL,
        filePath: row.file.filePath,
      }))
      setAllMoas(rows)
      setIsLoading(false)

    } catch (error) {
      console.log(error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const user = await getUser()
      setCurrentUser(user)
      fetchAllMoas()
      fetchMOATypes()
    }
    init()
  }, [])

  const columns = [
    {
      field: 'companyName',
      headerName: 'Company Name',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
    },
    {
      field: 'dateSigned',
      headerName: 'Date Signed',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      renderCell: (params) => {
        const date = params.row.dateSigned
        return (
          <>
            {dayjs(date).format('MMMM DD, YYYY')}
          </>
        )
      }
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      renderCell: (params) => {
        const date = params.row.expiryDate
        return (
          <>
            {dayjs(date).format('MMMM DD, YYYY')}
          </>
        )
      }
    },
    {
      field: 'uploadedBy',
      headerName: 'File Uploaded By',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
    },
    {
      field: 'uploadedDate',
      headerName: 'Date Updated',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      renderCell: (params) => {
        const date = params.row.uploadedDate
        return (
          <>
            {dayjs(date).format('MMMM DD, YYYY')}
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
          <>
            <Tooltip title='View File'>
              <IconButton
                onClick={() => {
                  setRow(row);
                  setIsOpenViewDialog(true);
                }}
              >
                <FileOpenOutlined color='primary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit'>
              <IconButton
                onClick={() => {
                  setRow(row);
                  setIsEditing(true);
                  setIsOpenForm(true);
                }}
              >
                <ModeEditOutlineOutlined color='warning' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton
                onClick={() => {
                  setRow(row);
                  setIsOpenDeleteDialog(true);
                }}
              >
                <DeleteOutlineOutlined color='error' />
              </IconButton>
            </Tooltip>
          </>
        )
      }
    }
  ]

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className='w-full'>
        <Grid item xs={6} md={8} lg={10} sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-4em' }}>
          <Button
            variant='contained'
            className='bg-cyan-600 text-white hover:bg-cyan-700'
            onClick={() => setIsOpenForm(true)}
            startIcon={<CloudUploadIcon />}
            sx={{
              width: 'auto',
              '@media (max-width: 500px)': {
                width: '40%',
              }
            }}
          >
            Upload MOA
          </Button>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography className='text-cyan-600 font-bold text-lg'>
              MOA
            </Typography>
            <Typography className='text-gray-600 font-bold '>
              List of MOAs
            </Typography>

          </Grid>
          <Grid item xs={12}>
            <Button
              size='small'
              onClick={() => setManageTypesDialogOpen(true)}
              variant='contained'
              className='bg-cyan-600 text-white hover:bg-cyan-700'
              startIcon={<AddCircleOutline />}
            >
              Add/ View Agreement Types
            </Button>
          </Grid>
        </Grid>
        <Box className='w-full'>
          <Table rows={allMoas} columns={columns} isLoading={isLoading} />
        </Box>

        <Dialog
          maxWidth='sm'
          open={isOpenForm}
          onClose={() => setIsOpenForm(false)}
        >
          <DialogTitle>
            {isEditing ? 'Edit MOA' : 'Upload New MOA'}
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2} p={1}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='type'
                      control={control}
                      rules={{
                        required: isEditing ? false : 'Type is required',
                      }}
                      render={({ field: { onChange, value } }) => (
                        [
                          <Autocomplete
                            value={value}
                            freeSolo
                            onChange={(event, newValue) => {
                              onChange(newValue);
                            }}
                            defaultValue={isEditing ? row.type : ''}
                            options={moaTypes.map((option) => option.name)}
                            getOptionLabel={(option) => option}
                            renderInput={(params) => <TextField {...params} label="MOA Type" error={Boolean(errors.courseStatus)} />}
                          />
                        ]
                      )}
                    />
                    {
                      errors.type && (
                        <FormHelperText error>
                          {errors.type.message}
                        </FormHelperText>
                      )
                    }
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='companyName'
                      rules={{
                        required: isEditing ? false : 'Company Name is required',
                      }}
                      control={control}
                      render={({ field: { onChange } }) => (
                        <TextField
                          defaultValue={isEditing ? row.companyName : ''}
                          onChange={onChange}
                          label='Company Name'
                          fullWidth
                          error={!!errors.companyName}
                        />
                      )}
                    />
                    {
                      errors.companyName && (
                        <FormHelperText error>
                          {errors.companyName.message}
                        </FormHelperText>
                      )
                    }
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='dateSigned'
                      control={control}
                      // rules={{
                      //   required: 'Date Signed is required',
                      // }}
                      render={({ field: { onChange } }) => (
                        <DatePicker
                          onChange={onChange}
                          defaultValue={isEditing ? dayjs(row.dateSigned) : null}
                          label='Date Signed'
                          fullWidth
                        />
                      )}
                    />
                    {
                      errors.dateSigned && (
                        <FormHelperText error>
                          {errors.dateSigned.message}
                        </FormHelperText>
                      )
                    }
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='expiryDate'
                      control={control}
                      // rules={{
                      //   required: 'Expiry Date is required',
                      // }}
                      render={({ field: { onChange } }) => (
                        <DatePicker
                          onChange={onChange}
                          defaultValue={isEditing ? dayjs(row.expiryDate) : null}
                          label='Expiry Date'
                          fullWidth
                        />
                      )}
                    />
                    {
                      errors.expiryDate && (
                        <FormHelperText error>
                          {errors.expiryDate.message}
                        </FormHelperText>
                      )
                    }
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl>
                    <Controller
                      name='file'
                      control={control}
                      rules={{
                        required: isEditing ? false : 'File is required',
                      }}
                    
                      render={({ field: { onChange, onBlur, value, ref } }) => (
                        <>
                          <label htmlFor="file">File (png, jpeg, jpg, pdf)</label>
                          <Button variant='contained' component='label' className="bg-cyan-600 text-white hover:bg-cyan-700">
                            Upload File
                            <input
                              name='file'
                              type='file'
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  onChange(file);
                                  setPreview(file.name)
                                }
                              }}
                              onBlur={onBlur}
                              ref={ref}
                              hidden
                              accept='application/pdf, image/*'
                            />
                          </Button>
                          <span>
                            {preview}
                          </span>
                        </>
                      )}
                    />
                    {errors.file && (
                      <FormHelperText error>
                        {errors.file.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <Button fullWidth variant='outlined' color='inherit' onClick={handleCancel}>Cancel</Button>
                </Grid>
                <Grid item xs={6}>
                  <Button fullWidth variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={handleSubmit(onSubmit)}>
                    {isSubmitting ? 'Loading...' : 'Submit'}
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
              Are you sure you want to delete this MOA?
            </DialogTitle>
            <DialogActions>
              <Button variant='outlined' onClick={() => setIsOpenDeleteDialog(false)}>Cancel</Button>
              <Button variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={handleDeleteMOA}>Confirm</Button>
            </DialogActions>
          </Box>
        </Dialog>

        <Dialog
          open={isOpenViewDialog}
          onClose={() => setIsOpenViewDialog(false)}
          maxWidth='lg'
        >
          <DialogTitle>
            View MOA File
          </DialogTitle>
          <DialogContent className='w-[75vw]'>
            {
              row.fileURL?.includes('.pdf') ? (
                <iframe
                  src={row.fileURL}
                  width='100%'
                  height='750px'
                  title='MOA File'
                />
              ) : (
                <img
                  src={row.fileURL}
                  width='100%'
                  height='750px'
                  alt='MOA File'
                />
              )
            }
          </DialogContent>
        </Dialog>

        <ManageMOATypes manageTypesDialogOpen={manageTypesDialogOpen} moaTypes={moaTypes} setManageTypesDialogOpen={setManageTypesDialogOpen} fetchMOATypes={fetchMOATypes}/>
      </div>
    </LocalizationProvider>

  )

}

export default MOA