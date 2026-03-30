import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PointGrid from "../components/PointGrid";
import ControlPanel from "../components/ControlPanel";
import { STATIC_LOCATIONS, DUST_MODE_ORDER } from "../types/types";
import { RASPBERRY_PI_API_BASE_URL } from "../configs/apiConfig";
import { Button, Modal, Typography } from "@mui/material";
import { useSnackbar } from "notistack";

export default function RobotCommandPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [activeMode, setActiveMode] = useState<"dust" | "transport" | null>(null);
  const [dustSelectedPoints, setDustSelectedPoints] = useState<string[]>([]);
  const [transportSelectedPoints, setTransportSelectedPoints] = useState<string[]>([]);
  const [sendToDatabase, setSendToDatabase] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const isDustMode = activeMode === "dust";

  const updatePoints = useCallback((mode: "dust" | "transport", updated: string[]) => {
    mode === "dust" ? setDustSelectedPoints(updated) : setTransportSelectedPoints(updated);
  }, []);

  const handleTogglePoint = (point: string, mode: "dust" | "transport") => {
    if (!activeMode) setActiveMode(mode);
    if (activeMode && activeMode !== mode) return;

    const selected = mode === "dust" ? dustSelectedPoints : transportSelectedPoints;
    const updated = selected.includes(point)
      ? selected.filter(p => p !== point)
      : [...selected, point];

    if (mode === "transport" && updated.length > 4) {
      enqueueSnackbar("You can only select up to 4 locations in Transportation Mode.", { variant: "warning" });
      return;
    }

    updatePoints(mode, updated);
  };

  const handleSelectAll = () => {
    if (!activeMode) setActiveMode("dust");
    setDustSelectedPoints([...STATIC_LOCATIONS]);
  };

  const handleAutoSelect = () => {
    if (!activeMode) setActiveMode("dust");
    setDustSelectedPoints([...DUST_MODE_ORDER]);
  };

  const handleDeselectAll = () => {
    setDustSelectedPoints([]);
    setTransportSelectedPoints([]);
    setActiveMode(null);
  };

  const checkRobotStatus = async () => {
    try {
      const { data } = await axios.get(`${RASPBERRY_PI_API_BASE_URL}/check-robot-connection`);
      if (data.message === "True") {
        const { data: status } = await axios.get(`${RASPBERRY_PI_API_BASE_URL}/get-points`);
        const robotBusy = Array.isArray(status.points) && status.points.length > 0;

        setModalMessage(
          robotBusy
            ? "Robot is already in operation. Do you want to stop the operation?"
            : "Robot is connected. Do you want to start the operation?"
        );
      } else {
        enqueueSnackbar("Robot is in error state. Please check the robot.", { variant: "error" });
      }
    } catch (error) {
      console.error("Error communicating with robot:", error);
      enqueueSnackbar("Failed to check robot status.", { variant: "error" });
    }
  };

  const handleStartStop = async () => {
    try {
      const { data } = await axios.get(`${RASPBERRY_PI_API_BASE_URL}/get-points`);
      const isBusy = Array.isArray(data.points) && data.points.length > 0;
  
      if (!isBusy) {
        if (!activeMode) {
          enqueueSnackbar("Please select a mode and at least one location.", { variant: "info" });
          return;
        }
  
        const selectedPoints = isDustMode ? dustSelectedPoints : transportSelectedPoints;
        if (selectedPoints.length === 0) {
          enqueueSnackbar("Please select at least one location.", { variant: "warning" });
          return;
        }
      }
  
      checkRobotStatus();
    } catch (error) {
      console.error("Error checking robot status before start/stop:", error);
      enqueueSnackbar("Error checking robot status.", { variant: "error" });
    }
  };  

  const confirmOperation = async () => {
    const selectedPoints = isDustMode ? dustSelectedPoints : transportSelectedPoints;

    try {
      const { data: status } = await axios.get(`${RASPBERRY_PI_API_BASE_URL}/get-points`);
      const isBusy = Array.isArray(status.points) && status.points.length > 0;

      if (isBusy) {
        await axios.get(`${RASPBERRY_PI_API_BASE_URL}/del-points`);
        await axios.get(`${RASPBERRY_PI_API_BASE_URL}/stop-dust`);
        enqueueSnackbar("Operation stopped!", { variant: "success" });
      } else {
        if (selectedPoints.length === 0) {
          enqueueSnackbar("Please select at least one point.", { variant: "warning" });
          return;
        }

        await axios.post(`${RASPBERRY_PI_API_BASE_URL}/add-points`, { points: selectedPoints });

        if (isDustMode) {
          await axios.post(`${RASPBERRY_PI_API_BASE_URL}/start-dust`, {
            required_send_database: sendToDatabase,
          });
          setDustSelectedPoints([]);
        } else {
          await axios.post(`${RASPBERRY_PI_API_BASE_URL}/start-transportation`, {
            points: selectedPoints,
          });
          setTransportSelectedPoints([]);
        }

        enqueueSnackbar("Operation started!", { variant: "success" });
      }
    } catch (error) {
      console.error("Operation error:", error);
      enqueueSnackbar("Failed to execute operation.", { variant: "error" });
    } finally {
      setModalMessage(null);
    }
  };

  useEffect(() => {
    if (!dustSelectedPoints.length && !transportSelectedPoints.length) {
      setActiveMode(null);
    }
  }, [dustSelectedPoints, transportSelectedPoints]);

  const renderModeSection = (
    title: string,
    color: string,
    mode: "dust" | "transport",
    selectedPoints: string[],
    showControls = false
  ) => {
    const isActive = activeMode === mode || activeMode === null;

    return (
      <div
        style={{
          opacity: isActive ? 1 : 0.4,
          pointerEvents: isActive ? "auto" : "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color }}>{title}</h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
            <button
              onClick={handleStartStop}
              style={{
                width: "128px",
                height: "128px",
                borderRadius: "50%",
                background: `linear-gradient(to bottom right, ${color}, ${mode === "dust" ? "#2563EB" : "#EF4444"})`,
                color: "white",
                fontSize: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              Start / Stop
            </button>
            {mode === "dust" && (
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={sendToDatabase}
                  onChange={(e) => setSendToDatabase(e.target.checked)}
                />
                Insert data to database
              </label>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <PointGrid
              points={STATIC_LOCATIONS}
              selectedPoints={selectedPoints}
              onToggle={(point) => handleTogglePoint(point, mode)}
              themeColor={color}
              showOrder
            />
            {showControls && (
              <ControlPanel
                onSelectAll={handleSelectAll}
                onClear={handleDeselectAll}
                onAutoSelect={handleAutoSelect}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "32px" }}>
      {renderModeSection("Dust Measurement Mode", "#1D4ED8", "dust", dustSelectedPoints, true)}
      {renderModeSection("Transportation Mode", "#DC2626", "transport", transportSelectedPoints)}

      <Modal open={!!modalMessage} onClose={() => setModalMessage(null)}>
        <div style={{
          padding: "16px",
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          margin: "auto",
          marginTop: "20vh",
          width: "400px"
        }}>
          <Typography variant="h6">{modalMessage}</Typography>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
            <Button variant="contained" sx={{width:'100px'}} onClick={confirmOperation}>Yes</Button>
            <Button variant="contained" sx={{width:'100px'}} onClick={() => setModalMessage(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
