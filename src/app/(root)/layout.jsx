"use client";

import Header from "@/src/components/shared/Header";
import {Toaster} from "react-hot-toast";
import Backdrop from "@mui/material/Backdrop";
import {Box, CircularProgress, ThemeProvider, createTheme} from "@mui/material";
import {useEffect, useRef, useState, useCallback} from "react";
import {usePathname} from "next/navigation";

export default function RootLayout({children}) {
  const [openMenu, setOpenMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPage = usePathname();
  const savedPathNameRef = useRef(currentPage);
  const wrapper = useCallback((currentPage, savedPathNameRef) => {
    setLoading((current) => !current);
    savedPathNameRef.current = currentPage;
    // setLoading((current) => !current);
  }, []);

  const disableLoading = useCallback(() => {
    setLoading((current) => !current);
  });
  useEffect(() => {
    if (savedPathNameRef.current !== currentPage) {
      wrapper(currentPage, savedPathNameRef);
      // wrapper(currentPage, savedPathNameRef);
    } else if (savedPathNameRef.current === currentPage && loading === true) {
      setTimeout(() => {
        disableLoading();
      }, 1000);
    }
  }, []);

  const theme = createTheme({
    typography: {
      "fontFamily": `"Source Sans 3", sans-serif`,
    }
  })

  return (
    <ThemeProvider theme={theme}>
      <Header openMenu={openMenu} setOpenMenu={setOpenMenu} />

      <Toaster />
      <Box
        className={`flex justify-center items-center absolute top-20 ${
          !openMenu ? "left-[4.5rem]" : "left-[4.5rem] md:left-[21rem]"
        } transition-all ease-in-out duration-300`}
      >
        <Box
          className={`flex ${
            loading && "justify-center items-center"
          } min-h-[90vh] ${
            !openMenu ? "w-[75vw] md:w-[90vw]" : "w-[75w] md:w-[72vw]"
          } overflow-hidden bg-white rounded-lg p-7 transition-all ease-in-out duration-300`}
          boxShadow="1"
        >
          {/* {loading ? <CircularProgress sx={{width: "100%"}} /> : children} */}
          {loading ? (
            <Backdrop
              open={true}
              sx={{color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1}}
            >
              <CircularProgress color="inherit" />
            </Backdrop>
          ) : (
            children
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
