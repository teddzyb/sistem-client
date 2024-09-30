'use client'
import api from '@/src/common/api'
import { Box, Button, Divider, Grid, TextField, Typography, Autocomplete, Select, FormControl, MenuItem, InputLabel } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers'
import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { adminPageClient, getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient'

const CourseOfferings = () => {
    loginIsRequiredClient()
    adminPageClient()

    const [currentUser, setCurrentUser] = useState()

    const [selectedProgram, setSelectedProgram] = useState('')
    const [courses, setCourses] = useState()

    const [courseOfferings, setCourseOfferings] = useState()
    const [currentSem, setCurrentSem] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const semesterOptions = ['1ST SEMESTER', '2ND SEMESTER', 'SUMMER SEMESTER']
    const [selectedSemester, setSelectedSemester] = useState('')
    const [selectedYear, setSelectedYear] = useState('')
    const [regularCourses, setRegularCourses] = useState()
    const [irregularCourses, setIrregularCourses] = useState()

    const fetchCurrentSemester = useCallback(async () => {
        try {
            const response = await api.getCurrentSemester()
            if (response.status === 200) {
                setCurrentSem(response.data)
            }
        } catch (error) {
            console.log(error)
        }
    }, [])

    const handleShowByYear = (courses) => {
        let groupedCourses = []

        courses.forEach(course => {
            const existingCourse = groupedCourses.find(
                groupedCourse => groupedCourse.course.courseCode === course.course.courseCode
            );

            if (existingCourse) {
                existingCourse.studentCount = [...new Set([...existingCourse.studentCount, ...course.studentCount])];
            } else {
                groupedCourses.push(course);
            }        
        });

        return groupedCourses

    }

    const groupByYearAndProgram = (courses) => {
        return courses?.reduce((acc, course) => {
            const key = `${course.yearLevel} - ${course.course.program}`
            if (!acc[key]) {
                acc[key] = []
            }
            acc[key].push(course)
            return acc
        }, {})
    }

    const groupByYear = (courses) => {
        return courses?.reduce((acc, course) => {
            const key = course.yearLevel
            if (!acc[key]) {
                acc[key] = []
            }
            acc[key].push(course)
            return acc
        }, {})
    }

    const fetchCurrentCourseOfferings = useCallback(async (currentUser) => {
        try {
            setIsLoading(true)
            const response = await api.getCurrentCourseOfferings()
            if (response.status === 200) {
                let courses = response.data?.courses   
                courses.sort((a, b) => a.yearLevel.localeCompare(b.yearLevel));

                setCourses(courses)          

                setCourseOfferings(response.data)

                let program = ''
                if (currentUser.position.includes('Coordinator')) {
                    program = 'BS ' + currentUser.position.split(' ')[0]
                }

                if (program != '') {
                    courses = courses.filter(course => course.course.program === program )
                    const regularCourses = courses?.filter(course => course.isRegularOffering)
                    const irregularCourses = courses?.filter(course => !course.isRegularOffering && course.studentCount.length > 0)
                    setRegularCourses(groupByYearAndProgram(regularCourses))
                    setIrregularCourses(groupByYearAndProgram(irregularCourses))
                } else {
                    let groupedCourses = handleShowByYear(courses)

                    const regularCourses = groupedCourses?.filter(course => course.isRegularOffering)
                    const irregularCourses = groupedCourses?.filter(course => !course.isRegularOffering && course.studentCount.length > 0)
                    setRegularCourses(groupByYear(regularCourses))
                    setIrregularCourses(groupByYear(irregularCourses))
                }


            }
            setIsLoading(false)
        } catch (error) {
            console.log(error)
        }
    }, [])

    const handleChangeAcademicPeriod = async () => {
        try {
            setSelectedProgram('')
            if (!selectedSemester || !selectedYear) {
                toast.error('Please select semester and year.',
                    {
                        duration: 4000,
                        position: 'top-right',
                        style: {
                            background: '#f44336',
                            color: '#ffffff',
                        },
                    })
                return
            }
            setIsLoading(true)
            const response = await api.getCourseOfferings(selectedSemester, selectedYear)
            if (response.status === 200) {
                let courses = response.data?.courses

                courses.sort((a, b) => a.yearLevel.localeCompare(b.yearLevel));

                setCourses(courses)
                setCourseOfferings(response.data)
                
                let program = ''
                if (currentUser.position.includes('Coordinator')) {
                    program = 'BS ' + currentUser.position.split(' ')[0]
                }

                if (program != '') {
                    courses = courses.filter(course => course.course.program === program)
                    const regularCourses = courses?.filter(course => course.isRegularOffering)
                    const irregularCourses = courses?.filter(course => !course.isRegularOffering && course.studentCount.length > 0)
                    setRegularCourses(groupByYearAndProgram(regularCourses))
                    setIrregularCourses(groupByYearAndProgram(irregularCourses))
                } else {
                    let groupedCourses = handleShowByYear(courses)

                    const regularCourses = groupedCourses?.filter(course => course.isRegularOffering)
                    const irregularCourses = groupedCourses?.filter(course => !course.isRegularOffering && course.studentCount.length > 0)
                    setRegularCourses(groupByYear(regularCourses))
                    setIrregularCourses(groupByYear(irregularCourses))
                }
            }
            setIsLoading(false)
        } catch (error) {
            console.log(error)
        }
    }

    // const handleFilterCourses = () => {

    //     if (selectedProgram === 'All') {

    //         const groupedCourses = handleShowByYear(courses)
    //         const regularCourses = groupedCourses?.filter(course => course.isRegularOffering)
    //         const irregularCourses = groupedCourses?.filter(course => !course.isRegularOffering && course.studentCount.length > 0)
    //         setRegularCourses(groupByYear(regularCourses))
    //         setIrregularCourses(groupByYear(irregularCourses))

    //     } else {
    //         console.log(courses)
    //         const filteredCourses = courses.filter(course => course.course.program === selectedProgram)
    //         const regularCourses = filteredCourses?.filter(course => course.isRegularOffering)
    //         const irregularCourses = filteredCourses?.filter(course => !course.isRegularOffering && course.studentCount.length > 0)
    //         setRegularCourses(groupByYearAndProgram(regularCourses))
    //         setIrregularCourses(groupByYearAndProgram(irregularCourses))

    //     }
    // }

    useEffect(() => {
        const init = async () => {
            const user = await getUser()

        fetchCurrentCourseOfferings(user)
        fetchCurrentSemester()
        setCurrentUser(user)
        }

        init()

    }, [])

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>

            <div className='w-full'>
                <Typography className='text-cyan-600 font-semibold'>
                    Course Offerings
                </Typography>
                    <Typography className='text-gray-500'>
                        Select Academic Period to view course offerings.
                    </Typography>
                <Grid container spacing={2} p={1} className='md:w-9/12'>
                    <Grid item xs={12} md={4}>
                        <Autocomplete
                            isOptionEqualToValue={(option, value) => option === value}
                            options={semesterOptions}
                            renderInput={(params) => <TextField {...params} label="Semester" />}
                            onChange={(e, value) => setSelectedSemester(value)}
                            value={selectedSemester}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <DatePicker
                            fullWidth
                            defaultValue={dayjs(currentSem.year, 'YYYY')}
                            // minDate={dayjs(new Date('2024-01-01'))}
                            views={['year']}
                            label='School Year'
                            onChange={(date) => setSelectedYear(date?.format('YYYY'))}
                            inputFormat='YYYY'
                            value={dayjs(selectedYear, 'YYYY')}
                        />
                    </Grid>
                    <Grid item xs={12} md={3} className='flex items-center justify-center'>
                        <Button
                            fullWidth
                            size='small'
                            onClick={handleChangeAcademicPeriod}
                            variant='contained'
                            className='bg-cyan-600 text-white hover:bg-cyan-700'
                        >
                            Change Academic Period
                        </Button>
                    </Grid>
                </Grid>
                {/* {
                    currentUser?.position === 'Department Chair' &&
                    <>
                        <Grid container spacing={2} p={1} className='md:w-9/12'>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel id='program'>Filter Courses by Program</InputLabel>
                                    <Select
                                        label='Filter Courses by Program'
                                        value={selectedProgram}
                                        onChange={(e) => setSelectedProgram(e.target.value)}
                                    >
                                        <MenuItem value='All'>All</MenuItem>
                                        <MenuItem value='BS IS'>BS IS</MenuItem>
                                        <MenuItem value='BS IT'>BS IT</MenuItem>
                                        <MenuItem value='BS CS'>BS CS</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2} className='flex items-center justify-center'>
                                <Button
                                    fullWidth
                                    size='small'
                                    onClick={handleFilterCourses}
                                    variant='contained'
                                    className='bg-cyan-600 text-white hover:bg-cyan-700'
                                >
                                    Filter
                                </Button>
                            </Grid>
                        </Grid>
                        <Divider className='my-4' />
                    </>
                } */}

                <Box className='flex items-center justify-center'>
                    <Grid container spacing={2} className='w-full md:w-11/12'>
                        <Grid item xs={12}>

                            {
                                isLoading ?
                                    <Typography className='text-center m-3 font-semibold text-cyan-600'>
                                        Loading...
                                    </Typography>
                                    :
                                    courseOfferings?.courses?.length > 0 ?
                                        <>
                                            <Typography className='text-cyan-600 text-center font-semibold my-4'>
                                                Course Offerings for {courseOfferings?.semPeriod?.semester} - {courseOfferings?.semPeriod?.year}
                                            </Typography>
                                        {
                                            Object.keys(regularCourses).length > 0 &&
                                            <Typography className='text-cyan-600 font-semibold text-center'>
                                                Regular Offerings
                                            </Typography>
                                        }

                                            {
                                                Object.keys(regularCourses).map((item, index) => (
                                                    <Box className='mt-2'>
                                                        <Typography className='text-cyan-600 font-semibold'>
                                                            Year Level: {item}
                                                        </Typography>
                                                        <Box className="border-solid border-slate-300 rounded-md p-3 m-1" key={index}>
                                                            <Grid item xs={12}>
                                                                <Grid container spacing={1}>
                                                                    <Grid item xs={3}>
                                                                        <Typography className='text-teal-600 font-semibold text-sm'>
                                                                            Course Code
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid item xs={6}>
                                                                        <Typography className='text-teal-600 font-semibold text-sm'>
                                                                            Course Description
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid item xs={3}>
                                                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                                            Estimated Students
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Divider />
                                                                </Grid>
                                                                <Grid item xs={12} >
                                                                    <Grid container spacing={1} mt={1}>
                                                                        {
                                                                            regularCourses[item].map((item, index) => (
                                                                                <>

                                                                                    <Grid item xs={3} key={index}>
                                                                                        <Typography className='text-gray-600 font-semibold text-sm'>
                                                                                            {item.course.courseCode}
                                                                                        </Typography>
                                                                                    </Grid>
                                                                                    <Grid item xs={6}>
                                                                                        <Typography className='text-gray-600 font-semibold text-sm'>
                                                                                            {item.course.courseDesc}
                                                                                        </Typography>
                                                                                    </Grid>
                                                                                    <Grid item xs={3}>
                                                                                        <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                                                            {item.studentCount.length}
                                                                                        </Typography>
                                                                                    </Grid>
                                                                                </>
                                                                            ))
                                                                        }
                                                                    </Grid>
                                                                    <Divider />
                                                                </Grid>
                                                            </Grid>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            <Divider className='my-4' />
                                            
                                            {Object.keys(irregularCourses).length > 0 &&
                                                <Typography className='text-cyan-600 font-semibold text-center'>
                                                    Non Regular
                                                </Typography>
                                            }                                             
                                            {

                                                Object.keys(irregularCourses).map((item, index) => (
                                                    <Box className='mt-2'>
                                                        <Typography className='text-cyan-600 font-semibold'>
                                                            Year Level: {item}
                                                        </Typography>
                                                        <Box className="border-solid border-slate-300 rounded-md p-3 m-1 mt-2" key={index}>
                                                            <Grid item xs={12}>
                                                                <Grid container spacing={1}>
                                                                    <Grid item xs={3}>
                                                                        <Typography className='text-teal-600 font-semibold text-sm'>
                                                                            Course Code
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid item xs={6}>
                                                                        <Typography className='text-teal-600 font-semibold text-sm'>
                                                                            Course Description
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid item xs={3}>
                                                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                                            Estimated Students
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Divider />
                                                                </Grid>
                                                                <Grid item xs={12} >
                                                                    <Grid container spacing={1}>
                                                                        {
                                                                            irregularCourses[item].map((item, index) => (
                                                                                <>

                                                                                    <Grid item xs={3} key={index}>
                                                                                        <Typography className='text-gray-600 font-semibold text-sm'>
                                                                                            {item.course.courseCode}
                                                                                        </Typography>
                                                                                    </Grid>
                                                                                    <Grid item xs={6}>
                                                                                        <Typography className='text-gray-600 font-semibold text-sm'>
                                                                                            {item.course.courseDesc}
                                                                                        </Typography>
                                                                                    </Grid>
                                                                                    <Grid item xs={3}>
                                                                                        <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                                                            {item.studentCount.length}
                                                                                        </Typography>
                                                                                    </Grid>
                                                                                </>
                                                                            ))
                                                                        }
                                                                    </Grid>
                                                                    <Divider />
                                                                </Grid>
                                                            </Grid>
                                                        </Box>
                                                    </Box>
                                                ))}
                                        </>
                                        :
                                        <Typography className='text-center m-3 font-semibold text-gray-600'>
                                            No course offerings for selected semester and year
                                        </Typography>
                            }
                        </Grid>
                    </Grid>
                </Box>

            </div>
        </LocalizationProvider>
    )
}

export default CourseOfferings