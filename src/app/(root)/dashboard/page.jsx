'use client'
import { useCallback, useEffect, useState } from "react";
import FacultyDashboard from "@/src/components/faculty/FacultyDashboard";
import StudentDashboard from "@/src/components/students/StudentDashboard";
import { Button, CircularProgress, Dialog, DialogActions, DialogTitle } from "@mui/material";
import api from "@/src/common/api";
import { getUser, loginIsRequiredClient } from "../../lib/loginClient";
import { getSession } from "next-auth/react";
import { authConfig } from "../../lib/auth";

const Dashboard = () => {
  loginIsRequiredClient()

  const [currentUser, setCurrentUser] = useState({})

  const [waitLists, setWaitLists] = useState([])

  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchWaitLists = useCallback(async (currentUser) => {
    const response = await api.getStudentWaitingList(currentUser._id)
    setWaitLists(response?.data?.petitions)
  }, [])

  useEffect(() => {
    const init = async () => {
      const user = await getUser()
      setCurrentUser(user)

      if (user) {
        if (user.user_type === 'student') {
          fetchWaitLists(user)
        }
      }

    }

    init()
    
  }, [])

  return (
    <>
      {

        currentUser && currentUser.user_type === 'faculty' ? (
          <>
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              maxWidth="sm"
              p={5}
            >
              <DialogTitle>
                No data available
              </DialogTitle>
              <DialogActions>
                <Button
                  onClick={() => setDialogOpen(false)}
                  color="primary"
                  variant="outlined"
                >
                  Close
                </Button>
              </DialogActions>
            </Dialog>
            <FacultyDashboard 
              currentUser={currentUser}
            />
          </>

        ) : (
          currentUser && currentUser.user_type === 'student' &&
          <StudentDashboard 
            user={currentUser}
            waitLists={waitLists}
          />
        )
      }
      
    </>
  )
}

export default Dashboard
