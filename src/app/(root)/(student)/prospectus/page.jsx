'use client'
import { getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient';
import api from "@/src/common/api";
import { storage } from "@/src/common/firebaseConfig";
import GradesTable from "@/src/components/shared/GradesTable";
import { getDownloadURL, ref, uploadBytes } from "@firebase/storage";
import {
    Box,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Tooltip,
    Typography,
    Button,
    Select,
    MenuItem,
    InputLabel,
    TextField,
    Autocomplete,
    DialogContent,
    FormControl,
    FormHelperText,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from 'react-hot-toast'


const Prospectus = () => {

    loginIsRequiredClient()
    const [allCourses, setAllCourses] = useState([])
    const [lackingCourses, setLackingCourses] = useState([])
    const [courses, setCourses] = useState({})
    const [displayedCourses, setDisplayedCourses] = useState({})
    const [courseFilter, setCourseFilter] = useState("show all")
    const [isLoading, setIsLoading] = useState(false)
    const [isOpenUpdateDialog, setIsOpenUpdateDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [grades, setGrades] = useState([]);
    const [allGrades, setAllGrades] = useState([]);
    const [currentUser, setCurrentUser] = useState({});

    const [preview, setPreview] = useState("");

    const [accreditedCourses, setAccreditedCourses] = useState([]);
    const [defaultValues, setDefaultValues] = useState()

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        clearErrors,
        reset,
    } = useForm();

    const fetchGrades = useCallback(async (user) => {
        setIsLoading(true);
        try {
            const id = user.idNumber;
            const response = await api.getGrades(id);
            if (response.status === 404) {
            } else if (response.status === 200) {
                const grades = response.data.grade;
                setAllGrades(grades.courses);
                setGrades(grades.courses.filter((course) => course.isPassed));              

                const accreditedCourses = grades.accreditedCourses;
                setAccreditedCourses(accreditedCourses);
 
            }
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    }, []);

    const handleSelectEquivalentCourse = (course) => {
        const courseCode = course.includes('GE') ? course.split(' ')[0] : course.split(' ')[0]+ ' ' + course.split(' ')[1]
        const selectedCourse = allGrades.find((grade) => grade.courseCode.includes(courseCode));
        if (selectedCourse) {
            setDefaultValues({
                units: selectedCourse.units,
                finalGrade: selectedCourse.finalGrade,
            });
        }
    }


    const onSubmit = async (data) => {
        try {

            if(data.accreditedCourse === null || data.equivalentCourse === null || data.school === null || data.file === null) {
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

            setIsSubmitting(true);

            const file = await handleUpload(data.file);

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
                file: file,
            };

            const response = await api.createCourseAccreditation(formData);
            if (response.status === 200) {
                fetchSuggestedCourses(currentUser);
                fetchGrades(currentUser);
                setIsOpenUpdateDialog(false);
                setIsSubmitting(false);
                reset();
                setPreview(" ");
                toast.success("Course accreditation submitted successfully", {
                    duration: 3000,
                    position: "top-right",
                    style: {
                        backgroundColor: "#4caf50",
                        color: "#fff",
                    },
                });
            } else {
                setIsSubmitting(false);
                toast.error(response.data.message, {
                    duration: 3000,
                    position: "top-right",
                    style: {
                        backgroundColor: "#f44336",
                        color: "#fff",
                    },
                });
                
            }
        } catch (error) {
            console.log(error);
        }
    };

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
                const filePath = snapshot.ref.fullPath;

                const fileUpload = {
                    fileUrl: fileURL,
                    filePath: filePath,
                };

                return fileUpload;
            } catch (error) {
                console.error("Error uploading file:", error.message);
            }
        } else {
            console.warn("No file selected.");
        }
    };



    const handleFilterCourses = () => {
        const filteredCourses = Object.keys(courses).reduce((acc, key) => {
            if (courseFilter === "show all") {
                acc[key] = courses[key];
            } else if (courseFilter === "show taken") {
                acc[key] = courses[key].filter((course) => course.hasTaken);
            } else if (courseFilter === "show lacking") {
                acc[key] = courses[key].filter((course) => !course.hasTaken);
            }
            return acc;
        }, {});

        setDisplayedCourses(filteredCourses);
    };

    const groupCoursesByYearAndSemester = (courses) => {
        return courses.reduce((acc, item) => {
            const key = `${item.course.year}-${item.course.semester}`;
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


    const fetchSuggestedCourses = useCallback(async (user) => {
        try {
            setIsLoading(true);
            try {
                const id = user.idNumber;
                const response = await api.getSuggestedCourses(id);
                const suggestedCourses = response.data.suggestedCourses.suggestedCourses;

                setAllCourses(suggestedCourses);

                const groupedCourses = groupCoursesByYearAndSemester(suggestedCourses);
                setCourses(groupedCourses);
                setDisplayedCourses(groupedCourses);

            } catch (error) {
                console.error(error);
            }
            setIsLoading(false);
        } catch (error) {
            console.log(error);    
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const user = await getUser()
            setCurrentUser(user)

        const id = user?.idNumber;
        fetchSuggestedCourses(user);
        fetchGrades(user)
        }
        init()
      
    }, [])
        
  return (
    <div className='w-full'>
        <Typography className="text-teal-600 font-bold text-lg">
            Courses Status
        </Typography>
        <Typography className="text-gray-600 text-sm font-semibold">
            Subjects from your prospectus and their corresponding details and status. 
        </Typography>
        <Divider/>
          {
              isLoading ? (
                  <Box className="flex items-center justify-center h-64">
                      <CircularProgress />
                  </Box>
              ) :

          <Grid
              item
              xs={12}
              md={6}
              className="mt-3"
          >
              <Typography className="text-gray-600 font-semibold text-sm">
                  List of courses from prospectus
              </Typography>
              <Box className="flex items-center justify-center space-x-4 my-2">
                  <InputLabel id="filter-courses">Filter Courses</InputLabel>
                  <Select
                      size="small"
                      variant="outlined"
                      defaultValue="show all"
                      className="w-1/2"
                      onChange={(e) => setCourseFilter(e.target.value)}
                  >
                      <MenuItem value="show all">Show All</MenuItem>
                      <MenuItem value="show taken">Show Taken Courses</MenuItem>
                      <MenuItem value="show lacking">Show Lacking Courses</MenuItem>
                  </Select>
                  <Button
                      size="small"
                      variant="contained"
                      className="bg-teal-600 text-white hover:bg-teal-700"
                      onClick={handleFilterCourses}
                  >
                      Refresh
                  </Button>
              </Box>
                      <Divider className='my-10' />
              <Box className="flex flex-col items-center justify-center space-x-2 my-2">
                  <Typography className="text-red-600 font-semibold text-sm">
                      *Some courses taken may be marked as lacking. Please check
                      your grades to correct this and update them manually here.
                  </Typography>
                  
                  <Button
                      size="small"
                      variant="contained"
                      className="w-fit bg-teal-600 text-white hover:bg-teal-700"
                      onClick={() => setIsOpenUpdateDialog(true)}
                  >
                      Update lacking courses
                  </Button>
              </Box>
                      <Divider className='my-10' />
              <Box >
                  {Object.keys(displayedCourses).map((key, index) => {
                      return (
                          displayedCourses[key] &&
                          displayedCourses[key].length > 0 && (
                              <div key={index} className="mt-3">
                                  <Typography className="text-teal-600 font-semibold">
                                      {`Year and Semester: ${key}`}
                                  </Typography>
                                  <Box className="border-solid border-slate-300 rounded-md p-1">
                                      <Grid container spacing={1}>
                                          <Grid item xs={12}>
                                              <Grid container>
                                                  <Grid item xs={2}>
                                                      <Typography className="text-teal-600 font-semibold text-sm text-center">
                                                          Course Code
                                                      </Typography>
                                                  </Grid>
                                                  <Grid item xs={2.5}>
                                                      <Typography className="text-teal-600 font-semibold text-sm text-center">
                                                          Course Description
                                                      </Typography>
                                                  </Grid>
                                                  <Grid item xs={1}>
                                                      <Typography className="text-teal-600 font-semibold text-sm text-center">
                                                          Units
                                                      </Typography>
                                                  </Grid>
                                                  <Grid item xs={2}>
                                                      <Typography className="text-teal-600 font-semibold text-sm text-center">
                                                          Status
                                                      </Typography>
                                                  </Grid>
                                                  <Grid item xs={3}>
                                                      <Typography className="text-teal-600 font-semibold text-sm text-center">
                                                        Course Taken Equivalent
                                                      </Typography>
                                                  </Grid>
                                                  <Grid item xs={1.5}>
                                                      <Typography className="text-teal-600 font-semibold text-sm text-center">
                                                          Final Rating
                                                      </Typography>
                                                  </Grid>
                                              </Grid>
                                              <Divider />
                                          </Grid>
                                          {displayedCourses[key].map((course, index) => {
                                            const grades = allGrades.filter(grade => grade.finalGrade.startsWith('NG'));
                                            let grade;
                                            const actualGrade = parseFloat(course.grade);
                                            grade = (actualGrade <= 3.0 || course.hasTaken === true) ? '1.0' : ' ';

                                              return (
                                                <Grid item xs={12} key={index}>
                                                  <Grid
                                                      container
                                                       className={`${grades.some(grade => grade.courseCode === course.courseCode) ? "bg-yellow-100" : (course.hasTaken && "bg-green-100")}`}
                                                  >
    
                                                      <Grid item xs={2}>
                                                          <Typography className="text-gray-600 font-semibold text-sm text-center">
                                                              {course.courseCode}
                                                          </Typography>
                                                      </Grid>
                                                      <Grid item xs={2.5}>
                                                          <Typography className="text-gray-600 font-semibold text-sm">
                                                              {course.courseDesc}
                                                          </Typography>
                                                      </Grid>
                                                      <Grid item xs={1}>
                                                          <Typography className="text-gray-600 font-semibold text-sm text-center">
                                                              {course.units}
                                                          </Typography>
                                                      </Grid>
                                                      <Grid item xs={2}>
                                                          <Typography className="text-gray-600 font-semibold text-sm text-center">
                                                          {grades.some(grade => grade.courseCode === course.courseCode) ? "Currently Taking" : (course.hasTaken ? "Taken" : "Not Taken")}
                                                          </Typography>
                                                      </Grid>
                                                      <Grid item xs={3}>
                                                          <Typography className="text-gray-600 font-semibold text-sm">
                                                              {course.subjectTaken}
                                                          </Typography>
                                                      </Grid>
                                                      <Grid item xs={1.5} className="text-center">
                                                            <Typography className="text-gray-600 font-semibold text-sm">
                                                            {grade}
                                                            </Typography>
                                                      </Grid>
                                                      <Divider />
                                                  </Grid>
                                              </Grid>
                                              )
                                            })}
                                      </Grid>
                                  </Box>
                              </div>
                          )
                      );
                  })}
              </Box>

          </Grid>
          }


          <Dialog
              open={isOpenUpdateDialog}
              onClose={() => setIsOpenUpdateDialog(false)}
              maxWidth="md"
              fullWidth
          >
              <Box className="p-2">
                  <DialogTitle>
                      Update lacking courses that are already taken. This is solely for
                      the study plan purposes.
                      
                  </DialogTitle>
                  <DialogContent  className='text-red-600'>
                    <strong>Important Note:</strong> Complete the accreditation of courses here before plotting your study plan, not doing so can alter your study plan.
                    </DialogContent>
                  <DialogContent>
                      <GradesTable
                          rows={null}
                          accreditedCourses={accreditedCourses}
                          canModify={true}
                          fetchGrade={fetchGrades}
                          lackingCourses={allCourses}
                          grades={grades}
                          fetchSuggestedCourses={fetchSuggestedCourses}
                      />
                      <Divider className="my-3" />
                      {isSubmitting ? (
                          <>
                              <Box className="flex flex-col justify-center items-center h-64 space-y-5">
                                  <CircularProgress />
                                  <Typography className="text-teal-600 text-lg">
                                      Saving...
                                  </Typography>
                              </Box>
                          </>
                      ) : (
                          <Grid
                              container
                              spacing={2}
                              component="form"
                              mt={1}
                              onSubmit={handleSubmit(onSubmit)}
                          >
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
                                        
                                            const filteredCourses = allCourses.filter(course => course.hasTaken === false);

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
                                            const filteredGrades = grades.filter(grade =>
                                                !accreditedCourses.some(accredited => {
                                                    const match =  accredited.equivalentCourse.course?.includes(grade) 
                                                   return match ? 1 : 0
                                                   
                                                })
                                               
                                            );
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
                                                    options={filteredGrades.map((grade) => grade.courseCode+ ' ' + grade.courseDesc) || ''}
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
                                  <FormHelperText>
                                  Input a number value on this field. e.g '1.1'
                                  </FormHelperText>
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
                                          name="file"
                                          control={control}
                                          rules={{
                                              required: "File is required",
                                          }}
                                          render={({ field: { onChange, onBlur, value, ref } }) => (
                                              <>
                                                  <label htmlFor="file">
                                                      File Format (png, jpeg, jpg, pdf)
                                                  </label>
                                                  <Button
                                                      variant="contained"
                                                      component="label"
                                                      className="bg-teal-600 text-white hover:bg-teal-700"
                                                  >
                                                      Upload File
                                                      <input
                                                          name="file"
                                                          type="file"
                                                          onChange={(e) => {
                                                              const file = e.target.files[0];
                                                              if (file) {
                                                                  onChange(file);
                                                                  setPreview(file.name);
                                                            }
                                                          }}
                                                          onBlur={onBlur}
                                                          ref={ref}
                                                          hidden
                                                          accept="application/pdf, image/*"
                                                      />
                                                  </Button>
                                                  <span>{preview}</span>
                                              </>
                                          )}
                                      />
                                  </FormControl>
                                  <FormHelperText>
                                      Please upload a screenshot of the approved course
                                      accreditation application from ISMIS.
                                  </FormHelperText>
                              </Grid>
                              <Grid item xs={12}>
                                  <Grid container spacing={2}>
                                      <Grid
                                          item
                                          xs={6}
                                          className="flex items-center justify-center"
                                      >
                                          <Button
                                              fullWidth
                                              variant="outlined"
                                              onClick={() => setIsOpenUpdateDialog(false)}
                                          >
                                              Cancel
                                          </Button>
                                      </Grid>
                                      <Grid
                                          item
                                          xs={6}
                                          className="flex items-center justify-center"
                                      >
                                          <Button
                                              fullWidth
                                              variant="contained"
                                              className="bg-teal-600 text-white hover:bg-teal-700"
                                              type="submit"
                                              disabled={!isValid}
                                          >
                                              Confirm
                                          </Button>
                                      </Grid>
                                  </Grid>
                              </Grid>
                          </Grid>
                      )}
                  </DialogContent>
              </Box>
          </Dialog>
    </div>
  )
}

export default Prospectus