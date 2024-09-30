import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogActions,
  Divider,
} from "@mui/material";
import {useCallback, useEffect, useState} from "react";
import {signOut} from "next-auth/react";
import {authConfig} from "@/src/app/lib/auth";
import SpecialRequestTable from "./SpecialRequestTable";
import PetitionsTable from "./PetitionsTable";
import api from "@/src/common/api";
import {useParams} from "next/navigation";

const StudentDashboard = ({ user, waitLists}) => {
  const [loadingPetitionID, setLoadingPetitionID] = useState(null);
  const [waitListValue, setWaitListValue] = useState();
  const [petitions, setPetitions] = useState([]);
  const [totalUnitsPassed, setTotalUnitsPassed] = useState(0);
  const [totalUnitsFailed, setTotalUnitsFailed] = useState(0);
  const [studentPassRate, setStudentPassRate] = useState(0);
  const [studentFailRate, setStudentFailRate] = useState(0);
  const [currentUnitLoad, setCurrentUnitLoad] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [unitValueProspectus, setUnitValueProspectus] = useState(0);
  const isCurrentSem = true;

  const [currentLoad, setCurrentLoad] = useState([]);

  const [overall, setOverall] = useState()

  const fetchStudentDetails = useCallback(async () => {
    setIsLoading(true);
    const id = user.idNumber;
    const responseGrade = await api.getGrades(id);
    const rows = [];
    let index = 0;
    responseGrade?.data?.grade.courses.forEach((gradeInfo) => {
      rows.push({
        semester: gradeInfo.semester,
      });
    });

    const groupedCourses = groupCoursesByYearAndSemester(rows);
    setRows(groupedCourses);

    setIsLoading(false);
  }, []);

  const groupCoursesByYearAndSemester = (courses) => {
    return courses.reduce((acc, course) => {
      const key = `${course.semester}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        semester: course.semester,
      });
      return acc;
    }, {});
  };

  const fetchStudentPetitions = useCallback(async () => {
    try {
      setIsLoading(true);
      const id = user?._id;
      const response = await api.getStudentJoinedPetitions(id);

      if (response?.status === 200) {
        const petitions = response.data?.petitions;

        const rows = petitions.map((petition) => ({
          id: petition._id,
          courseStatus: petition.courseStatus,
          dateCreated: petition.createdAt,
          course: petition.course.courseCode
            ? `${petition.course.courseCode} ${petition.course.courseDesc}`
            : petition.course,
          studentsJoined: petition.studentsJoined.length,
          status:
            !petition.statusTrail.coordinatorApproval.isApproved ||
            (!petition.statusTrail.chairApproval.isApproved &&
              petition.statusTrail.chairApproval.dateApproved != null)
              ? "Rejected"
              : petition.statusTrail.chairApproval.isApproved
              ? "Approved by Chair"
              : "Endorsed by Coordinator",
          approvedBy: petition.statusTrail.coordinatorApproval.approvedBy,
        }));
        setPetitions(rows);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("there was an error", error);
    }
  }, []);

  const fetchGradeInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const id = user.idNumber;
      const response = await api.getGrades(id);
      const courses = response.data?.grade?.courses;
   
      const accredited = response.data?.grade?.accreditedCourses;

      const currentLoad = courses.filter(
        (course) => course.finalGrade === "NG"
      );
      setCurrentLoad(currentLoad);

      let studentTotalUnits = 0;
      let studentTotalUnitsFailed = 0;
      let studentTotalUnitsCurrent = 0;
      let count = 0;
      {
        courses?.map((gradeInfo) => {
          if (
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
          } else if (
            gradeInfo.finalGrade === "NG" &&
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
            studentTotalUnitsCurrent += parseInt(gradeInfo.units);
          } else if (
            gradeInfo.finalGrade === "INC" ||
            gradeInfo.finalGrade === "W"
          ) {
            return null;
          } else if (
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
            studentTotalUnitsFailed += parseInt(gradeInfo.units);
          }
        })
        .filter(Boolean);
      }
      const regularCourseCodes = new Set(courses.map(course => course.courseCode));
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
      setTotalUnitsPassed(combine);
      setTotalUnitsFailed(studentTotalUnitsFailed);
      
      const failRatio = (studentTotalUnitsFailed / combine) * 100;
      const passRatio = 100 - failRatio
      setStudentPassRate(passRatio.toFixed(2));
      setStudentFailRate(failRatio.toFixed(2));

      setCurrentUnitLoad(studentTotalUnitsCurrent);
    } catch (error) {
      console.error("there was an error", error);
    }
    setIsLoading(false);
  });

  const fetchUnitValuesfromProspectus = useCallback(async () => {
    setIsLoading(true);
    try {
      const id = user.idNumber;
      const response = await api.getSuggestedCourses(id);
      const suggestedCourses = response?.data.suggestedCourses.suggestedCourses;
      const rows = [];
      suggestedCourses?.forEach((gradeInfo) => {
        rows.push({
          units: gradeInfo.course.units,
        });
      });
      const sumOfUnits = rows.reduce((acc, curr) => acc + curr.units, 0);
      setUnitValueProspectus(sumOfUnits);
    } catch (error) {
      console.error("Error occurred while fetching unit values:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStudentDetails();
    fetchStudentPetitions();
    fetchGradeInfo();
    fetchUnitValuesfromProspectus();
  }, []);

  const studentPercentage = () => {
    if (totalUnitsPassed === 0 || unitValueProspectus === 0) {
      return 0;
    }
    return ((totalUnitsPassed / unitValueProspectus) * 100).toFixed(2);
  };

  const rowsKey = Object.keys(rows);
  const lastSem = Object.keys(rows).length - 1;
  let semLast = rowsKey[lastSem];
  if (semLast === "COURSE ACCREDITED" && Object.keys(rows).length > 1) {
    semLast = rowsKey[Object.keys(rows).length - 2];
  }

  return (
    <div className="w-full">

      <Typography className="text-teal-600 font-bold text-lg">
        Dashboard
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box p={2}>
            <Typography className="text-teal-600 font-bold mb-2">
              Student Progress:
            </Typography>
            <Typography className="text-black font-semibold">
              Total Units Earned: {totalUnitsPassed} / {unitValueProspectus}
              <span
                className="percentage-text"
                style={{color: "green", marginLeft: .8 + "rem"}}
              >
                ({studentPercentage()}% Completion Rate){" "}
              </span>
            </Typography>
            <Typography className="text-black font-semibold">
              Student Passing Rate:
              <span style={{color: studentPassRate < 60 ? "red" : "green"}}>
                {" "}
                {studentPassRate}% ({totalUnitsPassed} Units Passed)
              </span>
            </Typography>
            <Typography className="text-black font-semibold">
              Student Failure Rate:
              <span
                style={{
                  color: studentFailRate > 9 ? "red" : "green",
                  marginLeft: 0.4 + "rem",
                }}
              >
                {studentFailRate} % ({totalUnitsFailed} Units Failed)
              </span>
            </Typography>
          </Box>
        </Grid>

        {/* Student Current Load*/}
        <Grid item xs={12} md={8}>
          <Box p={2}>
            <Typography className="text-teal-600 font-bold mb-2">
              Student Current Load
            </Typography>
            <Typography className="text-gray-600 font-semibold">
              Current Units:{" "}
              {currentLoad.reduce((acc, curr) => acc + parseInt(curr.units), 0)}
                            {' '}
            </Typography>

            {currentLoad.length > 0 ? (
              <Box className="border-solid border-slate-300 rounded-md p-3 m-1">
                <Grid item xs={12}>
                  <Grid container spacing={1}>
                    <Grid item xs={3}>
                      <Typography className="text-teal-600 font-semibold text-sm">
                        Course Code
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography className="text-teal-600 font-semibold text-sm">
                        Course Description
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography className="text-teal-600 font-semibold text-sm">
                        Units
                      </Typography>
                    </Grid>
                    <Divider />
                  </Grid>
                  {currentLoad.map((item, index) => (
                    <Grid item xs={12} key={index}>
                      <Grid container spacing={1}>
                        <Grid item xs={3}>
                          <Typography className="text-gray-600 font-semibold text-sm">
                            {item.courseCode}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography className="text-gray-600 font-semibold text-sm">
                            {item.courseDesc}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography className="text-gray-600 font-semibold text-sm">
                            {item.units}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Divider />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <Typography className="text-gray-600 font-semibold text-sm">
                No data to display for now...
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box boxShadow={1} p={2} borderRadius={1}>
            <Typography className="text-teal-600 font-bold mb-2">
              Special Requests
            </Typography>
            {/*<Typography className="text-black font-semibold">
              Total Special Request:
              {localStorage.getItem("specialRequestCount")}
          </Typography>*/}
            <SpecialRequestTable isCurrentSem={isCurrentSem} />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box boxShadow={1} p={2} borderRadius={1}>
            <Typography className="text-teal-600 font-bold mb-2">
              Petitions Joined
            </Typography>
            {/* <Typography className="text-black font-semibold">
              Total Petitions Joined:
              {petitions.length}
            </Typography> */}
            <PetitionsTable rows={petitions} isLoading={isLoading} />
          </Box>
        </Grid>
      </Grid>
      {waitLists?.length > 0 && (
        <Grid item xs={12} mt={2}>
          <Box boxShadow={1} p={2} borderRadius={1}>
            <Typography className="text-teal-600 font-bold mb-2">
              Joined Courses Waiting List
            </Typography>
            <Grid container spacing={2}>
              {waitLists?.map((petition, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Box
                    className="cursor-pointer"
                    boxShadow={1}
                    /* onClick={() => handlePetitionClick(petition?._id)} INSERT A DIFFERENT ONCLICK VALUE*/
                  >
                    <Box p={2}>
                      <Typography className="text-gray-600 font-bold">
                        View
                      </Typography>
                      {loadingPetitionID === petition._id ? (
                        <>
                          <Typography className="text-gray-600 font-bold">
                            {petition?.course.courseCode}{" "}
                            {petition?.course.courseDesc}
                          </Typography>
                          <Typography className="text-gray-600 font-bold">
                            Loading..{" "}
                            <CircularProgress
                              size={14}
                              sx={{
                                position: "relative",
                                marginBottom: "-.12em",
                              }}
                            />
                          </Typography>
                        </>
                      ) : (
                        <Typography className="text-gray-600 font-bold">
                          {petition?.course.courseCode}{" "}
                          {petition?.course.courseDesc}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>
      )}
    </div>
  );
};

export default StudentDashboard;
