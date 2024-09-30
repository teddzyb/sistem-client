import "./globals.css";

export const metadata = {
  title: "SISTEM",
  description:
    "SISTEM: Student Information System Tool for Enrollment Management",
  icons: {
    icon: "/images/sistem-logo.png",
  },
};

export default function RootLayout({children}) {

  return (
    <html lang="en">
      <head>
        
        <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        style={{margin: 0, padding: 0, backgroundColor: "rgb(247, 247, 247)", fontFamily: "Source Sans 3"}}
      >
        {children}
      </body>
    </html>
  );
}