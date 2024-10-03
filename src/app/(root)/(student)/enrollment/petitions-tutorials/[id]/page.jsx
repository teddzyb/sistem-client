'use client'

import { getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient'
import api from '@/src/common/api'
import Table from '@/src/components/shared/Table'
import { ArrowBackOutlined } from '@mui/icons-material'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Typography } from '@mui/material'
import moment from 'moment'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const PetitionDetails = () => {
  loginIsRequiredClient()

  const [petitionId, setPetitionId] = useState('')
  const [petitionDetails, setPetitionDetails] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [currentUser, setCurrentUser] = useState()
  const [isUserBanned, setIsUserBanned] = useState(false)

  const [isEndorsedByCoordinator, setIsEndorsedByCoordinator] = useState(false)
  const [isEndorsedByChair, setIsEndorsedByChair] = useState(false)
  const [isRejected, setIsRejected] = useState(false)
  const [isFull, setIsFull] = useState(false)

  const [isJoined, setIsJoined] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [openWaitingList, setOpenWaitingList] = useState(false)
  const [waitList, setWaitList] = useState([])
  const [isInWaiting, setIsInWaiting] = useState(false)
  const [waitDialog, setWaitDialog] = useState(false)

  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)

  const [remarks, setRemarks] = useState([])

  const router = useRouter()
  const params = router.query.id

  const fetchPetitionDetails = useCallback(async (currentUser) => {
    try {
      setIsLoading(true)
      const response = await api.getPetition(params)
      if (response.status === 200) {

        const petitionDetails = response?.data?.petition
        setPetitionDetails(petitionDetails)
        setRemarks(petitionDetails.remarks)

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
        setRows(rows)

        const isLab = petitionDetails.course.isLab
        const isFull = petitionDetails.studentsJoined.length >= (isLab ? 30 : 40)
        setIsFull(isFull)

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
        setWaitList(waitingList)


        const isEndorsedByCoordinator = petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy != null && petitionDetails?.statusTrail?.coordinatorApproval?.isApproved;
        setIsEndorsedByCoordinator(isEndorsedByCoordinator);


        const isEndorsedByChair = petitionDetails?.statusTrail?.chairApproval.dateApproved != null && petitionDetails?.statusTrail?.chairApproval.isApproved;
        setIsEndorsedByChair(isEndorsedByChair);

        const isRejected = (petitionDetails?.statusTrail?.coordinatorApproval?.approvedBy != null &&
          !petitionDetails?.statusTrail?.coordinatorApproval?.isApproved) || (petitionDetails?.statusTrail?.chairApproval?.dateApproved != null &&
            !petitionDetails?.statusTrail?.chairApproval?.isApproved);
        setIsRejected(isRejected);

        const isJoined = rows.find(student => student.id === currentUser?.idNumber);
        setIsJoined(!!isJoined);

        const isInWaiting = waitList.find(student => student?._id === currentUser?._id);
        setIsInWaiting(!!isInWaiting);

        const isConfirmed = petitionDetails?.studentsJoined.find(student => student?.student?._id === currentUser?._id)?.hasConfirmed;
        setIsConfirmed(isConfirmed);

      }

      setIsLoading(false)
    } catch (error) {
      console.log(error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const user = await getUser()
      setCurrentUser(user)
      setIsUserBanned(user.banToPetition)
      fetchPetitionDetails(user);
      setPetitionId(params);
    }
    init()
  }, []);

  const handleJoin = async () => {
    try {
      if (!rows.find(student => student.id === currentUser?.idNumber)) {
        const formData = {
          student: currentUser._id
        }

        const response = await api.joinPetition(petitionId, formData)

        if (response?.status == 200) {
          toast.success(`Successfully joined petition for ${petitionDetails?.course.courseCode} ${petitionDetails?.course.courseDesc}`, {
            position: 'bottom-right',
            duration: 3000,
            style: {
              background: '#4caf50',
              color: '#fff'
            }
          })
          fetchPetitionDetails()

        } else {
          toast.error('Error joining petition', {
            position: 'bottom-right',
            duration: 3000,
            style: {
              background: '#f44336',
              color: '#fff'
            }
          })
        }
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }


  const handleLeave = async () => {
    try {
      const formData = {
        student: currentUser._id
      }


      const response = await api.leavePetition(petitionId, formData)

      if (response?.status === 200) {

        toast.success(`Successfully left petition for ${petitionDetails?.course.courseCode} ${petitionDetails?.course.courseDesc}`, {
          position: 'bottom-right',
          duration: 3000,
          style: {
            background: '#4caf50',
            color: '#fff'
          }
        })
        fetchPetitionDetails()
        router.push('/enrollment/petitions-tutorials')

      } else {
        toast.error('Error leaving petition', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            background: '#f44336',
            color: '#fff'
          }
        })
      }

    } catch (error) {
      console.log(error)
      throw error
    }
  }

  const handlePetition = async () => {
    setIsDialogOpen(false)
    if (!isJoined) {
      await handleJoin()
    } else {
      await handleLeave()
    }
  }

  const handleJoinWaitingList = async () => {
    try {
      if (!waitList.find(student => student._id === currentUser._id)) {
        const formData = {
          student: currentUser._id
        }

        const response = await api.joinWaitingList(petitionId, formData)

        if (response?.status == 200) {
          fetchPetitionDetails()
          toast.success(`Successfully joined waiting list for ${petitionDetails?.course.courseCode} ${petitionDetails?.course.courseDesc}`, {
            position: 'bottom-right',
            duration: 3000,
            style: {
              background: '#4caf50',
              color: '#fff'
            }
          })
        } else {
          toast.error('Error joining waiting list', {
            position: 'bottom-right',
            duration: 3000,
            style: {
              background: '#f44336',
              color: '#fff'
            }
          })
        }
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  const handleLeaveWaitingList = async () => {
    try {
      const formData = {
        student: currentUser._id
      }

      const response = await api.leaveWaitingList(petitionId, formData)

      if (response?.status == 200) {
        fetchPetitionDetails()
        toast.success(`Successfully left waiting list for ${petitionDetails?.course.courseCode} ${petitionDetails?.course.courseDesc}`, {
          position: 'bottom-right',
          duration: 3000,
          style: {
            background: '#4caf50',
            color: '#fff'
          }
        })
      } else {
        toast.error('Error leaving waiting list', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            background: '#f44336',
            color: '#fff'
          }
        })
      }

    } catch (error) {
      console.log(error)
      throw error
    }
  }

  const handleWaiting = async () => {
    setWaitDialog(false)
    if (!isInWaiting) {
      await handleJoinWaitingList()
    } else {
      await handleLeaveWaitingList()
    }
  }

  const handleConfirmParticipation = async () => {
    try {
      setConfirmDialog(false)
      const formData = {
        student: currentUser._id
      }

      const response = await api.confirmParticipation(petitionId, formData)

      if (response?.status === 200) {
        fetchPetitionDetails()
        toast.success(`Successfully confirmed participation for ${petitionDetails?.course.courseCode} ${petitionDetails?.course.courseDesc}`, {
          position: 'bottom-right',
          duration: 3000,
          style: {
            background: '#4caf50',
            color: '#fff'
          }
        })
      } else {
        toast.error('Error confirming participation', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            background: '#f44336',
            color: '#fff'
          }
        })
      }

    } catch (error) {
      console.log(error)
      throw error
    }
  }

  const columns = [
    {
      field: 'hasConfirmed',
      headerName: 'Join Status',
      flex: 1,
      headerClassName: 'bg-teal-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
    },
    {
      field: 'id', headerName: 'ID Number', flex: 1, headerClassName: 'bg-teal-600 text-white', align: 'center', // This will center the cell content
      headerAlign: 'center',
    },
    {
      field: 'studentName',
      headerName: 'Student Name',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-teal-600 text-white'
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-teal-600 text-white'
    },
    {
      field: 'program',
      headerName: 'Program',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-teal-600 text-white'
    },
    {
      field: 'yearLevel',
      headerName: 'Year Level',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-teal-600 text-white'
    },
    {
      field: 'dateJoined',
      headerName: 'Date Joined',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-teal-600 text-white'
    },
  ]

  return (
    <div className='w-full'>
      <Dialog
        open={isUserBanned}
        maxWidth='sm'
      >
        <DialogTitle>
          Sorry, you are banned from creating/joining petitions.
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => router.push('/dashboard')}>
            Go Back
          </Button>
        </DialogActions>
      </Dialog>

      <Typography className='text-teal-600 font-bold text-lg'>
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
        <Grid container spacing={2} className='ml-5 mt-2'>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
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
                <Typography variant='caption'>
                  Note: course status can depend to the number of students joined.
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
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
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
                  {
                    petitionDetails?.deadline &&
                    <Grid item xs={12}>
                      <Typography className='text-gray-500 font-bold '>
                        Deadline: &nbsp;&nbsp;
                        <span className='text-red-600 font-bold '>
                          {moment(petitionDetails?.deadline).format('lll')}
                        </span>
                      </Typography>
                    </Grid>
                  }
                  <Grid item xs={12}>
                    <Typography className='text-gray-500 font-bold mb-4'>
                      Remarks:
                    </Typography>

                    {remarks?.length > 0
                      ?
                      remarks.map((remark, index) => (
                        <>

                          <Typography key={index} className='text-gray-600 font-bold '>
                            {remark.remark} - {moment(remark.dateCreated).format('ll')}
                          </Typography>
                          <Typography key={index} className='text-gray-600 font-bold mb-4'>
                            {remark.createdBy.firstName} {remark.createdBy.lastName}                                     </Typography>

                        </>
                      ))
                      :
                      <Typography className='text-gray-400 font-bold '>
                        No remarks for now
                      </Typography>
                    }

                  </Grid>
                </Grid>
              </Grid>
            </Grid>

          </Grid>
          <Grid item xs={12} md={4}>
            {
              isEndorsedByCoordinator && !isConfirmed && isJoined &&
              <Grid container spacing={1}>
                <Grid item xs={12}>

                  <Typography className='text-gray-500 font-bold '>
                    Options:
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box
                    className='w-4/5 border border-solid border-slate-400 rounded-md p-2 flex flex-col items-center justify-center'
                    boxShadow={2}>
                    <Typography className='text-red-600 font-bold'>
                      CONFIRM PARTICIPATION HERE:
                    </Typography>
                    {
                      new Date(petitionDetails.deadline) > new Date() ?
                        <Button
                          variant='contained'
                          className='bg-teal-600 text-white hover:bg-teal-700 m-5'
                          onClick={() => setConfirmDialog(true)}
                        >
                          Confirm
                        </Button>
                        :
                        <Typography>
                          DEADLINE HAS PASSED
                        </Typography>
                    }
                  </Box>
                </Grid>
              </Grid>
            }
          </Grid>
        </Grid>}
      <Grid container spacing={2} p={2} mt={10}>
        <Grid item xs={12} md={4}>
          <Typography className='text-gray-500 font-bold'>
            Total Students Joined : {petitionDetails?.studentsJoined?.filter((student) => !student.hasLeft).length}
          </Typography>
        </Grid>
        {
          currentUser?.user_type?.toLowerCase() == 'student' &&
          !isRejected && !isEndorsedByChair && !isConfirmed &&
          <Grid item xs={12} md={6}>
            <Grid container spacing={1}>
              <Grid item xs={12} md={3}>
                {isJoined ?
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    variant='contained'
                    size='small'
                    className='bg-red-600 text-white hover:bg-red-700'
                    fullWidth
                  >
                    Leave
                  </Button>
                  :

                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    size='small'
                    variant='contained' className='bg-teal-600 text-white hover:bg-teal-700'
                    fullWidth
                  >
                    Join
                  </Button>
                }

              </Grid>
              {
                isFull &&
                <Grid item xs={12} md={3}>
                  <Button
                    variant='outlined' className='border-teal-600 text-teal-600'
                    size='small'
                    fullWidth
                    onClick={() => setOpenWaitingList(true)}
                  >
                    Waiting List
                  </Button>
                </Grid>
              }
            </Grid>

          </Grid>
        }
        <Grid item xs={12}>
          <Table isLoading={isLoading} rows={rows} columns={columns} />
        </Grid>
      </Grid>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        sx={{ p: 3 }}
      >
        <DialogTitle>
          {
            !isJoined ?
              'Are you sure you want to join this petition?'
              :
              <>
                <Typography className='text-red-600 text-center text-xl font-semibold'>
                  ⚠️ Warning! If you leave this petition you will lose your slot and your account will be banned from creating or joining any petitions. ⚠️
                </Typography>
                <Divider className='my-10' />
                <span>
                  {petitionDetails?.studentsJoined.length > 1 ?
                    'Are you sure you want to leave this petition?'
                    : 'This action will delete the petition. Do you want to continue?'}
                </span>
              </>

          }
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} variant='outlined' >
            No
          </Button>
          <Button onClick={handlePetition} variant='contained' className='bg-teal-600 text-white hover:bg-teal-700'>
            Yes
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
          <Grid container spacing={1}>
            <Grid item xs={12} md={9}>
              <Typography className='text-gray-500 font-semibold text-lg'>
                Waiting List
              </Typography>
              <Typography className='text-gray-500'>
                List is currently full. You can join the waiting list to reserve a slot when it is available.
              </Typography>
            </Grid>
            {
              !isJoined &&
              <Grid item xs={12} md={3}>
                {
                  !isInWaiting ?
                    <Button
                      onClick={() => setWaitDialog(true)}
                      variant='outlined'
                      className='border-teal-600 text-teal-600 mt-5'
                      fullWidth
                    >
                      Join Waiting List
                    </Button>
                    :
                    <Button
                      onClick={() => setWaitDialog(true)}
                      variant='outlined'
                      className='border-red-600 text-red-600 mt-5 hover:border-red-600'
                      fullWidth
                    >
                      Leave Waiting List
                    </Button>
                }
              </Grid>
            }
          </Grid>

        </DialogTitle>
        <DialogContent>
          <Table isLoading={isLoading} rows={waitList} columns={columns} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={waitDialog}
        onClose={() => setWaitDialog(false)}
        sx={{ p: 3 }}
      >
        <DialogTitle>
          {
            !isInWaiting ?
              'Are you sure you want to join the waiting list?'
              :
              'Are you sure you want to leave the waiting list?'
          }
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setWaitDialog(false)} variant='contained'>
            No
          </Button>
          <Button onClick={handleWaiting} variant='contained' className='bg-teal-600 text-white hover:bg-teal-700'>
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        sx={{ p: 3 }}
      >
        <DialogTitle>
          Are you sure you want to confirm your participation?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} variant='outlined' >
            No
          </Button>
          <Button onClick={handleConfirmParticipation} variant='contained' className='bg-teal-600 text-white hover:bg-teal-700'>
            Yes
          </Button>
        </DialogActions>
      </Dialog>


    </div>
  )

}


export default PetitionDetails