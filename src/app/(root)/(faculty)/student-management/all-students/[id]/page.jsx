'use client'

import { adminPageClient, loginIsRequiredClient } from '@/src/app/lib/loginClient'
import api from '@/src/common/api'
import { Grid, Typography, IconButton, Tabs, Tab, Box, Divider, Button, Dialog, DialogContent, Tooltip } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { ArrowBackOutlined } from '@mui/icons-material'
import GradesTable from '@/src/components/shared/GradesTable'


const StudentDetails = () => {
  loginIsRequiredClient()
  adminPageClient()

  const router = useRouter()
  const params = router.query.id
  const [studentProgram, setStudentProgram] = useState('')
  const [studentDetails, setStudentDetails] = useState({})
  const [value, setValue] = useState(0);
  const [totalUnitsPassed, setTotalUnitsPassed] = useState(0)
  const [totalUnitsFailed, setTotalUnitsFailed] = useState(0)
  const [studentPassRate, setStudentPassRate] = useState(0)
  const [studentFailRate, setStudentFailRate] = useState(0)
  const [unitValueProspectus, setUnitValueProspectus] = useState(0)
  const [currentUnitLoad, setCurrentUnitLoad] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [statusVal, setStatusVal] = useState(0)
  const [rows, setRows] = useState([])
  const [accreditedCourses, setAccreditedCourses] = useState([])
  const [failedCourses, setFailedCourses] = useState([])
  const [currentLoad, setCurrentLoad] = useState([])
  const [open, setOpen] = useState(false)
  const [studentRows, setStudentRows] = useState([]);

  const handleOpen = () => {
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
  }



  const fetchStudentDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getUser(params)
      setStudentDetails(response?.data?.user)

      const responseGrade = await api.getGrades(response?.data?.user?.idNumber);
      const rows = [];
      responseGrade?.data?.grade.courses.forEach((gradeInfo) => {
        rows.push({
          id: gradeInfo._id,
          courseCode: gradeInfo.courseCode,
          description: gradeInfo.courseDesc,
          semester: gradeInfo.semester,
          units: gradeInfo.units,
          finalGrade: gradeInfo.finalGrade,
          verdict: gradeInfo.isPassed ? "PASSED" : "FAILED",
        });
      });

      const accreditedCourses = responseGrade?.data?.grade.accreditedCourses
      setAccreditedCourses(accreditedCourses);

      const groupedPrevGrades = groupCoursesByYearAndSemester(rows);
      setRows(groupedPrevGrades);
      const failedCourses = groupCoursesByYearAndSemester(rows.filter((course) => course.verdict === 'FAILED' && course.finalGrade !== 'NG' && course.finalGrade !== 'W' && course.finalGrade !== 'INC'));
      setFailedCourses(failedCourses);

      const userProgram = fullProgramName(response.data?.user?.program)
      setStudentProgram(userProgram)
      setIsLoading(false);
    } catch (error) {
      console.error('there was an error', error)
    }
  }, [params])

  const fullProgramName = (program) => {
    switch (program?.replace(/\s/g, '')) {
      case 'BSIS':
        return 'BACHELOR OF SCIENCE IN INFORMATION SYSTEMS';
      case 'BSIT':
        return 'BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY';
      case 'BSCS':
        return 'BACHELOR OF SCIENCE IN COMPUTER SCIENCE';
      default:
        return 'NO USER PROGRAM';

    }
  }
  const handleChange = (event, newValue) => {
    setValue(newValue);
  }

  const groupCoursesByYearAndSemester = (courses) => {
    return courses.reduce((acc, course) => {
      const key = `${course.semester}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        courseCode: course.courseCode,
        courseDesc: course.description,
        semester: course.semester,
        finalGrade: course.finalGrade,
        units: course.units,
        verdict: course.verdict,
      });
      return acc;
    }, {});
  };

  const fetchGradeInfo = useCallback(async () => {
    setIsLoading(true)
    try {
      const responseUser = await api.getUser(params)
      const response = await api.getGrades(responseUser?.data?.user?.idNumber)
      const courses = response.data?.grade?.courses;
      const accredited = response?.data?.grade.accreditedCourses

      const currentLoad = courses?.filter((course) => course.finalGrade === "NG")
      setCurrentLoad(currentLoad)


      let studentTotalUnits = 0;
      let studentTotalUnitsFailed = 0;
      let studentTotalUnitsCurrent = 0;
      let count = 0
      {
        courses?.map((gradeInfo) => {
          if (
            gradeInfo.isPassed &&
            (
              gradeInfo.courseCode.includes("IS") ||
              gradeInfo.courseCode.includes("IT") ||
              gradeInfo.courseCode.includes("CS") ||
              gradeInfo.courseCode.includes("CIS") ||
              gradeInfo.courseCode.includes("GE-") ||
              gradeInfo.courseCode.includes("EDM") ||
              gradeInfo.courseCode.includes("NSTP") ||
              gradeInfo.courseCode.includes("FILIPINO") ||
              gradeInfo.courseCode.includes("TPE")
            )
          ) {
            studentTotalUnits += parseInt(gradeInfo.units);
          } else if (
            gradeInfo.finalGrade === "NG" &&
            (
              gradeInfo.courseCode.includes("IS") ||
              gradeInfo.courseCode.includes("IT") ||
              gradeInfo.courseCode.includes("CS") ||
              gradeInfo.courseCode.includes("CIS") ||
              gradeInfo.courseCode.includes("GE-") ||
              gradeInfo.courseCode.includes("EDM") ||
              gradeInfo.courseCode.includes("NSTP") ||
              gradeInfo.courseCode.includes("FILIPINO") ||
              gradeInfo.courseCode.includes("TPE")
            )
          ) {
            studentTotalUnitsCurrent += parseInt(gradeInfo.units);
          } else if (
            gradeInfo.finalGrade === "INC" ||
            gradeInfo.finalGrade === "W"
          ) {
            return null;
          } else if (
            (
              gradeInfo.courseCode.includes("IS") ||
              gradeInfo.courseCode.includes("IT") ||
              gradeInfo.courseCode.includes("CS") ||
              gradeInfo.courseCode.includes("CIS") ||
              gradeInfo.courseCode.includes("GE-") ||
              gradeInfo.courseCode.includes("EDM") ||
              gradeInfo.courseCode.includes("NSTP") ||
              gradeInfo.courseCode.includes("FILIPINO") ||
              gradeInfo.courseCode.includes("TPE")
            )
          ) {
            studentTotalUnitsFailed += parseInt(gradeInfo.units);
          }
        })
          .filter(Boolean);
      }

      const regularCourseCodes = new Set(courses.map(course => course.courseCode));

      accredited.forEach(course => {
        let commonSubstringFound = false;
        regularCourseCodes.forEach(regularCode => {
          if (course.equivalentCourse.course?.includes(regularCode) || course.equivalentCourse.courseCode?.includes(regularCode)) {
            commonSubstringFound = true;
            return;
          }
        });

        if (!commonSubstringFound && course.accreditedCourse.isPassed) {
          count += parseInt(course.equivalentCourse.units);

        }
      });

      let combine = count + studentTotalUnits;
      setTotalUnitsPassed(combine);
      setTotalUnitsFailed(studentTotalUnitsFailed);

      const failRatio = (studentTotalUnitsFailed / combine) * 100;
      const passRatio = 100 - failRatio
      setStudentPassRate(passRatio.toFixed(2));
      setStudentFailRate(failRatio.toFixed(2));

      //current units
      setCurrentUnitLoad(studentTotalUnitsCurrent)

      //failed units
      setStatusVal(studentTotalUnitsFailed)
    }
    catch (error) {
      console.error('there was an error', error)
    }
    setIsLoading(false)
  })

  const fetchUnitValuesfromProspectus = useCallback(async () => {
    setIsLoading(true);
    try {
      const responseUser = await api.getUser(params)
      const response = await api.getSuggestedCourses(responseUser?.data?.user?.idNumber);
      const suggestedCourses = response?.data.suggestedCourses.suggestedCourses;
      const rows = [];
      suggestedCourses?.forEach((gradeInfo) => {
        rows.push({
          units: gradeInfo.course.units,
        });
      });
      const sumOfUnits = rows.reduce((acc, curr) => acc + curr.units, 0);
      setUnitValueProspectus(sumOfUnits)
      // console.log(sumOfUnits)
    } catch (error) {

      console.error("Error occurred while fetching unit values:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStudentDetails();
    fetchGradeInfo()
    fetchUnitValuesfromProspectus()
  }, []);

  const studentPercentage = () => {
    if (totalUnitsPassed === 0 || unitValueProspectus === 0) {
      return 0;
    }
    return ((totalUnitsPassed / unitValueProspectus) * 100).toFixed(2)
  }

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
  const a11yProps = (index) => {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const rowsKey = Object.keys(rows)
  const lastSem = Object.keys(rows).length - 1
  let semLast = rowsKey[lastSem];
  if (semLast === "COURSE ACCREDITED" && Object.keys(rows).length > 1) {
    semLast = rowsKey[Object.keys(rows).length - 2]
  }

  return (
    <div className='w-full'>
      <Typography className='text-cyan-600 font-bold text-lg'>
        <IconButton onClick={() => router.back()}>
          <ArrowBackOutlined />
        </IconButton>
        Student Details
      </Typography>
      <Grid container spacing={2} className='ml-5 mt-2'>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            ID Number
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            {studentDetails?.idNumber}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            Belonging Department
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
            {

              studentDetails?.firstName === 'YEVGENY GRAZIO MARI' || studentDetails?.firstName === 'SHANNEN' || studentDetails?.firstName === 'KENT JOSEPH' ? //pls remove if we're gone :)
                <Tooltip title='Developer'> {studentDetails?.firstName} </Tooltip> : studentDetails?.firstName

            }
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
          <Typography className='text-black-400 font-bold'>
            Program
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            {studentProgram}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            Year Level
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            {studentDetails?.yearLevel}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            Student Completion Rate
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            <span className='text-green-600 font-bold'> {studentPercentage()}%  </span> ({totalUnitsPassed} / {unitValueProspectus} Total Units)
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            Current Study Load
          </Typography>
          <Button variant="contained"
            className='bg-cyan-600 text-white hover:bg-cyan-700'
            onClick={handleOpen}
          >
            View Here
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            Status
          </Typography>
          <Typography className='text-gray-600 font-bold'>
            {(() => {
              if (statusVal > 9) {
                return 'IRREGULAR & PROBATIONARY';
              } else if (statusVal >= 3 && statusVal <= 9) {
                return 'IRREGULAR';
              } else if (statusVal <= 3 && statusVal === 0) {
                return 'REGULAR';
              }
              else {
                return 'N/A';
              }
            })()}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>

        </Grid>
        <Grid item xs={12} md={6}>
          <Typography className='text-black-400 font-bold'>
            Other Information
          </Typography>
          <Grid item xs={12} md={6}>
            <Box sx={{ borderBottom: '2px solid', width: '100%', borderColor: 'divider' }}>
              <Tabs
                variant='standard'
                value={value}
                onChange={handleChange}
                aria-label="user tabs"
              >
                <Tab className='text-cyan-600' label="Student Grades"{...a11yProps(0)} />
                <Tab className='text-cyan-600' label="Courses Failed"{...a11yProps(1)} />
              </Tabs>
            </Box>
          </Grid>
        </Grid>
      </Grid>
      <CustomTabPanel value={value} index={0}>
        <Typography className='text-black font-semibold'>
          Student Passing Rate:
          <span style={{ color: studentPassRate < 60 ? 'red' : 'green' }}>
            {' '}{studentPassRate}% ({totalUnitsPassed} Units Taken)
          </span>
        </Typography>
        <Typography variant='caption'>
          *Cumulative count is based on courses handled in DCISM and General Education
        </Typography>
        <GradesTable rows={rows} accreditedCourses={accreditedCourses} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <Typography className='text-black font-semibold'>
          Student Failure Rate:
          <span style={{ color: studentFailRate > 9 ? 'red' : 'green' }}>
            {' '}{studentFailRate}% ({totalUnitsFailed} Units Failed)
          </span>
        </Typography>
        <GradesTable rows={failedCourses} />
      </CustomTabPanel>
      {  /* Dialog to view study load */}
      <Dialog open={open} onClose={handleClose} maxWidth='md'>
        <DialogContent>

          <Grid item xs={12} md={8}>
            <Box p={1}>
              <Typography className='text-cyan-600 font-bold mb-2'>
                Current Student Load
              </Typography>
              <Typography className='text-gray-600 font-semibold'>
                Units: {currentLoad?.reduce((acc, curr) => acc + parseInt(curr.units), 0)} ({semLast})
              </Typography>
              {currentLoad?.length > 0 ? (
                <Box className="border-solid border-slate-300 rounded-md p-3 m-1">
                  <Grid item xs={12}>
                    <Grid container spacing={12}>
                      <Grid item xs={3}>
                        <Typography className='text-cyan-600 font-semibold text-sm'>
                          Course Code
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography className='text-cyan-600 font-semibold text-sm'>
                          Course Description
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography className='text-cyan-600 font-semibold text-sm'>
                          Units
                        </Typography>
                      </Grid>
                    </Grid>
                    <Divider />
                  </Grid>
                  {currentLoad.map((item, index) => (
                    <Grid item xs={12} key={index}>
                      <Grid container spacing={12}>
                        <Grid item xs={3}>
                          <Typography className='text-gray-600 font-semibold text-sm'>
                            {item.courseCode}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography className='text-gray-600 font-semibold text-sm'>
                            {item.courseDesc}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography className='text-gray-600 font-semibold text-sm'>
                            {item.units}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Divider />
                    </Grid>
                  ))}
                </Box>
              ) : (
                <Typography className='text-gray-600 font-semibold text-sm'>
                  No data to display for now...
                </Typography>
              )}
            </Box>
          </Grid>

        </DialogContent>
      </Dialog>
    </div>

  )


}


export default StudentDetails