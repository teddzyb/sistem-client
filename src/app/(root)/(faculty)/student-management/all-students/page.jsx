'use client'
import { adminPageClient, getUser, loginIsRequiredClient } from '@/src/app/lib/loginClient';
import api from "@/src/common/api";
import Table from "@/src/components/shared/Table";
import { IconButton, Tooltip, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AiOutlineEye } from "react-icons/ai";

const AllStudents = () => {
  loginIsRequiredClient()
  adminPageClient()

  const [studentRows, setStudentRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [program, setProgram] = useState('')
  const router = useRouter()

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getStudents();

      const rows = response?.data?.users.map(user => ({
        userId: user._id,
        id: user.idNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        program: user.program,
        effectiveYear: user.effectiveYear,
        yearLevel: user.yearLevel,
        userType: user.user_type,
        isActive: user.isActive
      }))
      setStudentRows(rows)
      setIsLoading(false)

    } catch (error) {
      console.log(error)
    }
  }, []);

  const fetchStudentByProgram = useCallback(async (program) => {
    try {
      setIsLoading(true)
      const response = await api.getStudentsByProgram(program);

      const rows = response?.data?.students.map(user => ({
        userId: user._id,
        id: user.idNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        program: user.program,
        effectiveYear: user.effectiveYear,
        yearLevel: user.yearLevel,
        userType: user.user_type,
        isActive: user.isActive
      }))
      setStudentRows(rows)
      setIsLoading(false)

    } catch (error) {
      console.log(error)
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const user = await getUser()

    if (user.position.includes('Coordinator')) {
      const program = user.position === 'IT Coordinator' ? 'BS IT' : user.position === 'CS Coordinator' ? 'BS CS' : 'BS IS'
      setProgram(program)
      fetchStudentByProgram(program)
    } else {
      fetchStudents();
    }
  }
    init()

  }, []);

  const studentColumns = [
    {
      field: 'id', headerName: 'ID Number', flex: 1, headerClassName: 'bg-cyan-600 text-white', align: 'center', // This will center the cell content
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
              {params.row.isActive ? 'Active' : 'Inactive'}
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
            <Tooltip title='View Details'>
              <IconButton
                onClick={() => {
                  router.push(`/student-management/all-students/${student.userId}`)
                }}
              >
                <AiOutlineEye className='text-green-600'/>
              </IconButton>
            </Tooltip>
          </>
        )
      }
    }
  ];

  return (
    <div className="w-full">
      <Typography className='text-cyan-600 font-bold text-lg'>
        All {program} Students
      </Typography>
      <Typography className='text-gray-600 font-bold '>
        List of all {program} students
      </Typography>
      <Table rows={studentRows} columns={studentColumns} isLoading={isLoading} />
    </div>
  )
}

export default AllStudents