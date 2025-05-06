// components/EventNavBar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Box, Button, Typography } from "@mui/material";
import PinkPeachIcon from "../assets/PinkPeachIcon.png"; 
import ATWLogo from "../assets/ATWLogo.jpg"; 
import { useTheme } from "@mui/material/styles";

const EventNavBar = ({ event }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTheme = useTheme();

  const isAtlTechWeek = event === "ATL Tech Week";
  const isCheckInPage = location.pathname.includes("checkin");

  const headerBackgroundColor = isAtlTechWeek
    ? "#68dcaf"
    : currentTheme.palette.background.default;

  const headerButtonStyle = {
    backgroundColor: isAtlTechWeek
      ? "#4f2b91"
      : currentTheme.palette.primary.main,
    color: "white",
    "&:hover": {
      backgroundColor: isAtlTechWeek
        ? "#3a1c6d"
        : currentTheme.palette.primary.dark,
    },
  };

  const getLogo = () => (isAtlTechWeek ? ATWLogo : PinkPeachIcon);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ backgroundColor: headerBackgroundColor }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box display="flex" alignItems="center">
          <img src={getLogo()} alt="logo" style={{ height: 40 }} />
          <Typography sx={{ ml: 2, fontWeight: 600 }}>
            {event}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            onClick={() => navigate("/admin/dashboard")}
            sx={headerButtonStyle}
          >
            Back to Dashboard
          </Button>
          <Button
            onClick={() => navigate(isCheckInPage ? "/admin/checkin" : "/admin/checkin")}
            sx={headerButtonStyle}
          >
            {isCheckInPage ? "Back to Check In" : "Check In"}
          </Button>
          <Button
            onClick={() => navigate("/logout")}
            sx={headerButtonStyle}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default EventNavBar;
