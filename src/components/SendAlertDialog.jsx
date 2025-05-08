import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  Checkbox,
  ListItemText,
} from "@mui/material";

// Used only for "teamlead-direct"
const teamLeadFloors = [
  "Floor 1",
  "Floor 2",
  "Floor 3",
  "Floor 4",
  "Food Truck Park",
  "Rapid Response",
  "Evening Activation",
  "Speaker Team"
];

const SendAlertDialog = ({
  open,
  onClose,
  newAlert,
  setNewAlert,
  handleAddAlert,
}) => {
  const theme = useTheme();
  const isTeamLeadDirect = newAlert.audience === "teamlead-direct";
  const isAdminDirect = newAlert.audience === "admin-direct";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.text.primary,
        }}
      >
        Add New Alert
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Alert Message"
          value={newAlert.message}
          onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
          margin="normal"
          multiline
          rows={3}
        />

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Alert Type</InputLabel>
          <Select
            value={newAlert.severity}
            label="Alert Type"
            onChange={(e) =>
              setNewAlert({ ...newAlert, severity: e.target.value })
            }
          >
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="error">Urgent</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Send To</InputLabel>
          <Select
            value={newAlert.audience}
            label="Send To"
            onChange={(e) =>
              setNewAlert({
                ...newAlert,
                audience: e.target.value,
                adminName: "",
                floor: [],
              })
            }
          >
            <MenuItem value="everyone">Everyone</MenuItem>
            <MenuItem value="admin-all">All Admins</MenuItem>
            <MenuItem value="admin-direct">Specific Admin</MenuItem>
            <MenuItem value="teamlead-all">All Team Leads</MenuItem>
            <MenuItem value="teamlead-direct">Team Leads on Floor(s)</MenuItem>
          </Select>
        </FormControl>

        {isAdminDirect && (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Admin Name</InputLabel>
            <Select
              value={newAlert.adminName || ""}
              label="Admin Name"
              onChange={(e) =>
                setNewAlert({ ...newAlert, adminName: e.target.value })
              }
            >
              <MenuItem value="Mikal">Mikal</MenuItem>
              <MenuItem value="Reba">Reba</MenuItem>
              <MenuItem value="Lloyd">Lloyd</MenuItem>
              <MenuItem value="Ashley">Ashley</MenuItem>
            </Select>
          </FormControl>
        )}

        {isTeamLeadDirect && (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Target Floor(s)</InputLabel>
            <Select
              multiple
              value={newAlert.floor || []}
              onChange={(e) =>
                setNewAlert({ ...newAlert, floor: e.target.value })
              }
              renderValue={(selected) => selected.join(", ")}
            >
              {teamLeadFloors.map((floor) => (
                <MenuItem key={floor} value={floor}>
                  <Checkbox checked={newAlert.floor?.includes(floor)} />
                  <ListItemText primary={floor} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAddAlert}
          color="primary"
          disabled={!newAlert.message}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendAlertDialog;
