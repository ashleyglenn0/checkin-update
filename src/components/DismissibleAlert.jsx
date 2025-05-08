import React, { useState } from "react";
import { Alert, IconButton, Collapse } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

const DismissibleAlert = ({ alert, userName, onDismiss }) => {
  const [open, setOpen] = useState(true);

  const handleClose = async () => {
    try {
      setOpen(false);

      const ref = doc(db, "alerts", alert.id);
      await updateDoc(ref, {
        dismissedBy: arrayUnion(userName),
      });

      if (onDismiss) onDismiss(alert.id);
    } catch (err) {
      console.error("❌ Failed to dismiss alert:", err);
    }
  };

  if (!open) return null;

  return (
    <Collapse in={open}>
      <Alert
        severity={alert.severity || "info"}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ mb: 1 }}
      >
        {alert.message}
      </Alert>
    </Collapse>
  );
};

export default DismissibleAlert;
