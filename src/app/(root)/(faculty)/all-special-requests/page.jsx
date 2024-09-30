'use client'
import { adminPageClient, getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient';
import api from "@/src/common/api";
import SpecialRequestTable from "@/src/components/faculty/SpecialRequestTable";
import { Tab, Tabs, Typography, Box, Grid, Tooltip, IconButton, Divider, Button, Autocomplete, TextField } from "@mui/material";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { AiOutlineEye } from "react-icons/ai";

const CustomTabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Box>{children}</Box>
        </Box>
      )}
    </div>
  );
}

const a11yProps = (index) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const AllRequestsList = () => {
  loginIsRequiredClient()
  adminPageClient()


  const router = useRouter()

  const [value, setValue] = useState(0);
  const [newReq, setNewReq] = useState([])          //1. NEW REQUESTS 
  const [studCancel, setStudCancel] = useState([])  //2. STUDENT REQUEST CANCELLATION
  const [cancel, setCancel] = useState([])          //3. CANCELLED
  const [inProgress, setInProgress] = useState([])  //4. IN PROGRESS
  const [aprCoord, setAprCoord] = useState([])      //5. APPROVED BY COORDINATOR
  const [rejected, setRejected] = useState([])    //6. DECLINED BY COORDINATOR
  const [aprChair, setAprChair] = useState([])      //7. APPROVED BY DEPT.CHAIR
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState([])  
  const [filterValue, setFilterValue] = useState('')    
  
  const [semesters, setSemesters] = useState([])
  const [currentSemester, setCurrentSemester] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [displayedSemester, setDisplayedSemester] = useState('')
  const [displayedYear, setDisplayedYear] = useState('')
  const [program, setProgram] = useState('')

  const semesterOptions = ['1ST SEMESTER', '2ND SEMESTER', 'SUMMER SEMESTER']

  const [currentUser, setCurrentUser] = useState()

  const columns = [
    // { field: 'id', headerName: 'ID Number', width: 90, headerClassName: 'bg-cyan-600 text-white' },
    {
      // concern
      field: 'concern',
      headerName: 'Concern',
      flex: 2,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      renderCell: (params) => {
        return (
          <Box className='w-full relative space-x-4'>
          <Box
            sx={{ backgroundColor: params.row.color }}
            className="h-1/4 w-3 absolute top-[40%] left-0"
          >
          </Box>
            <p className="text-ellipsis overflow-hidden">
              {params.value}
            </p>
          </Box>
        );

      }
    },
    {
      field: 'courses',
      headerName: 'Courses',
      flex: 4,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'left', // This will center the cell content
      headerAlign: 'left',
    },
    {
      // concern
      field: 'dateCreated',
      headerName: 'Date Created',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      renderCell: (params) => {
        return (
          <>
            {moment(params.value).format("ll")}
          </>
        );

      }
    },
    {
      // Full Name of User
      field: 'name',
      headerName: 'Request By',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      // ID NO
      field: 'idNumber',
      headerName: 'ID Number',
      flex: 1,
      sortable: true,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: "lastUpdated",
      headerName: "Last Updated",
      flex: 1,
      headerClassName: "bg-cyan-600 text-white",
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        return (
          <>
            {moment(params.value).format("ll")}
          </>
        );
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      headerClassName: "bg-cyan-600 text-white",
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box className='flex justify-between'>
            <Tooltip title='View Details'>
              <IconButton
                onClick={() => {
                  router.push(`/all-special-requests/${row.id}`)
                }}
              >
                <AiOutlineEye className='text-green-600' />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    }
  ];
  
  const handleChange = (event, newValue) => {
    setValue(newValue);
  }

  const handleFilter = (filter) => {
    setFilterValue(filter)

  }

  const fetchRequests = useCallback(async () => {
    try {
      const response = await api.getSpecialRequestOptions()
      setFilters(response?.data?.specialRequests)

    } catch (error) {
      console.log(error)
    }
  }, [])

  const fetchSpecialRequests = useCallback(async (user) => {
    try {
      setIsLoading(true)

      let program = ''
      let response = null

      if (user.position.includes('Coordinator')) {
        program = user.position === 'IT Coordinator' ? 'BS IT' : user.position === 'CS Coordinator' ? 'BS CS' : 'BS IS'
        setProgram(program)
        response = await api.getSpecialRequestsByProgram(program)
      } else {
        response = await api.getSpecialRequests();
      }

      let data = []

      response?.data?.specialRequests.forEach((request) => {
        data.push( {
          id: request._id,
          color: request.concern.colorCode,
          concernId: request.concern._id,
          concern: request.concern.requestTitle,
          courses: request.coursesAssociated.map(course => course.course).join('   |   '), 
          dateCreated: request.createdAt,
          lastUpdated: request.updatedAt,
          idNumber: request.createdBy?.idNumber,
          name: request.createdBy?.firstName + ' ' + request.createdBy?.lastName,
          status: request.statusTrail.isCancelled != null ? request.statusTrail.isCancelled : (
            request.statusTrail.inProgress ? 'In Progress' : (
              !request.statusTrail.coordinatorApproval.approvedBy ? 'Pending' : (
                !request.statusTrail.coordinatorApproval.isApproved || (!request.statusTrail.chairApproval.isApproved && request.statusTrail.chairApproval.dateApproved != null) ? 'Rejected' : (
                  request.statusTrail.chairApproval.isApproved ? 'Approved by Chair' : 'Endorsed by Coordinator'
                )
              )
            )
          )
        })
      })

      data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))

      const newReq = data.filter((request) => request.status === 'Pending')
      setNewReq(newReq)

      const studCancel = data.filter((request) => request.status === 'Cancellation Pending')
      setStudCancel(studCancel)

      const cancel = data.filter((request) => request.status === 'Cancelled')
      setCancel(cancel)

      const rejected = data.filter((request) => request.status === 'Rejected')
      setRejected(rejected)

      const inProgress = data.filter((request) => request.status === 'In Progress')
      setInProgress(inProgress)

      const aprCoord = data.filter((request) => request.status === 'Endorsed by Coordinator')
      setAprCoord(aprCoord)

      const aprChair = data.filter((request) => request.status === 'Approved by Chair')
      setAprChair(aprChair)

      setIsLoading(false)

    } catch (error) {
      console.log(error)
    }
  }, []);

  const handleChangeAcademicPeriod = async () => {
    try {
      if (!selectedSemester || !selectedYear) {
        toast.error('Please select semester and academic year', {
          duration: 3000,
          position: 'top-right',
          style: {
            backgroundColor: '#f44336',
            color: '#fff',
          },
        })
        return
      }
      setIsLoading(true)

      let program = ''
      let response

      if (currentUser.position.includes('Coordinator')) {
        program = currentUser.position === 'IT Coordinator' ? 'BS IT' : currentUser.position === 'CS Coordinator' ? 'BS CS' : 'BS IS'
        setProgram(program)
        response = await api.getSpecialRequestsBySemAndProgram(selectedYear, selectedSemester, program)
      } else {
        response = await api.getSpecialRequestsBySemester(selectedSemester, selectedYear)
      }

      if (response.status === 200) {
        const requests = response.data.specialRequests
        let data = []
        requests.forEach((request) => {
          data.push( {
            id: request._id,
            color: request.concern.colorCode,
            concernId: request.concern._id,
            concern: request.concern.requestTitle,
            courses: request.coursesAssociated.map(course => course.course).join('   |   '), 
            dateCreated: request.createdAt,
            lastUpdated: request.updatedAt,
            idNumber: request.createdBy?.idNumber,
            name: request.createdBy?.firstName + ' ' + request.createdBy?.lastName,
            status: request.statusTrail.isCancelled != null ? request.statusTrail.isCancelled : (
              request.statusTrail.inProgress ? 'In Progress' : (
                !request.statusTrail.coordinatorApproval.approvedBy ? 'Pending' : (
                  !request.statusTrail.coordinatorApproval.isApproved || (!request.statusTrail.chairApproval.isApproved && request.statusTrail.chairApproval.dateApproved != null ) ? 'Rejected' : (
                    request.statusTrail.chairApproval.isApproved ? 'Approved by Chair' : 'Endorsed by Coordinator'
                  )
                )
              )
            )
          })
        });

        data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))   

        const newReq = data.filter((request) => request.status === 'Pending')
        setNewReq(newReq)

        const studCancel = data.filter((request) => request.status === 'Cancellation Pending')
        setStudCancel(studCancel)

        const cancel = data.filter((request) => request.status === 'Cancelled')
        setCancel(cancel)

        const rejected = data.filter((request) => request.status === 'Rejected')
        setRejected(rejected)

        const inProgress = data.filter((request) => request.status === 'In Progress')
        setInProgress(inProgress)

        const aprCoord = data.filter((request) => request.status === 'Endorsed by Coordinator')
        setAprCoord(aprCoord)

        const aprChair = data.filter((request) => request.status === 'Approved by Chair')
        setAprChair(aprChair)

      } 
      setIsLoading(false)
      setDisplayedSemester(selectedSemester)
      setDisplayedYear(selectedYear)

    } catch (error) {
      console.log(error)
    }
  }

  const fetchAcademicPeriod = useCallback(async () => {
    try {
      const response = await api.getCurrentSemester()
      if (response.status === 200) {
        const semester = response.data
        setCurrentSemester(semester)
       setSelectedSemester(semester.semester)
        setSelectedYear(semester.year)
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }, [])

  const fetchSemesters = useCallback(async () => {
    try {
      const response = await api.getSemesters()

      if (response.status === 200) {
        const semesters = response.data.semesters
        let years = semesters.map((semester) => semester.year)
        years = [...new Set(years)]
        setSemesters(years)
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }, [])
  
  useEffect(() => {
    const init = async () => {
      const user = await getUser()
      setCurrentUser(user)
      fetchSpecialRequests(user)
      fetchRequests();
      fetchAcademicPeriod()
      fetchSemesters()
    }
    init()
  }, []);

  return (
    <div className="w-full">
      <Typography className='text-cyan-600 font-bold text-lg' sx={{fontFamily: 'Source Sans Pro' }}>
        Special Requests {program && 'By ' + program + ' Students'}
      </Typography>
      <Divider />
      <Typography className='text-gray-500 mt-3'>
        Select Semester and Academic Year to view special requests. Default is the current semester and academic year.
      </Typography>
      <Grid container spacing={2} mt={1}>
        <Grid item xs={12} md={5}>
          <Autocomplete
            fullWidth
            isOptionEqualToValue={(option, value) => option === value}
            options={semesterOptions}
            renderInput={(params) => <TextField {...params} label="Semester" />}
            onChange={(e, value) => setSelectedSemester(value)}
            value={selectedSemester}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <Autocomplete
            fullWidth
            isOptionEqualToValue={(option, value) => option === value}
            value={selectedYear}
            options={semesters}
            renderInput={(params) => <TextField {...params} label="Academic Year" />}
            onChange={(e, value) => setSelectedYear(value)}
          />
        </Grid>
        <Grid item xs={12} md={2} className='flex items-center justify-center'>
          <Button
          size='small'
            onClick={handleChangeAcademicPeriod}
            variant='contained'
            className='bg-cyan-600 text-white hover:bg-cyan-700'
          >
            Change Period
          </Button>
        </Grid>
      </Grid>

      <Typography className='text-cyan-600 my-5'>
        Semester and Academic Year: &nbsp;
        <span className='font-semibold'>
          {displayedSemester && displayedYear ? displayedSemester + ' ' + displayedYear : currentSemester.semester + ' ' + currentSemester.year}
        </span>
      </Typography>
      <Divider className='my-5' />
      <Typography className='text-gray-600 font-bold ' sx={{ marginTop: '.7vw', fontFamily: 'Source Sans Pro', marginLeft: '2vw' }}>
        List of Special Requests by Status
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box className='w-full overflow-auto' sx={{ borderBottom: 1, borderColor: 'divider' }}>

            <Tabs value={value} onChange={handleChange} aria-label="user tabs">
              <Tab label={`${newReq.length != 0 ? newReq.length : ''}   New Requests`} {...a11yProps(0)} />
              <Tab label={`${studCancel.length != 0 ? studCancel.length : ''}   Student Request Cancellation`} {...a11yProps(1)} />
              <Tab label={`${cancel.length != 0 ? cancel.length : ''}   Cancelled`} {...a11yProps(2)} />
              <Tab label={`${inProgress.length != 0 ? inProgress.length : ''}   In Progress`} {...a11yProps(3)} />
              <Tab label={`${aprCoord.length != 0 ? aprCoord.length : ''}    Endorsed by Coordinator`} {...a11yProps(4)} />
              <Tab label={`${aprChair.length != 0 ? aprChair.length : ''}   Approved by Dept. Chair`} {...a11yProps(5)} />
              <Tab label={`${rejected.length != 0 ? rejected.length : ''}   Declined`} {...a11yProps(6)} />
            </Tabs>

          </Box>
        </Grid>
        {/* TEXTS FOR CATEGORY FILTERS */}
        <Grid item xs={12} md={2}>
            <Typography className=' font-bold' sx={{ marginTop: '2em', marginLeft: '2em', color: '#676767', marginBottom: '.5em', fontFamily: 'Source Sans Pro' }} >
              Category Filters
            </Typography>
          <Typography className='font-bold py-2 cursor-pointer' sx={{marginLeft: 5, color: '#676767', fontFamily: 'Source Sans Pro' }} onClick={() => handleFilter()}>
                All Concerns
          </Typography>
          <Divider />

            {
              filters?.map((filter, index) => (
                <>
                  <Box className='flex items-center space-x-4 py-2 cursor-pointer' key={index} onClick={() => handleFilter(filter.requestTitle)}>
                    <Box sx={{ borderRadius: '5px' }}
                      minWidth="20px"
                      minHeight="20px"
                      bgcolor={filter.colorCode}
                    >
                    </Box>
                    <Typography className='font-bold' sx={{ color: '#676767', textOverflow: 'ellipsis', fontFamily: 'Source Sans Pro' }}>
                      {filter.requestTitle}
                    </Typography>

                  </Box>
                  <Divider />
                </>
              ))
            }

            

        </Grid>
        <Grid item xs={12} md={10}>
          {/* New Requests  */}
          <CustomTabPanel value={value} index={0}>
            <SpecialRequestTable rows={newReq} columns={columns} isLoading={isLoading} filterValue={filterValue}/>
          </CustomTabPanel>
          {/* Student Request Cancellation */}
          <CustomTabPanel value={value} index={1}>
            <SpecialRequestTable rows={studCancel} columns={columns} isLoading={isLoading} filterValue={filterValue} />
          </CustomTabPanel>
          {/* Cancelled */}
          <CustomTabPanel value={value} index={2}>
            <SpecialRequestTable rows={cancel} columns={columns} isLoading={isLoading} filterValue={filterValue} />
          </CustomTabPanel>
          {/* In Progress */}
          <CustomTabPanel value={value} index={3}>
            <SpecialRequestTable rows={inProgress} columns={columns} isLoading={isLoading} filterValue={filterValue} />
          </CustomTabPanel>
          {/* Approved by Coordinator */}
          <CustomTabPanel value={value} index={4}>
            <SpecialRequestTable rows={aprCoord} columns={columns} isLoading={isLoading} filterValue={filterValue} />
          </CustomTabPanel>
          {/* Approved by Dept. Chair */}
          <CustomTabPanel value={value} index={5}>
            <SpecialRequestTable rows={aprChair} columns={columns} isLoading={isLoading} filterValue={filterValue} />
          </CustomTabPanel>
          {/* Rejected */}
          <CustomTabPanel value={value} index={6}>
            <SpecialRequestTable rows={rejected} columns={columns} isLoading={isLoading} filterValue={filterValue} />
          </CustomTabPanel>
        </Grid>
        
      </Grid>
    </div>
  )
}

export default AllRequestsList