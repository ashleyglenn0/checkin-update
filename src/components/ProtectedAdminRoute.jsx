// components/ProtectedAdminRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getTokenFromSession } from "../utils/tokenHelpers";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

const ProtectedAdminRoute = ({ children }) => {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = getTokenFromSession();

      if (!token) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("https://us-central1-volunteercheckin-3659e.cloudfunctions.net/verifyAuthToken", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error("Token verification failed");
        }

        const result = await response.json();

        if (result?.role === "admin") {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        console.error("🛑 Admin token verification failed:", err);
        setAuthorized(false);
      }

      setLoading(false);
    };

    verifyToken();
  }, []);

  if (loading) {
    return (
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return authorized ? children : <Navigate to="/" replace />;
};

export default ProtectedAdminRoute;
