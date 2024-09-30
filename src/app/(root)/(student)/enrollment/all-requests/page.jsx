"use client";

import { authConfig } from '@/src/app/lib/auth';
import { getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient';
import api from "@/src/common/api";

import SpecialRequestTable from "@/src/components/students/SpecialRequestTable";
import {
  Autocomplete,
  Button,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { getSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const AllRequests = () => {
  loginIsRequiredClient();

  const [currentUser, setCurrentUser] = useState();
  const [rows, setRows] = useState([]);
  const [isCurrentSem, setIsCurrentSem] = useState(true);
  const [semesters, setSemesters] = useState([])
  const [currentSemester, setCurrentSemester] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [displayedSemester, setDisplayedSemester] = useState('')
  const [displayedYear, setDisplayedYear] = useState('')

  const semesterOptions = ['1ST SEMESTER', '2ND SEMESTER', 'SUMMER SEMESTER']

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

      const id = currentUser._id

      setIsCurrentSem(false)
      const response = await api.getStudentSpecialRequestsBySem(selectedSemester, selectedYear, id)

      if (response.status === 200) {
        const requests = response.data.specialRequests
        let rows = []
        requests.forEach((request) => {
          rows.push(
           {
            id: request._id,
            concern: request.concern.requestTitle,
            dateCreated: request.createdAt,
            lastUpdated: request.updatedAt,
            courses: request.coursesAssociated.map(course => course.course).join('   |   '), dateCreated: request.createdAt,

            status: request.statusTrail.isCancelled != null ? request.statusTrail.isCancelled : (
              request.statusTrail.inProgress ? 'In Progress' : (
                !request.statusTrail.coordinatorApproval.approvedBy ? 'Pending' : (
                  !request.statusTrail.coordinatorApproval.isApproved || (!request.statusTrail.chairApproval.isApproved && request.statusTrail.chairApproval.dateApproved != null) ? 'Rejected' : (
                    request.statusTrail.chairApproval.isApproved ? 'Approved by Chair' : 'Endorsed by Coordinator'
                  )
                )
              )
            )
          })
        });

        rows.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))

        setRows(rows)
        setDisplayedSemester(selectedSemester)
        setDisplayedYear(selectedYear)
      } 
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
        setSelectedSemester(semester.semester)
        setSelectedYear(semester.year)
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
        const years = semesters
          .map((semester) => semester.year)
          .filter((year, index, self) => self.indexOf(year) === index);
        setSemesters(years)
      }
    } catch (error) {
      console.log(error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const user = await getUser()
      setCurrentUser(user)
    }
    init()  

    fetchAcademicPeriod()
    fetchSemesters()
  }, []);

  return (
    <div className="w-full">
      <Typography className="text-teal-600 font-bold text-lg">
        Existing Applications
      </Typography>
      <Typography className="text-gray-500 font-bold ">
        List of all your existing special request applications.
      </Typography>
      <Divider/>
      <Typography className='text-gray-500 mt-3'>
        Select Semester and Academic Year to view special requests. Default is the current semester and academic year.
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
            fullWidth
            onClick={handleChangeAcademicPeriod}
            variant='contained'
            className='bg-teal-600 text-white hover:bg-teal-700'
          >
            Change Period
          </Button>
        </Grid>
      </Grid>
      <Divider className='my-5'/>
      <Typography className='text-teal-600 mt-1'>
        Semester and Academic Year: &nbsp;
        <span className='font-semibold'>
          {displayedSemester && displayedYear ? displayedSemester + ' ' + displayedYear : currentSemester.semester + ' ' + currentSemester.year}
        </span>
      </Typography>
      <SpecialRequestTable rowParams={rows} isCurrentSem={isCurrentSem} />
    </div>
  );
};

export default AllRequests;
