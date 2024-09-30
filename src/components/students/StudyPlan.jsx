import { getUser } from '@/src/app/lib/loginClient';
import api from '@/src/common/api';
import { Box, Button, Divider, Grid, Typography, CircularProgress } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'

const StudyPlan = ({ handleVerifyStudent, grades }) => {
    const [studyPlan, setStudyPlan] = useState({});
    const [studyPlanLoading, setStudyPlanLoading] = useState(false);

    const fetchStudyPlan = useCallback(async (id) => {
        try {
            setStudyPlanLoading(true);
            const response = await api.getStudentStudyPlan(id)
            const studyPlan = response.data.studentStudyPlan
            if (response.status === 200) {
                setStudyPlan(studyPlan);
            }
            setStudyPlanLoading(false);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const user = await getUser();
        fetchStudyPlan(user.idNumber);
        }
        init();
    }, []);

    return (
        <div>
            <Grid container spacing={2}>
                {studyPlanLoading ?
                    <Grid item xs={12}>
                        <div className="h-64 flex justify-center items-center space-x-5">
                            <CircularProgress className="w-24" />
                            <Typography
                                className="text-white-600 text-sm mt-3"
                                sx={{ fontSize: "40px" }}
                            >
                                Loading Study Plan...
                            </Typography>
                        </div>
                    </Grid>
                    :
                    <>
                        <Grid item xs={12} className='mt-3'>
                            <Typography className='text-teal-600 font-semibold text-center mt-2'>
                                {studyPlan?.semPeriod?.semester} - {studyPlan?.semPeriod?.year}
                            </Typography>

                            <Box className="border-solid border-slate-300 rounded-md p-1 mt-1">
                                <Grid item xs={12}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={3}>
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
                                        <Grid item xs={4}>
                                            <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                Status
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Divider />
                                </Grid>
                                {
                                    studyPlan?.suggestedCourses?.length === 0 &&
                                    <Grid item xs={12}>
                                        <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                            No courses to Display
                                        </Typography>
                                        {
                                            studyPlan?.semPeriod.semester === 'SUMMER SEMESTER' &&
                                            <Typography variant='caption' className='text-gray-600 text-center'>
                                                Note: If your curriculum does not have regular summer courses, your initial study plan will be empty. You may add courses later within the website. Please continue to the next step.
                                            </Typography>
                                        }
                                    </Grid>
                                }
                                {
                                    studyPlan?.suggestedCourses?.map((course, index) => (
                                        <Grid item xs={12} key={index}>
                                            <Grid container spacing={1}>
                                                <Grid item xs={3}>
                                                    <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                        {course.courseCode}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography className='text-gray-600 font-semibold text-sm'>
                                                        {course.courseDesc}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={2}>
                                                    <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                        {course.units}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                        {
                                                            grades?.courses?.some((grade) => grade.courseCode === course.courseCode && grade.finalGrade === 'NG') ? 'Currently enrolled' : 'To be enrolled/petitioned'
                                                        }
                                                    </Typography>
                                                </Grid>

                                            </Grid>
                                            <Divider />
                                        </Grid>
                                    ))
                                }
                            </Box>
                        </Grid>
                        <Grid item xs={12} className='flex justify-center items-center mt-3'>
                            <Button
                                size='small'
                                variant='contained'
                                className='w-fit mt-3 text-white bg-teal-600'
                                onClick={handleVerifyStudent}
                            >
                                Done
                            </Button>
                        </Grid>
                    </>
                }
            </Grid>
        </div>
    )
}

export default StudyPlan