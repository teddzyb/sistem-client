'use client'
import GoogleIcon from '@mui/icons-material/Google';
import { Button } from '@mui/material';

const GoogleButton = ({handleSignIn}) => {
    

  return (
      <Button
          variant='contained' color='primary'
          sx={{ paddingX: '1em',  fontFamily: 'sans-serif'}}
          onClick={handleSignIn}
      >
          <GoogleIcon sx={{ paddingRight: '.5em', }} />
          LogIn with Google
      </Button>
  )
}

export default GoogleButton