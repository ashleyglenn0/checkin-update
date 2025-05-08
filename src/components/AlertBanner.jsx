import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { Stack, Typography } from "@mui/material";
import DismissibleAlert from "./DismissibleAlert";

const AlertBanner = ({ role, event, userName, userTask }) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!role || !event || !userName) return;

    const q = query(collection(db, "alerts"), where("event", "==", event));

    const unsub = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filtered = all.filter((a) => {
        if (a.dismissedBy?.includes(userName)) return false;

        if (a.audience === "everyone") return true;
        if (a.audience === "admin-all" && role === "admin") return true;
        if (a.audience === "teamlead-all" && role === "teamlead") return true;

        if (a.audience === "teamlead-direct" && role === "teamlead") {
          return a.task === userTask || a.taskGroup?.includes(userTask);
        }

        return false;
      });

      setAlerts(filtered);
    });

    return () => unsub();
  }, [role, event, userName, userTask]);

  if (alerts.length === 0) {
    return (
      <Typography variant="body2" sx={{ fontStyle: "italic", mt: 1 }}>
        No recent alerts.
      </Typography>
    );
  }

  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      {alerts.map((alert) => (
        <DismissibleAlert
          key={alert.id}
          alert={alert}
          userName={userName}
          onDismiss={(id) =>
            setAlerts((prev) => prev.filter((a) => a.id !== id))
          }
        />
      ))}
    </Stack>
  );
};

export default AlertBanner;
