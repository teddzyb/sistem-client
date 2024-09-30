'use client'
import { adminPageClient, loginIsRequiredClient } from '@/src/app/lib/loginClient';
import api from '@/src/common/api';
import Table from '@/src/components/shared/Table';
import { Autocomplete, Box, Button, Divider, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AiOutlineEye } from 'react-icons/ai';

const PetitionsTutorialsList = () => {
  loginIsRequiredClient()
  adminPageClient()

  const [isLoading, setIsLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [semesters, setSemesters] = useState([])
  const [currentSemester, setCurrentSemester] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [displayedSemester, setDisplayedSemester] = useState('')
  const [displayedYear, setDisplayedYear] = useState('')

  const semesterOptions = ['1ST SEMESTER', '2ND SEMESTER', 'SUMMER SEMESTER']

  const router = useRouter()

  const fetchPetitions = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getPetitions()
      let rows = []
      response.data.petitions.forEach((petition) => {
        rows.push({
          id: petition._id,
          courseStatus: petition.courseStatus,
          dateCreated: petition.createdAt,
          course: petition.course.courseCode ? `${petition.course.courseCode} ${petition.course.courseDesc}` : petition.course,
          studentsJoined: petition.studentsJoined.filter((student) => !student.hasLeft).length,
          status: !petition.statusTrail.coordinatorApproval.isApproved || (!petition.statusTrail.chairApproval.isApproved && petition.statusTrail.chairApproval.dateApproved != null) ? 'Rejected' : (petition.statusTrail.chairApproval.isApproved ? 'Approved by Chair' : 'Endorsed by Coordinator'),
          approvedBy: petition.statusTrail.coordinatorApproval.approvedBy,
        })
      })
      rows.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
      setRows(rows)
      setIsLoading(false)

    } catch (error) {
      console.log(error)
    }
  }, [])

  const handleChangeAcademicPeriod = async () => {
    try {
      if (!selectedSemester || !selectedYear) {
        toast.error('Please select semester and academic year', {
          duration: 3000,
          position: 'top-right',
          style: {
            backgroundColor: '#f44336',
            color: '#fff',
          },
        })
        return
      }

      setIsLoading(true)
      const response = await api.getPetitionsBySemester(selectedSemester, selectedYear)

      if (response.status === 200) {
        const petitions = response.data.petitions
        let rows = []
        petitions.forEach((petition) => {
          rows.push({
            id: petition._id,
            courseStatus: petition.courseStatus,
            dateCreated: petition.createdAt,
            course: petition.course.courseCode ? `${petition.course.courseCode} ${petition.course.courseDesc}` : petition.course,
            studentsJoined: petition.studentsJoined.filter((student) => !student.hasLeft).length,
            status: !petition.statusTrail.coordinatorApproval.isApproved || (!petition.statusTrail.chairApproval.isApproved && petition.statusTrail.chairApproval.dateApproved != null) ? 'Rejected' : (petition.statusTrail.chairApproval.isApproved ? 'Approved by Chair' : 'Endorsed by Coordinator'),
            approvedBy: petition.statusTrail.coordinatorApproval.approvedBy,
          })
        })
        rows.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
        setRows(rows)
      } else {
        toast.error('No petitions found', {
          duration: 3000,
          position: 'top-right',
          style: {
            backgroundColor: '#f44336',
            color: '#fff',
          },
        })
      }
      setIsLoading(false)
      setDisplayedSemester(selectedSemester)
      setDisplayedYear(selectedYear)
    } catch (error) {
      console.log(error)
    }
  }

  const fetchAcademicPeriod = useCallback(async () => {
    try {
      const response = await api.getCurrentSemester()
      if (response.status === 200) {
        const semester = response.data
        setCurrentSemester(semester)
      }
    } catch (error) {
      console.log(error)
    }
  }, [])

  const fetchSemesters = useCallback(async () => {
    try {
      const response = await api.getSemesters()

      if (response.status === 200) {
        const semesters = response.data.semesters
        let years = semesters.map((semester) => semester.year)
        years = [...new Set(years)]
        setSemesters(years)
      }
    } catch (error) {
      console.log(error)
    }
  }, [])

  useEffect(() => {
    fetchPetitions()
    fetchAcademicPeriod()
    fetchSemesters()
  }, [])

  const columns = [
    {
      field: 'courseStatus',
      headerName: 'Course Status',
      flex: 1.25,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'course',
      headerName: 'Course',
      flex: 2,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'studentsJoined',
      headerName: 'Number of Students Joined',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center',
      headerAlign: 'center',
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
      headerClassName: 'bg-cyan-600 text-white',
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box className='flex justify-between'>
            <Tooltip title='View Details'>
              <IconButton
                onClick={() => {
                  router.push(`/petitions-tutorials-list/${row.id}`)
                }}
              >
                <AiOutlineEye className='text-green-600' />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    }
  ];

  return (
    <div className='w-full'>
      <Grid container spacing={2}>
        <Grid item xs={9}>

          <Typography className='text-cyan-600 font-bold text-lg'>
            Petitions/Tutorials
          </Typography>
          <Typography className='text-gray-500 font-bold '>
            List of Petitions/Tutorials
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <Typography className='text-gray-500'>
            Select Semester and Academic Year to view petitions. Default is the current semester and academic year.
          </Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} md={5}>
              <Autocomplete
                fullWidth
                isOptionEqualToValue={(option, value) => option === value}
                options={semesterOptions}
                renderInput={(params) => <TextField {...params} label="Semester" />}
                onChange={(e, value) => setSelectedSemester(value)}
                value={selectedSemester}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Autocomplete
                fullWidth
                isOptionEqualToValue={(option, value) => option === value}
                value={selectedYear}
                options={semesters}
                renderInput={(params) => <TextField {...params} label="Academic Year" />}
                onChange={(e, value) => setSelectedYear(value)}
              />
            </Grid>
            <Grid item xs={12} md={2} className='flex items-center justify-center'>
              <Button
                size='small'
                onClick={handleChangeAcademicPeriod}
                variant='contained'
                className='bg-cyan-600 text-white hover:bg-cyan-700'
              >
                Change Period
              </Button>
            </Grid>
          </Grid>
        <Typography className='text-cyan-600 mt-1'>
          Semester and Academic Year: &nbsp;
          <span className='font-semibold'>
            {displayedSemester && displayedYear ? displayedSemester + ' ' + displayedYear : currentSemester.semester + ' ' + currentSemester.year}
          </span>
        </Typography>
        </Grid>
      </Grid>

      <Table rows={rows} columns={columns} isLoading={isLoading} />
    </div>
  )
}

export default PetitionsTutorialsList