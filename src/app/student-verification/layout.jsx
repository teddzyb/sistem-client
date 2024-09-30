"use client";
import { ThemeProvider, createTheme } from "@mui/material";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
    

    const theme = createTheme({
        typography: {
            "fontFamily": `"Source Sans 3", sans-serif`,
        }
    })

    return (
        <ThemeProvider theme={theme}>
            <Toaster />

            {children}
        </ThemeProvider>
    );
}
