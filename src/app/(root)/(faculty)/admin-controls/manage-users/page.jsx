'use client'
//import { loginIsRequiredClient } from '@/src/app/lib/loginClient';
import api from "@/src/common/api";
import Table from "@/src/components/shared/Table";
import { VisibilityOutlined, DeleteOutlineOutlined, ModeOutlined, Person } from "@mui/icons-material";
import { Tab, Tabs, Typography, Box, IconButton, Dialog, DialogTitle, DialogContent, CircularProgress, FormControl, FormHelperText, Tooltip, Grid, OutlinedInput, MenuItem, Select, DialogActions, Button, TextField, InputLabel, Autocomplete } from "@mui/material";
import { useEffect } from "react";
import { useCallback, useState } from "react";
import { useForm, Controller, set } from 'react-hook-form'
import toast from "react-hot-toast";
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import { useDropzone } from "react-dropzone";
import { MdCloudUpload } from 'react-icons/md';
import Backdrop from "@mui/material/Backdrop";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from "dayjs";
import { adminPageClient, getUser, loginIsRequiredClient } from "@/src/app/lib/loginClient";
import { getSession } from "next-auth/react";
import { authConfig } from "@/src/app/lib/auth";


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

const ManageUsers = () => {
  loginIsRequiredClient()
  adminPageClient()

  const [user, setUser] = useState()
  const [fileName, setFileName] = useState('');
  const [valueTab, setValueTab] = useState(0);
  const [studentRows, setStudentRows] = useState([])
  const [facultyRows, setFacultyRows] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [isOpenUserDetails, setIsOpenUserDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [isOpenStatusDialog, setIsOpenStatusDialog] = useState(false);
  const [importUsers, setImportUsers] = useState(false)
  const [viewImageModal, setViewImageModal] = useState(false);
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facultyPosition, setFacultyPosition] = useState('')
  const [formData, setFormData] = useState({ position: selectedRow?.position, program: selectedRow?.program });
  const semesters = ['1ST SEMESTER', '2ND SEMESTER', 'SUMMER SEMESTER']
  // const [file, setFile] = useState();
  
  const toggleImageModal = () => {
    setViewImageModal(!viewImageModal);
  };

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
    clearErrors,
    setError,
    setValue,
  } = useForm()

  const onSubmit = async (formData) => {
    try {
      setIsOpenUserDetails(false);

      let response
      
      if (selectedRow.userType === 'student') {
        response = await api.updateStudentUser(selectedRow.id, formData);
        
      } else {
        response = await api.updateFacultyUser(selectedRow.id, formData)
      }
      

      if (response.status === 200) {
        if (formData.position === 'Department Chair' && selectedRow.position !== 'Department Chair') {
          setFormData(prevFormData => ({ ...prevFormData, posiition: selectedRow.position }))
          toast.error('Department Chair is already assigned to a different user', { position: 'bottom-right', duration: 3000, style: { backgroundColor: '#f44336', color: '#fff' } });
          return;
        }
        setIsOpenUserDetails(false);

        fetchStudents();
        fetchFaculty();

        toast.success(`User details updated successfully! Changes will take effect once user logs out`, { position: 'bottom-right', duration: 8000, style: { backgroundColor: '#4caf50', color: '#fff' } })
      } else {
        toast.error('Something went wrong', { position: 'bottom-right', duration: 3000, style: { backgroundColor: '#f44336', color: '#fff' } })
      }

    } catch (error) {
      console.log(error)
    }
  }

  const handleStatusUpdate = async () => {
    setIsOpenStatusDialog(false);
    
    const response = await api.updateUserStatus(selectedRow.id, { isActive: !selectedRow.isActive });
    if (response.status === 200) {
      fetchStudents();
      fetchFaculty();
      toast.success('User status updated successfully', { position: 'bottom-right', duration: 3000, style: { backgroundColor: '#4caf50', color: '#fff' } })
      
    } else {
      toast.error('Something went wrong', { position: 'bottom-right', duration: 3000, style: { backgroundColor: '#f44336', color: '#fff' } })
    }

  }
  const handleFileUpload = async (data) => {

    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('semester', data.semester);
    formData.append('year', dayjs(data.year).format('YYYY'));
    try {
      setIsSubmitting(true)
      const response = await api.importStudentUsers(formData)
      if (response?.status === 201) {
        toast.success('File import success!', {
          duration: 3000,
          position: "bottom-right",
          style: {
            backgroundColor: "#4caf50",
            color: "#fff",
          },
        })
        fetchStudents();
        setImportUsers(false);
        setValue('file', null);
        setFileName('');
        setValue('semester', null);
        setValue('year', null);
      } else {
        toast.error('Something went wrong', {
          duration: 3000,
          style: {
            background: '#f44336',
            color: '#fff',
          },
          position: 'bottom-right',
        });
        console.log(response.data.message);
      }
      setIsSubmitting(false)
    } catch (error) {
      console.error('Error importing student data', error)
    }
  };


  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: [".xlsx"],
    onDrop: (accepted) => {
      // Update form values when files are dropped
      setValue('file', accepted[0]);
      setFileName(accepted[0].name);
    },
  });

  const addFacultyUser = async (data) => {
    try {
      setIsSubmitting(true);

      if (facultyRows.some(faculty => faculty.email === data.email)) {
        setError('email', {
          type: 'manual',
          message: 'Email already exists'
        });
        setIsSubmitting(false);
        return
      }

      const response = await api.addFacultyUser(data);

      if (response.status === 201) {
        fetchFaculty();
        setAddUserDialog(false);
        toast.success('Faculty user added successfully', { position: 'bottom-right', duration: 3000, style: { backgroundColor: '#4caf50', color: '#fff' } })
      } else {
        toast.error('Something went wrong', { position: 'bottom-right', duration: 3000, style: { backgroundColor: '#f44336', color: '#fff' } })
      }
      setIsSubmitting(false);
    } catch (error) {
      console.log(error)
    }
  }


  const facultyColumns = [
    // { field: 'id', headerName: 'ID Number', width: 90, headerClassName: 'bg-cyan-600 text-white' },
    {
      field: 'firstName',
      headerName: 'First Name',
      flex: 1,
      headerClassName: 'bg-cyan-600 text-white',
      align: 'center', // This will center the cell content
      headerAlign: 'center',
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      flex: 1,
      sortable: true,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'position',
      headerName: 'Position',
      width: 200,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'isActive',
      headerName: 'User Status',
      maxWidth: 200,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      sortable: true,
      headerClassName: 'bg-cyan-600 text-white',
      renderCell: (params) => {
        return (
          <>
            <Typography className={params.row.isActive ? 'text-green-600' : 'text-red-600'} variant='body2'>
              {params.row.isActive ? 'Active' : 'Inactive'}
            </Typography>
          </>
        )
      }
    }
  ];
  if (facultyPosition === "Department Chair") {
    facultyColumns.push({
      field: 'actions',
      headerName: 'Actions',
      align: 'center',
      flex: 1,
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white',
      renderCell: (params) => {
        const faculty = params.row;
        return (
          <Box>
            <>
              <Button
                onClick={() => {
                  setIsOpenStatusDialog(prev => !prev);
                  setSelectedRow(faculty);
                }}
              >
                <Typography
                  variant="caption"
                  className={params.row.isActive ? 'text-blue-600' : 'text-red-600'}
                >
                  Set To {faculty.isActive ? 'INACTIVE' : 'ACTIVE'}
                </Typography>
              </Button>
              <Tooltip title='Edit Details'>
                <IconButton
                  onClick={() => {
                    setSelectedRow(faculty);
                    setIsOpenUserDetails(true);
                  }}
                  >
                  <ModeOutlined color='warning' fontSize='small' />
                </IconButton>
              </Tooltip>
            </>
          </Box>
        );
      }
    });
  }


  const studentColumns = [
    {
      field: 'idNumber', headerName: 'ID Number', maxWidth: 100, headerClassName: 'bg-cyan-600 text-white', align: 'center', // This will center the cell content: ;
      headerAlign: 'center',
    },
    {
      field: 'firstName',
      headerName: 'First Name',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      flex: 1,
      sortable: true,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'program',
      headerName: 'Program',
      maxWidth: 100,
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'effectiveYear',
      headerName: 'Effective Year',
      maxWidth: 100,
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'yearLevel',
      headerName: 'Year Level',
      maxWidth: 100,
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'isActive',
      headerName: 'User Status',
      maxWidth: 100,
      align: 'center',
      sortable: true,
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white',
      renderCell: (params) => {
        return (
          <>
            <Typography className={params.row.isActive ? 'text-green-600' : 'text-red-600'} variant='body2'>
              {params.row.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Typography>
          </>
        )
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white',
      renderCell: (params) => {
        const student = params.row;
        return (
          <>

            <Button onClick={() => {
              setIsOpenStatusDialog(prev => !prev);
              setSelectedRow(student)
            }
            }>
              <Typography variant='caption' className={`${student.isActive ? 'text-red-600' : 'text-blue-600'}`}>
                Set To {student.isActive ? 'Inactive' : 'Active'}
              </Typography>
            </Button>

            <Tooltip title='Edit Details'>
              <IconButton
                onClick={() => {
                  setSelectedRow(student)
                  setIsOpenUserDetails(true);
                }}
              >
                <ModeOutlined color='warning' fontSize='small' />
              </IconButton>
            </Tooltip>
          </>
        )
      }
    }
  ];

  const handleChange = (event, newValue) => {
    setValueTab(newValue);
  }

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getStudents();

      const rows = response.data?.users.map(user => ({
        id: user._id,
        idNumber: user.idNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        program: user.program,
        yearLevel: user.yearLevel,
        effectiveYear: user.effectiveYear,
        userType: user.user_type,
        isActive: user.isActive
      }))

      setStudentRows(rows);
      setIsLoading(false)

    } catch (error) {
      console.log(error)
    }
  }, []);

  const fetchFaculty = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getFaculties();
      const rows = response.data?.users.map(user => ({
        id: user._id,
        idNumber: user.idNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        position: user.position,
        userType: user.user_type,
        isActive: user.isActive
      }))

      setFacultyRows(rows);
      setIsLoading(false)

    } catch (error) {
      console.log(error)
    }
  }, []);

  useEffect(() => {

    const init = async () => {
      const user = await getUser()
      setUser(user)
      setFacultyPosition(user.position)
    }

    init()
    fetchStudents();
    fetchFaculty();
  }, []);

  useEffect(() => {
    if (selectedRow) {
      setValue('idNumber', selectedRow.idNumber);
      setValue('firstName', selectedRow.firstName);
      setValue('lastName', selectedRow.lastName);
      setValue('email', selectedRow.email);
      setValue('position', selectedRow.position);
      setValue('program', selectedRow.program);
      setValue('yearLevel', selectedRow.yearLevel);
    }
  }, [selectedRow]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="w-full">
        <Grid container spacing={2}>
          <Grid item xs={9}>
            <Typography className='text-cyan-600 font-bold text-lg'>
              All Users
            </Typography>
            <Typography className='text-gray-600 font-semibold '>
              Manage users and their roles
            </Typography>

          </Grid>
        </Grid>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={valueTab} onChange={handleChange} aria-label="user tabs">
              <Tab label="Faculty Users" {...a11yProps(0)} />
              <Tab label="Student Users" {...a11yProps(1)} />
            </Tabs>
          </Box>
          <CustomTabPanel value={valueTab} index={0}>
            <Box className='flex justify-end'>
            {facultyPosition === 'Department Chair' && (
             
                <Button
                  variant='contained'
                  className='bg-cyan-600 text-white hover:bg-cyan-700'
                  onClick={() => setAddUserDialog(true)}
                  startIcon={<Person />}
                >
                  Add Faculty User
                </Button>
              )}
            </Box>
            <Table rows={facultyRows} columns={facultyColumns} isLoading={isLoading} />
          </CustomTabPanel>
          <CustomTabPanel value={valueTab} index={1}>
            <Box className='flex justify-end'>
            {facultyPosition === 'Department Chair' && (
              <Button
                variant='contained'
                className='bg-cyan-600 text-white hover:bg-cyan-700'
                onClick={() => setImportUsers(true)}
                startIcon={<ImportContactsIcon />}
                sx={{
                  width: 'auto',
                  '@media (max-width: 500px)': {
                    width: '40%',
                    marginBottom: '1.5em'
                  }
                }}
              >
                Import Student Users
              </Button>
               )}
            </Box>
            <Table rows={studentRows} columns={studentColumns} isLoading={isLoading} />
          </CustomTabPanel>
        </Box>


        <Dialog
          maxWidth='sm'
          fullWidth
          open={importUsers}
          onClose={() => setImportUsers(false)}
        >
          <DialogTitle>
            <Typography className='text-cyan-600 font-bold text-lg'>
              Import Users
            </Typography>
            <Typography className='text-gray-600'>
              For importing student users
            </Typography>
          </DialogTitle>
          <DialogContent>
            Please upload a file of '.xlsx' format from ISMIS.
            <br /><br />
            <u className='cursor-pointer text-cyan-600' onClick={toggleImageModal}>click me</u> for your reference
          </DialogContent>
          <form onSubmit={handleSubmit(handleFileUpload)}>
            <DialogContent>
              <div className='flex flex-col justify-center items-center'>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <Controller
                        name='semester'
                        control={control}
                        rules={{
                          required: 'This field is required',
                        }}
                        render={({ field: { onChange, value } }) => (
                          [
                            <Autocomplete
                              value={value}
                              freeSolo
                              onChange={(event, newValue) => {
                                onChange(newValue);
                              }}
                              options={semesters}
                              getOptionLabel={(option) => option}
                              renderInput={(params) => <TextField {...params} label="Select Semester" />}
                            />
                          ]
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>

                    <FormControl fullWidth>
                      <Controller
                        name='year'
                        control={control}
                        rules={{
                          required: 'School Year is required',
                        }}
                        render={({ field: { value, onChange } }) => (
                          <>
                            <DatePicker
                              views={['year']}
                              label='School Year'
                              value={value}
                              onChange={onChange}
                              error={Boolean(errors.schoolYear)}
                              inputFormat='YYYY'
                            />
                          </>
                        )}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
                <FormControl>
                  <div
                    {...getRootProps()}
                    className={`w-full h-28 border-2 border-dashed border-gray-400 rounded-md flex justify-center items-center space-x-6 cursor-pointer p-4 mt-3 ${fileName ? 'text-cyan-600' : 'text-gray-400'
                      } hover:text-gray-500 transition duration-300 ease-in-out`}
                  >
                    <input name='file' {...getInputProps()} />
                    <MdCloudUpload className='text-[4em]' />
                    <Typography variant='caption'>{fileName ? fileName : ' Drag and drop file or select from your device'}</Typography>
                  </div>
                </FormControl>

              </div>
            </DialogContent>
            <DialogActions >
              <Button variant='outlined' onClick={() => setImportUsers(false)}>Cancel</Button>
              <Button variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" type="submit">Submit Data</Button>
            </DialogActions>
          </form>
          {
            isSubmitting && (
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
                      Importing user data.. may take a while.
                    </Typography>
                  </div>
                </Backdrop>
              </div>
            )
          }
        </Dialog>

        <Dialog
          open={viewImageModal}
          onClose={toggleImageModal}
          fullWidth
          maxWidth="md"
        >
          <DialogContent>
            <p> Spreadsheet sample: </p>
            <img src="/images/instruction.png" alt="Instructions" style={{ width: '100%' }} />
            <b> This is the data the system will accept and must be in spreadsheet (.xlsx) format </b> <br />
          <p>   "Academic Term & Year" should be the basis for selection in ["Select Semester", "School Year"] Fields before importing new student users </p>
          </DialogContent>
        </Dialog>

        <Dialog
          maxWidth='sm'
          open={isOpenUserDetails}
          onClose={() => setIsOpenUserDetails(false)}
        >
          <DialogTitle>
            User Details
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>

          <Grid container spacing={2} p={2}>
            {
              selectedRow?.userType === 'student' &&
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Controller
                    name="idNumber"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        label="ID Number"
                        variant='outlined'
                        id="id-number"
                        name="idNumber"
                        value={value}
                        onChange={onChange}
                        aria-describedby='id-number'
                      />
                    )}
                  />
                </FormControl>
              </Grid>
            }
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label="First Name"
                      variant='outlined'
                      id="first-name"
                      name="firstName"
                      value={value}
                      onChange={onChange}
                      aria-describedby='first-name'
                    />
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label="Last Name"
                      variant='outlined'
                      id="last-name"
                      name="lastName"
                      value={value}
                      onChange={onChange}
                      aria-describedby="last-name"
                    />
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name="email"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label="Email"
                      type="email"
                      variant='outlined'
                      id="email"
                      name="email"
                      value={value}
                      onChange={onChange}
                      aria-describedby="email"
                    />
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
                <Grid container spacing={2}>
                  {
                    selectedRow?.userType === 'student' && (
                      <>
                        <Grid item xs={12}>
                          <FormControl variant="outlined" fullWidth>
                            <Controller
                              name="yearLevel"
                              control={control}
                              render={({ field: { value, onChange } }) => (

                            <TextField
                              label="Year Level"
                              id="year-level"
                              aria-describedby="year-level"
                              value={value}
                              onChange={onChange}
                            />
                            )}
                            />
                            {errors.yearLevel &&
                              <FormHelperText id="year-level-error-text">This field is required</FormHelperText>
                            }
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl variant="outlined" fullWidth>
                            <Controller
                              name="program"
                              control={control}
                              render={({ field: { value, onChange } }) => (
                                <>
                                  <InputLabel id="program">Program</InputLabel>
                                  <Select

                                    id="program"
                                    label="Program"
                                    value={value}
                                    onChange={onChange}

                                    error={Boolean(errors.program)}
                                  >
                                    <MenuItem value={'BS IT'}>BS IT</MenuItem>
                                    <MenuItem value={'BS CS'}>BS CS</MenuItem>
                                    <MenuItem value={'BS IS'}>BS IS</MenuItem>
                                    {/* Add more MenuItem components as needed */}
                                  </Select>
                                </>
                              )}
                            />
                            {errors.program &&
                              <FormHelperText id="program-error-text">This field is required</FormHelperText>
                            }
                          </FormControl>
                        </Grid>

                      </>
                    )
                  }
                  {
                    selectedRow?.userType === 'faculty' && (

                      <Grid item xs={12}>
                        <FormControl variant="outlined" fullWidth>
                          <Controller
                            name="position"
                            control={control}
                            /* defaultValue={selectedRow.position} */
                            render={({ field: { value, onChange } }) => (
                              <>
                                <InputLabel id="position">Position</InputLabel>
                                <Select
                                  id="position"
                                  label="Position"
                                  value={value}
                                  onChange={onChange}
                                  error={Boolean(errors.position)}
                                >
                                  {/* <MenuItem value={'Faculty'}>Faculty</MenuItem> */}
                                  {/* <MenuItem value={'Department Chair'}>Department Chair</MenuItem> */}
                                  <MenuItem value={'CS Coordinator'}>CS Coordinator</MenuItem>
                                  <MenuItem value={'IT Coordinator'}>IT Coordinator</MenuItem>
                                  <MenuItem value={'IS Coordinator'}>IS Coordinator</MenuItem>
                                  <MenuItem value={'OJT Cordinator'}>OJT Coordinator</MenuItem>
                                </Select>
                                {value === 'Department Chair' && selectedRow?.position !== 'Department Chair' && (
                                  <FormHelperText id="program-error-text">
                                    Department Chair is already assigned to a different user.
                                  </FormHelperText>
                                )}
                              </>
                            )}
                          />
                          {
                            errors.position &&
                            (<FormHelperText id="position-error-text">This field is required</FormHelperText>)
                          }
                        </FormControl>
                      </Grid>
                    )

                  }
                  <Grid item xs={6}>
                    <Button fullWidth variant='outlined' color='inherit' onClick={() => setIsOpenUserDetails(false)}>Cancel</Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant='contained'
                      className="bg-cyan-600 text-white hover:bg-cyan-700"
                      disabled={!isValid}// Disable the button if form is not valid
                      type='submit' // Change type to 'button' to prevent form submission
                    >
                      Save
                    </Button>
                  </Grid>
                </Grid>
            </Grid>
          </Grid>
              </form>
        </Dialog>

        <Dialog
          open={isOpenStatusDialog}
          onClose={() => setIsOpenStatusDialog(false)}
          maxWidth='xs'
        >
          <Box className='p-2'>
            <DialogTitle>
              Are you sure you want to set this user's status to {selectedRow?.isActive ? 'INACTIVE' : 'ACTIVE'}?
            </DialogTitle>
            <DialogActions >
              <Button variant='outlined' onClick={() => setIsOpenStatusDialog(false)}>Cancel</Button>
              <Button variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={handleStatusUpdate}>Confirm</Button>
            </DialogActions>
          </Box>
        </Dialog>

        <Dialog
          maxWidth='sm'
          open={addUserDialog}
          onClose={() => setAddUserDialog(false)}
        >
          <DialogTitle>
            Add Faculty User
          </DialogTitle>
          <Grid container spacing={2} p={2} component='form' onSubmit={handleSubmit(addFacultyUser)}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name='firstName'
                  control={control}
                  defaultValue=''
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label="First Name"
                      variant='outlined'
                      id="first-name"
                      placeholder="Enter first name"
                      value={value}
                      onChange={onChange}
                      aria-describedby='first-name'
                    />
                  )}
                />
                {errors.firstName &&
                  <FormHelperText id="first-name-error-text">This field is required</FormHelperText>
                }
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name='lastName'
                  control={control}
                  defaultValue=''
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label="Last Name"
                      variant='outlined'
                      id="last-name"
                      placeholder="Enter last name"
                      value={value}
                      onChange={onChange}
                      aria-describedby="last-name"
                    />
                  )}
                />
                {errors.lastName &&
                  <FormHelperText id="last-name-error-text">This field is required</FormHelperText>
                }
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name='email'
                  control={control}
                  defaultValue=''
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label="Email"
                      type="email"
                      variant='outlined'
                      id="email"
                      placeholder="Enter email"
                      value={value}
                      onChange={onChange}
                      aria-describedby="email"
                    />
                  )}
                />
                {errors.email &&
                  <FormHelperText id="email-error-text">This field is required</FormHelperText>
                }
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl variant="outlined" fullWidth>
                <Controller
                  name="position"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <>
                      <InputLabel id="position">Position</InputLabel>
                      <Select
                        id="position"
                        label="Position"
                        value={value}
                        onChange={onChange}
                        error={Boolean(errors.position)}
                      >
                        <MenuItem value={'Department Chair'}>Department Chair</MenuItem>
                        <MenuItem value={'CS Coordinator'}>CS Coordinator</MenuItem>
                        <MenuItem value={'IT Coordinator'}>IT Coordinator</MenuItem>
                        <MenuItem value={'IS Coordinator'}>IS Coordinator</MenuItem>
                        {/* <MenuItem value={'MATH Coordinator'}>MATH Coordinator</MenuItem> */}
                        <MenuItem value={'OJT Coordinator'}>OJT Coordinator</MenuItem>
                      </Select>
                    </>
                  )}
                />
                {
                  errors.position &&
                  (<FormHelperText id="position-error-text">This field is required</FormHelperText>)
                }
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <Button fullWidth variant='outlined' color='inherit' onClick={() => setAddUserDialog(false)}>Cancel</Button>
            </Grid>
            <Grid item xs={6}>
              <Button fullWidth variant='contained' className="bg-cyan-600 text-white hover:bg-cyan-700" disabled={!isValid} type='submit'>Save</Button>
            </Grid>
          </Grid>
        </Dialog>

      </div>
    </LocalizationProvider>
  )
}

export default ManageUsers