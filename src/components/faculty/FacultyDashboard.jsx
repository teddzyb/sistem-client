'use client'
import api from '@/src/common/api'
import { Box, Grid, Typography, CircularProgress } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { plugins } from '@/postcss.config';
import { adminPageClient } from '@/src/app/lib/loginClient';
Chart.register(...registerables);


const FacultyDashboard = ({currentUser}) => {
  adminPageClient()

  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState({});
  // const [currentSem, setCurrentSem] = useState({});
  const [studentsPerProgram, setStudentsPerProgram] = useState({});

  const [combinedCountsStudents, setCombinedCountsStudents] = useState({});
  const [requests, setRequests] = useState([]);
  const [petitions, setPetitions] = useState([]);

  const [program, setProgram] = useState('')

  const [series, setSeries] = useState({
    labels: [
    ],
    datasets: [
    ],
  });

  const groupByCourse = (students) => {
    return students.reduce((acc, student) => {
      const key = `${student.program}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(student)
      return acc
    }, {})
  }

  const groupByProgram = (population) => {
    population = population.sort((a, b) => {
      // Extract semester and year from each record
      const semesterA = a.semPeriod.semester.toUpperCase();
      const semesterB = b.semPeriod.semester.toUpperCase();
      const yearA = parseInt(a.semPeriod.academicYear);
      const yearB = parseInt(b.semPeriod.academicYear);

      // Convert semester to numerical value
      const semesterValue = semester => {
        switch (semester) {
          case "1ST SEMESTER":
            return 1;
          case "2ND SEMESTER":
            return 2;
          case "SUMMER SEMESTER":
            return 3;
          default:
            return 0;
        }
      };

      // Compare years first
      if (yearA !== yearB) {
        return yearA - yearB;
      }
      // If years are equal, compare semesters
      return semesterValue(semesterA) - semesterValue(semesterB);
    })

    const series = {
      labels: [],
      datasets: []
    };

    const students = population

    // Extract labels from the database
    population.forEach(entry => {
      series.labels.push(`${entry.semPeriod.semester.split(' ')[0]} SEM ${entry.semPeriod.academicYear}`);
    });

    population[0]?.studentsPerProgram.forEach(program => {
      let color = program?.program.replace(/\s/g, '') === "BSIT"
        ? "rgba(75,192,192,1)"
        : program.program.replace(/\s/g, '') === "BSIS"
          ? "#3dbe32"
          : "#b84bc0";

      const dataset = {
        label: program.program,
        data: [],
        borderColor: color,
        backgroundColor: color,
      };

      students.forEach(s => {
        s.studentsPerProgram.forEach(pop => {
          if (pop.program === program.program)
            dataset.data.push(pop.population);
        });

      })



      series.datasets.push(dataset);
    });

    return series;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const currentSemResponse = await api.getCurrentSemester();
        // if (currentSemResponse.status === 200) {
        const currentSemData = currentSemResponse.data;
        // const studentCountResponse = await api.getStudents();

        let specialRequestsResponse
        let program

        if (currentUser.position.includes('Coordinator')) {
          program = currentUser.position === 'IS Coordinator' ? 'BS IS' : currentUser.position === 'IT Coordinator' ? 'BS IT' : 'BS CS'
          setProgram(program)
          specialRequestsResponse = await api.getSpecialRequestsByProgram(program)
          // const response = await api.getStudentsByProgram(program)
          // if (response.status === 200) {
          //   setStudentsPerProgram(response.data.students)
          // }
        } else {
          specialRequestsResponse = await api.getSpecialRequests()
        }

        const petitionsResponse = await api.getPetitions()
        const studentPopulationResponse = await api.getStudentPopulation();
        if (/*studentCountResponse.status === 200 &&*/ specialRequestsResponse.status === 200 && petitionsResponse.status === 200 && studentPopulationResponse.status === 200) {
          // const students = 
          // setStudents(students);
          setRequests(specialRequestsResponse.data.specialRequests);
          setPetitions(petitionsResponse.data.petitions);

          const population = studentPopulationResponse.data.studentPopulation;
          const currentSemPopulation = population.filter((pop) => pop.semPeriod.semester === currentSemData.semester && pop.semPeriod.academicYear === currentSemData.year)[0];
          setStudents(currentSemPopulation);
          const studentsPerProgram = currentSemPopulation?.studentsPerProgram.filter((student) => student.program === program)[0];
          setStudentsPerProgram(studentsPerProgram);
          // Process population data here...
          const data = groupByProgram(population);
          setSeries(data);
        }
        // }
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);


  useEffect(() => {
    const calculateCombinedCounts = () => {
      const countStudent = {};
      Object.keys(students).forEach((student) => {
        let combinedStudent = student;
        if (student === "BSCS" || student === "BS CS") {
          combinedStudent = "BSCS";
        } else if (student === "BSIT" || student === "BS IT") {
          combinedStudent = "BSIT";
        } else {
          combinedStudent = "BSIS";
        }
        countStudent[combinedStudent] = (countStudent[combinedStudent] || 0) + students[student].length;
      });
      setCombinedCountsStudents(countStudent);
    };

    calculateCombinedCounts();
  }, []);

  function studProgram(student) {
    if (student === "BS CS" || student === "BSCS") {
      return "Computer Science"
    }
    else if (student === "BS IT" || student === "BSIT") {
      return "Information Technology"
    }
    else if (student === "BS IS" || student === "BSIS") {
      return "Information Systems"
    }
  }

  const options = {
    scales: {

      y: {
        type: 'linear',
        beginAtZero: true
      }
    },
    color: 'black',
    responsive: true,
    maintainAspectRatio: false,
    plugins:{
      tooltip:{
        mode:'index',
        intersect: false
      }
    }


  }

  return (
    <div className="w-full">
      <Typography className="text-cyan-600 font-bold text-lg">
        Dashboard
      </Typography>

      {
        isLoading ? (
          <Box className="flex justify-center items-center h-[50vh]">
            <CircularProgress />
          </Box>
        )
          :

          <Grid container p={1} spacing={3}>
            {/* Number of Students */}
            <Grid item xs={12}>
              <Box p={2} className="min-h-64">
                <Grid container spacing={2}>
                  {/* Line Chart */}
                  <Grid item xs={12}>
                    <Box borderRadius={2} boxShadow={2} p={2} >
                      <Typography className="text-cyan-600 font-semibold">
                        Enrollees per Semester
                      </Typography>
                      <Line
                        data={series}
                        options={options}
                        className='h-[40vh]'
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box boxShadow={2} borderRadius={2} p={2}>
                      <Typography className="text-cyan-600 font-semibold">
                        Number of Students
                      </Typography>
                      {/* <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <Box className='border-solid border-2 border-gray-400 rounded-md flex flex-col items-center justify-center text-center'>
                      <Typography className='text-cyan-600 font-semibold text-lg'>
                        {Object.keys(students).map(student => students[student].length).reduce((a, b) => a + b, 0)}
                      </Typography>
                      <Typography>
                        Total Students
                      </Typography>
                    </Box>
                  </Grid>
                  {Object.keys(combinedCountsStudents).map((program, index) => (
                    <Grid item xs={3} key={index}>
                      <Box className='border-solid border-2 border-gray-400 rounded-md flex flex-col items-center justify-center text-center'>
                        <Typography className='text-cyan-600 text-lg font-semibold'>
                          {combinedCountsStudents[program]}
                        </Typography>
                        <Typography>
                          {studProgram(program)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
              
                </Grid> */}
                      {currentUser.position === "Department Chair" ? (
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <Box className="border-solid border-2 border-cyan-600 rounded-md flex flex-col items-center justify-center text-center">
                              <Typography className="text-cyan-600 font-semibold text-lg">
                                {
                                  (students?.studentsPerProgram
                                    ?.map((student) => student.population)
                                    .reduce((a, b) => a + b, 0)) || 0
                                }                              </Typography>
                              <Typography className='font-semibold text-gray-500'>Total Students</Typography>
                            </Box>
                          </Grid>
                          {students?.studentsPerProgram?.map((student, index) => (
                            <>
                              <Grid item xs={12} key={index}>
                                <Box className="rounded-md flex flex-col items-center justify-center text-center">
                                  <Typography className="text-cyan-600 text-lg font-semibold">
                                    {student.population}
                                  </Typography>
                                  <Typography>
                                    {studProgram(student.program)}
                                  </Typography>
                                </Box>
                              </Grid>
           
                            </>
                          ))}

                        </Grid>
                      ) : (
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <Box className="border-solid border-2 border-gray-400 rounded-md flex flex-col items-center justify-center text-center">
                              <Typography className="text-cyan-600 font-semibold text-lg">
                                {studentsPerProgram?.population}
                              </Typography>
                              <Typography>Total {program} Students</Typography>
                            </Box>
                          </Grid>

                          {/* <Grid item xs={12} md={3}>
                            <Box className="border-solid border-2 border-gray-400 rounded-md flex flex-col items-center justify-center text-center">
                              <Typography className="text-cyan-600 text-lg font-semibold">
                                {
                                  studentsPerProgram.studentsByYearLevel?.filter(student => student.yearLevel === "1")[0].population
                                }
                              </Typography>
                              <Typography>1st Years</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Box className="border-solid border-2 border-gray-400 rounded-md flex flex-col items-center justify-center text-center">
                              <Typography className="text-cyan-600 text-lg font-semibold">
                                {
                                  studentsPerProgram.studentsByYearLevel?.filter(student => student.yearLevel === "2")[0].population
                                }
                              </Typography>
                              <Typography>2nd Years</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Box className="border-solid border-2 border-gray-400 rounded-md flex flex-col items-center justify-center text-center">
                              <Typography className="text-cyan-600 text-lg font-semibold">
                                {
                                  studentsPerProgram.studentsByYearLevel?.filter(student => student.yearLevel === "3")[0].population
                                }
                              </Typography>
                              <Typography>3rd Years</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Box className="border-solid border-2 border-gray-400 rounded-md flex flex-col items-center justify-center text-center">
                              <Typography className="text-cyan-600 text-lg font-semibold">
                                {
                                  studentsPerProgram.studentsByYearLevel?.filter(student => student.yearLevel === "4")[0].population
                                }
                              </Typography>
                              <Typography>4th Years</Typography>
                            </Box>
                          </Grid> */}
                        </Grid>
                      )}
                    </Box>
                  </Grid>

                  {/* Special Requests */}
                  <Grid item xs={12} md={6} mt={2}>
                    <Box boxShadow={2} borderRadius={2} p={2}>
                      <Typography className="text-cyan-600 font-semibold">
                        Special Requests
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Box className="border-solid border-2 border-cyan-700 rounded-md p-2 text-center">
                            <Typography className="text-cyan-600 font-semibold">
                              {requests.length}
                            </Typography>
                            <Typography>Total Requests</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box className="p-2 text-center">
                            <Typography className="text-cyan-600 font-semibold">
                              {
                                requests.filter(
                                  (request) =>
                                    request.statusTrail.coordinatorApproval
                                      .dateApproved == null &&
                                    request.statusTrail.chairApproval
                                      .dateApproved == null
                                ).length
                              }
                            </Typography>
                            <Typography>Pending</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box className="p-2 text-center">
                            <Typography className="text-cyan-600 font-semibold">
                              {
                                requests.filter(
                                  (request) =>
                                    request.statusTrail.coordinatorApproval
                                      .isApproved
                                ).length
                              }
                            </Typography>
                            <Typography>Endorsed by Coordinator</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box className="p-2 text-center">
                            <Typography className="text-cyan-600 font-semibold">
                              {
                                requests.filter(
                                  (request) =>
                                    request.statusTrail.chairApproval.isApproved
                                ).length
                              }
                            </Typography>
                            <Typography>Approved by Chair</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box className="p-2 text-center">
                            <Typography className="text-cyan-600 font-semibold">
                              {
                                requests.filter(
                                  (request) =>
                                    (!request.statusTrail.chairApproval
                                      .isApproved &&
                                      request.statusTrail.chairApproval
                                        .dateApproved != null) ||
                                    (!request.statusTrail.coordinatorApproval &&
                                      request.statusTrail.coordinatorApproval
                                        .dateApproved != null)
                                ).length
                              }
                            </Typography>
                            <Typography>Declined</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  {/* Petitions */}
                  <Grid item xs={12} md={6} mt={2}>
                    <Box boxShadow={2} borderRadius={2} p={2}>
                      <Typography className="text-cyan-600 font-semibold">
                        Petitions
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Box className="border-solid border-2 border-cyan-800 rounded-md p-2 text-center">
                            <Typography className="text-cyan-600 font-semibold">
                              {petitions.length}
                            </Typography>
                            <Typography>Total Petitions</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box className="p-2 text-center">
                            <Typography className="text-cyan-600 font-semibold">
                              {
                                petitions.filter(
                                  (request) =>
                                    request.statusTrail.coordinatorApproval
                                      .dateApproved == null &&
                                    request.statusTrail.chairApproval
                                      .dateApproved == null
                                ).length
                              }
                            </Typography>
                            <Typography>Pending</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box className="p-2 text-center">
                            <Typography className="text-cyan-600 font-semibold">
                              {
                                petitions.filter(
                                  (request) =>
                                    request.statusTrail.coordinatorApproval
                                      .isApproved
                                ).length
                              }
                            </Typography>
                            <Typography>Endorsed by Coordinator</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box className="p-2 text-center">
                            <Typography className="text-cyan-600 font-semibold">
                              {
                                petitions.filter(
                                  (request) =>
                                    request.statusTrail.chairApproval.isApproved
                                ).length
                              }
                            </Typography>
                            <Typography>Evaluated by Chair</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box className="p-2 text-center">
                            <Typography className="text-cyan-600 font-semibold">
                              {
                                petitions.filter(
                                  (request) =>
                                    (!request.statusTrail.chairApproval
                                      .isApproved &&
                                      request.statusTrail.chairApproval
                                        .dateApproved != null) ||
                                    (!request.statusTrail.coordinatorApproval &&
                                      request.statusTrail.coordinatorApproval
                                        .dateApproved != null)
                                ).length
                              }
                            </Typography>
                            <Typography>Declined</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

          </Grid>
      }
    </div>
  );
}

export default FacultyDashboard