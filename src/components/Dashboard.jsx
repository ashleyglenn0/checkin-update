import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../config/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  serverTimestamp,
  getDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  CssBaseline,
  Stack,
  Grid,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import { useTheme, createTheme, ThemeProvider } from "@mui/material/styles";
import SendAlertDialog from "./SendAlertDialog";
import BrandingSlotV2 from "./BrandingSlotV2"; // Adjust path if needed
import { useAuth } from "../context/AuthContext";
import AlertBanner from "./AlertBanner";

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

const trafficZones = ["Registration", "Main Stage", "Food Truck Park"];

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [isAtlTechWeek, setIsAtlTechWeek] = useState(
    JSON.parse(localStorage.getItem("isAtlTechWeek")) || false
  );
  const [longTaskVolunteers, setLongTaskVolunteers] = useState([]);
  const [checkIns, setCheckIns] = useState(0);
  const [checkOuts, setCheckOuts] = useState(0);
  const [noShows, setNoShows] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [slackMessages, setSlackMessages] = useState([]);
  const [trafficLevels, setTrafficLevels] = useState([]);
  const [eventsActivatedToday, setEventsActivatedToday] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [newAlert, setNewAlert] = useState({
    message: "",
    severity: "info",
    audience: "admin-all",
  });
  const [lastActivity, setLastActivity] = useState(() => {
    const stored = localStorage.getItem("lastActivity");
    return stored ? new Date(stored) : new Date();
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const activeEvent = isAtlTechWeek ? "ATL Tech Week" : "Render";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleAddAlert = async () => {
    try {
      const alertDoc = {
        ...newAlert,
        createdAt: serverTimestamp(),
        event: activeEvent,
      };

      if (
        newAlert.audience === "teamlead-direct" &&
        (!newAlert.taskGroup || newAlert.taskGroup.length === 0)
      ) {
        alert(
          "Please select at least one task group for direct team lead alerts."
        );
        return;
      }

      if (newAlert.audience !== "teamlead-direct") {
        delete alertDoc.taskGroup;
      }

      await addDoc(collection(db, "alerts"), alertDoc);
      setOpenDialog(false);

      if (
        newAlert.audience?.startsWith("admin") &&
        newAlert.severity === "error"
      ) {
        await fetch(
          "https://us-central1-volunteercheckin-3659e.cloudfunctions.net/sendSlackAlert",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newAlert.message }),
          }
        );
      }
    } catch (error) {
      console.error("❌ handleAddAlert error:", error);
    }
  };

  useEffect(() => {
    const fetchSlackMessages = async () => {
      try {
        const res = await fetch(
          "https://us-central1-volunteercheckin-3659e.cloudfunctions.net/getSlackMessages"
        );
        const messages = await res.json();
        setSlackMessages(messages);
      } catch (error) {
        console.error("Failed to fetch Slack messages:", error);
      }
    };

    const fetchStats = async () => {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999
      );

      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      const eventFilter = where("event", "==", activeEvent);
      const formattedDate = startOfDay.toLocaleDateString("en-US");

      try {
        const checkInsQuery = query(
          collection(db, "check_ins"),
          eventFilter,
          where("status", "==", "Checked In"),
          where("timestamp", ">=", startTimestamp),
          where("timestamp", "<=", endTimestamp)
        );
        const checkInsSnap = await getDocs(checkInsQuery);

        const validCheckIns = checkInsSnap.docs.filter(
          (doc) => doc.data().role?.toLowerCase() !== "admin"
        );
        setCheckIns(validCheckIns.length);

        const checkOutsSnap = await getDocs(
          query(
            collection(db, "check_ins"),
            eventFilter,
            where("status", "==", "Checked Out"),
            where("timestamp", ">=", startTimestamp),
            where("timestamp", "<=", endTimestamp)
          )
        );

        const scheduledSnap = await getDocs(
          query(
            collection(db, "scheduled_volunteers"),
            where("date", "==", formattedDate),
            where("isAtlTechWeek", "==", isAtlTechWeek)
          )
        );

        const validCheckOuts = checkOutsSnap.docs.filter(
          (doc) => doc.data().role?.toLowerCase() !== "admin"
        );
        setCheckOuts(validCheckOuts.length);
        setScheduledCount(scheduledSnap.size);
        if (scheduledSnap.size === 0) {
          setNoShows(0);
        } else {
          const noShowCount = scheduledSnap.size - validCheckIns.length;
          setNoShows(noShowCount < 0 ? 0 : noShowCount);
        }
      } catch (err) {
        console.error("❌ Error fetching dashboard stats:", err);
      }
    };

    const fetchEventStats = async () => {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59
      );

      try {
        const checkInsSnap = await getDocs(
          query(
            collection(db, "check_ins"),
            where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
            where("timestamp", "<=", Timestamp.fromDate(endOfDay)),
            where("event", "==", "ATL Tech Week")
          )
        );

        const scheduledSnap = await getDocs(
          query(
            collection(db, "scheduled_volunteers"),
            where("date", "==", startOfDay.toLocaleDateString("en-US")),
            where("isAtlTechWeek", "==", true)
          )
        );

        const activatedEventIds = new Set(
          checkInsSnap.docs.map(
            (doc) => doc.data().scheduledEventId || doc.data().eventId
          )
        );
        setEventsActivatedToday(activatedEventIds.size);

        const upcoming = scheduledSnap.docs.map((doc) => ({
          name: doc.data().eventName || "Unnamed Event",
          volunteersNeeded: doc.data().volunteersNeeded || 0,
        }));

        setUpcomingEvents(upcoming);
      } catch (err) {
        console.error("Error fetching event stats:", err);
      }
    };

    const fetchLongTaskVolunteers = async () => {
      const now = new Date();
      const q = query(
        collection(db, "task_checkins"),
        where("checkoutTime", "==", null),
        where("event", "==", activeEvent)
      );
      const snapshot = await getDocs(q);
      const twoHours = 2 * 60 * 60 * 1000;
      const threeHours = 3 * 60 * 60 * 1000;

      const volunteers = snapshot.docs.map((doc) => {
        const data = doc.data();
        const checkinTime = new Date(data.checkinTime);
        const duration = now - checkinTime;
        const durationMinutes = Math.floor(duration / 60000);
        const isFood = data.task.toLowerCase().includes("food");

        let overdueBy = 0;
        let status = "safe";

        if (isFood && duration > twoHours) {
          status = "overdue";
          overdueBy = Math.floor((duration - twoHours) / 60000);
        } else if (!isFood && duration > threeHours) {
          status = "overdue";
          overdueBy = Math.floor((duration - threeHours) / 60000);
        }

        return {
          name: `${data.first_name} ${data.last_name}`,
          task: data.task,
          checkinTime: checkinTime.toLocaleTimeString(),
          duration: durationMinutes,
          overdueBy,
          status,
        };
      });

      setLongTaskVolunteers(volunteers.filter((v) => v.status === "overdue"));
    };

    const unsubscribe = onSnapshot(
      collection(db, "traffic_levels"),
      (snapshot) => {
        const levels = {};
        snapshot.forEach((doc) => {
          levels[doc.id] = doc.data().level;
        });
        setTrafficLevels(levels);
      }
    );

    fetchSlackMessages();
    fetchStats();
    fetchLongTaskVolunteers();
    fetchEventStats();

    return () => unsubscribe();
  }, [isAtlTechWeek]);

  useEffect(() => {
    const updateActivity = () => {
      const now = new Date();
      setLastActivity(now);
      localStorage.setItem("lastActivity", now.toISOString());
    };

    const events = ["click", "keydown", "mousemove", "touchstart"];
    events.forEach((event) => window.addEventListener(event, updateActivity));

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, updateActivity)
      );
    };
  }, []);

  const currentTheme = isAtlTechWeek ? atlTheme : renderTheme;
  const coverageRate =
    scheduledCount > 0 ? Math.round((checkIns / scheduledCount) * 100) : 0;

  const updateTrafficLevel = async (zone, level) => {
    const docRef = doc(db, "traffic_levels", zone);
    await setDoc(docRef, { level, event: activeEvent }, { merge: true });
  };

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

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />

      {/* Top Toolbar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: headerBackgroundColor,
          p: 2,
          mb: 2,
          borderBottom: "1px solid #ddd",
        }}
      >
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          alignItems="center"
        >
          <Box sx={{ flexGrow: 1 }}>
            <BrandingSlotV2 currentEvent={activeEvent} />
          </Box>
          <Button
            variant="outlined"
            sx={headerButtonStyle}
            onClick={() => setIsAtlTechWeek(!isAtlTechWeek)}
          >
            View Stats For {isAtlTechWeek ? "Render" : "ATL Tech Week"}
          </Button>
          <Button
            variant="contained"
            sx={headerButtonStyle}
            onClick={() => navigate("/admin/schedule")}
          >
            View Schedule
          </Button>
          <Button
            variant="contained"
            sx={headerButtonStyle}
            onClick={() => navigate("/admin/checkin")}
          >
            Back to Check-In
          </Button>
          <Button
            variant="contained"
            sx={headerButtonStyle}
            onClick={() => navigate("/admin/reports")}
          >
            Reports
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={headerButtonStyle}
            onClick={() => setOpenDialog(true)}
          >
            Send Alert
          </Button>
          <Button
            variant="outlined"
            sx={headerButtonStyle}
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </Stack>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1, mr: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontStyle: "italic",
            }}
          >
            Logged in as {user?.firstName} | Last active:{" "}
            {lastActivity?.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: isMobile ? 2 : 4 }}>
        {/* Metrics */}
        <Grid container spacing={2} mb={2} alignItems="flex-start">
          <Grid item xs={12} sm={6} md={3} lg={2.5}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: "#e3f2fd" }}>
              <Typography variant="subtitle2">Check-Ins (Today)</Typography>
              <Typography variant="h5">{checkIns}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: "#fff3e0" }}>
              <Typography variant="subtitle2">Check-Outs (Today)</Typography>
              <Typography variant="h5">{checkOuts}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: "#ffebee" }}>
              <Typography variant="subtitle2">No Shows (Today)</Typography>
              <Typography variant="h5">{noShows}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: "#e8f5e9" }}>
              <Typography variant="subtitle2">Coverage Rate</Typography>
              <Typography variant="h5">{coverageRate}%</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Traffic Monitor */}
        {isAtlTechWeek ? (
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Events Activated Today: {eventsActivatedToday}
            </Typography>

            {upcomingEvents.length === 0 ? (
              <Typography variant="body2">No upcoming events today.</Typography>
            ) : (
              upcomingEvents.slice(0, 5).map((event, idx) => (
                <Box key={idx} sx={{ my: 1 }}>
                  <Typography variant="subtitle2">{event.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Volunteers Needed: {event.volunteersNeeded}
                  </Typography>
                </Box>
              ))
            )}

            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate("/admin/full-event-list")}
            >
              See Full Event List
            </Button>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Traffic Monitor
            </Typography>
            {trafficZones.map((zone) => (
              <Box key={zone} sx={{ mb: 2 }}>
                <Typography variant="subtitle2">{zone}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <IconButton
                      key={level}
                      size="small"
                      onClick={() => updateTrafficLevel(zone, level)}
                    >
                      <CircleIcon
                        sx={{
                          color:
                            level <= (trafficLevels[zone] || 0)
                              ? currentTheme.palette.primary.main
                              : "#ccc",
                        }}
                      />
                    </IconButton>
                  ))}
                </Stack>
              </Box>
            ))}
          </Paper>
        )}

        {/* Long Task Volunteers */}
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Volunteers to Rotate</Typography>
          {longTaskVolunteers.length === 0 ? (
            <Typography variant="body2">
              No one is currently over their task time.
            </Typography>
          ) : (
            longTaskVolunteers.map((v, idx) => (
              <Box key={idx} sx={{ my: 0.5 }}>
                <Typography>
                  {v.name} - {v.task} - {v.duration} mins (Overdue by{" "}
                  {v.overdueBy ??
                    v.duration -
                      (v.task.toLowerCase().includes("food") ? 120 : 180)}{" "}
                  mins)
                </Typography>
              </Box>
            ))
          )}
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate("/admin/task-dashboard")}
          >
            View Task Breakdown
          </Button>
        </Paper>

        {/* Slack Feed */}
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Slack Feed</Typography>
          {slackMessages.map((msg, idx) => (
            <Box key={idx} sx={{ my: 0.5 }}>
              <Typography variant="body2">
                <strong>{msg.user}:</strong> {msg.text}
              </Typography>
            </Box>
          ))}
        </Paper>

        {/* Alerts Section */}
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Recent Alerts</Typography>
          <AlertBanner
            role={user?.role || ""}
            event={user.event || (isAtlTechWeek ? "ATL Tech Week" : "Render")}
            userName={user.firstName}
          />
        </Paper>
      </Box>

      <SendAlertDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        newAlert={newAlert}
        setNewAlert={setNewAlert}
        handleAddAlert={handleAddAlert}
      />
    </ThemeProvider>
  );
};

export default Dashboard;
