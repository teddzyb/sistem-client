'use client'
import { Grid, Box, Button, Typography, FormControl, InputLabel, Select, MenuItem, TextField, TextareaAutosize, CircularProgress, Dialog, DialogTitle, DialogActions, Autocomplete, FormHelperText, Divider } from '@mui/material'
import { React, useState, useRef, useEffect, useCallback } from 'react'
import { MdCloudUpload, MdPictureAsPdf } from 'react-icons/md'
import { SiMicrosoftword } from "react-icons/si"
import CloseIcon from '@mui/icons-material/Close'
import ImageIcon from '@mui/icons-material/Image'
import toast from 'react-hot-toast'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/src/common/firebaseConfig'
import { Controller, get, set, useForm } from 'react-hook-form'
import api from '@/src/common/api'
import { getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient'
import { useRouter } from 'next/navigation'
import { FileUploadOutlined, UploadFileOutlined } from '@mui/icons-material'
import { getSession } from 'next-auth/react'
import { authConfig } from '@/src/app/lib/auth'

const CreateNewRequest = () => {
  loginIsRequiredClient()
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState({})
  const [concernOptions, setConcernOptions] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter()
  const [courses, setCourses] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false)
  const [coursesTaken, setCoursesTaken] = useState([])
  const [isValidFile, setIsValidFile] = useState(true)
  const [concern, setConcern] = useState('')
  const [concernsNeedCourses, setConcernsNeedCourses] = useState([])

  const fetchCourses = useCallback(async (user) => {
    try {
      setIsLoading(true)
      const year = user?.effectiveYear;
      const program = user?.program;
      const res = await api.getProspectus(program, year);

      let courses = []

      res.data.prospectus.courses.forEach(course => {
        if (!course.courseCode.startsWith('GE-') && !course.courseCode.startsWith('NSTP') && !course.courseCode.startsWith('TPE') && !course.courseCode.startsWith('EDM')) {
          courses.push(
            course.courseCode + ' ' + course.courseDesc
          );
        }
      })

      let equivalentCourses = []
      /* res.data.prospectus.courses.map(course => course.equivalents.forEach(equivalentCourse => equivalentCourses.push(equivalentCourse))) */
      res.data.prospectus.courses.forEach(course => {
        course.equivalents.forEach(equivalentCourse => {
          // Check if the equivalent course does not include 'GE-FEL'
          if (!equivalentCourse.includes('GE-FEL') && !equivalentCourse.includes('IS 1') && !equivalentCourse.includes('IT 1') && !equivalentCourse.includes('CS 1')) {
            equivalentCourses.push(equivalentCourse);
          }
        });
      });


      const allCourse = [...courses, ...equivalentCourses];
      setCourses(allCourse)
      setIsLoading(false)

    } catch (error) {
      console.log(error)
    }
  }, [])

  /* UPLOAD SECTION */
  const [image, setImage] = useState(null);
  const inputRef = useRef(null);
  const [uploadPercentage, setUploadPercentage] = useState(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
    clearErrors,
    setError,
    reset,
  } = useForm()

  const fetchTakenCourses = useCallback(async (currentUser) => {
    try {
      const response = await api.getSuggestedCourses(currentUser.idNumber)

      if (response.status === 200) {
        const courses = response.data.suggestedCourses.suggestedCourses
        let coursesTaken = []
        courses.forEach(course => {
          if (course.hasTaken) {
            coursesTaken.push(
              course.course.courseCode + ' ' + course.course.courseDesc
            )
          }
        })
        setCoursesTaken(coursesTaken)
      }
    } catch (error) {
      console.error('Error fetching taken courses:', error.message)
    }
  }, [])


  const fetchConcernOptions = useCallback(async (year) => {
    try {
      const response = await api.getSpecialRequestOptions()
      const concernOptions = response.data.specialRequests

      const filteredConcernOptions = concernOptions.filter(option =>
        option.eligibleYearLevels.some(yearLevel => yearLevel[0] === year[0])
      )

      setConcernOptions(filteredConcernOptions)

      const concernsNeedCourses = filteredConcernOptions.filter(option => 
        option.requestTitle !== 'Shift' && option.requestTitle !== 'Advanced Practicum').map(option => option._id)

      setConcernsNeedCourses(concernsNeedCourses)
    } catch (error) {
      console.error('Error fetching concern options:', error.message)
    }
  }, [])

  const fetchAcademicPeriod = useCallback(async () => {
    try {
      const response = await api.getCurrentSemester()
      if (response.status === 200) {
        const semester = response.data
        const isEnabled = semester?.specialRequestEnabled
        setIsDisabled(!isEnabled)

      }
    } catch (error) {
      console.log(error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const user = await getUser()
      setCurrentUser(user)
      const year = user?.yearLevel
      fetchConcernOptions(year)
      fetchAcademicPeriod()
      fetchCourses(user)
      fetchTakenCourses(user)

    }

    init()


  }, [])

  const handleCourseCheck = (courses, concern) => {
    let conditionedConcerns = []

    concernOptions.forEach(option => {
      if (option.requestTitle === 'Simultaneous Enrollment' || option.requestTitle === 'Overload Enrollment' || option.requestTitle === 'In Lieu') {
        conditionedConcerns.push(option._id)
      }
    })

    let isValid = true

    if (conditionedConcerns.includes(concern)){
      if (courses.every(course => coursesTaken.includes(course))){
        isValid = false
      }
    }
    return isValid
}

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      const isValidCourses = handleCourseCheck([data.course1, data.course2], data.concern)

      if (!isValidCourses) {
        toast.error('Please select a course not yet taken', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            fontFamily: 'Source Sans Pro',
            backgroundColor: '#f44336',
            color: '#fff',
          }
        })
        setIsSubmitting(false);
        return;

      }

      for (let a = 0; a < selectedFiles.length; a++) {
        const file = selectedFiles[a];
        const fileExtend = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(fileExtend)) {
          toast.error('Unsupported file format! PDF, DOC Files, and images only', {
            position: 'bottom-right',
            duration: 3000,
            style: {
              fontFamily: 'Source Sans Pro',
              backgroundColor: '#f44336',
              color: '#fff',
            }
          })
          setIsSubmitting(false)
          return;
        }
      }


      const filesToUpload = await Promise.all(selectedFiles.map(file => handleUpload(file)));

      const courses = concernsNeedCourses.includes(data.concern) ? [data.course1, data.course2] : []

      // console.log(courses)

      const formData = {
        createdBy: currentUser._id,
        concern: data.concern,
        coursesAssociated: courses,
        reason: data.reason,
        attachedFiles: filesToUpload,
      }

      // console.log(formData)

      const response = await api.createSpecialRequest(formData)


      if (response.status === 201) {
        toast.success('Special request created successfully!', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            fontFamily: 'Source Sans Pro',
            backgroundColor: '#4caf50',
            color: '#fff',
          }
        })

        router.push(`/enrollment/all-requests/${response.data.specialRequest._id}`)
      } else {
        toast.error('Error creating special request!', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            fontFamily: 'Source Sans Pro',
            backgroundColor: '#f44336',
            color: '#fff',
          }
        })
      }

      reset();
      setSelectedFiles([]);
      setIsSubmitting(false);

    } catch (error) {
      console.log(error)
    }
  }

  const handleFileChange = (event) => {
    const files = event.target.files;
    setUploadPercentage(0);

    if (selectedFiles.length + files.length > 5) {
      toast.error('Upload limit is 5 files only!', {
        position: 'bottom-right',
        duration: 3000,
        style: {
          fontFamily: 'Source Sans Pro',
          backgroundColor: '#f44336',
          color: '#fff',
        }
      })
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
  }

  const handleUpload = async (file) => {
    if (file) {
      try {
        // Create a storage reference
        const filename = file.name.split(' ').join('-');
        const timestamp = new Date().getTime();
        const uniqueFilename = `${filename}-${timestamp}`;
        const storageRef = ref(storage, `sistem-files/special-requests/${uniqueFilename}`);
        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the file URL
        const fileURL = await getDownloadURL(snapshot.ref);

        const fileUpload = {
          fileURL: fileURL,
          filePath: snapshot.ref.fullPath,
        };

        return fileUpload;

      } catch (error) {
        console.error('Error uploading file:', error.message);
        throw error;
      }
    } else {
      console.warn('No file selected.');
      return null;
    }
  };

  const onChooseFile = () => {
    inputRef.current.click();
    inputRef.current.value = '';
  };

  const isImage = (selectedFiles) => {
    const imageExtensions = ['jpg', 'jpeg', 'png'];
    const fileExtend = selectedFiles.split('.').pop().toLowerCase();
    return imageExtensions.includes(fileExtend);
  };

  const getFileIcon = (selectedFiles) => {
    const fileExtend = selectedFiles.split('.').pop().toLowerCase();
    if (isImage(selectedFiles)) {
      return <ImageIcon color='black' fontSize='large' />
    }
    else if (fileExtend === 'pdf') {
      return <MdPictureAsPdf color='red' fontSize='2em' />
    }
    else if (fileExtend === 'docx' || fileExtend === 'doc') {
      return <SiMicrosoftword color='#2888cd' fontSize='large' />

    }
  }

  const handleRemoveFile = (index) => {
    const fileToRemove = selectedFiles[index];

    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

  };

  const handleConcernChange = (concern) => {
    setConcern(concern);
    set
  }

  return (
    <div className='w-full'>
      <Typography className='text-600 font-bold text-lg text-teal-600'>
        Create New Special Request

      </Typography>
      <Divider className='my-4' />
      <Typography className='text-gray-600'>
        Please follow the steps below to create a new special request. 
      </Typography>
      {
        isLoading ?
          <Box className='w-full flex justify-center items-center'>
            <CircularProgress />
          </Box>
          :
          <Grid container spacing={3} p={2} className='flex items-center justify-center'>
            <Grid item xs={12} className='w-8/12' boxShadow={2} borderRadius={2} p={3} m={3}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography className='mb-4'>
                    <span style={{ fontWeight: 'bold' }}>Step 1: </span>Choose Your Concern - Select the type of special request you'd like to make based on your academic level.
                    </Typography>

                    <FormControl fullWidth>
                      <Controller
                        name='concern'
                        control={control}
                        rules={{
                          required: 'This field is required',
                        }}
                        render={({ field: { onChange, value } }) => (
                          <>
                            <InputLabel>
                              Concern
                            </InputLabel>
                            <Select
                              id='concern'
                              label='Concern'
                              value={value}
                              onChange={
                                (e) => {
                                  onChange(e.target.value);
                                  handleConcernChange(e.target.value);
                                }
                              }
                              error={Boolean(errors.courseStatus)}
                            >
                              {
                                concernOptions.map((option) => (
                                  <MenuItem key={option._id} value={option._id}>
                                    {option.requestTitle}
                                  </MenuItem>

                                ))
                              }
                            </Select>
                          </>
                        )}
                      />
                    </FormControl>
                  </Grid>
                  {
                    concern != '' && concernsNeedCourses.includes(concern) &&
                  <Grid item xs={12} >
                    <Typography >
                    <span style={{ fontWeight: 'bold' }}>Step 2:</span>  Choose the relevant choice or course relating to your concern 
                    
                    </Typography>
                        <Typography sx={{ marginLeft: { xs: '0', sm: '3.2em' } }} className='mb-4'>
                    (if not applicable, select 'N/A' in the fields). 
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='course1'
                            control={control}
                            render={({ field: { onChange, value } }) => (
                              [
                                <Autocomplete
                                  value={value}
                                  freeSolo={true}
                                  onChange={(event, newValue) => {
                                    onChange(newValue);
                                  }}
                                  options={["N/A", ...courses]}
                                  getOptionLabel={(option) => option}
                                  renderInput={(params) => <TextField {...params} label="Select Course / Choice" error={Boolean(errors.courseStatus)} />}
                                />
                              ]
                            )}
                          />
                        </FormControl>
                        <FormHelperText>
                          *Input 'N/A' on the fields if not applicable
                        </FormHelperText>

                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='course2'
                            control={control}
                            render={({ field: { onChange, value } }) => (
                              [
                                <Autocomplete
                                  value={value}
                                  freeSolo={true}
                                  onChange={(event, newValue) => {
                                    onChange(newValue);
                                  }}
                                  options={["N/A", ...courses]}
                                  getOptionLabel={(option) => option}
                                  renderInput={(params) => <TextField {...params} label="Select Course / Choice" error={Boolean(errors.courseStatus)} />}
                                />
                              ]
                            )}
                          />
                        </FormControl>
                        <FormHelperText>
                          *Input 'N/A' on the fields if not applicable
                        </FormHelperText>
                      </Grid>
                    </Grid>
                  </Grid>
                  }
                  {
                    concern != '' && 
                    <>
                  <Grid item xs={12}>
                        <Typography className='mb-4'>
                    <span style={{ fontWeight: 'bold' }}>Step {concernsNeedCourses.includes(concern) ? '3' : '2'}: </span> Provide a brief explanation of your created request on the text field below.
                    </Typography>
                    <FormControl fullWidth>
                      <Typography className='text-gray-500'>
                        Reason
                      </Typography>
                      <Controller
                        name='reason'
                        control={control}
                        rules={{
                          required: 'This field is required',
                        }}
                        render={({ field: { onChange, value } }) => (
                          <TextareaAutosize
                            className='w-full outline-none border border-gray-400 rounded-md'
                            aria-label='minimum height'
                            minRows={5}
                            placeholder='Enter Reason Here'
                            value={value}
                            onChange={onChange}
                            maxLength={150}
                            style={{ width: "100%" }}

                          />
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Box className='w-full' p={4}>
                      {
                        selectedFiles.length > 0 &&
                        <>
                          <Typography className='text-gray-600 text-md font-bold'>
                            Attached Files
                          </Typography>
                          <Grid container spacing={3}>

                            {
                              selectedFiles.map((file, index) => (
                                <Grid item xs={6} md={2} key={index}>
                                  <Box
                                    className='relative flex flex-col items-center justify-center text-center p-4 mt-4 h-[6em]'
                                    sx={{
                                      fontFamily: 'Source Sans Pro',
                                      backgroundColor: 'transparent',
                                      border: '1px solid #65646496',
                                      borderRadius: '5px',
                                      overflowWrap: 'break-word',
                                    }}>
                                    {getFileIcon(file.name)}
                                    <Typography variant='caption'>
                                      {file.name}
                                    </Typography>

                                    <div style={{ display: uploadPercentage > 0 ? 'block' : 'none' }}>
                                      <div
                                        style={{
                                          width: `${uploadPercentage}%`,
                                          backgroundColor: '#4CAF50',
                                          height: '20px',
                                          marginTop: '10px',
                                        }}
                                      >
                                        {uploadPercentage}%
                                      </div>
                                    </div>

                                    <CloseIcon
                                      className='absolute top-0 right-0'
                                      cursor='pointer'
                                      onClick={() => handleRemoveFile(index)}
                                    />

                                  </Box>
                                </Grid>
                              ))
                            }
                          </Grid>
                        </>
                      }
                    </Box>
                  </Grid>
                  <Grid item xs={12} className='flex flex-col justify-center items-center'>
                    <Typography>
                    <span style={{ fontWeight: 'bold' }}>Step 4: </span> Upload Related Files (Optional).  You can upload up to 5 files only. 
                    </Typography>
                   
                    <Box
                      component='form'
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />

                      <Button
                        fullWidth
                        onClick={onChooseFile}
                        variant='contained'
                        className=' bg-teal-600 flex justify-center items-center space-x-4 text-white'
                      >
                        <FileUploadOutlined/>
                        <Typography>Upload Files</Typography>
                      </Button>
                    </Box>
                    <Typography>
                    Accepted file formats for uploads: [.PDF .doc/docx .jpg/jpeg/png]
                    </Typography>
                  </Grid>

                  <Grid item xs={12} mt={10} className='flex flex-col items-center justify-center'>
                    <Button
                      variant='contained'
                      className={`text-white ${isValid ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300'}  transition duration-300 ease-in-out`}
                      type='submit'
                      disabled={!isValid || isSubmitting}
                    >
                      Create Application
                    </Button>
                  </Grid>
                  </>
                  }
                </Grid>
              </form>

            </Grid>
          </Grid>
      }



      <Dialog
        open={isDisabled}
        // onClose={() => setIsDisabledDialog(false)}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        maxWidth='xs'
      >
        <DialogTitle>
          ⚠️ Creating special requests hasn't been enabled for the current semester. ⚠️
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

export default CreateNewRequest