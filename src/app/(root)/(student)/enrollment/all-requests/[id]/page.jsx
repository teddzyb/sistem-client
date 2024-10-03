'use client'

import { loginIsRequiredClient } from '@/src/app/lib/loginClient'
import api from "@/src/common/api"
import { ArrowBackOutlined, Close, FileUploadOutlined } from "@mui/icons-material"
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Tooltip, Typography } from "@mui/material"
import moment from "moment"
import { useRouter } from "next/router"
import { useCallback, useEffect, useRef, useState } from "react"
import { MdPictureAsPdf } from "react-icons/md"
import { SiMicrosoftword } from "react-icons/si"
import ImageIcon from '@mui/icons-material/Image'
import toast from "react-hot-toast"
import { getDownloadURL, ref, uploadBytes } from "@firebase/storage"
import { storage } from "@/src/common/firebaseConfig"
import GradesTable from "@/src/components/shared/GradesTable"

const SpecialRequestDetails = () => {
  loginIsRequiredClient()

  const router = useRouter()
  const params = router.query.id

  const [id, setId] = useState(params)
  const [specialRequest, setSpecialRequest] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isFileOpen, setIsFileOpen] = useState(false)
  const [viewFile, setViewFile] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [rows, setRows] = useState([])
  const [accreditedCourses, setAccreditedCourses] = useState([])
  const inputRef = useRef(null);
  const [gradeDialog, setGradeDialog] = useState(false);
  const [remarks, setRemarks] = useState([])


  const fetchSpecialRequest = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getSpecialRequest(id)
      setSpecialRequest(response.data?.specialRequest)
      setIsLoading(false)
      setId(params)
      setRemarks(response.data?.specialRequest.remarks)

    } catch (error) {
      console.error('Error fetching special request:', error.message);
      throw error;
    }
  }, [])


  useEffect(() => {
    fetchSpecialRequest()
  }, [])

  const isImage = (selectedFiles) => {
    const imageExtensions = ['jpg', 'jpeg', 'png'];
    const fileExtend = selectedFiles?.split('.').pop().toLowerCase();
    return imageExtensions.includes(fileExtend);
  };

  const handleCancelRequest = async () => {
    try {
      const formData = {
        isCancelled: 'Cancellation Pending'
      }

      const response = await api.cancelSpecialRequest(id, formData)

      if (response.status === 200) {
        toast.success('Successfully cancelled request!', {
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
      setIsDialogOpen(false)

    } catch (error) {
      console.log(error)
    }
  }
  const handleOpenDialog = () => {
    setGradeDialog(true);
  };
  const handleCloseDialog = () => {
    setGradeDialog(false);
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

    const fileToRemove = selectedFiles[index];

    const newFiles = [...selectedFiles];
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
      <Typography className='text-teal-600 font-bold text-lg'>
        <IconButton onClick={() => router.back()}>
          <ArrowBackOutlined />
        </IconButton>
        Special Request Application Details
      </Typography>
      <Grid container spacing={2} p={2}>
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography className='text-gray-500 font-bold '>
                Concern:
              </Typography>
              <Typography className='text-gray-600 font-bold '>
                {specialRequest?.concern?.requestTitle}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              {Array.isArray(specialRequest?.coursesAssociated) && specialRequest?.coursesAssociated.length > 0 && specialRequest?.coursesAssociated[0]?.course &&
                <>
                  <Typography className='text-gray-500 font-bold '>
                    Associated Courses (if applicable):
                  </Typography>
                  <Typography className='text-gray-600 font-bold '>

                    {specialRequest?.coursesAssociated[0]?.course} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; {specialRequest?.coursesAssociated[1]?.course}
                  </Typography>
                </>
              }
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography className='text-gray-500 font-bold '>
                Date Created:
              </Typography>
              <Typography className='text-gray-600 font-bold '>
                {moment(specialRequest?.dateCreated).format('ll')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography className='text-gray-500 font-bold '>
                Reason:
              </Typography>
              <Typography className='text-gray-600 font-bold '>
                {specialRequest?.reason}
              </Typography>
            </Grid>
          </Grid>
          <Divider className="my-4" />
          <Grid container spacing={2}>
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
                              <Typography className='text-green-600 font-bold '>
                                Endorsed by {specialRequest.statusTrail.coordinatorApproval.approvedBy.firstName} {specialRequest.statusTrail.coordinatorApproval.approvedBy.lastName}&nbsp; -&nbsp;{
                                  moment(specialRequest.statusTrail.coordinatorApproval.dateApproved).format('ll')}
                              </Typography>
                              :
                              <Typography className='text-red-600 font-bold '>
                                Rejected by {specialRequest.statusTrail.coordinatorApproval.approvedBy.firstName} {specialRequest.statusTrail.coordinatorApproval.approvedBy.lastName}&nbsp; -&nbsp;{
                                  moment(specialRequest.statusTrail.coordinatorApproval.dateApproved).format('ll')}
                              </Typography>
                          )
                      )
                  )
              }
              {
                specialRequest.statusTrail?.coordinatorApproval?.isApproved && specialRequest.statusTrail.chairApproval.dateApproved && (specialRequest.statusTrail?.chairApproval.isApproved ?
                  <Typography className='text-green-600 font-bold '>
                    Approved by Department Chair&nbsp; -&nbsp;{
                      moment(specialRequest.statusTrail?.chairApproval.dateApproved).format('ll')}
                  </Typography>
                  :
                  <Typography className='text-red-600 font-bold '>
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
                      {remark.createdBy.firstName} {remark.createdBy.lastName}                                     </Typography>

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
          (!specialRequest.statusTrail?.chairApproval.dateApproved ||
            !specialRequest.statusTrail?.isCancelled === 'Cancelled') &&
          <Grid item xs={12} md={3}>
            <Typography className="text-teal-600 font-bold  mb-2">
              Options:
            </Typography>
            <Button
              fullWidth
              size="small"
              variant="contained"
              color="warning"
              className="justify-self-center self-center"
              onClick={() => setIsDialogOpen(true)}
            >
              Withdraw Request
            </Button>
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
                    variant="outlined"
                    onClick={() => setSelectedFiles([])}
                  >
                    Cancel
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    className="bg-teal-600 text-white hover:bg-teal-700 transition duration-300 ease-in-out"
                    onClick={handleUpdateRequest}
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
          <Typography className="text-teal-600 font-bold text-lg">Courses Summary</Typography>
          <Typography className="text-gray-600  font-semibold text-sm">List of courses the student has passed or failed</Typography>
        </DialogTitle>
        <DialogContent>
          <GradesTable rows={rows} accreditedCourses={accreditedCourses} />
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
        <DialogContent className="p-5 w-full">
          {
            isImage(viewFile?.file.filePath) ?
              <img src={viewFile?.file.fileURL} alt="" style={{ width: '300px', height: '600px' }} />
              :
              <iframe src={viewFile?.file.fileURL} className='w-full h-[90vh]' />
          }
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDialogOpen}
        onClick={() => setIsDialogOpen(false)}
        maxWidth='xs'
        fullWidth
      >
        <Box className='p-2'>
          <DialogTitle>
            Are you sure you want to withdraw your request?
          </DialogTitle>
          <DialogActions>
            <Button
              variant="outlined"
              // color="inherit
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              className="bg-teal-600 text-white hover:bg-teal-700 transition duration-300 ease-in-out"
              onClick={handleCancelRequest}
            >
              Confirm
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

    </div>
  )
}

export default SpecialRequestDetails
