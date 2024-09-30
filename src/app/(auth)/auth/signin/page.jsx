'use client'
import GoogleButton from "@/src/components/GoogleButton"
import { Alert, AlertTitle, Box,  CircularProgress, Typography } from "@mui/material"
import "@fontsource/source-sans-pro"
import { useRouter } from "next/navigation"
import { getSession, signIn, signOut } from "next-auth/react"
import { authConfig } from "@/src/app/lib/auth"
import { getUser } from "@/src/app/lib/loginClient"
import { useEffect, useState } from "react"
import api from "@/src/common/api"

const SignIn = () => {
    const [userNotFound, setUserNotFound] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessages, setErrorMessages] = useState("");
    const router = useRouter();
    const [user, setUser] = useState(null);

    const handleSignIn = async () => {
        signIn('google', { callbackUrl: '/dashboard' });
    };

    const handleSignOut = () => {

        signOut({
            // callbackUrl: `${window.location.origin}/your-redirect-page`,
            redirect: false,
        });
    };

    const getAuth = async () => {
        setIsLoading(true);
        try {
            const session = await getSession(authConfig);
            if (session) {
                const email = session.user.email;

                const response = await api.signInUser(email);

                if (response.status === 200) {
                    router.push("/dashboard");
                } else {
                    setUserNotFound(true);
                    setErrorMessages(response.data);

                    handleSignOut()
                }
            }
            setIsLoading(false);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        const init = async () => {
            const user = await getUser();
            setUser(user);
            if (user) {
                router.push("/dashboard");
            } else {
                getAuth();
            }
        }

        init();
    }, []);

    return (

        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: 'rgb(247, 247, 247)',
                flexDirection: 'column',
                backgroundImage: `url('/images/landing-page-img.jpg')`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}

        >
            {
                userNotFound &&
                <Alert
                    variant="filled"
                    sx={{
                        position: 'absolute',
                        left: '50%',
                        top: '10%',
                        transform: 'translateX(-50%)',
                    }}
                    severity="error">

                    <AlertTitle>Error</AlertTitle>
                    {errorMessages}

                </Alert>
            }

            {
                isLoading && !userNotFound ?
                    <Box
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            top: '10%',
                            transform: 'translateX(-50%)',
                        }}
                        className="flex flex-col justify-center items-center space-y-5"
                    >
                        <CircularProgress />
                        <Typography className="text-gray-600 text-lg">
                            Loading...
                        </Typography>
                    </Box>

                    :

                    <Box
                        sx={{

                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '80vh',
                            minWidth: '50vw',

                        }}
                    >
                        <Box
                            fontSize={{ xs: '24px', sm: '36px', md: '48px', lg: '67px' }}
                            textAlign={'center'}
                            sx={{ paddingY: '1em', width: '100%', fontFamily: 'Source Sans Pro', fontWeight: 'bold' }}
                        >
                            <Box
                                sx={{
                                    fontFamily: 'Source Sans Pro',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                }}
                            >
                                <Box //red logo

                                    sx={{
                                        minHeight: '1vh',
                                        backgroundImage: `url('/images/sistem-logo.png')`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        minWidth: '6.4vw',

                                    }}
                                >
                                </Box>
                                Student Information System
                            </Box>
                            Tool for Enrollment and Management
                        </Box>

                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontFamily: 'Source Sans Pro',
                                fontSize: { xs: '12px', md: '13px' },
                                width: '100%',
                                textAlign: 'center',
                                textIndent: '-140px',
                                marginBottom: '.2em',
                                fontWeight: 'bold'
                            }}
                        >
                            Get Started
                        </Typography>

                        <GoogleButton handleSignIn={handleSignIn} />

                    </Box>
            }

            <Box

                sx={{
                    textAlign: 'center',
                    width: '100%',
                    backgroundPosition: 'center',
                    backgroundColor: '#2888cd',
                    padding: '1em',
                    fontFamily: 'Source Sans Pro',
                    color: '#fff',
                    
                    position: 'absolute',
                    bottom: '0',
                    
                }}
            >
                <Typography variant="body2" sx={{ fontSize: { xs: '10px', sm: '12px', md: '14px' } }}>
                    COPYRIGHT SISTEM™ © 2024. ALL RIGHTS RESERVED.
                </Typography>
            </Box>



        </Box>
    )
}


export default SignIn