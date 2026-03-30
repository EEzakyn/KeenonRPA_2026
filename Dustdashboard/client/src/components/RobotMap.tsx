import { Card, Typography, LinearProgress, Box, CircularProgress } from '@mui/material';
import { useContext } from 'react';
import { DustDataContext } from '../Contexts/RealtimeDustDataContext';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Map from '/Layout.png';
import { FetchedData } from '../types/types';

// Coordinates for known locations (must match the `location_name` from DB)
const locationCoordinates = {
  'IS-1K-001': { x: 80, y: 87 },
  'IS-1K-002': { x: 52, y: 87 },
  'IS-1K-003': { x: 22, y: 87 },
  'IS-1K-004': { x: 80, y: 72 },
  'IS-1K-005': { x: 52, y: 72 },
  'IS-1K-006': { x: 22, y: 72 },
  'IS-1K-007': { x: 72, y: 57 },
  'IS-1K-008': { x: 76, y: 50 },
  'IS-1K-009': { x: 46, y: 50 },
  'IS-1K-010': { x: 30, y: 57 },
  'IS-1K-011': { x: 22, y: 50 },
  'IS-1K-012': { x: 30, y: 40 },
  'IS-1K-013': { x: 31, y: 33 },
  'IS-1K-014': { x: 52, y: 40 },
  'IS-1K-015': { x: 76, y: 40 },
  'IS-1K-016': { x: 76, y: 33 },
  'IS-1K-017': { x: 84, y: 21 },
  'IS-1K-018': { x: 52, y: 21 },
  'IS-1K-019': { x: 31, y: 21 },
};

function getPinColor(measured: boolean, alarmHigh: boolean) {
  if (!measured) return 'gray';
  if (alarmHigh) return 'red';
  return 'green';
}

function RobotMap() {
  const { dustData, loading } = useContext(DustDataContext)!;

  // Count unique measured locations
  const uniqueMeasured = new Set(dustData.map((d) => d.location_name));
  const progress = Math.min((uniqueMeasured.size / Object.keys(locationCoordinates).length) * 100, 100);

  const latestMeasurements: { [location: string]: FetchedData } = {};

  // Iterate through the dustData to get the most recent data for each location
  dustData.forEach((data) => {
    const current = latestMeasurements[data.location_name];
    if (!current || new Date(data.measurement_datetime) > new Date(current.measurement_datetime)) {
      latestMeasurements[data.location_name] = data;
    }
  });

  return (
    <Card sx={{ backgroundColor: '#f9f9f9', p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom align="center">
        Robot Monitor
      </Typography>

      <Box sx={{ marginBottom: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Progress: {Math.round(progress)}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 15, borderRadius: 5 }}
        />
      </Box>

      <Box sx={{ position: 'relative', width: '100%', maxHeight: '800px' }}>
        <img
          src={Map}
          alt="Robot Map"
          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
        />
        {Object.entries(locationCoordinates).map(([locationName, coords]) => {
          const measurement = latestMeasurements[locationName];
          const color = getPinColor(!!measurement, measurement?.alarm_high === 1);

          return (
            <LocationOnIcon
              key={locationName}
              sx={{
                position: 'absolute',
                top: `${coords.y}%`,
                left: `${coords.x}%`,
                transform: 'translate(-50%, -100%)',
                fontSize: '32px',
                color: color,
                zIndex: 2,
                cursor: 'pointer',
              }}
              titleAccess={`${locationName}`}
            />
          );
        })}

        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(255,255,255,0.7)',
              p: 2,
              borderRadius: 2,
              zIndex: 10,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" mt={1}>
              Loading...
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}

export default RobotMap;
