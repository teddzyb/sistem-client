'use client'

import { adminPageClient, getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient'
import api from '@/src/common/api'
import Table from '@/src/components/shared/Table'
import { ArrowBackOutlined, ModeEditOutlined } from '@mui/icons-material'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import moment from 'moment'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { Controller, set, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const PetitionDetails = () => {
  loginIsRequiredClient()
  adminPageClient()

  const [petitionId, setPetitionId] = useState('')
  const [petitionDetails, setPetitionDetails] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [currentUser, setCurrentUser] = useState({})
  const [isApproved, setIsApproved] = useState(false)
  const [approveDialogOpen, setapproveDialogOpen] = useState(false)
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false)
  const [openWaitingList, setOpenWaitingList] = useState(false)
  const [waitList, setWaitList] = useState([])

  const [remarks, setRemarks] = useState('')
  const [allRemarks, setAllRemarks] = useState([])

  const [isRejected, setIsRejected] = useState(false)

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
    clearErrors,
    setError,
    reset,
  } = useForm()

  const router = useRouter()
  const params = router.query.id

  const handleRemarks = async () => {
    try {

      const formData = {
        remarks: remarks,
        userId: currentUser._id,
      }

      const response = await api.addRemarksToPetition(petitionId, formData)

      if (response.status === 200) {
        toast.success('Remarks added successfully', {
          duration: 3000,
          position: 'bottom-right',
          style: {
            backgroundColor: 'green',
            color: '#fff',
          }
        })
      } else {
        toast.error('Something went wrong', {
          duration: 3000,
          position: 'bottom-right',
          style: {
            backgroundColor: 'red',
            color: '#fff',
          }
        })
      }
      fetchPetitionDetails()

    } catch (error) {
      console.log(error)
    }
  }

  const fetchPetitionDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getPetition(params)
      if (response.status === 200) {
        const petitionDetails = response?.data?.petition
        setPetitionDetails(petitionDetails)
        setAllRemarks(petitionDetails.remarks)

        let rows = []

        petitionDetails.studentsJoined.forEach(item => {
          if (item.student) {
            rows.push({
              id: item.student.idNumber,
              hasConfirmed: item.hasLeft ? 'Withdrawn' : (!petitionDetails.statusTrail.coordinatorApproval.approvedBy ? 'To be reviewed by coordinator' : (item.hasConfirmed ? 'Confirmed' : 'Pending')),
              studentName: `${item.student.firstName} ${item.student.lastName}`,
              email: item.student.email,
              program: item.student.program,
              yearLevel: item.student.yearLevel,
              dateJoined: moment(item.dateJoined).format('ll')
            })
          }
        })

        const isRejected = (petitionDetails.statusTrail.coordinatorApproval.approvedBy != null && !petitionDetails.statusTrail.coordinatorApproval.isApproved) || (petitionDetails.statusTrail.chairApproval.approvedBy != null && !petitionDetails.statusTrail.chairApproval.isApproved)

        setIsRejected(isRejected)

        rows.sort((a, b) => new Date(b.dateJoined) - new Date(a.dateJoined))

        setRows(rows)

        let waitingList = []

        petitionDetails.waitingList.forEach(item => {
          if (item.student) {
            waitingList.push({
              id: item.student.idNumber,
              studentName: `${item.student.firstName} ${item.student.lastName}`,
              email: item.student.email,
              program: item.student.program,
              yearLevel: item.student.yearLevel,
              _id: item.student._id,
              dateJoined: moment(item.dateJoined).format('ll')
            })
          }
        })
        rows.sort((a, b) => new Date(b.dateJoined) - new Date(a.dateJoined))
        setWaitList(waitingList)

        setIsLoading(false)


      }
    } catch (error) {
      console.log(error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const user = await getUser()
      setCurrentUser(user);

      fetchPetitionDetails();
      setPetitionId(params);
    }
    init();
  }, []);

  const onSubmit = async (data) => {
    try {
      const dateNow = new Date(data.deadline)

      if (!data.deadline) {
        toast.error('Deadline is required', {
          duration: 3000,
          position: 'top-center',
          style: {
            backgroundColor: 'red',
            color: '#fff',
          }
        })
        return
      }

      if (dateNow < new Date()) {
        setError('deadline', {
          type: 'manual',
          message: 'Deadline must be a future date'
        })
        return
      }

      const response = await api.setPetitionDeadline(petitionId, data)

      if (response.status === 200) {
        toast.success('Deadline set successfully', {
          duration: 3000,
          position: 'bottom-right',
          style: {
            backgroundColor: 'green',
            color: '#fff',
          }
        })
        setDeadlineDialogOpen(false)
        fetchPetitionDetails()
      } else {
        toast.error('Something went wrong', {
          duration: 3000,
          position: 'bottom-right',
          style: {
            backgroundColor: 'red',
            color: '#fff',
          }
        })
      }

    } catch (error) {
      console.log(error)
    }
  }

  const handleApprove = async (isApproved) => {
    try {
      let response

      const formData = {
        isApproved: isApproved,
        user: currentUser._id,
      }

      if (currentUser?.position?.toLowerCase() === 'department chair') {
        response = await api.approvePetitionByChair(petitionId, formData)
      } else {
        response = await api.approvePetitionByCoordinator(petitionId, formData)
        if (isApproved) {
          setDeadlineDialogOpen(true)
        }
      }

      if (response.status === 200) {
        toast.success('Petition approved successfully', {
          duration: 3000,
          position: 'bottom-right',
          style: {
            backgroundColor: 'green',
            color: '#fff',
          }
        })

      } else {
        toast.error('Something went wrong', {
          duration: 3000,
          position: 'bottom-right',
          style: {
            backgroundColor: 'red',
            color: '#fff',
          }
        })
      }
      setapproveDialogOpen(false)
      fetchPetitionDetails()
    } catch (error) {
      console.log(error)
    }
  }

  const columns = [
    {
      field: 'hasConfirmed',
      headerName: 'Join Status',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
    },
    {
      field: 'id', headerName: 'ID Number', flex: 1, headerClassName: 'bg-cyan-600 text-white', align: 'center', // This will center the cell content
      headerAlign: 'center',
    },
    {
      field: 'studentName',
      headerName: 'Student Name',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'program',
      headerName: 'Program',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'yearLevel',
      headerName: 'Year Level',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'dateJoined',
      headerName: 'Date Joined',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    }
  ]

  const ApprovalButtons = ({ setIsApproved, setapproveDialogOpen }) => (
    <Grid container spacing={2}>
      <Grid item xs={4} sm={6} md={4}>
        <Button
          fullWidth
          size='small'
          variant='contained'
          className='bg-cyan-600 text-white hover:bg-cyan-700'
          onClick={() => {
            setapproveDialogOpen(true);
            setIsApproved(true);
          }}
        >
          Approve
        </Button>
      </Grid>
      <Grid item xs={4} sm={6} md={4}>
        <Button
          fullWidth
          size='small'
          variant='contained'
          className='bg-red-600 text-white hover:bg-red-700'
          onClick={() => {
            setapproveDialogOpen(true);
            setIsApproved(false);
          }}
        >
          Reject
        </Button>
      </Grid>
    </Grid>
  );

  return (
    <div className='w-full'>
      <Typography className='text-cyan-600 font-bold text-lg'>
        <IconButton onClick={() => router.back()}>
          <ArrowBackOutlined />
        </IconButton>
        Petition Details
      </Typography>
      {isLoading ?
        <Box className="flex flex-col justify-center items-center h-64 space-y-5">
          <CircularProgress />
          <Typography className="text-teal-600 text-lg">
            Loading...
          </Typography>
        </Box>
        :
        <Grid container spacing={1} className='ml-5 mt-2'>
          <Grid item xs={12} md={9}>
            <Grid container spacing={1}>
              <Grid item xs={12} md={6}>
                <Typography className='text-gray-500 font-bold '>
                  Course: &nbsp;&nbsp;
                  <span className='text-gray-600 font-bold '>
                    {petitionDetails?.course?.courseCode} {petitionDetails?.course?.courseDesc}
                  </span>
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography className='text-gray-500 font-bold '>
                  Course Status: &nbsp;&nbsp;
                  <span className='text-gray-600 font-bold '>
                    {petitionDetails?.courseStatus == 'Petition' ? 'Petition' :
                      petitionDetails?.studentsJoined?.length < 5 ? 'Tutorial' : 'Petition'
                    }

                  </span>
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography className='text-gray-500 font-bold '>
                  Created By: &nbsp;&nbsp;
                  <span className='text-gray-600 font-bold '>
                    {petitionDetails?.createdBy?.firstName} {petitionDetails?.createdBy?.lastName}
                  </span>
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography className='text-gray-500 font-bold '>
                  Date Created: &nbsp;&nbsp;
                  <span className='text-gray-600 font-bold '>
                    {moment(petitionDetails?.createdAt).format('ll')}
                  </span>
                </Typography>
              </Grid>
            </Grid>
            <Grid container spacing={1} mt={2}>

              <Grid item xs={12} md={6}>
                <Typography className='text-gray-500 font-bold '>
                  Status: &nbsp;&nbsp;
                  {
                    petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy == null &&
                    <span className='text-gray-600 font-bold '>
                      Pending
                    </span>
                  }
                </Typography>
                {
                  petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy != null &&
                  <>
                    {
                      petitionDetails?.statusTrail?.coordinatorApproval?.isApproved
                        ?
                        <Typography className='text-green-600 font-bold '>
                          Endorsed by {petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy?.firstName} {petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy?.lastName}&nbsp;-&nbsp;
                          {(moment(petitionDetails?.statusTrail?.coordinatorApproval?.dateApproved).format('ll'))}
                        </Typography>
                        :
                        <Typography className='text-red-600 font-bold '>
                          Rejected  by {petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy?.firstName} {petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy?.lastName}&nbsp;-&nbsp;
                          {moment(petitionDetails?.statusTrail?.coordinatorApproval?.dateApproved).format('ll')}
                        </Typography>}
                  </>

                }
                {
                  petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy != null && petitionDetails?.statusTrail?.chairApproval.dateApproved != null &&
                  (petitionDetails?.statusTrail?.chairApproval.isApproved
                    ?
                    <Typography className='text-green-600 font-bold '>
                      Approved by Department Chair&nbsp;-&nbsp;
                      {moment(petitionDetails?.statusTrail?.chairApproval?.dateApproved).format('ll')}
                    </Typography>
                    :
                    <Typography className='text-red-600 font-bold '>
                      Rejected by Department Chair&nbsp;-&nbsp;
                      {moment(petitionDetails?.statusTrail?.chairApproval?.dateApproved).format('ll')}
                    </Typography>)
                }
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography className='text-gray-500 font-bold mb-4'>
                  Remarks:
                </Typography>

                {allRemarks?.length > 0
                  ?
                  allRemarks.map((remark, index) => (
                    <>

                      <Typography key={index} className='text-gray-600 font-bold '>
                        {remark.remark} - {moment(remark.dateCreated).format('ll')}
                      </Typography>
                      <Typography key={index} className='text-gray-600 font-bold mb-4'>
                        {remark.createdBy?.firstName} {remark.createdBy?.lastName}                                     </Typography>

                    </>
                  ))

                  :
                  <Typography className='text-gray-400 font-bold '>
                    No remarks for now
                  </Typography>
                }

              </Grid>

              {
                petitionDetails?.deadline &&
                <Grid item xs={12}>
                  <Typography className='text-gray-500 font-bold '>
                    Deadline: &nbsp;&nbsp;
                    <span className='text-red-600 font-bold '>
                      {moment(petitionDetails?.deadline).format('lll')}
                    </span>
                    {
                      !petitionDetails?.statusTrail?.chairApproval?.dateApproved && !isRejected &&
                      <Tooltip title='Edit Deadline'>
                        <ModeEditOutlined
                          color='warning'
                          className='cursor-pointer ml-5 -mb-1'
                          onClick={() => setDeadlineDialogOpen(true)}
                        />
                      </Tooltip>
                    }
                  </Typography>
                </Grid>
              }
            </Grid>

          </Grid>
          <Grid item xs={12} md={3}>
            {
              currentUser?.user_type?.toLowerCase() === 'faculty' && !petitionDetails?.statusTrail?.chairApproval?.dateApproved && !isRejected && <>
                <Typography className='text-gray-500 font-bold '>
                  Options:
                </Typography>
                {
                  !currentUser?.position?.includes('Coordinator')
                    ?
                    (
                      !petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy
                        ?
                        <Typography className='text-gray-600 font-bold '>
                          Waiting for Coordinator's Approval
                        </Typography>
                        :
                        <ApprovalButtons setIsApproved={setIsApproved} setapproveDialogOpen={setapproveDialogOpen} />
                    )
                    :
                    (
                      !petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy
                        ?
                        <ApprovalButtons setIsApproved={setIsApproved} setapproveDialogOpen={setapproveDialogOpen} />
                        :
                        <Typography className='text-gray-600 font-bold '>
                          Waiting for Department Chair's Evaluation
                        </Typography>
                    )
                }
                <Box className='w-9/12 mt-3' >
                  <Typography className='text-gray-500 font-bold '>
                    Add remarks:
                  </Typography>
                  <Typography className='text-gray-500 font-bold '>
                    <textarea
                      onChange={(e) => setRemarks(e.target.value)}
                      className='w-full mt-2 h-20 outline-none border border-gray-300 rounded-md p-2'
                      placeholder='Type your remarks here...'
                    />
                  </Typography>
                  <Button
                    fullWidth
                    size='small'
                    disabled={remarks === ''}
                    onClick={handleRemarks}
                    variant='contained'
                    className='bg-cyan-600 text-white hover:bg-cyan-700 mt-3'
                  >
                    Save
                  </Button>
                </Box>

              </>
            }
          </Grid>
        </Grid>}
      <Grid container spacing={2} p={2} mt={10}>
        <Grid item xs={12} md={4}>
          <Typography className='text-gray-500 font-bold'>
            Total Students Joined: {petitionDetails?.studentsJoined?.filter(item => !item.hasLeft).length}
          </Typography>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            variant='outlined' className='border-teal-600 text-teal-600'
            size='small'
            fullWidth
            onClick={() => setOpenWaitingList(true)}
          >
            Waiting List
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Table isLoading={isLoading} rows={rows} columns={columns} />
        </Grid>
      </Grid>

      <Dialog
        open={approveDialogOpen}
        onClose={() => setapproveDialogOpen(false)}
        sx={{ p: 3 }}
      >
        <DialogTitle>
          Are you sure you want to {isApproved ? 'Approve' : 'Reject'} this petition?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => handleApprove(isApproved)} variant='contained' className='bg-teal-600 text-white hover:bg-teal-700'>
            Yes
          </Button>
          <Button onClick={() => setapproveDialogOpen(false)} variant='contained' className='bg-red-600 text-white hover:bg-red-700'>
            No
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openWaitingList}
        onClose={() => setOpenWaitingList(false)}
        sx={{ p: 3 }}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>
          <Typography className='text-gray-500 font-semibold text-lg'>
            Waiting List
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Table isLoading={isLoading} rows={waitList} columns={columns} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deadlineDialogOpen}
        // onClose={() => setDeadlineDialogOpen(false)}
        sx={{ p: 4, height: '50vh' }}
        maxWidth='md'
        fullWidth

      >
        <DialogTitle>
          <Typography className='text-gray-500 font-semibold text-lg'>
            Please indicate a deadline for the students to confirm the petition.
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <FormControl fullWidth>
                <Controller
                  name='deadline'
                  control={control}
                  rules={{
                    required: 'This field is required',
                  }}
                  render={({ field: { onChange } }) => (
                    <DateTimePicker
                      onChange={onChange}
                      label='Deadline'
                      fullWidth
                      views={['year', 'month', 'day', 'hours', 'minutes']}
                    />
                  )}
                />
                {
                  errors.deadline && (
                    <Typography className='text-red-600'>
                      {errors.deadline.message}
                    </Typography>
                  )
                }
              </FormControl>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button
              variant='contained'
              className='bg-cyan-600 text-white hover:bg-cyan-700 m-3'
              disabled={!isValid}
              type='submit'
            >
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  )

}


export default PetitionDetails