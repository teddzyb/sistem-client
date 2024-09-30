'use client'
import { getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient';
import api from '@/src/common/api';
import { Box, Typography, Button, FormControl, CircularProgress, FormGroup, Grid, Dialog, DialogTitle, DialogContent, Divider } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Controller, set, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdCloudUpload } from 'react-icons/md';
import Backdrop from "@mui/material/Backdrop";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { AiOutlineEye } from 'react-icons/ai';
import { Add, AddCircleOutline, Grade, RemoveCircleOutline, SaveOutlined, Subject, UploadFile } from '@mui/icons-material';
import GradesTable from '@/src/components/shared/GradesTable';
import AddCourses from '@/src/components/students/AddCourses';
import { useRouter } from 'next/navigation';



const SubmitGrades = () => {
  loginIsRequiredClient()
  const [fileName, setFileName] = useState('');
  const [index, setIndex] = useState(0);
  const { control, handleSubmit, setValue } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [prevGrades, setPrevGrades] = useState({})
  const [accreditedCourses, setAccreditedCourses] = useState([])
  const [rows, setRows] = useState({})
  const [grades, setGrades] = useState({})
  const [showModal, setShowModal] = useState(false);
  const [gradeShowModal, setGradeShowModal] = useState(false);
  const [addCoursesModal, setAddCoursesModal] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [checked, setChecked] = useState(false);
  const [uploadDisabled, setUploadDisabled] = useState(false)

  const [gradeSemester, setGradeSemester] = useState([])
  const [added, setAdded] = useState(null)
  const [prevManuallyAdded, setPrevManuallyAdded] = useState([])
  const [userName, setUserName] = useState('')

  const [lackingCourses, setLackingCourses] = useState([])
  const [allCourses, setAllCourses] = useState()
  const [currentUser, setCurrentUser] = useState()
  const [totalUnitsPassed, setTotalUnitsPassed] = useState(0);
  const router = useRouter()

  const loadingMessages = [
    "Parsing information from PDF...",
    "Rendering new data...",
    "Adding data in a table...",
    "Anytime now..."
  ];

  const fetchSuggestedCourses = useCallback(async (user) => {
    try {
      const id = user.idNumber;

      const response = await api.getSuggestedCourses(id)
      const suggestedCourses = response.data.suggestedCourses.suggestedCourses

      setLackingCourses(suggestedCourses);


    } catch (error) {
      console.error(error);
    }
  }, []);


  const fetchStudentInfo = useCallback(async (id) => {
    try {
      const response = await api.getUser(id)
      const userName = (response.data?.user.firstName + ' ' + response.data?.user.lastName).toLowerCase()
      setUserName(userName);

      if (response.status === 200) {
        const user = response.data.user;
        if (user.isRetained) {
          router.push('/dashboard')
        }
      }

    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  }, []);

  const fetchGradeInfo = useCallback(async (user) => {
    try {
      setIsLoading(true);
      const id = user.idNumber;
  

      fetchStudentInfo(user._id)

      const response = await api.getGrades(id);
      const courses = response.data?.grade?.courses;
      setAllCourses(courses)

      const prevAddedGrades = courses.filter((course) => course.isAddedManually)
      // const addGrades = [...(grades?.courses || []), ...prevAddedGrades]
      // setGrades({ ...grades, courses: addGrades })
      setPrevManuallyAdded(prevAddedGrades)

      const rows = [];
      let added = []
      courses.forEach((gradeInfo) => {
        rows.push({
          id: gradeInfo._id,
          courseCode: gradeInfo.courseCode,
          description: gradeInfo.courseDesc,
          units:gradeInfo.units,
          semester: gradeInfo.semester,
          finalGrade: gradeInfo.finalGrade,
          verdict: gradeInfo.isPassed ? "PASSED" : "FAILED",
        });
      });

      courses.forEach((course) => {
        if (course.isAddedManually) {
          added.push({
            courseCode: course.courseCode,
            description: course.courseDesc,
            semester: course.semester,
            units: course.units,
            finalGrade: course.finalGrade,
            verdict: course.isPassed ? "PASSED" : "FAILED",
          });
        }
      })

      

      const groupedPrevGrades = groupCoursesByYearAndSemester(rows);
      setPrevGrades(groupedPrevGrades);

      const accreditedCourses = response.data?.grade?.accreditedCourses
      setAccreditedCourses(accreditedCourses);

      const groupedAdded = groupCoursesByYearAndSemester(added);
      setAdded(groupedAdded)
      setIsLoading(false);

    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error('No grades data found', {
        duration: 3000,
        style: {
          background: '#f44336',
          color: '#fff',
        },
        position: 'bottom-right',
      })
    }
  }, []);

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: ['application/pdf'],
    onDrop: (accepted) => {
      if (accepted.length === 0 || accepted[0].type !== 'application/pdf') {
        toast.error('Upload invalid, unsupported file type!', {
          duration: 3000,
          style: {
            background: '#f44336',
            color: '#fff',
          },
          position: 'bottom-right',
        });
        setUploadDisabled(true)
      }
      else {
        setValue('file', accepted[0]);
        setFileName(accepted[0].name);
        setUploadDisabled(false)
      }

    },
  });

  const handleFileSubmit = async (data) => {
    setIsSubmitting(true);
    setGradeShowModal(false);
    const studentId = currentUser.idNumber;

    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('studentId', studentId);

    try {
      const response = await api.submitGrades(formData);

      if (response.status === 200) {

        const data = response.data.data;
        const nameFromPdf = (response.data?.data?.studentName).toLowerCase();
        const studentNames = userName.split(' ');
        const commonNameStrings = studentNames.some(word => nameFromPdf.includes(word));

        let sem = []
        let takenCourses = []
        data.courses.forEach((gradeInfo, index) => {
          takenCourses.push({
            id: index,
            courseCode: gradeInfo.courseCode,
            description: gradeInfo.courseDesc,
            semester: gradeInfo.semester,
            units: gradeInfo.units,
            finalGrade: gradeInfo.finalGrade,
            verdict: gradeInfo.isPassed ? "PASSED" : "FAILED",
          });
          if (!sem.includes(gradeInfo.semester)) {
            sem.push(gradeInfo.semester);
          }
        });

        setGrades(data);
        setGradeSemester(sem);

        const groupedTakenCourses = groupCoursesByYearAndSemester(takenCourses);
        setRows(groupedTakenCourses);

  
         if(commonNameStrings){
          
          setShowModal(true);
          toast.success('Grades parsed successfully', {
            duration: 3000,
            style: {
              background: '#4caf50',
              color: '#fff',
            },
            position: 'bottom-right',
          });
       }else{
          setShowModal(false)
          setIsSubmitting(false)
        toast.error('Invalid file, grades report is from a different user!', {
            duration: 3000,
          style: {
             background: '#f44336',
              color: '#fff',
          },
           position: 'bottom-right',
        });
          return
      }


      } else {
        toast.error('Something went wrong', {
          duration: 3000,
          style: {
            background: '#f44336',
            color: '#fff',
          },
          position: 'bottom-right',
        });
        // console.log(response.data.message);
      }

      setIsSubmitting(false);

    } catch (error) {
      if (error) {
        toast.error(`Something went wrong ${error}`, {
          duration: 8000,
          style: {
            background: '#f44336',
            color: '#fff',
          },
          position: 'bottom-right',
        });
        setIsSubmitting(false);
        console.log(error)
      }
    }
  };

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

  const handleCloseModal = () => {
    setShowModal(false);
    // setGradeShowModal(false);
  };

  useEffect(() => {
    const init = async () => {
      const user = await getUser()
      setCurrentUser(user)
      fetchGradeInfo(user)
      fetchUnitInfo(user)
      fetchSuggestedCourses(user)
    }
    init()

    const interval = setInterval(() => {
      setIndex(prevIndex =>
        (prevIndex + 1) % loadingMessages.length
      );
    }, 12000);

    return () => clearInterval(interval);
  }, [])




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

        setIsSubmitting(true)
        handleCloseModal();
        const studentId = currentUser.idNumber;
        const id = currentUser._id;
        const formData = {
          studentId,
          grades,
          toUpdatePerformance: true
        }

        const response = await api.saveGrades(formData);

        if (response.status === 200) {
          fetchGradeInfo(currentUser);
          fetchStudentInfo(id);
          const grades = response.data.grades;

          setGrades(grades)
          setSelectedCourses([])

          // setGradeShowModal(true)

          toast.success('Grades saved successfully!', {
            duration: 4000,
            position: "top-center",
            style: {
              backgroundColor: "#4caf50",
              color: "#fff",
            },
          });
        }

        setIsSubmitting(false)

      } catch (error) {
        console.error('Error submitting grades:', error);
      }

    } else {
      toast.error(
        "Please click on the checkbox to confirm",
        {
          duration: 4000,
          position: "top-center",
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        }
      );
    }
  };

  const submitGradesCancelHandler = () => {
    setSelectedCourses([])
    toast.error("Your grades were not uploaded", {
      duration: 4000,
      position: "top-center",
      style: {
        backgroundColor: "#f44336",
        color: "#fff",
      },
    });
  };

  const handleChange = (event) => {
    setChecked(event.target.checked);
  };


  const handleRemoveCourse = (course) => {
    const updatedCourses = selectedCourses.filter((c) => c.courseCode !== course.courseCode)
    setSelectedCourses(updatedCourses)
    const updatedGrades = grades.courses.filter((c) => c.courseCode !== course.courseCode)
    setGrades({ ...grades, courses: updatedGrades })
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
      accredited?.forEach(course => {
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

    let response

    if(user.effectiveYear === '2018' && user.program === 'BS IS'){
      if(combine >= 0 && combine <= 51){
        const formData = {
          yearLevel: '1'
        };
         response = await api.updateStudentUser(user._id, formData);    
         /* console.log('1st yr') */
      }
      else if(combine >=52 && combine <=98){
        const formData = {
          yearLevel: '2'
        };
        response = await api.updateStudentUser(user._id, formData);
        /* console.log('2nd yr') */
      }
      else if(combine >= 99 && combine <= 150){
        const formData = {
          yearLevel: '3'
        };
        response = await api.updateStudentUser(user._id, formData);
        /* console.log('3rd yr') */
      }
      else if(combine >= 151){
        const formData = {
          yearLevel: '4'
        };
        response = await api.updateStudentUser(user._id, formData);
        /* console.log('4th yr') */
      }
      else{
        console.log('year undefined')
      }
    }

     //BSIT conditions in year standing 2018
    else if(user.effectiveYear === '2018' && user.program === 'BS IT'){
        if(combine >= 0 && combine <=51){
          const formData = {
            yearLevel: '1'
          };
           response = await api.updateStudentUser(user._id, formData);
        }
        else if(combine >= 52 && combine <= 98){
          const formData = {
            yearLevel: '2'
          };
           response = await api.updateStudentUser(user._id, formData);
        }
        else if(combine >= 99 && combine <= 140){
          const formData = {
            yearLevel: '3'
          };
           response = await api.updateStudentUser(user._id, formData);
        }
        else if(combine >= 141){
          const formData = {
            yearLevel: '4'
          };
           response = await api.updateStudentUser(user._id, formData);
        }
        else{
          console.log('year undefined')
        }
    }
    //BSC conditions in year standing 2018
    else if(user.effectiveYear === '2018' && user.program === 'BS CS'){
      if(combine >= 0 && combine <= 51){
        const formData = {
          yearLevel: '1'
        };
        response = await api.updateStudentUser(user._id, formData);
      }
      else if(combine >= 52 && combine <= 98){
        const formData = {
          yearLevel: '2'
        };
        response = await api.updateStudentUser(user._id, formData);
      }
      else if(combine >= 99 && combine <= 145){
        const formData = {
          yearLevel: '3'
        };
        response = await api.updateStudentUser(user._id, formData);
      }
      else if(combine >= 146){
        const formData = {
          yearLevel: '4'
        };
        response = await api.updateStudentUser(user._id, formData);
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

        if(combine >=0 && combine <= 63){
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

    /* setValue(studentTotalUnitsFailed) */
  })

  return (
    <div className='w-full'>
      <Grid item xs={6} md={8} lg={10} sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-3.6em' }}>
        <Button
          variant='contained'
          className='bg-teal-600 text-white hover:bg-teal-700'
          startIcon={<UploadFile />}
          onClick={setGradeShowModal}
          sx={{
            width: 'auto',
            '@media (max-width: 500px)': {
              width: '40%',
              marginBottom: '1.5em'
            }
          }}
        >
          Upload New Grades
        </Button>

      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <Typography className='text-teal-600 font-bold text-lg'>Submit Grades</Typography>
          <Typography className='text-gray-600 font-semibold text-sm'>Upload your grades here</Typography>
        </Grid>
      </Grid>

      <Box className="w-full p-4">
        {
          !isSubmitting ?
            <Box>
              <Typography className="text-teal-600 font-bold text-lg">Courses Summary</Typography>
           
              {
                isLoading &&
                <div className="w-full h-[80vh] flex flex-col justify-center items-center mt-8">
                  <CircularProgress className='text-teal-600' />
                </div>
              }
              <Typography variant='caption'>
                        For adding new course accreditations, please go to "Courses Status" page
              </Typography>
              <GradesTable rows={prevGrades} accreditedCourses={accreditedCourses} canModify={true} fetchGrade={fetchGradeInfo} lackingCourses={lackingCourses} grades={allCourses}/>
              <Typography className="text-gray-600 text-sm">Grades marked as "<span style={{ fontWeight: "bold" }}>N/A</span>" under{" "}
                <span style={{ fontWeight: "bold" }}>Verdict</span> are subject to change, please re-upload in SISTEM once your grade appears in ISMIS.
              </Typography>
            </Box>
            :
            <div className="w-full flex flex-col justify-center items-center mt-8">
              <Backdrop
                open={true}
                sx={{
                  color: "#e8e8e8",
                  zIndex: (theme) => theme.zIndex.drawer - 1,
                }}
              >
                <div className="flex flex-col justify-center items-center">
                  <CircularProgress color="inherit" size={5 + "rem"} />
                  <Typography className="text-white-600 text-sm" sx={{ fontSize: '40px' }}>
                    {loadingMessages[index]}
                  </Typography>
                </div>
              </Backdrop>
            </div>
        }
      </Box>
      <Dialog
        open={showModal}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle id="dialog-title" mb={5}>

          <Typography className="text-teal-600 font-bold text-lg">Grade Summary</Typography>
          <Typography className="text-gray-600  font-semibold text-sm">Viewing your submitted grades  </Typography>
          <Grid container justifyContent="flex-end" mt={-5}>
            <Grid item xs={12} md="auto" sx={{ marginTop: { xs: 6, md: 0 } }}>
              {/* <Button
                variant="contained"
                className="bg-teal-600 text-white hover:bg-teal-700"
                startIcon={<AddCircleOutline />}
                onClick={() => setAddCoursesModal(true)}
              >
                Add Missing Grades
              </Button> */}
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>
          {/* <Typography className="text-teal-600 font-bold text-lg">Courses Summary</Typography> */}
          {/* {
            added && Object.keys(added).length > 0 &&
            <Box className="border-solid border-slate-300 rounded-md p-1">
              <Typography className="text-teal-600 font-semibold ">Previously Manually Added Courses</Typography>
              <GradesTable rows={added} />
            </Box>
          }

          {
            selectedCourses.length > 0 &&
            <Box className="border-solid border-slate-300 rounded-md p-1">
              <Typography className="text-gray-600 font-semibold">Manually Added Courses</Typography>
              {selectedCourses.map((course, index) => (
                <Grid item xs={12} key={index}>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography className='text-gray-600 font-semibold '>
                        Course Code: {course.courseCode}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography className='text-gray-600 font-semibold '>
                        Description: {course.courseDesc}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography className='text-gray-600 font-semibold text-center'>
                        Final Grade: {course.finalGrade}
                      </Typography>
                    </Grid>
                    <Grid item xs={3} className='flex items-center justify-center'>
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
            </Box>
          } */}
          
          <GradesTable rows={rows} />
          <Typography className="text-gray-600 text-sm">Grades marked as "<span style={{ fontWeight: "bold" }}>N/A</span>" under{" "}
            <span style={{ fontWeight: "bold" }}>Verdict</span> are subject to change, please re-upload in SISTEM once your grade appears in
            ISMIS.
          </Typography>
          <div className="justify-center items-center flex" >
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox checked={checked} onChange={handleChange} />
                }
                label="I confirm that the information presented is accurate and true"
              />
            </FormGroup>
          </div>
          <div className="justify-center items-center flex">
            <Button
              variant="contained"
              className="bg-teal-600 text-white hover:bg-teal-700"
              onClick={submitGradesConfirmationHandler}
            >
              Confirm
            </Button>
            <Button
              variant="outlined"
              className="bg-white-600 text-blue"
              onClick={() => { handleCloseModal(); submitGradesCancelHandler(); }}
              sx={{ marginLeft: '1em' }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* <AddCourses
        showModal={addCoursesModal}
        setShowModal={setAddCoursesModal}
        addedCourses={selectedCourses}
        setAddedCourses={setSelectedCourses}
        gradeSemester={gradeSemester}
        grades={grades}
        setGrades={setGrades}
        handleRemoveCourse={handleRemoveCourse}
        prevManuallyAdded={prevManuallyAdded} 
      /> */}

      <Dialog
        open={gradeShowModal}
        onClose={() => setGradeShowModal(false)}
        maxWidth='sm'
        fullWidth>
        <DialogTitle>
          <Typography className="text-teal-600 font-bold text-lg">
            Upload Grades
          </Typography>
          <Typography variant='caption'>
          Download your grades report from ISMIS and upload it here
              </Typography>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(handleFileSubmit)} className='flex flex-col justify-center items-center'>
            <FormControl>
              <Controller
                name='file'
                control={control}
                rules={{ required: 'File is required' }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <div
                    {...getRootProps()}
                    className={`w-full h-28 border-2 border-dashed border-gray-400 rounded-md flex justify-center items-center space-x-6 cursor-pointer p-4 ${fileName ? 'text-teal-600' : 'text-gray-400'
                      } hover:text-gray-500 transition duration-300 ease-in-out`}
                  >
                    <input {...getInputProps()} />
                    <MdCloudUpload className='text-[4em]' />
                    <Typography variant='caption'>{fileName ? fileName : 'Drag and drop files or select from your device'}</Typography>
                  </div>
                )}
              />
            </FormControl>
          
            <Button type='submit' className='mt-3 w-fit' variant='contained' color='success' sx={{ marginLeft: '2em' }}>
              Submit
            </Button>

          </form>
          
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmitGrades;