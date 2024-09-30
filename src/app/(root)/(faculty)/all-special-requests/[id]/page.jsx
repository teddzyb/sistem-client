'use client'

import { adminPageClient, getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient'
import api from "@/src/common/api"
import { ArrowBackOutlined, Close, FileUploadOutlined } from "@mui/icons-material"
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, TextareaAutosize, Tooltip, Typography } from "@mui/material"
import moment from "moment"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { MdCloudUpload, MdPictureAsPdf } from "react-icons/md"
import { SiMicrosoftword } from "react-icons/si"
import ImageIcon from '@mui/icons-material/Image'
import toast from "react-hot-toast"
import { getDownloadURL, ref, uploadBytes } from "@firebase/storage"
import { storage } from "@/src/common/firebaseConfig"
import GradesTable from "@/src/components/shared/GradesTable"

const SpecialRequestDetails = () => {
    loginIsRequiredClient()
    adminPageClient()

    const params = useParams().id
    const router = useRouter()

    const [currentUser, setCurrentUser] = useState({})

    const [id, setId] = useState(params)
    const [specialRequest, setSpecialRequest] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [isFileOpen, setIsFileOpen] = useState(false)
    const [viewFile, setViewFile] = useState(null)
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [progressDialogOpen, setProgressDialogOpen] = useState(false)
    const [approveDialogOpen, setApproveDialogOpen] = useState(false)
    const [isApprove, setIsApprove] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [remarks, setRemarks] = useState([])
    const [note, setNote] = useState('')
    const [rows, setRows] = useState([])
    const [accreditedCourses, setAccreditedCourses] = useState([])
    const [studentProgram, setStudentProgram] = useState('')
    const inputRef = useRef(null);
    const [gradeDialog, setGradeDialog] = useState(false);

    const fetchSpecialRequest = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await api.getSpecialRequest(id)
           
            setSpecialRequest(response.data?.specialRequest)
            setIsLoading(false)
            setId(params)
            setRemarks(response.data?.specialRequest.remarks)

        } catch (error) {
            console.error(error);
        }
    }, [])

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
                finalGrade: course.finalGrade,
                verdict: course.verdict,
            });
            return acc;
        }, {});
    };


    const fetchStudentGrades = useCallback(async () => {
        try {
            setIsLoading(true)
            const responseSpecialReq = await api.getSpecialRequest(id)
            const response = await api.getGrades(responseSpecialReq.data?.specialRequest?.createdBy?.idNumber)
            const rows = []
            let index = 0;
            response?.data?.grade.courses.forEach((gradeInfo) => {
                rows.push({
                    id: index++,
                    courseCode: gradeInfo.courseCode,
                    description: gradeInfo.courseDesc,
                    semester: gradeInfo.semester,
                    finalGrade: gradeInfo.finalGrade,
                    verdict: gradeInfo.isPassed ? "PASSED" : "FAILED",
                })
            });
            const groupedCourses = groupCoursesByYearAndSemester(rows)
            setRows(groupedCourses)

            const accreditedCourses = response?.data?.grade.accreditedCourses
            setAccreditedCourses(accreditedCourses)

            setIsLoading(false)


        } catch (error) {
            console.error(error);
        }
    }, [])
    const fullProgramName = (program) => {
        switch (program?.replace(/\s/g, '')) {
            case 'BSIS':
                return 'BACHELOR OF SCIENCE IN INFORMATION SYSTEMS';
            case 'BSIT':
                return 'BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY';
            case 'BSCS':
                return 'BACHELOR OF SCIENCE IN COMPUTER SCIENCE';
            default:
                return 'NO USER PROGRAM';

        }
    }
    const fetchStudents = useCallback(async () => {
        setIsLoading(true)
        const responseSpecialReq = await api.getSpecialRequest(id)
        const response = await api.getByIdNumber(responseSpecialReq.data?.specialRequest?.createdBy?.idNumber);
        const userProgram = fullProgramName(response.data?.user?.program)
        setStudentProgram(userProgram)
        setIsLoading(false)
    })

    useEffect(() => {
        const init = async () => {
            const user = await getUser()

        setCurrentUser(user)
        fetchStudentGrades()
        fetchSpecialRequest()
        fetchStudents()
        }
        init()
    }, [])

    const handleAddNote = async () => {
        try {
            const formData = {
                notes: note,
                updatedBy: currentUser._id
            }

            const response = await api.updateSpecialRequest(id, formData)

            if (response.status === 200) {
                toast.success('Successfully added remarks!', {
                    position: 'bottom-right',
                    duration: 3000,
                    style: {
                        fontFamily: 'Source Sans Pro',
                        backgroundColor: '#4caf50',
                        color: '#fff',
                    }
                })
                fetchSpecialRequest()

            } else {
                toast.error('Something went wrong!', {
                    position: 'bottom-right',
                    duration: 3000,
                    style: {
                        fontFamily: 'Source Sans Pro',
                        backgroundColor: '#f44336',
                        color: '#fff',
                    }
                })
            }
            setNote('')

        } catch (error){
            console.log(error)
        }
    }

    const handleApprove = async () => {
        if (currentUser.position === 'Department Chair') {
            await handleChairApprove()
        } else {
            await handleCoordinatorApprove()
        }
        setApproveDialogOpen(false)
    }

    const handleCoordinatorApprove = async () => {
        const formData = {
            isApproved: isApprove,
            approvedBy: currentUser._id
        }

        const response = await api.coordinatorApproveSpecialRequest(id, formData)

        if (response.status === 200) {
            toast.success('Successfully updated request!', {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    fontFamily: 'Source Sans Pro',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                }
            })
            fetchSpecialRequest()

        } else {
            toast.error('Something went wrong!', {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    fontFamily: 'Source Sans Pro',
                    backgroundColor: '#f44336',
                    color: '#fff',
                }
            })
        }
    }

    const handleChairApprove = async () => {
        const formData = {
            isApproved: isApprove,
        }

        const response = await api.chairApproveSpecialRequest(id, formData)

        if (response.status === 200) {
            toast.success('Successfully updated request!', {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    fontFamily: 'Source Sans Pro',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                }
            })
            fetchSpecialRequest()
        } else {
            toast.error('Something went wrong!', {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    fontFamily: 'Source Sans Pro',
                    backgroundColor: '#f44336',
                    color: '#fff',
                }
            })
        }
    }

    const handleCancelRequest = async (cancel) => {
        let formData

        if (cancel) {
            formData = {
                isCancelled: 'Cancelled'
            }
        } else {
            formData = {
                isCancelled: 'Declined'
            }
        }

        const response = await api.cancelSpecialRequest(id, formData)

        if (response.status === 200) {
            toast.success('Successfully updated request!', {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    fontFamily: 'Source Sans Pro',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                }
            })
            fetchSpecialRequest()
        } else {
            toast.error('Something went wrong!', {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    fontFamily: 'Source Sans Pro',
                    backgroundColor: '#f44336',
                    color: '#fff',
                }
            })
        }
    }

    const handleSetReqInProgress = async () => {
        const formData = {
            inProgress: true,
            updatedBy: currentUser._id
        }

        const response = await api.setRequestInProgress(id, formData)

        if (response.status === 200) {
            toast.success('Successfully updated request!', {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    fontFamily: 'Source Sans Pro',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                }
            })
            fetchSpecialRequest()
        } else {
            toast.error('Something went wrong!', {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    fontFamily: 'Source Sans Pro',
                    backgroundColor: '#f44336',
                    color: '#fff',
                }
            })
        }
    }

    const isImage = (selectedFiles) => {
        const imageExtensions = ['jpg', 'jpeg', 'png'];
        const fileExtend = selectedFiles?.split('.').pop().toLowerCase();
        return imageExtensions.includes(fileExtend);
    };

    const getFileIcon = (selectedFiles) => {
        const fileExtend = selectedFiles?.split('.').pop().toLowerCase();
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
    const handleOpenDialog = () => {
        setGradeDialog(true);
    };

    const handleCloseDialog = () => {
        setGradeDialog(false);
    };

    const handleViewFile = (file) => {
        setIsFileOpen(true)
        setViewFile(file)
    }

    const onChooseFile = () => {
        inputRef.current.click();
        inputRef.current.value = '';
    };

    const handleFileChange = (event) => {
        const files = event.target.files;

        if (specialRequest.attachedFiles.length + selectedFiles.length + files.length > 5) {
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

        for (let a = 0; a < files.length; a++) {
            const file = files[a];
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

                return;
            }
        }
        setSelectedFiles([...selectedFiles, ...files]);
    }

    const handleRemoveFile = (index) => {

        const newFiles =  [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);

    };

    const handleUpdateRequest = async () => {
        const filesToUpload = await Promise.all(selectedFiles.map(file => handleUpload(file)));

        const formData = {
            attachedFiles: filesToUpload
        }

        const response = await api.updateSpecialRequest(id, formData)

        if (response.status === 200) {
            toast.success('Successfully updated request!', {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    fontFamily: 'Source Sans Pro',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                }
            })
            fetchSpecialRequest()
            setSelectedFiles([])

        } else {
            toast.error('Something went wrong!', {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    fontFamily: 'Source Sans Pro',
                    backgroundColor: '#f44336',
                    color: '#fff',
                }
            })
        }
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

    if (isLoading) {
        return (
            <div className="w-full flex justify-center items-center">
                <CircularProgress />
            </div>
        )
    }



    return (
        <div className="w-full">
            <Typography className='text-cyan-600 font-bold text-lg'>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackOutlined />
                </IconButton>
                Special Request Application Details
            </Typography>
            <Grid container spacing={2} p={2}>
                <Grid item xs={12} md={9}>
                    <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                            <Typography className='text-gray-500 font-bold '>
                                Date Created:
                            </Typography>
                            <Typography className='text-gray-600 font-bold '>
                                {moment(specialRequest?.dateCreated).format('ll')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography className='text-gray-500 font-bold '>
                                Created By:
                            </Typography>
                            <Typography className='text-gray-600 font-bold '>
                              {specialRequest?.createdBy?.firstName} {specialRequest?.createdBy?.lastName}&nbsp;- 
                              &nbsp;{specialRequest?.createdBy?.program}&nbsp;{specialRequest?.createdBy?.yearLevel}
                            </Typography>
                        </Grid>
                            
                        <Grid item xs={12} md={6}>

                            {Array.isArray(specialRequest?.coursesAssociated) && specialRequest?.coursesAssociated.length > 0 && specialRequest?.coursesAssociated[0]?.course &&
                                <>
                            <Typography className='text-gray-500 font-bold '>
                                Associated Courses:
                            </Typography>
                            <Typography className='text-gray-600 font-bold '>
                                    <Typography className='text-gray-600 font-bold '>

                                        {specialRequest?.coursesAssociated[0]?.course} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; {specialRequest?.coursesAssociated[1]?.course}
                                    </Typography>
                                    
                            </Typography>
                            </>
                                }
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography className='text-gray-500 font-bold '>
                                Concern:
                            </Typography>
                            <Typography className='text-gray-600 font-bold '>
                                {specialRequest?.concern?.requestTitle}
                            </Typography>
                        </Grid>
                       
                        <Grid item xs={12} md={6}>
                            <Typography className='text-gray-500 font-bold '>
                                Reason:
                            </Typography>
                            <Typography className='text-gray-600 font-bold '>
                                {specialRequest?.reason}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid container spacing={2} mt={2}>
                        <Grid item xs={12} md={6}>
                            <Typography className='text-gray-500 font-bold '>
                                Status:
                            </Typography>
                            {
                                specialRequest?.statusTrail?.isCancelled != null ?
                                    <Typography className='text-red-600 font-bold '>
                                        {specialRequest?.statusTrail?.isCancelled}
                                    </Typography>
                                    :
                                    (
                                        specialRequest?.statusTrail?.inProgress ?
                                            <Typography className='text-yellow-500 font-bold '>
                                                In Progress
                                            </Typography>
                                            :
                                            (
                                                !specialRequest?.statusTrail?.coordinatorApproval?.approvedBy ?
                                                    <Typography className='text-gray-600 font-bold '>
                                                        Pending
                                                    </Typography>
                                                    :
                                                    (
                                                        specialRequest.statusTrail.coordinatorApproval.isApproved ?
                                                            <Typography className='text-green-600 font-bold'>
                                                                Endorsed by {specialRequest.statusTrail.coordinatorApproval.approvedBy.firstName} {specialRequest.statusTrail.coordinatorApproval.approvedBy.lastName}&nbsp; -&nbsp;{
                                                                    moment(specialRequest.statusTrail.coordinatorApproval.dateApproved).format('ll')}
                                                            </Typography>
                                                            :
                                                            <Typography className='text-red-600 font-bold'>
                                                                Rejected by {specialRequest.statusTrail.coordinatorApproval.approvedBy.firstName} {specialRequest.statusTrail.coordinatorApproval.approvedBy.lastName}&nbsp; -&nbsp;{
                                                                    moment(specialRequest.statusTrail.coordinatorApproval.dateApproved).format('ll')}
                                                            </Typography>
                                                    )
                                            )
                                    )
                            }
                            {
                                specialRequest.statusTrail?.chairApproval.dateApproved && (specialRequest.statusTrail?.chairApproval.isApproved ?
                                    <Typography className='text-green-600 font-bold'>
                                        Approved by Department Chair&nbsp; -&nbsp;{
                                            moment(specialRequest.statusTrail?.chairApproval.dateApproved).format('ll')}
                                    </Typography>
                                    :
                                    <Typography className='text-red-600 font-bold'>
                                        Rejected by Department Chair&nbsp; -&nbsp;{
                                            moment(specialRequest.statusTrail?.chairApproval.dateApproved).format('ll')}
                                    </Typography>
                                )
                            }
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography className='text-gray-500 font-bold '>
                                Remarks:
                            </Typography>

                            {remarks?.length > 0
                                ?
                                    remarks.map((remark, index) => (
                                        <>

                                            <Typography key={index} className='text-gray-600 font-bold '>
                                                {remark.remark} - {moment(remark.dateCreated).format('ll')}
                                            </Typography>
                                            <Typography key={index} className='text-gray-600 font-bold '>
                                                {remark.createdBy.firstName} {remark.createdBy.lastName}                             
                                            </Typography>

                                        </>
                                    ))
                                :
                                <Typography className='text-gray-400 font-bold '>
                                    No remarks for now
                                </Typography>
                            }

                        </Grid>
                    </Grid>

                    <Grid container spacing={2} mt={1}>
                        {
                            specialRequest?.attachedFiles?.length > 0 &&
                            <>
                        <Grid item xs={12}>
                            <Typography className="text-teal-600 font-bold mb-1">
                                Attached Files
                            </Typography>
                        </Grid>
                                {specialRequest?.attachedFiles?.map((item, index) => (
                                    <Grid item xs={6} md={4} key={index}>
                                        <Tooltip title='View File'>
                                            <Box
                                                className='flex flex-col items-center justiy-center text-center p-4 border border-dashed rounded-md border-gray-600 bg-gray-100 cursor-pointer h-[5em] overflow-hidden'
                                                onClick={() => handleViewFile(item)}
                                            >
                                                <Box className='w-8 h-8 flex justify-center items-center'>
                                                    {getFileIcon(item.file.filePath)}
                                                </Box>
                                                <Box className='ml-2'>
                                                    <Typography
                                                        variant='caption'
                                                    >
                                                        {item.file.filePath?.split('/').pop().split('-').slice(0, -1).join('-')}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Tooltip>
                                    </Grid>
                                ))}
                            </>

            }
                    </Grid>
                </Grid>
                {
                    !specialRequest?.statusTrail?.chairApproval.dateApproved &&
                    <Grid item xs={12} md={3}>
                        <Typography className="text-cyan-600 font-bold  mb-5">
                            Options:
                        </Typography>
                        {
                            !specialRequest?.statusTrail?.coordinatorApproval?.approvedBy && currentUser.position === 'Department Chair' &&
                            <Typography className="text-gray-500  pb-5">
                                Waiting for Coordinator's Approval
                            </Typography>
                        }
                        {
                            !specialRequest?.statusTrail?.isCancelled &&
                            specialRequest?.statusTrail?.coordinatorApproval?.approvedBy && specialRequest?.statusTrail?.coordinatorApproval?.isApproved && currentUser.position === 'Department Chair' &&
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Button
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        onClick={() => { setApproveDialogOpen(true); setIsApprove(false) }}
                                    >
                                        Reject
                                    </Button>

                                </Grid>
                                <Grid item xs={6}>
                                    <Button
                                        fullWidth
                                        size="small"
                                        variant="contained"
                                        className="bg-cyan-600 text-white hover:bg-cyan-700 transition duration-300 ease-in-out"
                                        onClick={() => { setApproveDialogOpen(true); setIsApprove(true) }}
                                    >
                                        Approve
                                    </Button>
                                </Grid>
                            </Grid>
                        }
                        {
                            specialRequest?.statusTrail?.isCancelled === 'Cancellation Pending' &&
                            <Grid container spacing={2} boxShadow={2} p={2} className="bg-red-100">
                                <Grid item xs={12}>
                                    <Typography className="text-gray-700 font-bold text-center ">
                                        ⚠️ Student has requested to cancel this request
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} className="flex justify-center items-center">
                                    <Button
                                        size="small"
                                        variant="contained"
                                        className="bg-cyan-600 text-white hover:bg-cyan-700 transition duration-300 ease-in-out"
                                        onClick={() => setIsCancelDialogOpen(true)}

                                    >
                                        Approve
                                    </Button>
                                </Grid>
                            </Grid>
                        }
                        {
                            !specialRequest?.statusTrail?.isCancelled &&
                            !specialRequest?.statusTrail?.coordinatorApproval?.approvedBy && currentUser?.position?.includes('Coordinator') &&
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Button
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        onClick={() => { setApproveDialogOpen(true); setIsApprove(false) }}
                                    >
                                        Reject
                                    </Button>

                                </Grid>


                                <Grid item xs={6}>
                                    <Button
                                        fullWidth
                                        size="small"
                                        variant="contained"
                                        className="bg-cyan-600 text-white hover:bg-cyan-700 transition duration-300 ease-in-out"
                                        onClick={() => { setApproveDialogOpen(true); setIsApprove(true) }}
                                    >
                                        Approve
                                    </Button>
                                </Grid>
                                {
                                    !specialRequest?.statusTrail?.inProgress &&
                                    <Grid item xs={12}>
                                        <Button
                                            fullWidth
                                            size="small"
                                            variant="contained"
                                            color="warning"
                                            onClick={() => setProgressDialogOpen(true)}
                                        >
                                            Set In Progress
                                        </Button>
                                    </Grid>
                                }

                            </Grid>
                        }

                        <Divider className="mt-4" />
                        <Box
                            className='flex flex-col items-center justiy-center text-center mt-6 mb-5'
                        >
                            <TextareaAutosize
                                fullWidth
                                placeholder={note ? note : 'Add remarks here...'}
                                minRows={6}
                                className="w-full rounded-md mb-2"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            <Button
                                size="small"
                                variant="contained"
                                className="bg-cyan-600 text-white hover:bg-cyan-700 transition duration-300 ease-in-out"
                                onClick={handleAddNote}
                            >
                                Add Remarks
                            </Button>
                        </Box>
                        <Divider className="mb-8" />
                        {
                            selectedFiles.length > 0 &&
                            <Grid container spacing={2} mt={1}>
                                <Grid item xs={12}>
                                    <Grid container spacing={2}>
                                        {
                                            selectedFiles.map((file, index) => (
                                                <Grid item xs={6} key={index}>
                                                    <Box
                                                        className='flex flex-col items-center justiy-center text-center 
                                                        overflow-hidden
                                                        p-4 border border-dashed rounded-md border-gray-600 bg-gray-100 relative'
                                                    >
                                                        <Box className='w-8 h-8 flex justify-center items-center'>
                                                            {getFileIcon(file.name)}
                                                        </Box>
                                                        <Box className='ml-2'>
                                                            <Typography
                                                                variant="caption"
                                                            >
                                                                {file.name}
                                                            </Typography>
                                                        </Box>
                                                        <Close
                                                            className='absolute top-0 right-0'
                                                            cursor='pointer'
                                                            onClick={() => handleRemoveFile(index)}
                                                        />
                                                    </Box>
                                                </Grid>
                                            ))
                                        }
                                    </Grid>
                                </Grid>
                              
                                <Grid item xs={6}>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="contained"
                                                className="bg-cyan-600 text-white hover:bg-cyan-700 transition duration-300 ease-in-out"
                                                onClick={handleUpdateRequest}
                                                sx={{
                                                    marginLeft:'5vw'
                                                }}
                                            >
                                                Submit
                                            </Button>
                                </Grid>
                            </Grid>
                        }
                            <Box
                                component='form'
                                className='mt-5'
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />

                                <Button
                                    fullWidth
                                    size='small'
                                    onClick={onChooseFile}
                                    variant='contained'
                                    className='bg-teal-600 flex justify-center items-center space-x-4 text-white'
                                >
                                    <FileUploadOutlined />
                                    <Typography>Upload Files</Typography>
                                </Button>
                            </Box>
                    </Grid>
                }
            </Grid>
            <Dialog
                open={gradeDialog}
                onClose={handleCloseDialog}
                maxWidth='lg'
                fullWidth>
                <DialogTitle id="dialog-title">
                    <Typography className="text-cyan-600 font-bold text-lg">Courses Summary</Typography>
                    <Typography className="text-gray-600  font-semibold text-sm">List of courses the student has passed or failed</Typography>
                </DialogTitle>
                <DialogContent>
                    <GradesTable rows={rows} accreditedCourses={accreditedCourses}/>
                </DialogContent>
            </Dialog>
            <Dialog
                open={isFileOpen}
                onClose={() => setIsFileOpen(false)}
                maxWidth='md'
                fullWidth
            >
                <DialogTitle>
                    View File
                </DialogTitle>
                <DialogContent className="p-5">
                    {
                        isImage(viewFile?.file.filePath) ?
                            <img src={viewFile?.file.fileURL} alt="" className='w-full' />
                            :
                            <iframe src={viewFile?.file.fileURL} className='w-full h-[90vh]' />
                    }
                </DialogContent>
            </Dialog>

            <Dialog
                open={isCancelDialogOpen}
                onClick={() => setIsCancelDialogOpen(false)}
                maxWidth='xs'
                fullWidth
            >
                <Box className='p-2'>
                    <DialogTitle>
                        Are you sure you want to cancel this request?
                    </DialogTitle>
                    <DialogActions>
                        <Button
                            variant="outlined"
                            // color="inherit
                            onClick={() => setIsCancelDialogOpen(false)}
                        >
                            No
                        </Button>
                        <Button
                            variant="contained"
                            className="bg-cyan-600 text-white hover:bg-cyan-700 transition duration-300 ease-in-out"
                            onClick={() => handleCancelRequest(true)}
                        >
                            Yes
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog
                open={progressDialogOpen}
                onClick={() => setProgressDialogOpen(false)}
                maxWidth='xs'
                fullWidth
            >
                <Box className='p-2'>
                    <DialogTitle>
                        Are you sure you want to set this request to 'In Progress'?
                    </DialogTitle>
                    <DialogActions>
                        <Button
                            variant="outlined"
                            // color="inherit
                            onClick={() => setProgressDialogOpen(false)}
                        >
                            No
                        </Button>
                        <Button
                            variant="contained"
                            className="bg-cyan-600 text-white hover:bg-cyan-700 transition duration-300 ease-in-out"
                            onClick={handleSetReqInProgress}
                        >
                            Yes
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog
                open={approveDialogOpen}
                onClick={() => setApproveDialogOpen(false)}
                maxWidth='xs'
                fullWidth
            >
                <Box className='p-2'>
                    <DialogTitle>
                        Are you sure you want to {isApprove ? 'Approve' : 'Reject'} this request?
                    </DialogTitle>
                    <DialogActions>
                        <Button
                            variant="outlined"
                            // color="inherit
                            onClick={() => setApproveDialogOpen(false)}
                        >
                            No
                        </Button>
                        <Button
                            variant="contained"
                            className="bg-cyan-600 text-white hover:bg-cyan-700 transition duration-300 ease-in-out"
                            onClick={handleApprove}
                        >
                            Yes
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </div>
    )
}

export default SpecialRequestDetails