'use client'
import { Autocomplete, Button, Dialog, DialogContent, DialogTitle, Divider, FormControl, Grid, TextField, Typography } from '@mui/material'

import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const AddCourses = ({ showModal, setShowModal, addedCourses, setAddedCourses, gradeSemester, grades, setGrades, handleRemoveCourse, prevManuallyAdded }) => {
    const { control, handleSubmit, reset, formState: { errors } } = useForm();

    const handleAddCourse = (data) => {

        if(!data){
            return;
        }
        if (data.courseCode === '' || data.courseDesc === '' || data.finalGrade === '' || data.semester === '') {
            toast.error('Please input all fields', {
                duration: 3000,
                style: {
                    background: '#f44336',
                    color: '#fff',
                },
                position: 'top-center',
            });
            return;
        }

        if (
            ((grades?.courses || []).every((course) => course.courseCode.toLowerCase() !== data.courseCode.toLowerCase() && course.courseDesc.toLowerCase() !== data.courseDesc.toLowerCase())) && 
            ((addedCourses || []).every((course) => course.courseCode.toLowerCase() !== data.courseCode.toLowerCase() && course.courseDesc.toLowerCase() !== data.courseDesc.toLowerCase())) &&
            ((prevManuallyAdded || []).every((course) => course.courseCode.toLowerCase() !== data.courseCode.toLowerCase() && course.courseDesc.toLowerCase() !== data.courseDesc.toLowerCase()))
            
            ){
            let selected = []
                selected.push({
                    courseCode: data.courseCode,
                    courseDesc: data.courseDesc,
                    units: data.units,
                    semester: data.semester.toUpperCase(),
                    finalGrade: data.finalGrade,
                    isPassed: parseInt(data.finalGrade) <= 3.0 ? true : false,
                    isAddedManually: true
                })

            const newCourses = [...(grades?.courses || []), ...selected];
            setAddedCourses([...addedCourses, ...selected])
            setGrades({ ...grades, courses: newCourses });


        } else {
            toast.error(`Course already exists`, {
                duration: 3000,
                style: {
                    background: '#f44336',
                    color: '#fff',
                },
                position: 'top-center',
            });
        }

    }

    return (
        <div>
            <Dialog
                open={showModal}
                onClose={() => setShowModal(false)}
                fullWidth
                maxWidth='lg'
            >
                <DialogTitle>
                    Input your missing grades here
                </DialogTitle>
                <DialogContent>
                    For guidance: Log-in to ISMIS &gt; View Grades and check your accredited courses (similar to the image displayed below) <br/> 
                    Some courses taken in USC are marked as <span style={{color:'green', fontWeight:'bold'}}>Accredited</span>, disregard them. <br/>
                    <img src="/images/accredited.png" alt="accredited-photo" style={{width:'100%'}} />
                    <span style={{fontWeight:'bold'}}> Only input necessary data for missing grades </span> <br/> 
                    {
                        addedCourses.length > 0 &&
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography className='text-teal-600 font-semibold'>
                                    Added Courses
                                </Typography>
                                <Divider />
                            </Grid>
                            {addedCourses.map((course, index) => (
                                <Grid item xs={12} key={index}>
                                    <Grid container>
                                        <Grid item xs={2}>
                                            <Typography className='text-gray-600 font-semibold '>
                                                Course Code: {course.courseCode}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography className='text-gray-600 font-semibold '>
                                                Description: {course.courseDesc}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <Typography className='text-gray-600 font-semibold text-center'>
                                                Final Grade: {course.finalGrade}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <Typography className='text-gray-600 font-semibold text-center'>
                                                Units: {course.units}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={2} className='flex items-center justify-center'>
                                            <Button
                                                size='small'
                                                variant='contained'
                                                className='bg-red-600 text-white'
                                                onClick={() => handleRemoveCourse(course)}
                                            >
                                                Remove
                                            </Button>
                                        </Grid>
                                    </Grid>
                                    <Divider />
                                </Grid>
                            ))}
                        </Grid>
                    }
                    <form onSubmit={handleSubmit(handleAddCourse)}>
                        <Grid container spacing={2} mt={1}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                <Controller
                                    name='courseCode'
                                    control={control}
                                    rules={{ required: 'Course Code is required' }} 
                                    render={({ field: { value, onChange } }) => (
                                        <div>
                                            <TextField
                                                fullWidth
                                                size='small'
                                                label='Course Code'
                                                variant='outlined'
                                                id="course-code"
                                                value={value}
                                                onChange={onChange}
                                                aria-describedby='course-code'
                                            />
                                            <Typography variant="body2" color="error">{errors.courseCode && errors.courseCode.message}</Typography> 
                                        </div>
                                    )}
                                />
                                </FormControl>
                               
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <Controller
                                        name='courseDesc'
                                        control={control}
                                        rules={{ required: 'Course Description is Required' }} 
                                        render={({ field: { value, onChange } }) => (
                                            <div>
                                            <TextField
                                                fullWidth
                                                size='small'
                                                label='Course Description'
                                                variant='outlined'
                                                id="course-code"
                                                value={value}
                                                onChange={onChange}
                                                aria-describedby='course-code'
                                            />
                                            <Typography variant="body2" color="error">{errors.courseDesc && errors.courseDesc.message}</Typography> 
                                        </div>
                                        )}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <Controller
                                        name='units'
                                        control={control}
                                        rules={{ required: 'Units is required' }} 
                                        render={({ field: { value, onChange } }) => (
                                            <div>
                                            <TextField
                                            fullWidth
                                                size='small'
                                                label='Units'
                                                variant='outlined'
                                                value={value}
                                                onChange={onChange}
                                                aria-describedby='course-units'
                                            />
                                          <Typography variant="body2" color="error">{errors.units && errors.units.message}</Typography> 
 
                                        </div>
                                        )}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <Controller
                                        name='finalGrade'
                                        control={control}
                                        rules={{ required: 'Grade is required' }} 
                                        render={({ field: { value, onChange } }) => (
                                            <div> 
                                            <TextField
                                            fullWidth
                                                label='Final Grade'
                                                size='small'
                                                variant='outlined'
                                                id="final-grade"
                                                value={value}
                                                onChange={onChange}
                                                aria-describedby='final-grade'
                                            />
                                            <Typography variant="body2" color="error">{errors.finalGrade && errors.finalGrade.message}</Typography> 
                                            </div>
                                        )}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <Controller
                                        name='semester'
                                        control={control}
                                        rules={{ required: 'Semester is required' }} 
                                        render={({ field: { value, onChange } }) => (
                                            <div>
                                            <Autocomplete
                                                fullWidth
                                                size='small'
                                                id="semester"
                                                options={[...gradeSemester, "COURSE ACCREDITED"]}
                                                getOptionLabel={(option) => option}
                                                renderInput={(params) => <TextField {...params} label="Semester" variant="outlined" />}
                                                value={value}
                                                onChange={(e, data) => onChange(data)}
                                            />
                                            <Typography variant="body2" color="error">{errors.semester && errors.semester.message}</Typography> 
                                            </div>
                                        )}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={4} className='flex items-center justify-center'>
                                <Button
                                    fullWidth
                                    type='submit'
                                    variant='contained'
                                    className='mt-3 bg-teal-600 text-white'
                                >
                                    Add
                                </Button>
                            </Grid>
                            <Grid item xs={4} className='flex items-center justify-center'>
                                <Button
                                    fullWidth
                                    onClick={() => setShowModal(false)}
                                    variant='contained'
                                    className='mt-3 bg-red-500 text-white'
                                >
                                    Cancel
                                </Button>
                            </Grid>
                            <Grid item xs={4} className='flex items-center justify-center'>
                                <Button
                                    fullWidth
                                    onClick={() => setShowModal(false)}
                                    variant='contained'
                                    className='mt-3 bg-blue-500 text-white'
                                >
                                    Done
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddCourses