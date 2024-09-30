"use client";

import {
  AccountCircle,
  ExpandLess,
  ExpandMore,
  Notifications,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState, useEffect, useCallback } from "react";
import { getSession, signOut } from "next-auth/react";
import { authConfig } from "@/src/app/lib/auth";
import Link from "next/link";
import api from "@/src/common/api";
import "@fontsource/source-sans-pro";
import { useRouter } from "next/navigation";
import { getUser } from "@/src/app/lib/loginClient";

const Header = ({ openMenu, setOpenMenu }) => {
  const [auth, setAuth] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  // const [openMenu, setOpenMenu] = useState(false)
  const [menuData, setMenuData] = useState(null);
  const [expanded, setExpanded] = useState(-1);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [user, setUser] = useState(null);
  const [isRetained, setIsRetained] = useState(false);
  const router = useRouter();

  const handleCloseBackdrop = () => {
    setOpenBackdrop(false);
  };
  const handleOpenBackdrop = () => {
    setOpenBackdrop(true);
  };
  const handleChange = (index) => {
    setExpanded(expanded === index ? -1 : index);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    signOut(authConfig);
    // router.push('/auth/signin')
  };

  const toggleDrawer = () => {
    setOpenMenu(!openMenu);
  };

  const fetchData = async (userType) => {
    try {
      let response;

      if (userType === "student") {
        response = await fetch("/studentMenu.json");
      } else if (userType === "faculty") {
        response = await fetch("/facultyMenu.json");
      }

      const data = await response.json();
      setMenuData(data.menu);
    } catch (error) {
      console.error("Error fetching JSON:", error);
    }
  };

  const fetchNotifications = useCallback(async (id) => {
    try {

      const response = await api.getNotifications(id);
      if (response?.status === 200) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const handleReadNotification = async (notification) => {
    try {
      const id = user._id;

      const formData = {
        recipientID: id,
      };

      const response = await api.markNotificationRead(
        notification._id,
        formData
      );

      if (response?.status === 200) {
        fetchNotifications(id);
      }

    } catch (error) {
      console.log(error);
    }
  }
  const handleMarkAllAsRead = async () => {
    try {
      const id = user._id;
  
      const markAsReadPromises = [];
      notifications.forEach(notification => {
        const formData = {
          recipientID: id,
        };
        markAsReadPromises.push(api.markNotificationRead(notification._id, formData));
      });

      const responses = await Promise.all(markAsReadPromises);
      const allMarkedAsRead = responses.every(response => response?.status === 200);
      if (allMarkedAsRead) {
        fetchNotifications(id); 
      }
  
    } catch (error) {
      console.log(error);
    }
  }

  const handleClickNotification = (notification) => {

    const userType = user.user_type;

    if (userType === "student") {
      switch (notification.link) {
        case "special request":
          router.push(`/enrollment/all-requests/${notification.itemID}`);
          break;

        case "petition":
          router.push(
            `/enrollment/petitions-tutorials/${notification.itemID}`
          );
          break;
          case "study plan":
          router.push(
            `/study-plan`
          );
          break;
      }
    } else {
      switch (notification.link) {
        case "special request":
          router.push(`/all-special-requests/${notification.itemID}`);
          break;

        case "petition":
          router.push(`/petitions-tutorials-list/${notification.itemID}`);
          break;
      }
    }

  };

  useEffect(() => {
    const init = async () => {
      if (typeof window !== "undefined") {
        const user = await getUser();
        const session = await getSession(authConfig);
        const token = session?.expires
        const isExpired = new Date(token) < new Date();
        if (user && !isExpired) {
          setAuth(true);
          fetchData(user.user_type);
          fetchNotifications(user._id);
          setUser(user)

          if (user.user_type === "student") {
            if (!user.hasVerified) {
              router.push('/student-verification')
            }
          }

          setIsRetained(user.isRetained)

        } else {
          router.push("/auth/signin");
        }
      }
    };

    init();
  }, []);

  const list = () => (
    <Box
      sx={{ overflow: "hidden", border: "none !important" }}
      role="presentation"
      onKeyDown={toggleDrawer}
      className="flex flex-col justify-center"
    >
      <Typography
        style={{
          fontFamily: "Source Sans Pro",
          fontWeight: "bold",
          fontSize: "22px",
          marginTop: ".5em",
        }}
        className="text-center"
      >
        {" "}
        MENU{" "}
      </Typography>

      {menuData?.map((data, index) => (
        <List key={index}>
          <ListItem key={index} disablePadding divider className="w-full">
            {data.children ? (
              <div className="flex flex-col w-full">
                <ListItemButton onClick={() => handleChange(index)} sx={{ pl: 4 }}>
                  <ListItemText
                    primary={data.title}
                    primaryTypographyProps={{
                      fontWeight: "bold",
                      fontFamily: "Source Sans Pro",
                    }}
                  />
                  {expanded === index ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse
                  in={expanded === index}
                  timeout="auto"
                  unmountOnExit
                  className="w-full"
                >
                  {data.children.map((child, index) => (
                    <List component="div" disablePadding key={index}>
                      <Link href={child.link} className="no-underline">
                        <ListItemButton sx={{ pl: 5 }}>
                          <ListItemText
                            secondary={child.title}
                            secondaryTypographyProps={{
                              color: "#2888CD",
                              fontFamily: "Source Sans Pro",
                              // position: "relative",
                              // left: "30px",
                            }}
                            // sx={{
                            //   "@media (max-width: 480px)": {
                            //     marginLeft: "-25px",
                            //     marginTop: "0px",
                            //     borderRadius: "5px",
                            //     borderBottom: "0px",
                            //   },
                            // }}
                            onClick={handleOpenBackdrop}
                          />
                        </ListItemButton>
                      </Link>
                    </List>
                  ))}
                </Collapse>
              </div>
            ) : (
              <Link
                href={data.link}
                className="w-full no-underline text-gray-700"
              >
                <ListItemButton sx={{ pl: 4 }}>
                  <ListItemText
                    primary={data.title}
                    primaryTypographyProps={{
                      fontWeight: "bold",
                      fontFamily: "Source Sans Pro",
                      // position: "relative",
                      // left: "30px",
                    }}
                    sx={{
                      textDecoration: "none",
                      // "@media (max-width: 480px)": {
                      //   marginLeft: "-25px",
                      //   marginTop: "0px",
                      //   borderRadius: "5px",
                      //   overflow: "hidden",
                      //   borderBottom: "0px",
                      // },
                    }}
                  />
                </ListItemButton>
              </Link>
            )}
          </ListItem>
        </List>
      ))}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar color="transparent" sx={{boxShadow: '0px 0px 1px 0px rgba(0,0,0,0.01)', backgroundColor: '#F7F7F7'}} className="opacity-95">
        <Toolbar>
          <Box
            sx={{
              position: "absolute",
              top: "49.5vh",
              minHeight: "100vh",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "5px",
              opacity: '1',
              zIndex: 1,

              "@media (max-width: 25vh)": {
                fontSize: "1.5em",
                top: "10px",
                transform: "translate(0%, 50)",
                overflow: "hidden",
              },
            }}
          >
            <IconButton
              onClick={toggleDrawer}
              sx={{ mr: -2, cursor: "pointer", mt: "1em" }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          <IconButton>
            <Drawer
              anchor={"left"}
              open={openMenu}
              onClose={toggleDrawer}
              hideBackdrop={true}
              ModalProps={{
                keepMounted: true,
              }}
              variant="persistent"
              sx={{
                "& .MuiDrawer-paper": {
                  marginTop: "5rem",
                  width: "250px",
                  opacity: '1',
                  marginLeft: "70px",
                  borderRight: "none",
                  borderRadius: "5px",
                  boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.1)",
                  "@media (max-width: 540px)": {
                    marginLeft: "55px",
                    marginTop: "0px",
                    borderRadius: "5px",
                    overflow: "hidden",
                  },
                },
              }}

            >
              {list()}
            </Drawer>

          </IconButton>
          <Box className="flex flex-grow ">
            {/*SISTEM LOGO */}
            <Typography marginTop="0.5em" className="cursor-pointer" marginLeft="1.5em" >
              <img src="/images/sistem-logo.png" alt="logo" className="w-14" onClick={() => router.push('/dashboard')} />{" "}
            </Typography>
            {/*SISTEM FONT */}
            <Typography
              variant="h4"
              fontFamily="Source Sans Pro"
              fontWeight="bold"
              marginTop="0.3em"
              className="cursor-pointer"
              onClick={() => router.push('/dashboard')}
            >
            
              SISTEM{" "}
            </Typography>
          </Box>


          <div>
            <IconButton
              size="large"
              aria-label="show notifications"
              onClick={(e) => setNotificationsOpen(e.currentTarget)}
            >
              <Notifications className="text-black relative" />
              {notifications.length > 0 && (
                <Box className="bg-red-500 rounded-full flex items-center justify-center absolute py-[.2rem] px-[.5rem] top-0 right-1">
                  <Typography className="text-white text-xs font-bold">
                    {notifications.length}
                  </Typography>
                </Box>
              )}
            </IconButton>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
            >
              <AccountCircle className="text-black" />
            </IconButton>

            <Menu
              id="notifications-menu"
              anchorEl={notificationsOpen}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              sx={{ cursor: 'pointer' }}
              open={Boolean(notificationsOpen)}
              onClose={() => setNotificationsOpen(false)}
              className="min-w-[500px] mt-8 "
            >
              <Box className="w-full p-4 max-w-xs" sx={{ overflow: 'hidden' }}>
                
                <Typography className="font-bold items-center">
                  Notifications
                </Typography>
                {notifications.length  === 0 ||
                <Tooltip title='Clear All Notifications'> 
                <Button onClick={handleMarkAllAsRead} color="primary" variant="inherit" sx={{marginLeft: '12.6em', marginTop:'-3.1em' }}>
                Mark All as Read
                </Button>
                </Tooltip>
              }
                {notifications.length === 0 ? (
                  <Typography className="w-full p-4 max-w-xs">No notifications</Typography>
                ) :
                  notifications.map((notification, index) => (
                    <List className="flex flex-col items-center justify-center" key={index}>
                      <ListItemButton
                          onClick={() => {
                            handleClickNotification(notification);
                            /* handleReadNotification(notification); */
                          }}
                      >
                        <ListItem sx={{ marginTop: '-1em' }}>
                          <ListItemText >{notification.message} <Divider/> 
                          <Typography  sx={{textAlign: 'right'}}> 
                            {new Date(notification.createdAt)?.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                          </Typography>
                          </ListItemText>
                        </ListItem>
                      </ListItemButton>
                      <Divider />
                      <Tooltip title='Click me to clear'>
                        <Button
                          variant="inherit"
                          onClick={() =>
                            handleReadNotification(notification)
                          }
                        >
                          Mark as read
                        </Button>
                      </Tooltip>
                    </List>

                  ))}
                <Divider />
           
              
                {/* <Tooltip title='Mark as Read'>
                  <IconButton
                    sx={{ cursor: "pointer", marginLeft: '13em', fontSize: "1.0rem", fontWeight: "bold" }}
                    onClick={() =>
                      handleReadNotification(notification)
                    }
                  >
                    Mark as read
                  </IconButton>
                </Tooltip> */}
              </Box>
            </Menu>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              className="mt-8"
              sx={{ cursor: 'pointer' }}
            >
              <Typography className="px-3 font-semibold">
                {user?.firstName} {user?.lastName}  - {user?.user_type === 'student' ? 'Student' : user?.position}
               {/*  {console.log(user.position)} */}
              </Typography>
              <MenuItem     
              onClick={() => {
                router.push(`/profile/${user?._id}`)
                }}>Profile</MenuItem>
              <MenuItem onClick={handleSignOut}>Log Out</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <Dialog open={isRetained}>
        <DialogTitle>
          Your account doesn't have access to the system due to retention.
          Please contact your program coordinator or department office for
          further assistance.
        </DialogTitle>
        <DialogActions>
          <Button onClick={handleSignOut} color="primary">
            Continue
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Header;
