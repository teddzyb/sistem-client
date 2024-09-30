'use client'
import { adminPageClient, loginIsRequiredClient } from '@/src/app/lib/loginClient'
import api from '@/src/common/api'
import ManagePetitions from '@/src/components/faculty/ManagePetitions'
import ManageRequestOptions from '@/src/components/faculty/ManageRequestOptions'
import ManageSemester from '@/src/components/faculty/ManageSemester'
import { ChevronRightOutlined } from '@mui/icons-material'
import { Box, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Typography, } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const ManageEnrollment = () => {
  loginIsRequiredClient()
  adminPageClient()

  const [isLoading, setIsLoading] = useState(false)
  const [specialRequests, setSpecialRequests] = useState([])
  const [academicPeriod, setAcademicPeriod] = useState('')

  const [isEnabledRequest, setIsEnabledRequest] = useState(false)
  const [isPetitionEnabled, setIsPetitionEnabled] = useState(false)

  const specialRequestsRef = useRef(null);
  const petitionsRef = useRef(null);
  const academicPeriodConfigRef = useRef(null);

  const handleClick = (e) => {
    if (e.target.innerText === 'Special Requests') {
      specialRequestsRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (e.target.innerText === 'Petitions') {
      petitionsRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (e.target.innerText === 'Academic Period') {
      academicPeriodConfigRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    const response = await api.getSpecialRequestOptions()
    const rows = response.data?.specialRequests.map((request) => ({
      id: request._id,
      requestTitle: request.requestTitle,
      eligibleYearLevels: request.eligibleYearLevels,
    }))

    setSpecialRequests(rows)
    setIsLoading(false)

  }, [])

  const fetchAcademicPeriod = useCallback(async () => {
    try {
      const response = await api.getCurrentSemester()
      if (response.status === 200) {
        const semester = response.data
        setIsEnabledRequest(semester.specialRequestEnabled)
        setIsPetitionEnabled(semester.petitionEnabled)
        setAcademicPeriod(semester)
        
      }
    } catch (error) {
      console.log(error)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
    fetchAcademicPeriod()
  }, [])


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>

    <div className='w-full'>
      <Grid container spacing={2}>
        <Grid item xs={12} md={2} sx={{ borderRight: '1px solid', borderColor: '#959a9d61' }} className='relative'>
          <Box className='relative xl:fixed'>
            <Typography className='text-cyan-600 font-bold text-lg'>
              Manage Enrollment
            </Typography>
            <List>
              <ListItem className='cursor-pointer text-cyan-600 font-semibold' onClick={(e) => handleClick(e)}>
                <ListItemIcon className='-mr-5'>
                  <ChevronRightOutlined className='text-cyan-600' />
                </ListItemIcon>
                <ListItemText primary='Academic Period' />
                <Divider />
              </ListItem>
              <ListItem className='cursor-pointer text-cyan-600 font-semibold' onClick={(e) => handleClick(e)}>
                <ListItemIcon className='-mr-5'>
                  <ChevronRightOutlined className='text-cyan-600' />
                </ListItemIcon>
                <ListItemText primary='Special Requests' />
                <Divider />
              </ListItem>
              <ListItem className='cursor-pointer text-cyan-600 font-semibold' onClick={(e) => handleClick(e)}>
                <ListItemIcon className='-mr-5'>
                  <ChevronRightOutlined className='text-cyan-600' />
                </ListItemIcon>
                <ListItemText primary='Petitions' />
                <Divider />
              </ListItem>
              
            </List>
          </Box>
        </Grid>

        <Grid item xs={12} md={10}>
          <Grid container spacing={2} p={1}>
            <Grid item xs={12} ref={academicPeriodConfigRef}>
              <ManageSemester 
                fetchAcademicPeriod={fetchAcademicPeriod} 
                academicPeriod={academicPeriod}
              />
            </Grid>
            <Grid item xs={12} ref={specialRequestsRef}>
              <ManageRequestOptions
                fetchRequests={fetchRequests}
                isLoading={isLoading}
                specialRequests={specialRequests}
                fetchAcademicPeriod={fetchAcademicPeriod}
                academicPeriod={academicPeriod}
                isEnabledRequest={isEnabledRequest}
              />
            </Grid>
            <Grid item xs={12} ref={petitionsRef}>
              <ManagePetitions 
                fetchAcademicPeriod={fetchAcademicPeriod}
                academicPeriod={academicPeriod}
                isPetitionEnabled={isPetitionEnabled}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
    </div>
    </LocalizationProvider>
  )
}

export default ManageEnrollment