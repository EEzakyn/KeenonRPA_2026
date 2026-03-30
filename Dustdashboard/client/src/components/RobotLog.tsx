import { useEffect, useRef, useState } from 'react';
import { Card, Typography, Box, Stack } from '@mui/material';
import { API_BASE_URL } from '../configs/apiConfig';
import dayjs from 'dayjs';

interface LogEntryProps {
  id: number;
  time: string;
  location: string;
  message: string;
}

function LogEntry({ time, location, message }: Omit<LogEntryProps, 'id'>) {
  return (
    <Box display="flex" gap={1} flexWrap="wrap">
      <Typography variant="inherit" color="text.secondary" style={{ fontSize: '0.8rem' }}>
        {dayjs.utc(time).format('HH:mm:ss')}
      </Typography>
      <Typography variant="inherit" color="text.secondary" style={{ fontSize: '0.8rem' }}>
        {location}
      </Typography>
      <Typography variant="inherit" style={{ fontSize: '0.8rem' }}>
        {message}
      </Typography>
    </Box>
  );
}

function RobotLog() {
  const [logs, setLogs] = useState<LogEntryProps[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const latestLogIdRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const startDate = dayjs().subtract(1, 'hour').format("YYYY-MM-DDTHH:mm:ss");
      const endDate = dayjs().format("YYYY-MM-DDTHH:mm:ss");

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/activity-log/show-log?startDate=${startDate}&endDate=${endDate}`
        );
        const rawLogs = await res.json();

        const formattedLogs = rawLogs.map((log: any) => ({
          id: log.id,
          time: log.log_timestamp,
          location: log.location_name,
          message: log.activity,
        })).reverse();

        // Check if logs changed by comparing latest ID
        const latestFetchedId = formattedLogs[formattedLogs.length - 1]?.id;
        if (latestFetchedId && latestFetchedId !== latestLogIdRef.current) {
          setLogs(formattedLogs);
          latestLogIdRef.current = latestFetchedId;
        }

      } catch (err) {
        console.error('Failed to fetch logs', err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Polling every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card sx={{ backgroundColor: '#f9f9f9', p: 3, mt: 2, height: '35%' }}>
      <Typography variant="h6" gutterBottom align="center">
        Robot Log
      </Typography>

      <Stack
        spacing={1}
        ref={containerRef}
        sx={{ maxHeight: '80%', overflowY: 'auto' }}
      >
        {logs.map(({ id, time, location, message }) => (
          <LogEntry key={id} time={time} location={location} message={message} />
        ))}
      </Stack>
    </Card>
  );
}

export default RobotLog;
