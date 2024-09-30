"use client";
import api from "@/src/common/api";
import GradesTable from "@/src/components/shared/GradesTable";
import AddCourses from "@/src/components/students/AddCourses";
import Prospectus from "@/src/components/students/Prospectus";
import StudyPlan from "@/src/components/students/StudyPlan";
import SubmitGrades from "@/src/components/students/SubmitGrades";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Slide from '@mui/material/Slide';
import { getUser, loginIsRequiredClient } from "../lib/loginClient";
import { ArrowBack, SaveOutlined } from "@mui/icons-material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
})

const StudentVerification = () => {
  loginIsRequiredClient();
  const [currentUser, setCurrentUser] = useState();
  const [prospectuses, setProspectuses] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grades, setGrades] = useState({});
  const [rows, setRows] = useState({});
  const [accreditedCourses, setAccreditedCourses] = useState([]);
  const [hideFileUpload, setHideFileUpload] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [addedCourses, setAddedCourses] = useState([]);
  const [gradeSemester, setGradeSemester] = useState([]);
  const [checked, setChecked] = useState(false);

  const [userConfirmationDialog, setUserConfirmationDialog] = useState(true);
  const [userType, setUserType] = useState("");

  const [courses, setCourses] = useState({});
  const [displayedCourses, setDisplayedCourses] = useState({});
  const [lackingCourses, setLackingCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [passedCourses, setPassedCourses] = useState([]);

  const [showDialog, setShowDialog] = useState(false);

  const [curriculumDialog, setCurriculumDialog] = useState(false);
  const [defaultCurriculum, setDefaultCurriculum] = useState();

  const [step1Dialog, setStep1Dialog] = useState(false)
  const [step2Dialog, setStep2Dialog] = useState(false)
  const [step3Dialog, setStep3Dialog] = useState(false)
  const [step4Dialog, setStep4Dialog] = useState(false)

  const router = useRouter();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm();

  const handleUserType = (event) => {
    setUserType(event.target.value);
  };
  const handleChange = (event) => {
    setChecked(event.target.checked);
  };

  const groupCourses = (courses) => {
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
      });
      return acc;
    }, {});
  };

  const fetchSuggestedCourses = useCallback(async (currentUser) => {
    try {
      setIsLoading(true);
      const id = currentUser.idNumber;
      const response = await api.getSuggestedCourses(id);
      // console.log(response)

      if (response?.status === 200) {
        
        const courses = response.data.suggestedCourses.suggestedCourses;
        setAllCourses(courses);
        const groupedCourses = groupCourses(courses);
        setCourses(groupedCourses);
        setDisplayedCourses(groupedCourses);
  
        let suggestedCourses = [];
  
        if (
          response.data &&
          response.data.suggestedCourses &&
          response.data.suggestedCourses.suggestedCourses
        ) {
          response.data.suggestedCourses.suggestedCourses.forEach((course) => {
            if (course.hasTaken === false) {
              suggestedCourses.push(course);
            }
          });
        }
        
        setLackingCourses(suggestedCourses);
        setIsLoading(false);

      } else {
        toast.error("Error fetching suggested courses", {
          duration: 4000,
          position: "top-center",
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        });
      }

    } catch (error) {
      console.error(error);
    }
  }, []);

  const groupCoursesByYearAndSemester = (courses) => {
    return courses.reduce((acc, course) => {
      const key = `${course.semester}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        courseCode: course.courseCode,
        courseDesc: course.description,
        semester: course.semester,
        units: course.units,
        finalGrade: course.finalGrade,
        verdict: course.verdict,
      });
      return acc;
    }, {});
  };

  const fetchGradeInfo = useCallback(async (currentUser) => {
    try {
      const id = currentUser.idNumber;
      const response = await api.getGrades(id);
      const rows = [];
      response?.data?.grade.courses.forEach((gradeInfo) => {
        rows.push({
          id: gradeInfo._id,
          courseCode: gradeInfo.courseCode,
          description: gradeInfo.courseDesc,
          semester: gradeInfo.semester,
          units: gradeInfo.units,
          finalGrade: gradeInfo.finalGrade,
          verdict: gradeInfo.isPassed ? "PASSED" : "FAILED",
        });
      });
      setGrades(response.data.grade);
      const groupedPrevGrades = groupCoursesByYearAndSemester(rows);
      setRows(groupedPrevGrades);

      const passedCourses = response.data.grade.courses.filter(
        (course) => course.isPassed
      );
      setPassedCourses(passedCourses);

      const accreditedCourses = response.data.grade.accreditedCourses;
      setAccreditedCourses(accreditedCourses);
    } catch (error) {
      console.log(error)
    }
  }, []);

  const submitGradesConfirmationHandler = async () => {
    if (checked) {
      try {
        toast.success("Thank you for confirming your grades", {
          duration: 4000,
          position: "top-center",
          style: {
            backgroundColor: "#4caf50",
            color: "#fff",
          },
        });

        setIsSubmitting(true);
        const studentId = currentUser.idNumber;
        const formData = {
          studentId,
          grades,
          toUpdatePerformance: true,
        };

        const response = await api.saveGrades(formData);
        if (response.status === 200) {
          setIsSubmitting(false);
          // setGradeShowModal(true)
          setAddedCourses([]);
          fetchGradeInfo(currentUser);
          fetchSuggestedCourses(currentUser);
          setStep2Dialog(false)
          setStep3Dialog(true)
          toast.success("Grades saved successfully!", {
            duration: 4000,
            position: "top-center",
            style: {
              backgroundColor: "#4caf50",
              color: "#fff",
            },
          });
        }
      } catch (error) {
        console.error("Error submitting grades:", error);
      }
    } else {
      toast.error("Please click on the checkmark and confirm", {
        duration: 4000,
        position: "top-center",
        style: {
          backgroundColor: "#f44336",
          color: "#fff",
        },
      });
    }
  };

  const checkCurriculum = (curriculum) => {
    let isCurriculumCorrect = false

    prospectuses.forEach((prospectus) => {
      if (prospectus._id === curriculum) {
        if (prospectus.effectiveYear === currentUser.effectiveYear) {
          isCurriculumCorrect = true
        }
      }
    })

    return isCurriculumCorrect

  }

  const onSubmit = async () => {
    try {
      const data = getValues();

      const formData = {
        idNumber: data.studentId ? data.studentId : currentUser.idNumber,
        email: data.email ? data.email : currentUser.email,
        firstName: data.firstName ? data.firstName : currentUser.firstName,
        lastName: data.lastName ? data.lastName : currentUser.lastName,
        program: data.program ? data.program : currentUser.program,
        yearLevel: data.yearLevel ? data.yearLevel.toString() : currentUser.yearLevel,
        curriculum: data.curriculum,
      };

      if (!formData.curriculum || !formData.yearLevel) {
        toast.error("Please fill out required field", {
          duration: 4000,
          position: "top-center",
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        });
        return;
      }

      if (!checkCurriculum(formData.curriculum)) {
        setCurriculumDialog(true)
        return;

      }
 
      const response = await api.updateStudentInfo(formData);
      // console.log(response)
      if (response.status === 200) {
        const { user } = response.data;
        setStep1Dialog(false)
        setStep2Dialog(true)

        toast.success("Thank you for confirming", {
          duration: 4000,
          position: "top-center",
          style: {
            backgroundColor: "#4caf50",
            color: "#fff",
          },
        });
      } else {
        toast.error("Error verifying student", {
          duration: 4000,
          position: "top-center",
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

  const handleVerifyStudent = async () => {
    try {
      const response = await api.verifyStudent(currentUser.idNumber);

      if (response.status === 200) {
        const { user } = response.data;
        router.push("/dashboard");
      } else {
        toast.error("Error verifying student", {
          duration: 4000,
          position: "top-center",
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

  const handleRemoveCourse = (course) => {
    const updatedCourses = addedCourses.filter(
      (c) => c.courseCode !== course.courseCode
    );
    setAddedCourses(updatedCourses);
    const updatedGrades = grades.courses.filter(
      (c) => c.courseCode !== course.courseCode
    );
    setGrades({ ...grades, courses: updatedGrades });
  };

  const fetchProspectuses = useCallback(async (user) => {
    try {
      const response = await api.getProspectuses();

      if (response.status === 200) {
        const prospectuses = response.data.prospectuses;
        const prospectus = prospectuses.find(
          (prospectus) => prospectus.effectiveYear === user.effectiveYear && prospectus.program.includes(user.program)
        )
        setProspectuses(prospectuses);
        setDefaultCurriculum(prospectus?._id);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleSkip = () => {
    fetchSuggestedCourses(currentUser);
    setStep2Dialog(false)
    setStep3Dialog(true)
  };

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
    console.log(combine)

    //BSIS conditions in year standing
    //not the same with BSIT and BSCS
    //need data for BSIT and BSCS
    let response

    
    if(user.effectiveYear === '2018'){
      if(combine === 0 || combine <= 51){
        const formData = {
          yearLevel: '1'
        };
         response = await api.updateStudentUser(user._id, formData);    
      }
      else if(combine >=51 &&  combine <=98){
        const formData = {
          yearLevel: '2'
        };
        response = await api.updateStudentUser(user._id, formData);
        console.log('2nd yr')
      }
      else if(combine > 98 && combine <= 150){
        const formData = {
          yearLevel: '3'
        };
        response = await api.updateStudentUser(user._id, formData);
        console.log('3rd yr')
      }
      else if(combine > 150 && combine <= 184){
        const formData = {
          yearLevel: '4'
        };
        response = await api.updateStudentUser(user._id, formData);
        console.log('4th yr')
      }
      else{
        console.log('year undefined')
      }
    }else if(user.effectiveYear === '2023'){

    }

    /* setValue(studentTotalUnitsFailed) */
  })

  useEffect(() => {
    const init = async () => {
      const user = await getUser();
   
      setCurrentUser(user);
      
    if (user?.user_type !== "student") {
      router.push("/dashboard");
    }

    if (user?.hasVerified) {
      router.push("/dashboard");
    }

    fetchProspectuses(user);
  }
  init()
  }, []);


  return (
    <div className="w-full flex items-center justify-center">
      
      <Dialog
        open={userConfirmationDialog}
        maxWidth="xs"
        fullWidth
        className="z-100"
      // onClose={() => setUserConfirmationDialog(false)}
      >
        <DialogTitle>
          {" "}
          <Typography className="text-teal-600 font-bold text-xl">
            Welcome student! 🎉
          </Typography>
          <Typography className="font-semibold text-lg">
            Please Select Status
          </Typography>
        </DialogTitle>
        <DialogContent>
          
          <FormControl>
            <RadioGroup name="radio-buttons-group" onChange={handleUserType}>
              <FormControlLabel
                value="Freshman"
                // disabled={parseInt(user.yearLevel) !== 1}
                control={<Radio />}
                label="Freshman"
              />
              <Typography variant="body2" sx={{ marginLeft: "2.3em" }}>
                {" "}
                (First year standing IS, IT or CS college student in DCISM){" "}
              </Typography>
              <FormControlLabel
                value="Continuing"
                control={<Radio />}
                label="Continuing"
              />
              <Typography variant="body2" sx={{ marginLeft: "2.3em" }}>
                {" "}
                (Currently enrolled and 2nd year standing and above){" "}
              </Typography>
              <FormControlLabel
                value="Shiftee"
                control={<Radio />}
                label="Shiftee"
              />
              <Typography variant="body2" sx={{ marginLeft: "2.3em" }}>
                {" "}
                (Shifted from a different program but belonging in USC){" "}
              </Typography>
              <FormControlLabel
                value="Transferee"
                control={<Radio />}
                label="Transferee"
              />
              <Typography variant="body2" sx={{ marginLeft: "2.3em" }}>
                {" "}
                (From a different institution entering DCISM){" "}
              </Typography>
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {setUserConfirmationDialog(false); setStep1Dialog(true)}}
            className="bg-teal-600 text-white"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Box>
        
        <Dialog
        open={curriculumDialog}
        fullWidth
        maxWidth="xs"
        >
        <DialogTitle>
          <Typography className="text-teal-600 font-semibold text-lg">
            Curriculum Verification
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            SISTEM detected that you selected the wrong curriculum. Please correct your input.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setCurriculumDialog(false)}
            className="text-teal-600"
          >
            back to form
          </Button>
        </DialogActions>
      </Dialog>

        <Dialog
          fullScreen
          open={step1Dialog}
          TransitionComponent={Transition}
        >
          <DialogTitle>
            <Typography className="text-teal-600 font-bold text-xl">
              Welcome to{" "}
              <img
                src="/images/sistem-logo.png"
                alt="sistem-logo"
                style={{
                  width: "1.6em",
                  marginBottom: "-.25em",
                  marginLeft: "-.2em",
                }}
              />
              SISTEM.
            </Typography>
            <Typography className="text-gray-600 font-semibold mt-2">
              Step 1: Please verify your student information to continue.
            </Typography>
          </DialogTitle>
          <DialogContent className="mx-5">
            {
              isLoading ? 
              <div className="flex flex-col justify-center items-center">
                <CircularProgress className="w-24" />
                <Typography
                  className="text-white-600 text-sm mt-3"
                  sx={{ fontSize: "40px" }}
                >
                  Loading...
                </Typography>
              </div>
                :

            <Box className="flex items-center justify-center">
              <Grid
                container
                spacing={2}
                component="form"
                onSubmit={handleSubmit(onSubmit)}
              >
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <Controller
                      name="studentId"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <Typography variant="body2">Student ID Number</Typography>
                          <TextField
                            disabled
                            variant="outlined"
                            id="id-number"
                            value={value}
                            defaultValue={currentUser.idNumber}
                            onChange={onChange}
                            aria-describedby="id-number"
                          />
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <Typography variant="body2">Student Email</Typography>
                          <TextField
                            disabled
                            variant="outlined"
                            id="email"
                            value={value}
                            defaultValue={currentUser.email}
                            onChange={onChange}
                            aria-describedby="email"
                          />
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <Controller
                      name="studentName"
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <Typography variant="body2">First Name</Typography>
                          <TextField
                            disabled
                            variant="outlined"
                            id="first-name"
                            value={value}
                            defaultValue={currentUser.firstName}
                            onChange={onChange}
                            aria-describedby="first-name"
                          />
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <Controller
                      name="lastName"
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <Typography variant="body2">Last Name</Typography>
                          <TextField
                            disabled
                            variant="outlined"
                            id="last-name"
                            value={value}
                            defaultValue={currentUser.lastName}
                            onChange={onChange}
                            aria-describedby="last-name"
                          />
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <Controller
                      name="program"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <Typography variant="body2">Program</Typography>
                          <TextField
                            disabled
                            autoFocus
                            variant="outlined"
                            id="program"
                            value={value}
                            defaultValue={currentUser.program}
                            onChange={onChange}
                            aria-describedby="program"
                          />
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <Controller
                      name="yearLevel"
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <Typography variant="body2">Year Level</Typography>
                          <TextField
                            // disabled
                            required
                            type="number"
                            autoFocus
                            variant="outlined"
                            id="year-level"
                            value={value}
                            defaultValue={parseInt(currentUser.yearLevel)}
                            onChange={(e) => {
                              const inputValue = parseInt(e.target.value);
                              // Check if the input is a number and within the range [1, 4]
                              if (!isNaN(inputValue) && inputValue >= 1 && inputValue <= 4) {
                                onChange(inputValue); 
                              }
                            }}
                            inputProps={{
                              maxLength: 1, // Limit input length to 1 character
                              pattern: "[1-4]*", // Allow only digits from 1 to 4
                            }}
                            aria-describedby="year-level"
                          />
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name="curriculum"
                      control={control}
                      rules={{ required: true }}
                      defaultValue={defaultCurriculum}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <Typography variant="body2">Curriculum</Typography>
                          <Select
                            required
                            // disabled={curriculumVerified}
                            id="curriculum"
                            value={value}
                            onChange={onChange}
                            error={Boolean(errors.program)}
                          >
                            {prospectuses.map((prospectus, index) => {
                              switch (currentUser.program?.replace(/\s/g, "")) {
                                case "BSIS":
                                  if (
                                    prospectus.program ===
                                    "BACHELOR OF SCIENCE IN INFORMATION SYSTEMS (BS IS)"
                                  ) {
                                    return (
                                      <MenuItem key={index} value={prospectus._id}>
                                        {prospectus.program}{" "}
                                        {prospectus.effectiveYear}
                                      </MenuItem>
                                    );
                                  }
                                  break;
                                case "BSIT":
                                  if (
                                    prospectus.program ===
                                    "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY (BS IT)"
                                  ) {
                                    return (
                                      <MenuItem key={index} value={prospectus._id}>
                                        {prospectus.program}{" "}
                                        {prospectus.effectiveYear}
                                      </MenuItem>
                                    );
                                  }
                                  break;
                                case "BSCS":
                                  if (
                                    prospectus.program ===
                                    "BACHELOR OF SCIENCE IN COMPUTER SCIENCE (BS CS)"
                                  ) {
                                    return (
                                      <MenuItem key={index} value={prospectus._id}>
                                        {prospectus.program}{" "}
                                        {prospectus.effectiveYear}
                                      </MenuItem>
                                    );
                                  }
                                  break;
                                default:
                                  return (
                                    <MenuItem key={index} value={prospectus._id}>
                                      {prospectus.program}{" "}
                                      {prospectus.effectiveYear}
                                    </MenuItem>
                                  );
                              }
                              return null;
                            })}
                          </Select>
                          {errors.curriculum && (
                            <span style={{ color: "red" }}>
                              Curriculum is required.
                            </span>
                          )}
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box className="flex flex-col items-center justify-center">
                    <Button
                      type="submit"
                      variant="contained"
                      className="w-fit mt-3 text-white  bg-teal-600"
                      size="small"
                      onClick={onSubmit}
                    >
                      Verify
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            }
          </DialogContent>
        </Dialog>

        <Dialog
          fullScreen
          TransitionComponent={Transition}
          open={step2Dialog}
          p={2}
        >
          <DialogTitle>
            <Typography className="text-teal-600 font-bold text-xl mt-3 flex items-center space-x-2">
              <IconButton
                onClick={() => { setStep1Dialog(true); setStep2Dialog(false) }}
              >
                <ArrowBack />
              </IconButton>

             Step 2: Confirm Grades
             
            </Typography>
            <Typography className="text-gray-600 font-semibold mt-2 ml-10">
              Please submit your grades report from ISMIS to continue.
            </Typography>
            <Typography variant='caption' className='mt-2 ml-10'>
              To download go to ISMIS &gt; Student Task &gt; Enrollment Related &gt; View Grades &gt; Click the disk <SaveOutlined className="-mb-1"/> icon to download grades report
            </Typography>
          </DialogTitle>
          <DialogContent className="mx-8">
          

            {isSubmitting ? (
              <div className="flex flex-col justify-center items-center">
                <CircularProgress size={5 + "rem"} />
                <Typography
                  className="text-white-600 text-sm mt-3"
                  sx={{ fontSize: "40px" }}
                >
                  Processing your grades...
                </Typography>
              </div>
            ) : 
            !hideFileUpload ? (
              <>
                {(userType === "Freshman" || userType === "Transferee") &&
                <Box className="flex flex-col items-center justify-center my-3">
                  <Typography className="text-gray-600 font-semibold mt-2">
                    You may submit your grades data from ISMIS as basis for your
                    study plan or skip this step.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    className="w-fit mt-3"
                    onClick={handleSkip}
                  >
                    Skip
                  </Button>
                  <Divider className="my-3" />
                </Box>}
              <SubmitGrades
                setGradeSemester={setGradeSemester}
                setGrades={setGrades}
                setHideFileUpload={setHideFileUpload}
                setRows={setRows}
                setIsSubmitting={setIsSubmitting}
                user={currentUser}
              />
              </>
            ) : (
              <div>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={9}>
                    <Typography className="text-teal-600 font-bold text-xl mt-3">
                      Your Grades
                    </Typography>
                    <Typography className="text-gray-600 font-semibold mt-2">
                      Please verify your grades. If there are any missing from
                      the pdf, please input it manually to include them in the next step.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    {/* <Button
                      // disabled={gradesSubmitted}
                      size="small"
                      onClick={() => setShowModal(true)}
                      variant="contained"
                      className="w-fit mt-3 text-white bg-teal-600"
                    >
                      Add Missing Grades
                    </Button> */}
                  </Grid>
                  <Grid item xs={12}>
                    {/* {addedCourses.length > 0 && (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography className="text-teal-600 font-semibold">
                            Added Courses
                          </Typography>
                          <Divider />
                        </Grid>
                        {addedCourses.map((course, index) => (
                          <Grid item xs={12} key={index}>
                            <Grid container>
                              <Grid item xs={2}>
                                <Typography className="text-gray-600 font-semibold ">
                                  Course Code: {course.courseCode}
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography className="text-gray-600 font-semibold ">
                                  Description: {course.courseDesc}
                                </Typography>
                              </Grid>
                              <Grid item xs={2}>
                                <Typography className="text-gray-600 font-semibold text-center">
                                  Final Grade: {course.finalGrade}
                                </Typography>
                              </Grid>
                              <Grid item xs={2}>
                                <Typography className="text-gray-600 font-semibold text-center">
                                  Units: {course.units}
                                </Typography>
                              </Grid>
                              <Grid
                                item
                                xs={2}
                                className="flex items-center justify-center"
                              >
                                <Button
                                  size="small"
                                  variant="contained"
                                  className="bg-red-600 text-white"
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
                    )} */}
                    <Button
                      size="small"
                      onClick={() => setHideFileUpload(false)}
                      variant="outlined"
                      className="w-fit mt-3 text-teal-600"
                    >
                      reset Upload Grades
                    </Button>
                    <GradesTable
                      rows={rows}
                      accreditedCourses={accreditedCourses}
                      canModify={true}
                      fetchGrade={fetchGradeInfo}
                      grades={passedCourses}
                      lackingCourses={allCourses}
                    />

                  </Grid>
                  <Grid item xs={12}>
                    <Box className="flex items-center space-x-4 justify-center">
                      <Checkbox checked={checked} onChange={handleChange} />
                      <Typography className="text-gray-600 font-semibold">
                        I confirm that the information presented is accurate and
                        true
                      </Typography>
                      <Button
                        // disabled={gradesSubmitted}
                        size="small"
                        onClick={submitGradesConfirmationHandler}
                        variant="contained"
                        className="w-fit mt-3 text-white bg-teal-600"
                      >
                        continue
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AddCourses
          showModal={showModal}
          setShowModal={setShowModal}
          addedCourses={addedCourses}
          setAddedCourses={setAddedCourses}
          handleRemoveCourse={handleRemoveCourse}
          gradeSemester={gradeSemester}
          grades={grades}
          setGrades={setGrades}
        />

        <Dialog
          open={step3Dialog}
          fullScreen
          TransitionComponent={Transition}
          p={2}
        >
          <DialogTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={9}>
                <Typography className='text-teal-600 font-bold text-xl mt-3 flex items-center space-x-3'>
                  <IconButton
                    onClick={() => { setStep2Dialog(true); setStep3Dialog(false) }}
                  >
                    <ArrowBack />
                  </IconButton>
                  Step 3: Confirm Prospectus
                </Typography>
                <Typography className='text-gray-600 font-semibold mt-2 ml-10'>
                  Please review the courses and their corresponding status. Some courses taken may be marked as lacking, especially for accredited courses. You may add these courses to your grades to clear them from your lacking subjects list.
                </Typography>
                <Divider className='my-3' />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                {
                  grades.courses?.length > 0 &&
                  <Button
                    size='small'
                    onClick={() => setShowDialog(true)}
                    variant='contained'
                    className='w-fit mt-3 bg-teal-600 text-white'
                  >
                    Add Missing Courses
                  </Button>
                }
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent className="mx-10">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center">
                {/* <CircularProgress className="w-24" /> */}
                <Typography
                  className="text-white-600 text-sm mt-3"
                  sx={{ fontSize: "40px" }}
                >
                  Loading...
                </Typography>
              </div>
            ) : (
              <Prospectus
                passedCourses={passedCourses}
                fetchGradeInfo={fetchGradeInfo}
                  showStep4Dialog={setStep4Dialog}
                lackingCourses={lackingCourses}
                courses={courses}
                displayedCourses={displayedCourses}
                setDisplayedCourses={setDisplayedCourses}
                fetchSuggestedCourses={fetchSuggestedCourses}
                showDialog={showDialog}
                setShowDialog={setShowDialog}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={step4Dialog}
          fullScreen
          TransitionComponent={Transition}
          p={2}
        >
          <DialogTitle>
            <Typography className="text-teal-600 font-bold text-xl mt-3 flex items-center space-x-2">
              <IconButton
                onClick={() => { setStep4Dialog(false); setStep3Dialog(true) }}
              >
                <ArrowBack />
              </IconButton>
              Step 4: Confirm Study Plan
            </Typography>
            <Typography className='text-gray-600 font-semibold mt-2 ml-10'>
              Your initial study plan for the semester. This is based on the courses you have taken and the courses you are lacking.
            </Typography>

          </DialogTitle>
          <DialogContent className="mx-10">
            <StudyPlan
              handleVerifyStudent={handleVerifyStudent}
              grades={grades}
            />
          </DialogContent>
        </Dialog>
      </Box>
      
    </div>
  );
};

export default StudentVerification;
