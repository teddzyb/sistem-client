"use client";
import { getUser, loginIsRequiredClient } from "@/src/app/lib/loginClient";
import api from "@/src/common/api";
import {AddCircleOutline, RemoveCircleOutline} from "@mui/icons-material";
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
} from "@mui/material";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import moment from "moment";
import React, {useCallback, useEffect, useState} from "react";
import toast from "react-hot-toast";
import { ToastContainer } from "react-toastify";

const StudyPlan = () => {
  loginIsRequiredClient();

  const [isLoading, setIsLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [courses, setCourses] = useState({});
  const [studyPlan, setStudyPlan] = useState({});
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
  const [courseToRemove, setCourseToRemove] = useState({});
  const [displayedCourses, setDisplayedCourses] = useState({});
  const [courseFilter, setCourseFilter] = useState("show all");

  // const [isCurrentSem, setIsCurrentSem] = useState(true);
  const [semesters, setSemesters] = useState([]);
  const [currentSemester, setCurrentSemester] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [displayedSemester, setDisplayedSemester] = useState('')
  const [displayedYear, setDisplayedYear] = useState('')

  const semesterOptions = ["1ST SEMESTER", "2ND SEMESTER", "SUMMER SEMESTER"];
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [lackingCourses, setLackingCourses] = useState({})
  const [isOpenDeleteAllDialog, setIsOpenDeleteAllDialog] = useState(false)

  const [selected, setSelected] = useState("")
  const [yearSelected, setYearSelected] = useState('')
  const [yearUpdatedValues, setYearUpdatedValues] = useState(false)
  const [allGrades, setAllGrades] = useState([]);  
  const [unitsLimit, setUnitsLimit] = useState(0)
  const [unitsApplied, setUnitsApplied] = useState(0)

  const getMaxDate = () => {
    const currentYear = dayjs().year(); 
    return dayjs(new Date(currentYear, 0, 1)); 
  };


  const fetchGrades = useCallback(async (id) => {
    try {
      setIsLoading(true);
      const response = await api.getGrades(id);
      if (response.status === 404) {
      } else if (response.status === 200) {
        const grades = response.data.grade;
        setAllGrades(grades.courses);
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleRemoveAll = async () => {
    try {
      setIsOpenDeleteAllDialog(false);
      setStudyPlanLoading(true);
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
      setStudyPlanLoading(false)
    } catch (error) {
      console.error(error);
    }
  }


  const handleCreateStudyPlan = async () => {
    try {
      setIsLoading(true);
      const id = currentUser.idNumber;

      const formData = {
        studentId: id,
        semester: selectedSemester,
        year: selectedYear,
      };

      const response = await api.createStudyPlan(formData);

      if (response.status === 201) {
        const studyPlan = response.data.studentStudyPlan;
        toast.success("Study plan created successfully", {
          duration: 3000,
          position: "bottom-left",
          style: {
            backgroundColor: "#4caf50",
            color: "#fff",
          },
        });
        setStudyPlan(studyPlan);
      } else {
        toast.error("Failed to create study plan", {
          duration: 3000,
          position: "top-center",
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.log(error);
    }
  };


  const handleChangeAcademicPeriod = async () => {
    try {
      setStudyPlanLoading(true);
      
      
      const id = currentUser.idNumber;

      // setIsCurrentSem(false)
      const response = await api.getStudentStudyPlanBySem(
        selectedSemester,
        selectedYear,
        id
      );

      if (response.status === 200) {
        setYearSelected(selectedYear)
        setSelected(selectedSemester)
        const studyPlan = response.data.studentStudyPlan;
        setStudyPlan(studyPlan);

        // let unitsLimit = 0;

        // if (selectedSemester === 'SUMMER SEMESTER') {
        //   unitsLimit = 9;
        // } else {

        //   const key = currentUser.yearLevel + "-" + selectedSemester.split(' ')[0] + ' Semester';
  
        //   courses[key]?.forEach((c) => {
        //     unitsLimit += c.units;
        //   });
        // }


        // setUnitsLimit(unitsLimit);

        // let unitsApplied = 0;

        // studyPlan?.suggestedCourses.forEach((c) => {
        //   unitsApplied += c.units;
        // })

        // setUnitsApplied(unitsApplied);
        
      } else {
        toast.error("No study plan found", {
          duration: 3000,
          position: "top-right",
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        });
      }
      setStudyPlanLoading(false);
      setDisplayedSemester(selectedSemester);
      setDisplayedYear(selectedYear);
    } catch (error) {
      console.log(error);
    }
  };

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
        updatedBy: currentUser._id,
      };

      const response = await api.addToStudyPlan(formData);

      if (response.status === 201) {
        await handleChangeAcademicPeriod();
        toast.success(
          `Course ${course.courseCode} ${course.courseDesc} has been added to the study plan`,
          {
            duration: 3000,
            position: "bottom-left",
            style: {
              backgroundColor: "#4caf50",
              color: "#fff",
            },
          }
        );
      } else {
        toast.error("Failed to add course to study plan", {
          duration: 3000,
          position: "top-right",
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemove = (course) => {
    setIsOpenDeleteDialog(true);
    setCourseToRemove(course);
  };

  const handleRemoveFromStudyPlan = async () => {
    try {
      setIsOpenDeleteDialog(false);
      const formData = {
        studyPlanId: studyPlan._id,
        course: courseToRemove,
        updatedBy: currentUser._id,
      };

      const response = await api.removeFromStudyPlan(formData);
      if (response.status === 200) {
        await handleChangeAcademicPeriod();
        toast.success(
          `Course ${formData.course.courseCode} ${formData.course.courseDesc} has been removed from study plan`,
          {
            duration: 3000,
            position: "bottom-left",
            style: {
              backgroundColor: "#4caf50",
              color: "#fff",
            },
          }
        );
      } else {
        toast.error("Failed to remove course from study plan", {
          duration: 3000,
          position: "top-right",
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

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
      });
      return acc;
    }, {});
  };

  const fetchSuggestedCourses = useCallback(async (id) => {
    try {
      setCoursesLoading(true);
      const response = await api.getSuggestedCourses(id);
      const suggestedCourses = response.data.suggestedCourses.suggestedCourses;


      const groupedCourses = groupCoursesByYearAndSemester(suggestedCourses);
      setCourses(groupedCourses);
      setDisplayedCourses(groupedCourses);

      const lacking = suggestedCourses.filter(
        (course) => !course.hasTaken && course.isEligible
      );
      setLackingCourses(lacking);
      setCoursesLoading(false);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchStudyPlan = useCallback(async (id) => {
    try {
      setStudyPlanLoading(true);
      const response = await api.getStudentStudyPlan(id);
      const studyPlan = response.data.studentStudyPlan;
      setStudyPlan(studyPlan);
      setStudyPlanLoading(false);
    } catch (error) {
      console.error(error);
    }
  }, []);


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

  const fetchAcademicPeriod = useCallback(async () => {
    try {
      const response = await api.getCurrentSemester();
      if (response.status === 200) {
        const semester = response.data;
        setCurrentSemester(semester);
        setSelectedSemester(semester.semester);
        setSelectedYear(semester.year);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchSemesters = useCallback(async () => {
    try {
      const response = await api.getSemesters();

      if (response.status === 200) {
        const semesters = response.data.semesters;
        const years = semesters
          .map((semester) => semester.year)
          .filter((year, index, self) => self.indexOf(year) === index);
        setSemesters(years);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);


  useEffect(() => {
    const init = async () => {
      setIsLoading()
      const user = await getUser()
      setCurrentUser(user)

    fetchAcademicPeriod();
    fetchSemesters();
    if (user) {
      fetchGrades(user.idNumber);
      fetchSuggestedCourses(user.idNumber);
      fetchStudyPlan(user.idNumber);

    }
    setIsLoading(false);
  }
  init()
  
  }, []);

  useEffect(() => {
    let unitsLimit = 0;

    if (selected === 'SUMMER SEMESTER') {
      unitsLimit = 9;
    } else {

      const key = currentUser?.yearLevel + "-" + selected.split(' ')[0] + ' SEMESTER';

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
  }, [currentUser, selected, studyPlan]);


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="w-full">
        <Typography className="text-teal-600 font-semibold text-lg">
          Study Plan
        </Typography>
        <Divider />
        {isLoading ? (
          <Box className="flex flex-col justify-center items-center h-64 space-y-5">
            <CircularProgress />
            <Typography className="text-teal-600 text-lg">
              Loading...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} className="mt-3">
              <Typography className="text-gray-600 font-semibold">
                Your Study Plan
              </Typography>

              <Typography className="text-gray-500 font-bold mt-3">
                Select Semester and Academic Year
              </Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} md={5}>
                  <Autocomplete
                    fullWidth
                    isOptionEqualToValue={(option, value) => option === value}
                    options={semesterOptions}
                    renderInput={(params) => (
                      <TextField {...params} label="Semester" />
                    )}
                    onChange={(e, value) => setSelectedSemester(value)}
                    value={selectedSemester}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <DatePicker
                    fullWidth
                    minDate={dayjs(new Date("2023-01-01"))}
                    maxDate={getMaxDate()} 
                    views={["year"]}
    
                    defaultValue={dayjs(currentSemester.year, "YYYY")}
                    label="School Year"
                    onChange={(date) => setSelectedYear(date.format("YYYY"))}
                    inputFormat="YYYY"
                    value={dayjs(selectedYear, "YYYY")}
                  />
                </Grid>
                <Grid item xs={12} md={2} className="flex items-center justify-center">
                  <Button
                  size="small"
                    onClick={handleChangeAcademicPeriod}
                    variant="contained"
                    className="bg-teal-600 text-white hover:bg-teal-700"
                  >
                    Submit
                  </Button>
                </Grid>
              </Grid>
              
              <Typography className="text-teal-600 font-semibold text-center mt-10">

              {selected} - {yearSelected}

              </Typography>

              {studyPlanLoading ? (
                <Box className="flex flex-col justify-center items-center h-64 space-y-5">
                  <CircularProgress />
                  <Typography className="text-teal-600 text-lg">
                    Loading...
                  </Typography>
                </Box>
              ) : studyPlan && selected && yearSelected ? (
                <>
                      <Typography className="text-gray-600 font-semibold text-sm mt-5">
                        Total Units: {unitsApplied}/{unitsLimit}
                      </Typography>
                  <Box className="border-solid border-slate-300 rounded-md p-1 mt-5">

                    <Grid item xs={12}>
                      <Grid container spacing={1}>
                        <Grid item xs={2}>
                          <Typography className="text-teal-600 font-semibold text-sm text-center">
                            Course Code
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography className="text-teal-600 font-semibold text-sm text-center">
                            Course Description
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography className="text-teal-600 font-semibold text-sm text-center">
                            Units
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography className="text-teal-600 font-semibold text-sm text-center">
                            Status
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography className="text-teal-600 font-semibold text-sm text-center">
                            Actions
                          </Typography>
                        </Grid>
                      </Grid>
                      <Divider />
                    </Grid>
                    {studyPlan?.suggestedCourses?.length === 0 && (
                      <Typography className="text-center my-1">
                        Add courses to study plan
                      </Typography>
                    )}
                    {studyPlan?.suggestedCourses?.map((course, index) => (
                      <Grid item xs={12} key={index}>
                        <Grid container spacing={1}>
                          <Grid item xs={2}>
                            <Typography className="text-gray-600 font-semibold text-sm text-center">
                              {course.courseCode}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography className="text-gray-600 font-semibold text-sm text-center">
                              {course.courseDesc}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography className="text-gray-600 font-semibold text-sm text-center">
                              {course.units}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography className="text-gray-600 font-semibold text-sm text-center">
                              {allGrades.some(
                                (grade) =>
                                  grade.courseCode === course.courseCode &&
                                  grade.finalGrade === "NG"
                              )
                                ? "Currently enrolled"
                                : course.semester?.split(' ')[0] ===
                                  studyPlan.semPeriod.semester.split(' ')[0]
                                ? "Regular offering"
                                : "To be petitioned"}
                            </Typography>
                          </Grid>
                          <Grid item xs={2} className="text-center">
                            <Tooltip title="Remove from Study Plan" arrow>
                              <IconButton onClick={() => handleRemove(course)}>
                                <RemoveCircleOutline className="cursor-pointer text-red-700" />
                              </IconButton>
                            </Tooltip>
                          </Grid>
                        </Grid>
                        <Divider />
                      </Grid>
                    ))}
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
                       studyPlan?.lastUpdatedBy ?
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
              ) :selected && yearSelected ? (
                <Box className="flex flex-col items-center justify-center mt-4">
                  <Typography className="text-gray-500 font-bold mt-3">
                    No study plan found
                  </Typography>
                  <Button
                    onClick={handleCreateStudyPlan}
                    variant="contained"
                    size="small"
                    className="bg-teal-600 text-white hover:bg-teal-700 mt-2"
                  >
                    Create Study Plan
                  </Button>
                </Box>
                
              ) : (
                <Box className="flex flex-col items-center justify-center mt-4">
                <Typography className="text-gray-500 font-bold mt-3">
                  Please Select Semester and School Year
                </Typography>
                </Box>
              )}

             
            </Grid>
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
              <Divider className="my-10"/>
              
              <Typography className="text-gray-600 font-bold text-sm">
                References:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography className="text-gray-600 text-sm">
                    <span className="text-gray-500 font-extrabold">Gray</span> -
                    Course not yet taken and requisite/s not met
                  </Typography>
                  <Typography className="text-gray-600 text-sm">
                    <span className="text-yellow-500 font-extrabold">
                      Yellow
                    </span>{" "}
                    - Course in study plan
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography className="text-gray-600 text-sm">
                    <span className="text-blue-500 font-extrabold">Blue</span> -
                    Course not yet taken or passed, and requisite/s met
                  </Typography>
                  <Typography className="text-gray-600 text-sm">
                    <span className="text-green-500 font-extrabold">Green</span>
                    - Course already taken or passed
                  </Typography>
                </Grid>
              </Grid>
              <Divider className="my-5"/>
              <Box style={{ height : '80vh', overflow: 'scroll'}}>
                  {coursesLoading ?
                    <Box className="flex flex-col justify-center items-center h-64 space-y-5">
                      <CircularProgress />
                      <Typography className="text-teal-600 text-lg">
                        Loading...
                      </Typography>
                    </Box>
                    :
                    (Object.keys(displayedCourses).length === 0 ?
                      <Typography className='text-center mt-3'>
                        No courses found
                      </Typography>
                      :
                   
                    Object.keys(displayedCourses).map((key, index) => {
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
                                  <Grid item xs={2.5}>
                                    <Typography className="text-teal-600 font-semibold text-sm text-center">
                                      Equivalents
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={2.5}>
                                    <Typography className="text-teal-600 font-semibold text-sm text-center">
                                      Requisites
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={1.5}>
                                    <Typography className="text-teal-600 font-semibold text-sm text-center">
                                      Actions
                                    </Typography>
                                  </Grid>
                                </Grid>
                                <Divider />
                              </Grid>
                              {displayedCourses[key].map((course, index) => (
                                <Grid item xs={12} key={index}>
                                  <Grid
                                    container
                                    className={`${studyPlan?.suggestedCourses?.some(
                                      (c) => c.courseCode === course.courseCode
                                    )
                                        ? "bg-yellow-200"
                                        : course.isEligible
                                          ? "bg-blue-200"
                                          : course.hasTaken
                                            ? "bg-green-200"
                                            : "bg-gray-200"
                                      }`}
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
                                    <Grid item xs={2.5}>
                                      <Typography className="text-gray-600 font-semibold text-sm text-center">
                                        {course.equivalents.length > 0
                                          ? course.equivalents
                                            .map((equivalent) => equivalent)
                                            .join(", ")
                                          : "N/A"}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={2.5}>
                                      <Typography className="text-gray-600 font-semibold text-sm text-center">
                                        {course.requisites.length > 0
                                          ? course.requisites
                                            .map((requisite) => requisite)
                                            .join(", ")
                                          : "N/A"}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={1.5} className="text-center">
                                      {!studyPlan?.suggestedCourses?.some(
                                        (c) => c.courseCode === course.courseCode
                                      )
                                        &&
                                        /*course.isEligible*/ !course.hasTaken && (
                                          <Tooltip
                                            title="Add to Study Plan"
                                            arrow
                                          >
                                            <IconButton
                                              onClick={() =>
                                                handleAddtoStudyPlan(course)
                                              }
                                            >
                                              <AddCircleOutline className="cursor-pointer text-green-700" />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      {course.hasTaken && (
                                        <Typography className="text-gray-600 font-semibold text-sm text-center">
                                          TAKEN
                                        </Typography>
                                      )}
                                      {studyPlan?.suggestedCourses?.some(
                                        (c) => c.courseCode === course.courseCode
                                      ) && (
                                          <Typography className="text-gray-600 font-semibold text-sm text-center">
                                            IN STUDY PLAN
                                          </Typography>
                                        )}
                                    </Grid>
                                    <Divider />
                                  </Grid>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </div>
                      )
                    );
                  }))
                }
              </Box>
             
            </Grid>
          </Grid>
        )}

        <Dialog
          open={isOpenDeleteDialog}
          onClose={() => setIsOpenDeleteDialog(false)}
          maxWidth="xs"
        >
          <Box className="p-2">
            <DialogTitle>
              Are you sure you want to remove this course?
            </DialogTitle>
            <DialogActions>
              <Button
                variant="outlined"
                onClick={() => setIsOpenDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                className="bg-teal-600 text-white hover:bg-teal-700"
                onClick={handleRemoveFromStudyPlan}
              >
                Confirm
              </Button>
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


      </div>
    </LocalizationProvider>
  );
};

export default StudyPlan;
