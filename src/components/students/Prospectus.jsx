import { getUser } from '@/src/app/lib/loginClient';
import api from '@/src/common/api';
import { storage } from '@/src/common/firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from '@firebase/storage';
import { Autocomplete, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Prospectus = ({ passedCourses, fetchGradeInfo, showStep4Dialog, courses, displayedCourses, lackingCourses, fetchSuggestedCourses, setDisplayedCourses, showDialog, setShowDialog }) => {
    const [courseFilter, setCourseFilter] = useState('show all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [preview, setPreview] = useState('');
    const [defaultValues, setDefaultValues] = useState();
    const [currentUser, setCurrentUser] = useState();

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        clearErrors,
        reset,
    } = useForm()

    const handleSelectEquivalentCourse = (course) => {
        const courseCode = course.includes('GE') ? course.split(' ')[0] : course.split(' ')[0] + ' ' + course.split(' ')[1]
        const selectedCourse = passedCourses.find((grade) => grade.courseCode.includes(courseCode));
        if (selectedCourse) {
            setDefaultValues({
                units: selectedCourse.units,
                finalGrade: selectedCourse.finalGrade,
            });
        }
    }


    const onSubmit = async (data) => {
        try {

            if (data.accreditedCourse === null || data.equivalentCourse === null || data.school === null || data.file === null) {
                toast.error("Please fill out all the fields", {
                    duration: 3000,
                    position: "top-right",
                    style: {
                        backgroundColor: "#f44336",
                        color: "#fff",
                    },
                });
                return;
            }

            setIsSubmitting(true)
            setShowDialog(false)

            const file = await handleUpload(data.file)


            const equivalentCourse = {
                course: data.equivalentCourse,
                units: data.units ? data.units : defaultValues.units,
                finalGrade: data.finalGrade ? data.finalGrade : defaultValues.finalGrade,
            }

            const formData = {
                studentId: currentUser.idNumber,
                accreditedCourse: data.accreditedCourse.course,
                equivalentCourse: equivalentCourse,
                schoolName: data.school,
                file: file
            }

            const response = await api.createCourseAccreditation(formData)

            if (response.status === 200) {
                setShowDialog(false)
                fetchSuggestedCourses(currentUser);
                fetchGradeInfo(currentUser);
                toast.success('Course accreditation submitted successfully', {
                    duration: 3000,
                    position: 'top-right',
                    style: {
                        backgroundColor: '#4caf50',
                        color: '#fff',
                    },
                })
            } else {
                toast.error('Failed to submit course accreditation', {
                    duration: 3000,
                    position: 'top-right',
                    style: {
                        backgroundColor: '#f44336',
                        color: '#fff',
                    },
                })
            }
            setIsSubmitting(false)

        } catch (error) {
            console.log(error)
        }
    }

    const handleSubmitProspectus = () => {
        showStep4Dialog(true)
        // setStudyPlanCreated(true)
    }

    const handleUpload = async (file) => {
        if (file) {
            try {
                // Create a storage reference
                const filename = file.name.split(' ').join('-');
                const timestamp = new Date().getTime();
                const uniqueFilename = `${filename}-${timestamp}`;
                const storageRef = ref(storage, `sistem-files/course-accreditaion/${uniqueFilename}`);
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
    const fetchUnitInfo = useCallback(async (user) =>{
        setIsLoading(true)
        const id = user?.idNumber;
        const responseGrade = await api.getGrades(id)
        const courses = responseGrade.data?.grade?.courses
        const accredited = responseGrade.data?.grade?.accreditedCourses;
    
        let studentTotalUnitsFailed = 0;
        let studentTotalUnits = 0;
        let count = 0;
        const data = courses?.map((gradeInfo) => {
          const rows = []
          if(!gradeInfo.isPassed && gradeInfo.finalGrade !== "NG"){
            studentTotalUnitsFailed += parseInt(gradeInfo.units)
            return{
                units: parseInt(gradeInfo.units),
                courseCode: gradeInfo.courseCode,
                verdict: "FAILED"
            }
        }
        else if(
          gradeInfo.isPassed &&
          (
            gradeInfo.courseCode.includes("IS") ||
            gradeInfo.courseCode.includes("IT") ||
            gradeInfo.courseCode.includes("CS") ||
            gradeInfo.courseCode.includes("CIS") ||
            gradeInfo.courseCode.includes("GE-") ||
            gradeInfo.courseCode.includes("EDM") ||
            gradeInfo.courseCode.includes("NSTP") ||
            gradeInfo.courseCode.includes("FILIPINO") || //2018 curriculum extra minor
            gradeInfo.courseCode.includes("TPE")
          )
        ) {
          studentTotalUnits += parseInt(gradeInfo.units);
        }
        else if (gradeInfo.finalGrade === "INC" || gradeInfo.finalGrade === "W") {
          return null;
        }
        
        }).filter(Boolean)
    
        const regularCourseCodes = new Set(courses?.map(course => course.courseCode));
          accredited.forEach(course => {
            let commonSubstringFound = false;
            regularCourseCodes.forEach(regularCode => {
                if (course.equivalentCourse.course.includes(regularCode)) {
                  /* console.log(`Common substring found: ${regularCode}`); */
                    commonSubstringFound = true;
                    return;
                }
            });
        
            if (!commonSubstringFound && course.accreditedCourse.isPassed) {
                count += parseInt(course.equivalentCourse.units);
            }
        });
        let combine = count + studentTotalUnits;

        setTotalUnitsPassed(combine)
        //BSIS conditions in year standing
        //not the same with BSIT and BSCS
        //need data for BSIT and BSCS
        let response
    
        if(user.effectiveYear === '2018' && user.program === 'BS IS'){
          if(combine >= 0 && combine <= 51){
            const formData = {
              yearLevel: '1'
            };
             response = await api.updateStudentUser(user._id, formData);    
             console.log('1st yr')
          }
          else if(combine >=52 && combine <=98){
            const formData = {
              yearLevel: '2'
            };
            response = await api.updateStudentUser(user._id, formData);
            console.log('2nd yr')
          }
          else if(combine >= 99 && combine <= 150){
            const formData = {
              yearLevel: '3'
            };
            response = await api.updateStudentUser(user._id, formData);
            console.log('3rd yr')
          }
          else if(combine >= 150){
            const formData = {
              yearLevel: '4'
            };
            response = await api.updateStudentUser(user._id, formData);
            console.log('4th yr')
          }
          else{
            console.log('year undefined')
          }
        }
        else if(user.effectiveYear === '2018' && user.program === 'BS IT'){
            if(combine >= 0 && combine <= 51){
                const formData = {
                  yearLevel: '1'
                };
                 response = await api.updateStudentUser(user._id, formData);    
                 console.log('1st yr')
              }
              else if(combine >=52 && combine <=98){
                const formData = {
                  yearLevel: '2'
                };
                response = await api.updateStudentUser(user._id, formData);
                console.log('2nd yr')
              }
              else if(combine >= 99 && combine <= 140){
                const formData = {
                  yearLevel: '3'
                };
                response = await api.updateStudentUser(user._id, formData);
                console.log('3rd yr')
              }
              else if(combine >= 141){
                const formData = {
                  yearLevel: '4'
                };
                response = await api.updateStudentUser(user._id, formData);
                console.log('4th yr')
              }
              else{
                console.log('year undefined')
              }
        }
        else if(user.effectiveYear === '2018' && user.program === 'BS CS'){
            if(combine >= 0 && combine <= 51){
                const formData = {
                  yearLevel: '1'
                };
                 response = await api.updateStudentUser(user._id, formData);    
                 console.log('1st yr')
              }
              else if(combine >=52 && combine <=98){
                const formData = {
                  yearLevel: '2'
                };
                response = await api.updateStudentUser(user._id, formData);
                console.log('2nd yr')
              }
              else if(combine >= 99 && combine <= 145){
                const formData = {
                  yearLevel: '3'
                };
                response = await api.updateStudentUser(user._id, formData);
                console.log('3rd yr')
              }
              else if(combine >= 146){
                const formData = {
                  yearLevel: '4'
                };
                response = await api.updateStudentUser(user._id, formData);
                console.log('4th yr')
              }
              else{
                console.log('year undefined')
              }
        }
        
        else if(user.effectiveYear === '2023' && user.program === 'BS CS'){
          if(combine >= 0 && combine <=52){
              const formData = {
                  yearLevel: '1'
                };
                response = await api.updateStudentUser(user._id, formData);
          }
          else if(combine >=53 && combine <= 114){
              const formData = {
                  yearLevel: '2'
                };
                response = await api.updateStudentUser(user._id, formData);
          }
          else if(combine >= 115){
              const formData = {
                  yearLevel: '3'
                };
                response = await api.updateStudentUser(user._id, formData);
          }
    
        }
        else if(user.effectiveYear === '2023' && user.program === 'BS IT'){
    
          if(combine >= 0 && combine <= 52){
              const formData = {
                  yearLevel: '1'
                };
                response = await api.updateStudentUser(user._id, formData);
          }
          else if(combine >= 53 && combine <= 113){
              const formData = {
                  yearLevel: '2'
                };
                response = await api.updateStudentUser(user._id, formData);
          }
          else if(combine >= 114){
              const formData = {
                  yearLevel: '3'
                };
                response = await api.updateStudentUser(user._id, formData);
          }
        }
          else if(user.effectiveYear === '2023' && user.program === 'BS IS'){
            if(combine >= 0 && combine <= 63){
                const formData = {
                    yearLevel: '1'
                  };
                  response = await api.updateStudentUser(user._id, formData);
            }
            else if(combine >= 64 && combine <= 127){
                const formData = {
                    yearLevel: '2'
                  };
                  response = await api.updateStudentUser(user._id, formData);
            }
            else if(combine >= 128){
                const formData = {
                    yearLevel: '3'
                  };
                  response = await api.updateStudentUser(user._id, formData);
            }
    
        }
    

      })
    

    useEffect(() => {
        const init = async () => {
            const user = await getUser();
            setCurrentUser(user);
            fetchUnitInfo(user)
        }
        init()
    }, [])

    return (
        <div>
            <Grid container spacing={2} mt={3}>

                
            </Grid>

            <Grid item xs={12} md={6} className='mt-3'>
                <Typography className='text-gray-600 font-semibold'>
                    List of courses from prospectus
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
                        className="bg-teal-600 text-white hover:bg-teal-700"
                        onClick={handleFilterCourses}
                    >
                        Refresh
                    </Button>
                </Box>
                <Divider className='my-3' />
                {
                    !isSubmitting ?
                        Object.keys(displayedCourses).map((key, index) => {
                            return (
                                displayedCourses[key] && displayedCourses[key].length > 0 &&
                                <div key={index} className='mt-3'>
                                    <Typography className='text-teal-600 font-semibold'>
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
                                                    <Grid item xs={2.5}>
                                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                            Course Description
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={1}>
                                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                            Units
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={2.5}>
                                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                            Equivalents
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={2.5}>
                                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                            Requisites
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={1.5}>
                                                        <Typography className='text-teal-600 font-semibold text-sm text-center'>
                                                            Status
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                                <Divider />
                                            </Grid>
                                            {
                                                displayedCourses[key].map((course, index) => (
                                                    <Grid item xs={12} key={index}>
                                                        <Grid container className={`${course.hasTaken ? 'bg-green-200' : 'bg-gray-200'}`}>
                                                            <Grid item xs={2}>
                                                                <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                                    {course.courseCode}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={2.5}>
                                                                <Typography className='text-gray-600 font-semibold text-sm'>
                                                                    {course.courseDesc}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={1}>
                                                                <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                                    {course.units}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={2.5}>
                                                                <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                                    {course.equivalents?.length > 0 ? course.equivalents.map((equivalent) => equivalent).join(", ") : 'N/A'}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={2.5}>
                                                                <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                                    {course.requisites?.length > 0 ? course.requisites.map((requisite) => requisite).join(", ") : 'N/A'}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={1.5} className='text-center'>
                                                                {
                                                                    course.hasTaken ?
                                                                        <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                                            TAKEN
                                                                        </Typography>
                                                                        :
                                                                        <Typography className='text-gray-600 font-semibold text-sm text-center'>
                                                                            LACKING
                                                                        </Typography>
                                                                }
                                                            </Grid>
                                                            <Divider />
                                                        </Grid>
                                                    </Grid>
                                                ))

                                            }


                                        </Grid>

                                    </Box>

                                </div>
                            )
                        })
                        :
                        <div className='flex flex-col items-center justify-center mt-3'>
                            <CircularProgress size={30} />
                            <Typography className='text-teal-600 font-semibold'>
                                Loading...
                            </Typography>
                        </div>
                }
            </Grid>
            {
                !isSubmitting &&
                <Grid item xs={12} className='flex items-center justify-center'>
                    <Button
                        // disabled={studyPlanCreated || isSubmitting}
                        onClick={handleSubmitProspectus}
                        variant='contained'
                        size='small'
                        className="w-fit mt-4 text-white bg-teal-600"
                    >
                        Continue
                    </Button>
                </Grid>
            }
            <Dialog
                open={showDialog}
                onClose={() => setShowDialog(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Add Courses
                </DialogTitle>
                <DialogContent>
                    <Typography className="text-teal-600 font-semibold mb-2">
                        Please select courses below that have been accredited by the university to clear them from your lacking subjects list.
                    </Typography>
                    <Grid container spacing={2} component='form' mt={1} onSubmit={handleSubmit(onSubmit)}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Typography className='text-gray-600 text-sm mb-2'>
                                    Select the course here to be accredited. The list of courses is from your prospectus
                                </Typography>
                                <Controller
                                    name="accreditedCourse"
                                    control={control}
                                    rules={{
                                        required: "Field is required",
                                    }}
                                    render={({ field: { onChange, value } }) => {
                                        // Filter out options that are already accredited

                                        const filteredCourses = lackingCourses.filter(course => course.isEligible === true);

                                        return (
                                            <Autocomplete
                                                value={value}
                                                onChange={(event, newValue) => {
                                                    onChange(newValue);
                                                }}
                                                options={filteredCourses}
                                                getOptionLabel={(option) =>
                                                    option.course?.courseCode +
                                                    " " +
                                                    option.course?.courseDesc
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Course to be accredited"
                                                    />
                                                )}
                                            />
                                        );
                                    }}

                                />
                                <FormHelperText>
                                    Please select a course that has been officially accredited by the
                                    university/ISMIS.
                                </FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Typography className='text-gray-600 text-sm mb-2'>
                                    Select the equivalent course taken from other school/department.
                                </Typography>
                                <Controller
                                    name="equivalentCourse"
                                    control={control}
                                    render={({ field: { onChange, value } }) => {
                                        // Filter out options from grades that are already accredited
                                        // const filteredGrades = passedCourses.filter(grade =>
                                        //     !accreditedCourses.some(accredited => {
                                        //         const match = accredited.equivalentCourse.course?.includes(grade)
                                        //         return match ? 1 : 0
                                        //     })

                                        // );
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
                                                options={passedCourses.map((grade) => grade.courseCode + ' ' + grade.courseDesc) || ''}
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
                                    name="units"
                                    control={control}
                                    render={({ field: { onChange, value } }) => [
                                        <TextField
                                            defaultValue={defaultValues?.units}
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
                                Input the final grade of the equivalent course taken.
                            </Typography>
                            <FormControl fullWidth>
                                <Controller
                                    name="finalGrade"
                                    control={control}
                                    render={({ field: { onChange, value } }) => [
                                        <TextField
                                            defaultValue={defaultValues?.finalGrade}
                                            value={value}
                                            onChange={onChange}
                                            fullWidth
                                        />
                                    ]}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="school"
                                    control={control}
                                    rules={{
                                        required: "Field is required",
                                    }}
                                    render={({ field: { onChange, value } }) => [
                                        <TextField
                                            value={value}
                                            onChange={onChange}
                                            label="Input School Name"
                                            fullWidth
                                        />
                                    ]}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl>
                                <Controller
                                    name='file'
                                    control={control}
                                    rules={{
                                        required: 'File is required',
                                    }}
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <>
                                            <label htmlFor="file">File (png, jpeg, jpg, pdf)</label>
                                            <Button variant='contained' component='label' className="bg-teal-600 text-white hover:bg-cyan-700">
                                                Upload File
                                                <input
                                                    required={true}
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
                                Please upload a screenshot of the approved course accreditation application from ISMIS.
                            </FormHelperText>
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container spacing={2}>
                                <Grid item xs={6} className='flex items-center justify-center'>
                                    <Button fullWidth variant='outlined' onClick={() => setShowDialog(false)}>Cancel</Button>
                                </Grid>
                                <Grid item xs={6} className='flex items-center justify-center'>
                                    <Button fullWidth variant='contained' className="bg-teal-600 text-white hover:bg-teal-700" type='submit' disabled={!isValid}>Confirm</Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Prospectus