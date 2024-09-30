import { getUser } from '@/src/app/lib/loginClient'
import api from '@/src/common/api'
import { storage } from '@/src/common/firebaseConfig'
import { deleteObject, getDownloadURL, ref, uploadBytes } from '@firebase/storage'
import { DeleteOutline, DescriptionOutlined, ModeOutlined } from '@mui/icons-material'
import { Autocomplete, Box, CircularProgress, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormHelperText, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import { isNumber } from '@mui/x-data-grid/internals'
import React, { useCallback, useEffect, useState } from 'react'
import { Controller, set, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const GradesTable = ({ rows, accreditedCourses, fetchGrade, fetchSuggestedCourses, canModify, lackingCourses, grades }) => {
    const [isOpenViewDialog, setIsOpenViewDialog] = useState(false)
    const [row, setRow] = useState({})
    const [selectedCourse, setSelectedCourse] = useState({})
    const [openEditDialog, setOpenEditDialog] = useState(false)
    const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false)
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState('')
    const [defaultValues, setDefaultValues] = useState()
    const [cumulativeUnits, setCumulativeUnits] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState()

    const [lackingCoursesOptions, setLackingCoursesOptions] = useState([])

    const handleEditCourse = (course) => {

        setSelectedCourse(course)
        setOpenEditDialog(true)

        const index = lackingCoursesOptions.findIndex((lackingCourse) => lackingCourse.courseCode === course.accreditedCourse.courseCode)
        setDefaultValues({
            accreditedCourse: lackingCoursesOptions[index],
            equivalentCourse: course.equivalentCourse.course,
            school: course.equivalentCourse.schoolTaken,
            file: course.file,
            units: course.equivalentCourse.units,
            finalGrade: course.equivalentCourse.finalGrade,
        })
    }

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        clearErrors,
        reset,
    } = useForm()

    const handleDeleteFile = async () => {
        try{

            const storageRef = ref(storage, selectedCourse.file.filePath);
            deleteObject(storageRef).then(() => {
                console.log('File deleted successfully');
            }).catch((error) => {
                console.error('Error deleting file:', error);
            });
        } catch (error) {
            console.log(error)
        }
    }


    const handleUpload = async (file) => {
        if (file) {
            try {
                // Create a storage reference
                const filename = file.name.split(' ').join('-');
                const timestamp = new Date().getTime();
                const uniqueFilename = `${filename}-${timestamp}`;
                const storageRef = ref(storage, `sistem-files/course-accreditation/${uniqueFilename}`);
                // if (row.filePath !== undefined) {
                //     await handleDeleteFile()
                // }

                // Upload the file
                const snapshot = await uploadBytes(storageRef, file);

                // Get the file URL
                const fileURL = await getDownloadURL(snapshot.ref);
                const filePath = snapshot.ref.fullPath

                const fileUpload = {
                    fileUrl: fileURL,
                    filePath: filePath,
                }

                return fileUpload
            } catch (error) {
                console.error('Error uploading file:', error.message);
            }
        } else {
            console.warn('No file selected.');
        }
    }

    const handleSelectEquivalentCourse = (course) => {
        const courseCode = course.includes('GE') ? course.split(' ')[0] : course.split(' ')[0] + ' ' + course.split(' ')[1]
        const selectedCourse = grades.find((grade) => grade.courseCode.includes(courseCode));
        if (selectedCourse) {

            setDefaultValues({
                units: selectedCourse.units,
                finalGrade: selectedCourse.finalGrade,
            });
        }
    }



    const onSubmit = async (data) => {
        setIsSubmitting(true)
        setOpenEditDialog(false)

        try {
            if (!data.accreditedCourse || !data.equivalentCourse || !data.school) {
                setIsSubmitting(false)
                return
            }

            let file
            if (data.file) {
                await handleDeleteFile()
                const fileUpload = await handleUpload(data.file)
                file = fileUpload
            } else {
                file = selectedCourse.file
            }

            const equivalentCourse = {
                course: data.equivalentCourse,
                units: data.units ? data.units : defaultValues.units,
                finalGrade: data.finalGrade ? data.finalGrade : defaultValues.finalGrade,
            }

            const formData = {
                id: selectedCourse._id,
                studentId: currentUser.idNumber,
                accreditedCourse: data.accreditedCourse,
                equivalentCourse: equivalentCourse,
                schoolName: data.school,
                file: file,
            }

            const response = await api.editCourseAccreditation(formData)

            if (response.status === 200) {
                setSelectedCourse({})
                setIsSubmitting(false)
                fetchGrade(currentUser)
                fetchSuggestedCourses(currentUser.idNumber)
                toast.success('Course accreditation updated successfully',
                {
                    duration: 4000,
                    position: 'top-right',
                    style: {
                        background: '#4caf50',
                            color: '#ffffff',
                        },
                    })

            } else {
                toast.error(response.data.message,
                    {
                        duration: 4000,
                        position: 'top-right',
                        style: {
                            background: '#f44336',
                            color: '#ffffff',
                        },
                    })
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleDeleteCourse = async () => {
        setOpenDeleteConfirmation(false)

        try {
            /* setIsLoading(true) */
            setIsSubmitting(true)

            const formData = {
                id: selectedCourse._id,
                courseCode: selectedCourse.accreditedCourse.courseCode,
                equivalentCourse: {
                    finalGrade: selectedCourse.equivalentCourse.finalGrade
                },
                studentId: currentUser.idNumber,
            }

            const file = selectedCourse.file

            await handleDeleteFile(file)


            const response = await api.deleteCourseAccreditation(formData)
            if (response.status === 200) {
                setSelectedCourse({})
                setIsSubmitting(false)

                toast.success('Course accreditation deleted successfully',
                {
                    duration: 4000,
                    position: 'top-right',
                    style: {
                        background: '#4caf50',
                        color: '#ffffff',
                    },
                })
                fetchGrade(currentUser)
                fetchSuggestedCourses && fetchSuggestedCourses(currentUser.idNumber)

            } else {
                toast.error('Failed to delete course accreditation',
                {
                    duration: 4000,
                    position: 'top-right',
                    style: {
                        background: '#f44336',
                        color: '#ffffff',
                    },
                })
            }
        } catch (error) {
            console.log(error)
        }
    }

    const getCumulativeUnits = (rows) => {
        let sum = 0;
        let cumulative = [];
        if (rows != null && Object.keys(rows).length > 0) {
            let totalSemestralUnits = 0;

            Object.keys(rows).map((key, index) => {
                let totalPassedUnits = 0; // Moved inside the map function

                rows[key].map((course, index) => {
                    let units = parseInt(course.units, 10);
                    totalSemestralUnits += units;

                    if (course.verdict === 'PASSED' &&
                        (
                            course.courseCode.includes("IS") ||
                            course.courseCode.includes("IT") ||
                            course.courseCode.includes("CS") ||
                            course.courseCode.includes("CIS") ||
                            course.courseCode.includes("GE-") ||
                            course.courseCode.includes("EDM") ||
                            course.courseCode.includes("NSTP") ||
                            course.courseCode.includes("FILIPINO") ||
                            course.courseCode.includes("TPE")
                        )
                    ) {
                        totalPassedUnits += units;
                    }
                })
                sum += totalPassedUnits;
                cumulative.push(sum);
            })
        }
        setCumulativeUnits(cumulative)
    }

    const getLackingCourses = () => {
        let courses = []

        lackingCourses?.forEach((course) => {
            if (course.hasTaken === false) {
                courses.push(course.course)
            }
        })

        accreditedCourses?.forEach((course) => {
            courses.push(course.accreditedCourse)
        })

        setLackingCoursesOptions(courses)
    
    }

    useEffect(() => {
        const init = async () => {
            const user = await getUser()
            setCurrentUser(user)
        }
        init()
        getCumulativeUnits(rows)
        getLackingCourses()
    }, [rows])

    return (
                isLoading ? 
                <div className='flex items-center justify-center'>
                    <Typography className='text-teal-600'>
                        Loading...   <CircularProgress size={14} style={{ marginLeft: '5px' }} />
                    </Typography>
                </div>
                :
                isSubmitting ?

                <Box className="flex flex-col justify-center items-center h-64 space-y-5">

                <div sx={{marginLeft: '8em'}}>
                    <CircularProgress sx={{marginLeft: '.5em'}} />
                    <Typography className="text-teal-600 text-lg" >
                        Saving...
                    </Typography>
                   
                </div>
                <Typography className="text-red-600 text-lg">
                        Do not make any changes on the page.
                    </Typography>
            </Box>
                :

        <div className='w-full'>
                {
                rows != null && Object.keys(rows).length > 0 && Object.keys(rows).map((key, index) => {
                 
                    let totalPassedUnits = 0;
                    let totalSemestralUnits = 0;

                    return (
                        
                        <div key={index} className='mt-3'>
                            <Typography className='text-teal-600 font-semibold'>
                                {`${key === 'COURSE ACCREDITED' ? key : 'Year and Semester: ' + key}`}
                            </Typography>
                          
                            <Box className="border-solid border-slate-300 rounded-md p-1">
                                <Grid container spacing={1}>
                                    <Grid item xs={12}>
                                        <Grid container>
                                            <Grid item xs={3}>
                                                <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                    Course Code
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={1}>
                                                <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                    Course Description
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                Units
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={1}>
                                                <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                    Final Rating
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                    Verdict
                                                </Typography>
                                            </Grid>

                                        </Grid>
                                        <Divider />
                                    </Grid>
                                    {
                                         rows[key].map((course, index) => {
                                            let units = parseInt(course.units, 10);
                                            totalSemestralUnits += units;
                                            
                                            if (course.verdict === 'PASSED') {
                                                totalPassedUnits += units;
                                            }
                                            // {console.log(course.units)}
                                            if(course.finalGrade === 'W'){
                                                return null
                                            }
                                            const actualGrade = parseFloat(course.finalGrade);
                                            let grade = (actualGrade <= 3.0 && course.verdict !== 'FAILED') ? '1.0' : '0';
                                        
                                            return (
                                                <Grid item xs={12} key={index}>
                                                    <Grid container>
                                                        <Grid item xs={3}>
                                                            <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                                {course.courseCode}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={2}>
                                                            <Typography className='text-gray-600 font-semibold text-sm'>
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
                                                               {grade === '1.0' ? grade : course.finalGrade}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={1}>
                                                            <Typography className={`${course.finalGrade === 'NG' || course.finalGrade === 'INC' ? 'text-blue-600' : (course.verdict === 'PASSED' ? 'text-green-600' : (course.verdict === 'FAILED' ? 'text-red-600' : 'text-blue-600'))} font-semibold text-sm text-center`}>
                                                                {course.finalGrade === 'NG' || course.finalGrade === 'INC' ? 'N/A' : (course.verdict !== 'PASSED' && course.verdict !== 'FAILED' ? 'N/A' : course.verdict)}
                                                               
                                                            </Typography>
                                                        </Grid>
                                                       
                                                    </Grid>
                                                        <Divider /> 
                                                </Grid>
                                            );
                                        })
                                        
                                       
                                        }
                                       
                                        <Grid item xs={12} key={index}>
                                        <Grid container> 
                                            <Grid item xs={2.3}>
                                            <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                   
                                            {/* SPACE*/}
                                                   </Typography>
                                            </Grid>
                                            <Grid item xs={3}>
                                            </Grid>
                                            <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                   
                                                   Total Units Passed: {totalPassedUnits} / {totalSemestralUnits}
                                               
                                            </Typography>
                                            </Grid>
                                            <Divider />
                                            <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                   
                                                   Cumulative Units: {cumulativeUnits[index]}
                                               
                                            </Typography>
                                            
                                        </Grid>
                                        

                                  
                                 
                                </Grid>

                              
                            </Box>

                        </div>
                    )
                })
            }
            {
                accreditedCourses?.length > 0 && (
                    <div className='mt-3'>
                        <Typography className='text-teal-600 font-semibold'>
                            COURSE ACCREDITED
                        </Typography>
                        <Box className="border-solid border-slate-300 rounded-md p-1">
                            <Grid container spacing={1}>
                                <Grid item xs={12}>
                                    <Grid container>
                                        <Grid item xs={2}>
                                            <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                Accredited Course
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                Equivalent Course
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                Units
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                Grade
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                School Course Taken
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                Screenshot Submitted
                                            </Typography>
                                        </Grid>
                                        {
                                            canModify &&
                                            <Grid item xs={2}>
                                                <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                    Actions
                                                </Typography>
                                            </Grid>
                                        }
                                    </Grid>
                                    <Divider />
                                </Grid>
                                {
                                    accreditedCourses?.map((course, index) => {

                                     return(
                                        <Grid item xs={12} key={index}>
                                        <Grid container>
                                            <Grid item xs={2}>
                                                <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                    {course.accreditedCourse.courseCode} - {course.accreditedCourse.courseDesc}

                                                </Typography>
                                            </Grid>
                                            <Grid item xs={2}>
                                                <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                    {course.equivalentCourse.course}
                                                    {course.equivalentCourse.courseCode} {course.equivalentCourse.courseDesc}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={1}>
                                                <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                    {course.equivalentCourse.units}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={1}>
                                                <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                {course.accreditedCourse.isPassed === true ? '1.0' : course.equivalentCourse.finalGrade}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                    {course.equivalentCourse.schoolTaken}
                                                    
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={1} className='flex items-center justify-center'>
                                                <Tooltip arrow title='View File'>
                                                    <IconButton onClick={() => { setRow(course.file); setIsOpenViewDialog(true) }}>
                                                        <DescriptionOutlined className='text-teal-600' />
                                                    </IconButton>
                                                </Tooltip>
                                            </Grid>
                                            {
                                                canModify &&
                                            <Grid item xs={2} className='flex items-center justify-center'>
                                                <Tooltip arrow title='Edit'>
                                                    <IconButton onClick={() => handleEditCourse(course)}>
                                                        <ModeOutlined className='text-orange-500' />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip arrow title='Delete'>
                                                    <IconButton onClick={() => { setSelectedCourse(course); setOpenDeleteConfirmation(true) }}>
                                                        <DeleteOutline className='text-red-600' />
                                                    </IconButton>
                                                </Tooltip>
                                            </Grid>
                                            }
                                        </Grid>
                                    <Divider />
                                </Grid>
                                       )
                                        
                                    })
                                }
                            </Grid>
                        </Box>
                    </div>
                )
            }


            <Dialog
                open={isOpenViewDialog}
                onClose={() => setIsOpenViewDialog(false)}
                maxWidth='lg'
            >
                <DialogTitle>
                    View File
                </DialogTitle>
                <DialogContent>
                    {
                        row.fileUrl?.includes('.pdf') ? (
                            <iframe
                                src={row.fileUrl}
                                width='100%'
                                height='500px'
                                title='File'
                            />
                        ) : (
                            <img
                                src={row.fileUrl}
                                width='100%'
                                height='500px'
                                alt='File'
                            />
                        )
                    }
                </DialogContent>
            </Dialog>

            <Dialog
                open={openEditDialog}
                onClose={() => setOpenEditDialog(false)}
                maxWidth='md'
            >
                <DialogTitle>
                    Edit Accredited Course
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} component='form' mt={1} onSubmit={handleSubmit(onSubmit)}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    defaultValue={defaultValues?.accreditedCourse}
                                    name='accreditedCourse'
                                    control={control}
                                    rules={{
                                        required: 'Field is required',
                                    }}
                                    render={({ field: { onChange, value } }) => (
                                        [
                                            <Autocomplete
                                                value={value}
                                                onChange={(event, newValue) => {
                                                    onChange(newValue);
                                                }}
                                                autoSelect
                                                options={lackingCoursesOptions}
                                                getOptionLabel={(option) => option?.courseCode + ' ' + option?.courseDesc}
                                                renderInput={(params) => <TextField {...params} label="Select Course To Be Accredited" />}
                                            />
                                        ]
                                    )}
                                />
                                <FormHelperText>
                                    Please select a course that have been accredited by the university.
                                </FormHelperText>

                            </FormControl>
                        </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <Typography className='text-gray-600 text-sm mb-2'>
                                        Select the equivalent course taken from other school/department.
                                    </Typography>
                                    <Controller
                                        defaultValue={defaultValues?.equivalentCourse}
                                        name="equivalentCourse"
                                        control={control}
                                        render={({ field: { onChange, value } }) => {
                                            // Filter out options from grades that are already accredited
                                            return (
                                                <Autocomplete
                                                    value={value}
                                                    freeSolo
                                                    autoSelect
                                                    onChange={(event, newValue) => {
                                                        onChange(newValue);
                                                    }}
                                                    onInputChange={(event, newInputValue) => {
                                                        onChange(newInputValue);
                                                        handleSelectEquivalentCourse(newInputValue);
                                                    }}
                                                    options={grades.map((grade) => grade.courseCode + ' ' + grade.courseDesc) || ''}
                                                    // getOptionLabel={(option) =>
                                                    //     option.courseCode + " " + option.courseDesc
                                                    // }
                                                    // isOptionEqualToValue={(options, value) => options.valueOf === value.valueOf}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Equivalent course"
                                                        />
                                                    )}
                                                />
                                            );
                                        }}
                                    />

                                    {/*  {console.log(grades)} */}
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography className='text-gray-600 text-sm mb-2'>
                                    Input the number of units of the equivalent course taken.
                                </Typography>
                                <FormControl fullWidth>
                                    <Controller
                                        defaultValue={defaultValues?.units}
                                        name="units"
                                        control={control}
                                        render={({ field: { onChange, value } }) => [
                                            <TextField
                                                value={value}
                                                onChange={onChange}
                                                fullWidth
                                            />
                                        ]}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography className='text-gray-600 text-sm mb-2'>
                                    Input the final grade of the equivalent course taken (NUMBER ONLY. e.g '1.1').
                                </Typography>
                                <FormControl fullWidth>
                                    <Controller
                                        defaultValue={defaultValues?.finalGrade}
                                        name="finalGrade"
                                        control={control}
                                        render={({ field: { onChange, value } }) => [
                                            <TextField
                                                value={value}
                                                onChange={onChange}
                                                fullWidth
                                            />
                                        ]}
                                    />
                                </FormControl>
                            </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <Controller
                                    defaultValue={selectedCourse && selectedCourse?.equivalentCourse?.schoolTaken}
                                    name='school'
                                    control={control}
                                    rules={{
                                        required: 'Field is required',
                                    }}
                                    render={({ field: { onChange, value } }) => (
                                        [
                                            <Autocomplete
                                                value={value}
                                                freeSolo
                                                onChange={(event, newValue) => {
                                                    onChange(newValue);
                                                }}
                                                options={['USC']}
                                                // getOptionLabel={(option) => option.title || ''}
                                                renderInput={(params) => <TextField {...params} label="Input School Name" />}
                                            />
                                        ]
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl>
                                <Controller
                                    name='file'
                                    control={control}
                                    // rules={{
                                    //     required: 'File is required',
                                    // }}
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <>
                                            <label htmlFor="file">File (png, jpeg, jpg, pdf)</label>
                                            <Button variant='contained' component='label' className="bg-teal-600 text-white hover:bg-cyan-700">
                                                Upload New File
                                                <input
                                                    // required={true}
                                                    name='file'
                                                    type='file'
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            onChange(file);
                                                            setPreview(file.name)
                                                        }
                                                    }}
                                                    onBlur={onBlur}
                                                    ref={ref}
                                                    hidden
                                                    accept='application/pdf, image/*'
                                                />
                                            </Button>
                                            <span>
                                                {preview}
                                            </span>
                                        </>
                                    )}
                                />
                            </FormControl>
                            <FormHelperText>
                                Please upload a file of these formats (png, jpeg, jpg, pdf) of the approved course accreditation application from ISMIS.
                            </FormHelperText>
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container spacing={2}>
                                <Grid item xs={6} className='flex items-center justify-center'>
                                    <Button fullWidth variant='outlined' onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                                </Grid>
                                <Grid item xs={6} className='flex items-center justify-center'>
                                    <Button
                                        disabled={!isValid}
                                        fullWidth
                                        variant='contained'
                                        className="bg-teal-600 text-white hover:bg-teal-700"
                                        type='submit'
                                        // disabled={!isValid}
                                    >
                                        Confirm
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>

            <Dialog
                open={openDeleteConfirmation}
                onClose={() => setOpenDeleteConfirmation(false)}
            >
                <DialogTitle>
                    Are you sure you want to delete existing course accreditation?
                </DialogTitle>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteConfirmation(false)} className='bg-red-600 text-white hover:bg-red-700'>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteCourse} className='bg-teal-600 text-white hover:bg-teal-700'>
                        Confirm
                    </Button>

                </DialogActions>
            </Dialog>

        </div>
    )
}

export default GradesTable