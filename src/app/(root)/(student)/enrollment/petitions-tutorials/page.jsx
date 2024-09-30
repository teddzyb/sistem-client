'use client'
import { getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient';
import api from '@/src/common/api';
import PetitionsTable from '@/src/components/students/PetitionsTable';
import { Autocomplete,  Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, Grid, InputLabel, MenuItem, Select,  Typography, TextField, Divider } from '@mui/material'
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const PetitionsTutorials = () => {
    loginIsRequiredClient()
    const [isLoading, setIsLoading] = useState(false)
    const [isOpenForm, setIsOpenForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rows, setRows] = useState([])
    const router = useRouter()
    const [courses, setCourses] = useState([]);
    // const [ISCourses, setIScourses] = useState([]);
    // const [ITCourses, setITcourses] = useState([]);
    // const [CSCourses, setCScourses] = useState([]);
    // const [studentProgram, setStudentProgram] = useState('')
    const [isDisabled, setIsDisabled] = useState(false)
    const [semesters, setSemesters] = useState([])
    const [isCurrentSem, setIsCurrentSem] = useState(true)
    const [currentSemester, setCurrentSemester] = useState('')
    const [selectedSemester, setSelectedSemester] = useState('')
    const [selectedYear, setSelectedYear] = useState('')
    const [displayedSemester, setDisplayedSemester] = useState('')
    const [displayedYear, setDisplayedYear] = useState('')
    const [currentUser, setCurrentUser] = useState()
    const [isUserBanned, setIsUserBanned] = useState(false)

    const semesterOptions = ['1ST SEMESTER', '2ND SEMESTER', 'SUMMER SEMESTER']

       const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        reset,
    } = useForm()

    const fetchPetitions = useCallback(async () => {
        try {
            setIsLoading(true)

            const response = await api.getPetitions()

            const petitions = response.data?.petitions

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
            setIsLoading(false)

        } catch (error) {

        }
    }, [])

    const onSubmit = async (data) => {
        try {
            const idNumber = currentUser._id;

            setIsSubmitting(true);

            const formData = {
                courseStatus: data.courseStatus,
                course: data.course,
                createdBy: idNumber,
            }

            const courseInfo = rows.map((row) => row.course);

            if (courseInfo.includes(formData.course.courseCode + ' ' + formData.course.courseDesc)) {
                toast.error(`An application for ${formData.course.courseCode} ${formData.course.courseDesc} exists, just join within the system.`, {
                    duration: 3000,
                    position: 'bottom-right',
                    style: {
                        backgroundColor: '#f44336',
                        color: '#fff',
                    },
                });
                setIsSubmitting(false);
                return;
            }
 
        const response = await api.createPetition(formData);
        if (response.status === 201) {
            toast.success('Petition created successfully', {
                duration: 3000,
                position: 'bottom-right',
                style: {
                    backgroundColor: '#4caf50',
                    color: '#fff',
                } 
            });
            fetchPetitions();
        } else {
            toast.error('Something went wrong', {
                duration: 3000,
                position: 'bottom-right',
                style: {
                    backgroundColor: '#f44336',
                    color: '#fff',
                } 
            });
        }
        setIsOpenForm(false);
        setIsSubmitting(false);
        reset();
        } catch (error) {
            console.log(error)
        }

    }

    const fetchCourses = useCallback(async (user) => {
        try {
            const program = user.program;
            const year = user.effectiveYear;
            const res = await api.getProspectus(program, year);

            const courses = res.data?.prospectus.courses;
            setCourses(courses)
        } catch (error) {
            console.log(error)
        }
    }, []);
    
    

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

            setIsCurrentSem(false)
            const response = await api.getPetitionsBySemester(selectedSemester, selectedYear)

            if (response.status === 200){
                const petitions = response.data.petitions
                let rows = []

                petitions.forEach((petition) => {
                    rows.push({
                        id: petition._id,
                        courseStatus: petition.studentsJoined.length < 5 ? 'Tutorial' : 'Petition',
                        dateCreated: petition.createdAt,
                        course: petition.course.courseCode ? `${petition.course.courseCode} ${petition.course.courseDesc}` : petition.course,
                        studentsJoined: petition.studentsJoined.filter((student) => !student.hasLeft).length,
                        status: !petition.statusTrail.coordinatorApproval.isApproved || (!petition.statusTrail.chairApproval.isApproved && petition.statusTrail.chairApproval.dateApproved != null) ? 'Rejected' : (petition.statusTrail.chairApproval.isApproved ? 'Approved by Chair' : 'Endorsed by Coordinator'),
                        approvedBy: petition.statusTrail.coordinatorApproval.approvedBy,
                    })
                })

                rows.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))

                setRows(rows)
                setDisplayedSemester(selectedSemester)
                setDisplayedYear(selectedYear)
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
                const isEnabled = semester?.petitionEnabled
                setIsDisabled(!isEnabled)
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
                let years = semesters.map((semester) => semester.year)
                years = [...new Set(years)]
                setSemesters(years)
            }
        } catch (error){
            console.log(error)
        }
    }, [])
 
    useEffect(() => {
        const init = async () => {
            const user = await getUser()
            setCurrentUser(user)
            setIsUserBanned(user.banToPetition)
            fetchAcademicPeriod()
            fetchSemesters()
            fetchCourses(user)
            fetchPetitions()

        }
        init()
    }, [])

    
    return (

        <div className='w-full'>
            <Dialog
                open={isUserBanned}
                maxWidth='sm'
            >
                <DialogTitle>
                    Sorry, you are banned from creating/joining petitions for the current semester.
                </DialogTitle>
                <DialogActions>
                    <Button onClick={() => router.push('/dashboard')}>
                        Go Back
                    </Button>
                </DialogActions>
            </Dialog>
            <Grid container spacing={2}>
                <Grid item xs={12} md={10}>
                    <Typography className='text-teal-600 font-bold text-lg'>
                        Petitions/Tutorials
                    </Typography>
                    <Typography className='text-gray-500 font-bold text-sm'>
                        List of Petitions/Tutorials
                    </Typography>
                    <Typography className='text-gray-500 text-sm'>
                        You may only create a petition for this semester.
                    </Typography>
                    <Divider />
                </Grid>
                <Grid item xs={12} md={2}>
                    <Button onClick={() => setIsOpenForm(prev => !prev)} variant='contained' className='bg-teal-600 text-white hover:bg-teal-700'>
                        Create Application
                    </Button>
                </Grid>
                <Grid item xs={12}>
                    <Typography className='text-gray-500'>
                        Select Semester and Academic Year To View Existing Petitions. Default is the current semester and academic year.
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
                            fullWidth
                                size='small'
                                onClick={handleChangeAcademicPeriod}
                                variant='contained' 
                                className='bg-teal-600 text-white hover:bg-teal-700'
                            >
                                Change Period
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Divider className='my-5'/>
            <Typography className='text-teal-600 mt-1'>
                Semester and Academic Year: &nbsp;
                <span className='font-semibold'>
                    {displayedSemester && displayedYear ? displayedSemester + ' ' + displayedYear : currentSemester.semester + ' ' + currentSemester.year}
                </span>
            </Typography>
            <Typography variant='caption' className='mt-1'>
               These are the list of petitions created by you and other students.
            </Typography>
            <PetitionsTable rows={rows} isLoading={isLoading}/>
            <Dialog
                maxWidth='sm'
                open={isOpenForm}
                onClose={() => setIsOpenForm(false)}
            >
                <DialogTitle>
                    Create Application
                </DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={2} p={1}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <Controller
                                        name='courseStatus'
                                        control={control}
                                        rules={{
                                            required: 'Course Status is required',
                                        }}
                                        render={({ field: { onChange, value } }) => (
                                            <>
                                                <InputLabel>
                                                    Course Status
                                                </InputLabel>
                                                <Select
                                                    id='status'
                                                    label='Course Status'
                                                    value={value}
                                                    onChange={onChange}
                                                    error={Boolean(errors.courseStatus)}
                                                >
                                                    <MenuItem value='Petition'>Petition</MenuItem>
                                                    <MenuItem value='Tutorial'>Tutorial</MenuItem>
                                                </Select>
                                            </>
                                        )}
                                    />
                                    {
                                        errors.requestTitle && (
                                            <FormHelperText error>
                                                {errors.requestTitle.message}
                                            </FormHelperText>
                                        )
                                    }
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                <Controller 
                                    name='course'
                                    control={control}
                                    rules={{
                                        required: 'This field is required',
                                    }}
                                    render={({ field: { onChange, value } }) => (
                                        [
                                        
                                            <Autocomplete
                                                value={value}
                                                onChange={(event, newValue) => {
                                                    onChange(newValue);
                                                }}
                                                options={courses}
                                                getOptionLabel={(option) => option.courseCode+ ' ' + option.courseDesc}
                                                renderInput={(params) => <TextField {...params} label="Select Course" error={Boolean(errors.courseStatus)} />}
                                            />
                                        ]
                                    )}
                                />
                                    {
                                        errors.requestTitle && (
                                            <FormHelperText error>
                                                {errors.requestTitle.message}
                                            </FormHelperText>
                                        )
                                    }
                                </FormControl>
                               {/*   <FormControl fullWidth>
                                    <Controller
                                        name='course'
                                        control={control}
                                        rules={{
                                            required: 'Course is required',
                                        }}
                                        render={({ field: { onChange, value } }) => (
                                            <>
                                                <InputLabel>
                                                    Course
                                                </InputLabel>
                                                <Select
                                                    id='status'
                                                    label='Course'
                                                    value={value}
                                                    onChange={onChange}
                                                    error={Boolean(errors.course)}
                                                >
                                                  {courses.map(course =>(
                                                    <MenuItem value={`${course.courseCode} ${course.courseDesc}`}> {course.courseCode} {course.courseDesc}  </MenuItem>
                                                  ))} 

                                                  {ISCourses.map(IS =>(
                                                    //butang lang mo ug conditions 
                                                    <MenuItem value={`${IS.courseCode} ${IS.courseDesc}`} > {IS.courseCode} {IS.courseDesc}  </MenuItem>
                                                  ))} 
                                                   {CSCourses.map(CS =>(
                                                    //butang lang mo ug conditions 
                                                    <MenuItem value={`${CS.courseCode} ${CS.courseDesc}`}> {CS.courseCode} {CS.courseDesc}  </MenuItem>
                                                  ))} 
                                                  {ITCourses.map(IT =>(
                                                    //butang lang mo ug conditions 
                                                    <MenuItem value={`${IT.courseCode} ${IT.courseDesc}`}> {IT.courseCode} {IT.courseDesc}  </MenuItem>
                                                  ))} 
                                                    
                                                </Select>
                                               
                                            </>
                                        )}
                                    />
                                    {
                                        errors.requestTitle && (
                                            <FormHelperText error>
                                                {errors.requestTitle.message}
                                            </FormHelperText>
                                        )
                                    }
                                </FormControl> */}
                            </Grid>
                            <Grid item xs={6}>
                                <Button fullWidth variant='outlined' color='inherit' onClick={() => setIsOpenForm(false)}>Cancel</Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button fullWidth variant='contained' className='bg-teal-600 text-white hover:bg-teal-700' onClick={handleSubmit(onSubmit)} disabled={isSubmitting || !isValid}>
                                    Submit
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </DialogContent>
            </Dialog>   

            <Dialog
                open={isDisabled}
                // onClose={() => setIsDisabledDialog(false)}
                aria-labelledby='alert-dialog-title'
                aria-describedby='alert-dialog-description'
                maxWidth='xs'
            >
                <DialogTitle>
                    ⚠️ Creating petition application hasn't been enabled for the current semester. ⚠️
                </DialogTitle>
                <DialogActions>
                    <Button onClick={() => router.back()}>
                        Go Back
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default PetitionsTutorials