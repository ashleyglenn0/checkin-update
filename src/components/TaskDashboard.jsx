import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PageLayout from "../components/PageLayout";
import { useAuth } from "../context/AuthContext";
import EventNavBar from "../components/EventNavBar";

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

const TaskDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  const initialEvent =
    user?.event ||
    (localStorage.getItem("isAtlTechWeek") === "true"
      ? "ATL Tech Week"
      : "Render");

  const [taskCheckIns, setTaskCheckIns] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(initialEvent);
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [newTask, setNewTask] = useState("");

  const startOfDay = new Date(`${selectedDate}T00:00:00`);
  const endOfDay = new Date(`${selectedDate}T23:59:59`);

  const tasks =
    selectedEvent === "ATL Tech Week"
      ? [
          "Registration",
          "Room Setup",
          "Tech Support",
          "Food Truck Park",
          "Stage Crew",
          "General Support",
        ]
      : [
          "Registration",
          "Swag Distribution",
          "Tech Support",
          "Check-in Desk",
          "Room Setup",
          "General Support",
        ];

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!selectedEvent || !selectedDate) return;

    const q = query(
      collection(db, "task_checkins"),
      where("event", "==", selectedEvent),
      where("checkinTime", ">=", Timestamp.fromDate(startOfDay)),
      where("checkinTime", "<=", Timestamp.fromDate(endOfDay))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        const checkIn = doc.data();
        if (!data[checkIn.task]) {
          data[checkIn.task] = [];
        }
        data[checkIn.task].push({ id: doc.id, ...checkIn });
      });
      setTaskCheckIns(data);
    });

    return () => unsubscribe();
  }, [selectedEvent, selectedDate, db]);

  const theme = selectedEvent === "ATL Tech Week" ? atlTheme : renderTheme;

  const calculateTimeSpent = (checkinTime) => {
    if (!checkinTime) return "-";

    const checkinDate = checkinTime.toDate?.() ?? new Date(checkinTime); // handle Timestamp or Date

    if (isNaN(checkinDate)) return "-";

    const now = new Date();
    const diffMs = now - checkinDate;
    return Math.max(Math.floor(diffMs / 60000), 0);
  };

  const handleOpenReassignDialog = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setNewTask("");
    setReassignDialogOpen(true);
  };

  const handleReassign = async () => {
    if (!selectedVolunteer || !newTask) return;

    const now = new Date().toISOString();
    await updateDoc(doc(db, "task_checkins", selectedVolunteer.id), {
      checkoutTime: now,
    });

    const newDocId = `${selectedVolunteer.first_name}_${selectedVolunteer.last_name}_${now}`;
    await setDoc(doc(db, "task_checkins", newDocId), {
      first_name: selectedVolunteer.first_name,
      last_name: selectedVolunteer.last_name,
      task: newTask,
      checkinTime: Timestamp.now(), // use Firebase Timestamp for consistency
      checkoutTime: null,
      teamLead: selectedVolunteer.teamLead,
      event: selectedEvent,
    });

    setReassignDialogOpen(false);
    setSelectedVolunteer(null);
    setNewTask("");
  };

  const allTasks = tasks;
  console.log("taskCheckIns:", taskCheckIns);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <EventNavBar event={selectedEvent} />
      <PageLayout>
        <Typography variant="h4" gutterBottom>
          {selectedEvent} Task Dashboard
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <ToggleButtonGroup
            value={selectedEvent}
            exclusive
            onChange={(e, newEvent) => {
              if (newEvent) setSelectedEvent(newEvent);
            }}
            color="primary"
          >
            <ToggleButton value="ATL Tech Week">ATL Tech Week</ToggleButton>
            <ToggleButton value="Render">Render</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            label="Select Date"
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {allTasks.map((task) => (
          <Accordion key={task} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{task}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {Array.isArray(taskCheckIns[task]) && taskCheckIns[task].length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Volunteer</TableCell>
                        <TableCell>Team Lead</TableCell>
                        <TableCell>Check-in Time</TableCell>
                        <TableCell>Time Spent (mins)</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {taskCheckIns[task].map((volunteer) => (
                        <TableRow key={volunteer.id}>
                          <TableCell>
                            {volunteer.first_name} {volunteer.last_name}
                          </TableCell>
                          <TableCell>{volunteer.teamLead}</TableCell>
                          <TableCell>
                            {(
                              volunteer.checkinTime?.toDate?.() ??
                              new Date(volunteer.checkinTime)
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            {calculateTimeSpent(volunteer.checkinTime)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                handleOpenReassignDialog(volunteer)
                              }
                            >
                              Reassign
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2">
                  No check-ins for this task.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}

        <Box mt={4} display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() =>
              navigate(
                selectedEvent === "ATL Tech Week"
                  ? "/admin/dashboard?event=atl"
                  : "/admin/dashboard?event=render"
              )
            }
          >
            Back to Dashboard
          </Button>
        </Box>

        <Dialog
          open={reassignDialogOpen}
          onClose={() => setReassignDialogOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
            },
          }}
        >
          <DialogTitle>Reassign Volunteer</DialogTitle>
          <DialogContent>
            <Typography>
              Name: {selectedVolunteer?.first_name}{" "}
              {selectedVolunteer?.last_name}
            </Typography>
            <Typography>Current Task: {selectedVolunteer?.task}</Typography>
            <Select
              fullWidth
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              sx={{ mt: 2 }}
            >
              {tasks.map((taskOption) => (
                <MenuItem key={taskOption} value={taskOption}>
                  {taskOption}
                </MenuItem>
              ))}
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReassignDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleReassign}
              disabled={!newTask}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </PageLayout>
    </ThemeProvider>
  );
};

export default TaskDashboard;
