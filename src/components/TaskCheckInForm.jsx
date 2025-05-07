import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Box,
  Button,
  TextField,
  Typography,
  CssBaseline,
  Alert,
  MenuItem,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PageLayout from "../components/PageLayout";
import { useAuth } from "../context/AuthContext";
import PinkPeachIcon from "../assets/PinkPeachIcon.png";
import ATWLogo from "../assets/ATWLogo.jpg";

const renderTheme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#fdf0e2", paper: "#ffffff" },
    primary: { main: "#fe88df" },
    text: { primary: "#711b43" },
  },
});

const atlTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    primary: {
      main: "#ffb89e",
    },
    text: {
      primary: "#4f2b91",
      secondary: "#2b2b36",
    },
    secondary: {
      main: "#68dcaf",
    },
  },
});

const TaskCheckInForm = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isTeamLeadPath = location.pathname.includes("/teamlead");
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [task, setTask] = useState("");
  const [teamLead, setTeamLead] = useState("");
  const [event, setEvent] = useState("");
  const [status, setStatus] = useState("Check In for Task");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showBackButton, setShowBackButton] = useState(false);

  const db = getFirestore();

  useEffect(() => {
    const qrTask = searchParams.get("task");
    const qrEvent = searchParams.get("event");
    const qrLead = searchParams.get("teamLead");

    setTask(qrTask || "");
    setEvent(user?.event || qrEvent || "");
    setTeamLead(qrLead || "");
    setShowBackButton(true);
  }, [searchParams, user]);

  const verifyAdminCheckIn = async (first, last, minWaitMinutes = 1) => {
    const startOfDay = Timestamp.fromDate(
      new Date(new Date().setHours(0, 0, 0, 0))
    );
    const endOfDay = Timestamp.fromDate(
      new Date(new Date().setHours(23, 59, 59, 999))
    );

    const q = query(
      collection(db, "check_ins"),
      where("first_name", "==", first),
      where("last_name", "==", last),
      where("status", "==", "Checked In"),
      where("timestamp", ">=", startOfDay),
      where("timestamp", "<=", endOfDay)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        allowed: false,
        message: "⚠️ No admin check-in found for today.",
      };
    }

    const checkInTime = snapshot.docs[0].data().timestamp.toDate();
    const currentTime = new Date();
    const timeDifferenceMinutes = (currentTime - checkInTime) / 60000;

    if (timeDifferenceMinutes < minWaitMinutes) {
      return {
        allowed: false,
        message: `⚠️ Please wait ${Math.ceil(
          minWaitMinutes - timeDifferenceMinutes
        )} more minute(s) before checking in with the team lead.`,
      };
    }

    return { allowed: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage("");

    try {
      const { allowed, message } = await verifyAdminCheckIn(
        firstName,
        lastName,
        1
      );
      if (!allowed) {
        setError(message);
        return;
      }

      const timestamp = Timestamp.now(); ;
      const taskCheckinId = `${firstName}_${lastName}_${timestamp}`;

      await setDoc(doc(db, "task_checkins", taskCheckinId), {
        first_name: firstName,
        last_name: lastName,
        task: task || "Unknown",
        status,
        checkinTime: timestamp,
        checkoutTime: null,
        teamLead: teamLead || "Unknown",
        event: event || "Render",
      });

      localStorage.setItem(
        "teamLeadInfo",
        JSON.stringify({ firstName, lastName, task, event })
      );

      setSuccessMessage(
        `✅ ${firstName} ${lastName} successfully recorded as "${status}".`
      );

      setTimeout(() => {
        navigate(
          `/teamlead-qr?firstName=${encodeURIComponent(
            teamLead.split(" ")[0]
          )}&lastName=${encodeURIComponent(
            teamLead.split(" ")[1] || ""
          )}&task=${encodeURIComponent(task)}&event=${encodeURIComponent(
            event
          )}`
        );
      }, 1200);
    } catch (error) {
      console.error("🔥 Error checking in:", error);
      setError("❌ Failed to check in. Please try again.");
    }
  };

  const theme = event === "ATL Tech Week" ? atlTheme : renderTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageLayout centered>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <img
            src={event === "ATL Tech Week" ? ATWLogo : PinkPeachIcon}
            alt="Event Logo"
            style={{ height: "60px", width: "auto" }}
          />
        </Box>

        {!user && (
          <Alert severity="info" sx={{ mb: 2 }}>
            🔓 Demo Mode: You're not logged in, but check-in is still available.
          </Alert>
        )}

        <Typography variant="h5" gutterBottom>
          Task Check-In Form
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          <TextField
            select
            label="Task Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            fullWidth
            margin="normal"
            required
          >
            {[
              "Check In for Task",
              "Check Out for Break",
              "Check In from Break",
              "Check Out from Task",
            ].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <Typography mt={2}>
            <strong>Task:</strong> {task}
          </Typography>
          <Typography>
            <strong>Team Lead:</strong> {teamLead}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button type="submit" variant="contained" sx={{ mt: 2 }}>
            Submit
          </Button>
        </Box>

        {isTeamLeadPath && showBackButton && (
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => {
              const teamLeadData = JSON.parse(
                localStorage.getItem("teamLeadInfo")
              );
              if (teamLeadData) {
                const { firstName, lastName, task, event } = teamLeadData;
                navigate(
                  `/teamlead-qr?firstName=${encodeURIComponent(
                    firstName
                  )}&lastName=${encodeURIComponent(
                    lastName
                  )}&task=${encodeURIComponent(task)}&event=${encodeURIComponent(
                    event
                  )}`
                );
              } else {
                alert("⚠️ No team lead information found.");
              }
            }}
          >
            Back to QR Code
          </Button>
        )}
      </PageLayout>
    </ThemeProvider>
  );
};

export default TaskCheckInForm;
