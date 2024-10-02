'use client'

import { getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient'
import api from '@/src/common/api'
import { Grid, Typography, IconButton, Tabs, Tab, Box, Divider, Tooltip } from '@mui/material'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ArrowBackOutlined } from '@mui/icons-material'
import { green } from '@mui/material/colors'
import useGetUser from "@/src/hooks/useGetUser"

const Profile = () => {
  loginIsRequiredClient()
  const router = useRouter()
  const [usertype, setUsertype] = useState({})
  const [studentProgram, setStudentProgram] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [studentDetails, setStudentDetails] = useState({})
  const [totalUnitsPassed, setTotalUnitsPassed] = useState(0);
  const params = useParams().id
  const [value, setValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [failedCourses, setFailedCourses] = useState([])

  const user = useGetUser();

  const fetchUserDetails = async (user) => {
    setIsLoading(true)
    const userType = user?.user_type
    const dates = user
    const createdAt = new Date(dates?.createdAt)
    const updatedAt = new Date(dates?.updatedAt)

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 to month since it's zero-indexed
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formattedCreatedAt = formatDate(createdAt);
    const formattedUpdatedAt = formatDate(updatedAt);

    setCreatedAt(formattedCreatedAt);
    setUpdatedAt(formattedUpdatedAt);

    setUsertype(userType)
    if (user) {
      if (user?.user_type === 'student') {
        const id = user?.idNumber;
        const firstName = user?.firstName
        const lastName = user?.lastName
        const yearLevel = user?.yearLevel
        const email = user?.email
        const program = fullProgramName(user?.program)
        const userDetails = {
          id,
          firstName,
          lastName,
          yearLevel,
          email,
          program
        };
        setStudentDetails(userDetails)
        setStudentProgram(program)

        const responseGrade = await api.getGrades(id)
        responseGrade?.data?.grade.courses.forEach((gradeInfo) => {
          rows.push({
            semester: gradeInfo.semester,
          });
        });

        const groupedCourses = groupCoursesByYearAndSemester(rows);
        setRows(groupedCourses);
      }
      else if (user?.user_type === 'faculty') {
        const id = user?.idNumber;
        const firstName = user?.firstName
        const lastName = user?.lastName
        const email = user?.email
        const pos = user?.position

        const userDetails = {
          id,
          firstName,
          lastName,
          email,
        };

        setStudentDetails(userDetails)
        setStudentProgram(pos)
      }
    }

    setIsLoading(false);
  }

  const fullProgramName = (program) => {
    switch (program?.replace(/\s/g, '')) {
      case 'BSIS':
      case 'BS IS':
        return 'BACHELOR OF SCIENCE IN INFORMATION SYSTEMS';
      case 'BSIT':
      case 'BS IT':
        return 'BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY';
      case 'BSCS':
      case 'BS CS':
        return 'BACHELOR OF SCIENCE IN COMPUTER SCIENCE';
      default:
        return 'FACULTY / ADMIN / COORDINATOR';
    }
  }

  const groupCoursesByYearAndSemester = (courses) => {
    return courses.reduce((acc, course) => {
      const key = `${course.semester}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        semester: course.semester,
      });
      return acc;
    }, {});
  };
  const fetchUnitInfo = async (user) => {
    const id = user?.idNumber;
    const responseGrade = await api.getGrades(id)
    const courses = responseGrade.data?.grade?.courses
    const accredited = responseGrade.data?.grade?.accreditedCourses;
    let studentTotalUnitsFailed = 0;

    const data = courses?.map((gradeInfo) => {
      const rows = []
      if (!gradeInfo.isPassed && gradeInfo.finalGrade !== "NG") {
        studentTotalUnitsFailed += parseInt(gradeInfo.units)
        return {
          units: parseInt(gradeInfo.units),
          courseCode: gradeInfo.courseCode,
          verdict: "FAILED"
        }
      }
    })

    setValue(studentTotalUnitsFailed)
  }

  useEffect(() => {
    fetchUserDetails(user)
    fetchUnitInfo(user)
  }, [user]);

  const CustomTabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Box>{children}</Box>
          </Box>
        )}
      </div>
    );
  }


  return (
    <div className='w-full'>

      <Typography className='text-teal-600 font-bold text-lg'>
        <IconButton onClick={() => router.back()}>
          <ArrowBackOutlined />
        </IconButton>
        User Profile
      </Typography>
      <Grid container spacing={2} className='ml-5 mt-2'>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            ID Number
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            {(() => {
              switch (Boolean(studentDetails?.id)) {
                case true:
                  return studentDetails.id;
                default:
                  return 'N/A';
              }
            })()}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            Assigned Department
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            Department of Computer and Information Sciences and Mathematics
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            First Name
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            {studentDetails?.firstName}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>

          <Typography className='text-black-400 font-bold'>
            Email
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            {studentDetails?.email}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            Last Name
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            {studentDetails?.lastName}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>

          {
            (() => {

              switch (usertype) {
                case 'student':
                  return (
                    <>
                      <Typography className='text-black-400 font-bold'>
                        Program
                      </Typography>
                      <Typography className='text-gray-600 font-bold'>
                        {studentProgram}
                      </Typography>
                    </>
                  )
                case 'faculty':
                  return (
                    <>
                      <Typography className='text-black-400 font-bold'>
                        Assigned Role
                      </Typography>
                      <Typography className='text-gray-600 font-bold'>
                        {studentProgram}
                      </Typography>
                    </>
                  )
                default:
                  return (
                    <Typography className='text-gray-600 font-bold'>
                      UNDEFINED
                    </Typography>
                  )

              }
            })()
          }
        </Grid>
        <Grid item xs={12} md={6}>
          {
            (() => {
              switch (Object.keys(rows).length > 0) {

                case true:
                  return (
                    <>
                      <Typography className='text-black-400 font-bold'>
                        First Enrolled
                      </Typography><Typography className='text-gray-600 font-bold'>
                        {Object.keys(rows)[0]}
                      </Typography>
                    </>
                  );

                default:
                  return (
                    <>
                      <Typography className='text-black-400 font-bold'>
                        Join Date
                      </Typography><Typography className='text-gray-600 font-bold'>
                        {createdAt}
                      </Typography>
                    </>

                  );
              }
            })()
          }


        </Grid>
        <Grid item xs={12} md={6}>
          {
            (() => {
              switch (Boolean(studentDetails?.yearLevel)) {
                case true:
                  return (
                    <>
                      <Typography className='text-black-400 font-bold'>
                        Year Level
                      </Typography>
                      <Typography className='text-gray-600 font-bold'>
                        <Tooltip title='Year level standing 
                        is evaluated base on the unit count and courses passed'>
                          {studentDetails.yearLevel}
                        </Tooltip>
                      </Typography>
                    </>
                  );
                default:
                  return (
                    <>
                      <Typography className='text-black-400 font-bold'>
                        Role Last Updated
                      </Typography>
                      <Typography className='text-gray-600 font-bold'>
                        {updatedAt}
                      </Typography>
                    </>
                  );
              }
            })()
          }
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            Status
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            {(() => {
              switch (true) {
                case value > 9:
                  return 'IRREGULAR / PROBATIONARY'
                case value >= 0 && value <= 3:
                  return 'REGULAR'
                case value >= 3 && value <= 9:
                  return 'IRREGULAR'
                default:
                  return 'N/A'
              }
            })()}
          </Typography>
        </Grid>

      </Grid>

    </div>
  )

}


export default Profile