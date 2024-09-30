'use client'
// import { loginIsRequiredClient } from '@/src/app/lib/loginClient'
import api from '@/src/common/api'
import GradesTable from '@/src/components/shared/GradesTable'
import { AddCircleOutline, RemoveCircleOutline, Search } from '@mui/icons-material'
import { Box, CircularProgress, Dialog, DialogActions, DialogTitle, Divider, Grid, IconButton, Tooltip, Typography, Button, InputLabel, Select, MenuItem, Autocomplete, TextField, DialogContent } from '@mui/material'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import { set, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ToastContainer } from 'react-toastify'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { adminPageClient, getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient'

const CurrentStudyPlan = () => {
  loginIsRequiredClient();
  adminPageClient()

  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [courses, setCourses] = useState({});
  const [displayedCourses, setDisplayedCourses] = useState({});
  const [studyPlan, setStudyPlan] = useState({});
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
  const [courseToRemove, setCourseToRemove] = useState({});
  const [student, setStudent] = useState(null)
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [displayedSemester, setDisplayedSemester] = useState('')
  const [displayedYear, setDisplayedYear] = useState('')
  const [currentSemester, setCurrentSemester] = useState('')
  const semesterOptions = ['1ST SEMESTER', '2ND SEMESTER', 'SUMMER SEMESTER']
  const [courseFilter, setCourseFilter] = useState('show all')
  const [allGrades, setAllGrades] = useState([])
  const [unitsLimit, setUnitsLimit] = useState(0)
  const [unitsApplied, setUnitsApplied] = useState(0)

  const [isOpenDeleteAllDialog, setIsOpenDeleteAllDialog] = useState(false)

  const [studyPlanLoading, setStudyPlanLoading] = useState(false)
  const [coursesLoading, setCoursesLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleRemoveAll = async () => {
    try {
      setIsOpenDeleteAllDialog(false);
      const formData = {
        studyPlanId: studyPlan._id,
        updatedBy: currentUser._id
      }

      const response = await api.removeAllFromStudyPlan(formData)
      if (response.status === 200) {
        await handleChangeAcademicPeriod()
        toast.success(`All courses have been removed from study plan`, {
          duration: 3000,
          position: "bottom-left",
          style: {
            backgroundColor: '#4caf50',
            color: '#fff',
          }
        })
      } else {
        toast.error("Failed to remove all courses from study plan", {
          duration: 3000,
          position: "top-right",
          style: {
            backgroundColor: '#f44336',
            color: '#fff',
          }
        })
      }
    } catch (error) {
      console.error(error);
    }
  }
  const getMaxDate = () => {
    const currentYear = dayjs().year(); 
    return dayjs(new Date(currentYear, 0, 1)); 
  };

  // const handleCreateStudyPlan = async () => {
  //   try {
  //     setIsLoading(true);
  //     // const user = JSON.parse(localStorage.getItem("user"));
  //     const id = student.idNumber;

  //     const formData = {
  //       studentId: id,
  //       semester: selectedSemester,
  //       year: selectedYear,
  //     };

  //     const response = await api.createStudyPlan(formData);

  //     if (response.status === 201) {
  //       const studyPlan = response.data.studentStudyPlan;
  //       toast.success("Study plan created successfully", {
  //         duration: 3000,
  //         position: "top-right",
  //         style: {
  //           backgroundColor: "#4caf50",
  //           color: "#fff",
  //         },
  //       });
  //       setStudyPlan(studyPlan);
  //     } else {
  //       toast.error("Failed to create study plan", {
  //         duration: 3000,
  //         position: "top-right",
  //         style: {
  //           backgroundColor: "#f44336",
  //           color: "#fff",
  //         },
  //       });
  //     }
  //     setIsLoading(false);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };


  const handleChangeAcademicPeriod = async () => {
    try {
      setStudyPlanLoading(true)

      const id = student.idNumber

      // setIsCurrentSem(false)
      const response = await api.getStudentStudyPlanBySem(selectedSemester, selectedYear, id)

      if (response.status === 200) {
        const studyPlan = response.data.studentStudyPlan
        setStudyPlan(studyPlan)

      } else {
        toast.error('No study plan found', {
          duration: 3000,
          position: 'top-right',
          style: {
            backgroundColor: '#f44336',
            color: '#fff',
          },
        })
      }
      setStudyPlanLoading(false)
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
        setSelectedSemester(semester.semester)
        setSelectedYear(semester.year)
      }
    } catch (error) {
      console.log(error)
    }
  }, [])
  const handleAddtoStudyPlan = async (course) => {
    try {

      const totalUnits = unitsApplied + course.units;

      if (totalUnits > unitsLimit) {
        toast.error("Cannot add course due to number of units limitation.", {
          duration: 3000,
          position: "top-right",
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        });
        return;
      }


      const formData = {
        studyPlanId: studyPlan._id,
        course: course,
        updatedBy : currentUser._id
      }

      const response = await api.addToStudyPlan(formData)
      if (response.status === 201) {
        await handleChangeAcademicPeriod()
        toast.success(`Course ${course.courseCode} ${course.courseDesc} has been added to the study plan`, {
          duration: 3000,
          position: "bottom-left",
          style: {
            backgroundColor: '#4caf50',
            color: '#fff',
          }
        })
     
      } else {
        toast.error("Failed to add course to study plan", {
          duration: 3000,
          position: "top-right",
          style: {
            backgroundColor: '#f44336',
            color: '#fff',
          }
        })
      }
    } catch (error) {
      console.error(error);
    }
  }

  const handleRemove = (course) => {
    setIsOpenDeleteDialog(true);
    setCourseToRemove(course);
  }

  const handleRemoveFromStudyPlan = async () => {
    try {
      setIsOpenDeleteDialog(false);
      const formData = {
        studyPlanId: studyPlan._id,
        course: courseToRemove,
        updatedBy: currentUser._id
      }


      const response = await api.removeFromStudyPlan(formData)
      if (response.status === 200) {
        await handleChangeAcademicPeriod()
        toast.success(`Course ${formData.course.courseCode} ${formData.course.courseDesc} has been removed from study plan`, {
          duration: 3000,
          position: "bottom-left",
          style: {
            backgroundColor: '#4caf50',
            color: '#fff',
          }
        })
    
      } else {
        toast.error("Failed to remove course from study plan", {
          duration: 3000,
          position: "top-right",
          style: {
            backgroundColor: '#f44336',
            color: '#fff',
          }
        })
      }
    } catch (error) {
      console.error(error);
    }
  }

  const groupCoursesByYearAndSemester = (courses) => {
    return courses.reduce((acc, item) => {
      const key = `${item.course.year}-${item.course.semester.toUpperCase()}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        courseCode: item.course.courseCode,
        courseDesc: item.course.courseDesc,
        units: item.course.units,
        equivalents: item.course.equivalents,
        requisites: item.course.requisites,
        isEligible: item.isEligible,
        hasTaken: item.hasTaken,
        grade: item.grade,
        subjectTaken: item.subjectTaken,

      });
      return acc;
    }, {});

  };

  const fetchSuggestedCourses = useCallback(async (id) => {
    try {
      setCoursesLoading(true)
      const response = await api.getSuggestedCourses(id)
      const suggestedCourses = response.data.suggestedCourses.suggestedCourses

      if (response.status === 200) {

        const groupedCourses = groupCoursesByYearAndSemester(suggestedCourses);
        setCourses(groupedCourses);
        setDisplayedCourses(groupedCourses)
      } else {
        setCourses({})
        setDisplayedCourses({})
      }
      setCoursesLoading(false)
    } catch (error) {
      console.error(error);
      setCourses({})
    }

  }, []);

  const fetchStudyPlan = useCallback(async (id) => {
    try {
      setStudyPlanLoading(true)
      const response = await api.getStudentStudyPlan(id)
      if (response.status === 200) {
        const studyPlan = response.data.studentStudyPlan
        setStudyPlan(studyPlan);
      } else {
        setStudyPlan({})
      }
      setStudyPlanLoading(false)
    } catch (error) {
      setStudyPlan({})
      console.error(error);

    }

  }, []);

  const fetchStudentDetails = useCallback(async (id) => {
    try {
      const response = await api.getByIdNumber(id)
      const user = response.data.user
      if (response.status === 200 && response.data.user) {
        setStudent(user)
      } else {
        setStudent(null)
        toast.error(`Student with ID: ${id} not found`, {
          duration: 8000,
          position: "top-right",
          style: {
            backgroundColor: '#f44336',
            color: '#fff',
          }
        })
      }
      return user
    } catch (error) {
      console.error(error)
      setStudent(null)
      toast.error(`Student with ID: ${id} not found`, {
        duration: 8000,
        position: "top-right",
        style: {
          backgroundColor: '#f44336',
          color: '#fff',
        }
      })
    }
  }, [])

  const fetchGrades = useCallback(async (id) => {
    try {
      const response = await api.getGrades(id)
      const grades = response.data.grade.courses

      if (response.status === 200) {

        setAllGrades(grades)
      }
      return grades
    } catch (error) {
      console.error(error);
    }

  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    const student = fetchStudentDetails(data.searchValue)
    if (student) {
      fetchGrades(data.searchValue);
      fetchStudyPlan(data.searchValue);
      fetchSuggestedCourses(data.searchValue);
      setSelectedSemester(currentSemester.semester)
      setSelectedYear(currentSemester.year)
      setDisplayedSemester(currentSemester.semester)
      setDisplayedYear(currentSemester.year)

    }
    setIsLoading(false);
  }

  const handleFilterCourses = () => {
    const filteredCourses = Object.keys(courses).reduce((acc, key) => {
      if (courseFilter === 'show all') {
        acc[key] = courses[key];
      } else if (courseFilter === 'show taken') {
        acc[key] = courses[key].filter((course) => course.hasTaken);
      } else if (courseFilter === 'show lacking') {
        acc[key] = courses[key].filter((course) => !course.hasTaken);
      }
      return acc;
    }, {});
    setDisplayedCourses(filteredCourses);
  }

  useEffect(() => {
    const init = async () => {
      const user = await getUser()
      setCurrentUser(user)
      fetchAcademicPeriod()
    }
    init()
  }, []);

  useEffect(() => {
    let unitsLimit = 0;

    if (selectedSemester === 'SUMMER SEMESTER') {
      unitsLimit = 9;
    } else {

      const key = student?.yearLevel + "-" + selectedSemester?.split(' ')[0] + ' SEMESTER';

      courses[key]?.forEach((c) => {
        unitsLimit += c.units;
      });
    }

    setUnitsLimit(unitsLimit);

    let unitsApplied = 0;

    studyPlan?.suggestedCourses?.forEach((c) => {
      unitsApplied += c.units;
    })

    setUnitsApplied(unitsApplied);
  }, [student, displayedSemester, studyPlan]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>

      <div className="w-full">

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography className="text-cyan-600 font-bold text-lg">
              Student Study Plan
            </Typography>
            <Typography className='text-gray-600 font-semibold'>
              Create or modify student study plan
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} className="flex items-center justify-center space-x-3" component='form' onSubmit={handleSubmit(onSubmit)}>
            <Box className="py-1 px-5 flex space-x-5 items-center border-1 border-solid border-slate-500 rounded-full">
              <Search />
              <input
                {...register('searchValue', { required: true })} // register input
                type="text"

                placeholder="Search Student ID Number..."
                className="w-full p-2 focus:outline-none border-none bg-transparent text-gray-600"
              />
            </Box>
            <Button
              variant="contained"
              className="bg-cyan-600 text-white hover:bg-cyan-700"
              type="submit"
            >
              Search
            </Button>
          </Grid>
        </Grid>
        <Divider className='my-3' />

        {
          (studyPlan && Object.keys(studyPlan).length === 0) && (courses && Object.keys(courses).length === 0) && !isLoading ?
            <Box className="flex flex-col justify-center items-center h-64 space-y-5">
              <Typography className="text-cyan-600 text-xl">
                Search Student ID Number to View Study Plan..
              </Typography>
            </Box>
            :
            isLoading ?
              <Box className="flex flex-col justify-center items-center h-64 space-y-5">
                <CircularProgress />
                <Typography className="text-teal-600 text-lg">
                  Loading...
                </Typography>
              </Box>
              :
              <Grid container spacing={3}>


                <Grid item xs={12} md={6}>
                  <Typography className='text-gray-600 font-semibold'>
                    Student Study Plan
                  </Typography>
                  {/* Insert the code snippet here */}
                  <Typography className='text-gray-500 mt-3'>
                    Select Semester and Academic Year to view study plan. Default is the current semester and academic year.
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
                      <DatePicker
                        fullWidth
                        minDate={dayjs(new Date('2023-01-01'))}
                        maxDate={getMaxDate()} 
                        views={['year']}
                        defaultValue={dayjs(currentSemester.year, 'YYYY')}
                        label='School Year'
                        onChange={(date) => setSelectedYear(date.format('YYYY'))}
                        inputFormat='YYYY'
                        value={dayjs(selectedYear, 'YYYY')}
                      />
                    </Grid>
                    <Grid item xs={12} md={2} className='flex items-center justify-center'>
                      <Button
                        size='small'
                        onClick={handleChangeAcademicPeriod}
                        variant='contained'
                        className='bg-cyan-600 text-white hover:bg-cyan-700'
                      >
                        Change
                      </Button>
                    </Grid>
                  </Grid>
                  <Divider className='my-10'/>
                  <Typography className='text-teal-600 font-semibold text-center mt-2'>
                    {displayedSemester && displayedYear ? displayedSemester + ' ' + displayedYear : currentSemester.semester + ' ' + currentSemester.year}

                  </Typography>
                  {
                    student &&
                    <>
                      <Typography className='text-gray-600 font-semibold text-sm'>
                        Student Details
                      </Typography>
                      <Divider />
                      <Grid item xs={12}>
                        <Typography className='text-gray-600 font-semibold text-sm'>
                          ID Number: {student.idNumber}
                        </Typography>
                        <Divider />

                        <Typography className='text-gray-600 font-semibold text-sm'>
                          Name: {student.lastName}, {student.firstName}
                        </Typography>
                        <Divider />

                        <Typography className='text-gray-600 font-semibold text-sm'>
                          Program & Year Level: {student.program} - {student.yearLevel}
                        </Typography>
                        <Divider />
                        {
                          student.curriculum ?
                        <Typography className='text-gray-600 font-semibold text-sm'>
                          Curriculum: {student.curriculum?.program} - {student.curriculum?.effectiveYear}
                        </Typography>
                        :
                        <Typography className='text-gray-600 font-semibold text-sm'>
                          Curriculum: {student.program} - {student.effectiveYear}
                        </Typography>

                        }
                        <Divider />
                        {/* 
                        <Button
                          variant='contained'
                          size='small'
                          className='bg-cyan-600 text-white hover:bg-cyan-700'
                          onClick={() => setOpenGrades(true)}
                        >
                          View Student Grades
                        </Button>

                        <Divider /> */}
                      </Grid>
                    </>
                  }

                  {
                    studyPlanLoading ?
                      <Box className="flex flex-col justify-center items-center h-64 space-y-5">
                        <CircularProgress />
                        <Typography className="text-teal-600 text-lg">
                          Loading...
                        </Typography>
                      </Box>
                      :
                      studyPlan ?
                        <>
                          <Typography className="text-gray-600 font-semibold text-sm mt-5">
                            Total Units: {unitsApplied}/{unitsLimit}
                          </Typography>

                          <Box className="border-solid border-slate-300 rounded-md p-1 mt-10">
                            <Grid item xs={12}>
                              <Grid container spacing={1}>
                                <Grid item xs={2}>
                                  <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                    Course Code
                                  </Typography>
                                </Grid>
                                <Grid item xs={3}>
                                  <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                    Course Description
                                  </Typography>
                                </Grid>
                                <Grid item xs={2}>
                                  <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                    Units
                                  </Typography>
                                </Grid>
                                <Grid item xs={3}>
                                  <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                    Status
                                  </Typography>
                                </Grid>
                                <Grid item xs={2}>
                                  <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                    Actions
                                  </Typography>
                                </Grid>
                              </Grid>
                              <Divider />
                            </Grid>
                            {
                              studyPlan?.suggestedCourses?.length === 0 &&
                              <Typography className='text-center my-1'>
                                Add courses to study plan
                              </Typography>
                            }


                              {studyPlan?.suggestedCourses?.map((course, index) => (
                                <Grid item xs={12} key={index}>
                                  <Grid container spacing={1}>
                                    <Grid item xs={2}>
                                      <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                        {course.courseCode}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                      <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                        {course.courseDesc}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={2}>
                                      <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                        {course.units}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                      <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                        {allGrades.some(
                                          (grade) =>
                                            grade.courseCode === course.courseCode &&
                                            grade.finalGrade === "NG"
                                        )
                                          ? "Currently enrolled"
                                          : course.semester?.split(' ')[0] ===
                                            studyPlan.semPeriod.semester?.split(' ')[0]
                                            ? "Regular offering"
                                            : "To be petitioned"}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={2} className='text-center'>
                                      <Tooltip title="Remove from Study Plan" arrow>
                                        <IconButton onClick={() => handleRemove(course)}>
                                          <RemoveCircleOutline className='cursor-pointer text-red-700' />
                                        </IconButton>
                                      </Tooltip>
                                    </Grid>
                                  </Grid>
                                  <Divider />
                                </Grid>
                              ))
                            }
                            {
                              studyPlan?.suggestedCourses?.length > 0 &&
                            <Grid item xs={12} className='flex justify-center'>
                                <Button
                                  size='small'
                                  className='bg-red-600 text-white hover:bg-red-700 m-2'
                                  onClick={() => setIsOpenDeleteAllDialog(true)}
                                >
                                  Remove All
                                </Button>
                              </Grid>
                            }                            
                          </Box>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography  variant='caption' className="text-left" style={{ color: 'red' }}>
                            *SISTEM autosaves your progress or activity on this page
                          </Typography>
                          {
                            studyPlan?.lastUpdatedBy != undefined ? 
                            <Typography variant='body2' className='mt-2 text-gray-500 font-bold text-right'>
                                Last updated by: {studyPlan.lastUpdatedBy.firstName} {studyPlan.lastUpdatedBy.lastName} - {moment(studyPlan.updatedAt).format('lll')}
                            </Typography>
                            :
                          <Typography variant='body2' className='mt-2 text-gray-500 font-bold text-right'>
                            {studyPlan?.updatedAt && `Last updated: ${moment(studyPlan.updatedAt).format('lll')}`}
                          </Typography>
                          
                          }
                        </div>
                        </>
                        :
                        <Box className='flex flex-col items-center justify-center mt-4'>
                          <Typography className='text-gray-500 font-bold mt-3'>
                            No study plan found
                          </Typography>
                          {/* <Button
                            onClick={handleCreateStudyPlan}
                            variant='contained'
                            size='small'
                            className='bg-cyan-600 text-white hover:bg-cyan-700 mt-2'
                          >
                            Create Study Plan
                          </Button> */}
                        </Box>
                  }
                </Grid>

                {displayedCourses &&
                  <Grid item xs={12} md={6} className="mt-3">
                    <Typography className='text-gray-600 font-semibold text-sm'>
                      List of courses from student's curriculum
                    </Typography>
                    <Box className='flex items-center justify-center space-x-4 mt-2'>
                      <InputLabel id="filter-courses">Filter Courses</InputLabel>
                      <Select
                        size='small'
                        variant="outlined"
                        defaultValue='show all'
                        className='w-1/2'
                        onChange={(e) => setCourseFilter(e.target.value)}
                      >
                        <MenuItem value='show all'>Show All</MenuItem>
                        <MenuItem value='show taken'>Show Taken Courses</MenuItem>
                        <MenuItem value='show lacking'>Show Lacking Courses</MenuItem>
                      </Select>
                      <Button
                        size='small'
                        variant='contained'
                        className="bg-cyan-600 text-white hover:bg-cyan-700"
                        onClick={handleFilterCourses}
                      >
                        Refresh
                      </Button>
                    </Box>
                    <Typography className='text-gray-600 font-bold mt-5 text-sm'>
                      References:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography className='text-gray-600 text-sm'>
                          <span className='text-gray-500 font-extrabold'>Gray</span> - Course not yet taken and requisite/s not met
                        </Typography>
                        <Typography className='text-gray-600 text-sm'>
                          <span className='text-yellow-500 font-extrabold'>Yellow</span> - Course in study plan
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>

                        <Typography className='text-gray-600 text-sm'>
                          <span className='text-blue-500 font-extrabold'>Blue</span> - Course not yet taken and requisite/s met
                        </Typography>
                        <Typography className='text-gray-600 text-sm'>
                          <span className='text-green-500 font-extrabold'>Green</span>
                          - Course already taken or passed
                        </Typography>
                      </Grid>
                    </Grid>
                    <Divider />
                    <Box style={{ height: "90vh", overflowY: "scroll" }} marginTop={3}>
                      {
                        coursesLoading ?
                          <Box className="flex flex-col justify-center items-center h-64 space-y-5">
                            <CircularProgress />
                            <Typography className="text-teal-600 text-lg">
                              Loading...
                            </Typography>
                          </Box>
                          :   
                        Object.keys(displayedCourses).length === 0  ?
                          <Typography className='text-center mt-3'>
                            No courses found
                          </Typography>
                        :
                        Object.keys(displayedCourses).map((key, index) => {
                          return (
                            displayedCourses[key] && displayedCourses[key].length > 0 &&
                            <div key={index} className='mt-3'>
                              <Typography className='text-black-600 font-semibold'>
                                {`Year and Semester: ${key}`}
                              </Typography>
                              <Box className="border-solid border-slate-300 rounded-md p-1">
                                <Grid container spacing={1}>
                                  <Grid item xs={12}>
                                    <Grid container>
                                      <Grid item xs={2}>
                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                          Course Code
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={3}>
                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                          Course Description
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={1.5}>
                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                          Units
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={3}>
                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                          Course Taken
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={1.5}>
                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                          Final Rating
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={1}>
                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                          Actions
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                    <Divider />
                                  </Grid>
                                  {
                                    displayedCourses[key].map((course, index) => {
                                      let grade;
                                      const actualGrade = parseFloat(course.grade);
                                      grade = (actualGrade <= 3.0 || course.hasTaken === true) ? '1.0' : ' ';
                                      return (
                                      <Grid item xs={12} key={index}>
                                        <Grid container className={`${studyPlan?.suggestedCourses?.some((c) => c.courseCode === course.courseCode) ? 'bg-yellow-200' : (course.isEligible ? 'bg-blue-200' : (course.hasTaken ? 'bg-green-200' : 'bg-gray-200'))}`}>
                                          <Grid item xs={2}>
                                            <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                              {course.courseCode}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={3}>
                                            <Typography className='text-gray-600 font-semibold text-sm'>
                                              {course.courseDesc}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={1.5}>
                                            <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                              {course.units}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={3}>
                                            <Typography className='text-gray-600 font-semibold text-sm'>
                                              {course.subjectTaken}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={1.5}>
                                            <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                             {grade}
                                             {/* {course.grade} */}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={1} className='text-center'>
                                            {
                                              studyPlan?.suggestedCourses?.some((c) => c.courseCode === course.courseCode) ? null : (
                                                // course.isEligible && (
                                                  !course.hasTaken  &&
                                                  <Tooltip title="Add to Study Plan" arrow>
                                                    <IconButton onClick={() => handleAddtoStudyPlan(course)}>
                                                      <AddCircleOutline className='cursor-pointer text-green-700' />
                                                    </IconButton>
                                                  </Tooltip>
                                                )
                                            }
                                            {
                                              course.hasTaken &&
                                              <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                TAKEN
                                              </Typography>
                                            }
                                            {studyPlan?.suggestedCourses?.some((c) => c.courseCode === course.courseCode) && (
                                              <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                IN STUDY PLAN
                                              </Typography>
                                            )}
                                          </Grid>
                                          <Divider />
                                        </Grid>
                                      </Grid>
                                      )
                                    })

                                  }
                                </Grid>

                              </Box>
                            </div>
                          )
                        })
                      }
                    </Box>
                  </Grid>
                }
              </Grid>
        }

        <Dialog
          open={isOpenDeleteDialog}
          onClose={() => setIsOpenDeleteDialog(false)}
          maxWidth='xs'
        >
          <Box className='p-2'>
            <DialogTitle>
              Are you sure you want to remove this course?
            </DialogTitle>
            <DialogActions>
              <Button variant='outlined' onClick={() => setIsOpenDeleteDialog(false)}>Cancel</Button>
              <Button variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={handleRemoveFromStudyPlan}>Confirm</Button>
              <ToastContainer />
            </DialogActions>
          </Box>
        </Dialog>

        <Dialog
          open={isOpenDeleteAllDialog}
          onClose={() => setIsOpenDeleteAllDialog(false)}
          maxWidth='xs'
        >
          <Box className='p-2'>
            <DialogTitle>
              Are you sure you want to remove all courses?
            </DialogTitle>
            <DialogActions>
              <Button variant='outlined' onClick={() => setIsOpenDeleteAllDialog(false)}>Cancel</Button>
              <Button variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={handleRemoveAll}>Confirm</Button>
              <ToastContainer />
            </DialogActions>
          </Box>
        </Dialog>

        {/* <Dialog
          open={isOpenGrades}
          onClose={() => setOpenGrades(false)}
          maxWidth='md'
        >
          <DialogContent>
            <GradesTable rows={rows} accreditedCourses={accreditedCourses} />
          </DialogContent>
        </Dialog> */}

      </div>
    </LocalizationProvider>
  );
};

export default CurrentStudyPlan;
