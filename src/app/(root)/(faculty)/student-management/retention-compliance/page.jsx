'use client'
import { adminPageClient, loginIsRequiredClient } from '@/src/app/lib/loginClient';
import api from "@/src/common/api";
import Table from "@/src/components/shared/Table";
import { Box, Button, Dialog, DialogActions, DialogTitle, IconButton, Tooltip, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineEye } from "react-icons/ai";

const RetentionCompliance = () => {
  loginIsRequiredClient()
  adminPageClient()


  const [studentRows, setStudentRows] = useState([]);
  const [selectedRow, selectRow] = useState({})
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenStatusDialog, setIsOpenStatusDialog] = useState(false)
  const router = useRouter();

  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
  try{
    const response = await api.getRetainedStudents();
    const rows = []
    response.data?.users?.forEach(user => {
      rows.push({
        userId: user._id,
        id: user.idNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        program: user.program,
        yearLevel: user.yearLevel,
        userType: user.user_type,
        isActive: user.isActive,
        isRetained: user.isRetained,
        course: user.retentionCourse,
      })
    }  
)
    setStudentRows(rows);
    setIsLoading(false)
  }
  catch(error){
    console.log(error)
  }
  }, []);

  const handleAllowAccess = async () => {
    setIsLoading(true)
    try {
      const response = await api.allowStudentAccess(selectedRow.id);
      if (response.status === 200) {
        fetchStudents();
        setIsOpenStatusDialog(prev => !prev);
        toast.success('Access allowed successfully',
          {
            duration: 4000,
            position: 'bottom-right',
            style: {
              background: '#4caf50',
              color: '#fff',
            }
          }
        )
      } else {
        toast.error('An error occurred while allowing access',
          {
            duration: 4000,
            position: 'bottom-right',
            style: {
              background: '#f44336',
              color: '#fff',
            }
          }
        )
      }

      setIsLoading(false)
    } catch (error) {
      console.log(error)
    }

  }

  useEffect(() => {
    fetchStudents();
  }, []);

  const studentColumns = [
    {
      field: 'id', headerName: 'ID Number', flex: 1,
      headerClassName: 'bg-cyan-600 text-white', align: 'center', // This will center the cell content
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
      field: 'yearLevel',
      headerName: 'Year Level',
      maxWidth: 100,
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
    },
    {
      field: 'course',
      headerName: 'Reason for Retention',
      flex: 1,
      align: 'center', // This will center the cell content
      headerAlign: 'center',
      headerClassName: 'bg-cyan-600 text-white'
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
          <Box className='flex items-center justify-center space-x-3'>

            <Button
              onClick={() => {
                setIsOpenStatusDialog(prev => !prev);
                selectRow(student)
              }}
            >
              <Typography variant='caption' className="hover:underline">
                Allow Access
              </Typography>
            </Button>
            <Tooltip title='View Details'>
              <IconButton
                onClick={() => {
                  router.push(`/student-management/all-students/${student.userId}`)
                }}
              >
                <AiOutlineEye className='text-green-600' />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    }
  ];

  return (
    <div className="w-full">
      <Typography className='text-cyan-600 font-bold text-lg'>
        Students for Retention Compliance
      </Typography>
      <Typography className='text-gray-600 font-bold '>
        List of all students for retention compliance
      </Typography>
      <Table rows={studentRows} columns={studentColumns} isLoading={isLoading} />
      <Dialog
        open={isOpenStatusDialog}
        onClose={() => setIsOpenStatusDialog(prev => !prev)}
        maxWidth='sm'
      >
        <DialogTitle>
          Are you sure you want to allow access to {selectedRow.firstName} {selectedRow.lastName}?
        </DialogTitle>
        <DialogActions>
          <Button
            variant='outlined'
            onClick={() => setIsOpenStatusDialog(prev => !prev)}>Cancel</Button>
          <Button
            variant='contained'
            className="bg-cyan-600 text-white"
            onClick={handleAllowAccess}>Allow Access</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default RetentionCompliance