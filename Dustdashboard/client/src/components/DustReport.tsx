import { useContext } from 'react';
import { Card, Typography, Box, Stack } from '@mui/material';
import { DustDataContext } from '../Contexts/RealtimeDustDataContext';
import { FetchedData } from '../types/types';

function DustReport() {
  const context = useContext(DustDataContext);

  if (!context) {
    return <Typography align="center">Context not available</Typography>;
  }

  const { dustData } = context;

  // Group data by room, area, and location
  const groupedByRoomAreaLocation = dustData.reduce((acc, item) => {
    const key = `${item.room}-${item.area}-${item.location_name}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as { [key: string]: FetchedData[] });

  // For each group (room-area-location), find the item with the latest timestamp
  const latestLocationData = Object.values(groupedByRoomAreaLocation).map((items) => {
    return items.reduce((latestItem, currentItem) => {
      return new Date(currentItem.measurement_datetime) > new Date(latestItem.measurement_datetime) ? currentItem : latestItem;
    });
  });

  return (
    <Card sx={{ backgroundColor: '#f9f9f9', p: 3, mt: 2, height: '61%' }}>
      <Typography variant="h6" gutterBottom align="center">
        Dust Report
      </Typography>

      {/* Scrollable Container for Dust Report */}
      <Box sx={{ height: '325px', overflowY: 'auto', pb: 4 }}>
        <Stack spacing={2}>
          {/* Show header once, aligned to the left */}
          {latestLocationData.length === 0 ? (
            <Typography align="center">No data available</Typography>
          ) : (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ marginBottom: 2 }}
            >
              <Box sx={{ width: '33%' }}>
                <Typography variant="subtitle1" fontWeight="bold" textAlign="left">
                  Location
                </Typography>
              </Box>

              <Box sx={{ width: '33%' }}>
                <Typography variant="subtitle1" fontWeight="bold" textAlign="left">
                  um03
                </Typography>
              </Box>

              <Box sx={{ width: '33%' }}>
                <Typography variant="subtitle1" fontWeight="bold" textAlign="left">
                  Status
                </Typography>
              </Box>
            </Stack>
          )}

          {/* Data Rows for location with the latest timestamp */}
          {latestLocationData.map((item, index) => (
            <Stack
              key={index}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="flex-start"
              alignItems="flex-start"
            >
              {/* Location */}
              <Box sx={{ width: '33%' }}>
                <Typography>{`${item.location_name}`}</Typography>
              </Box>

              {/* Dust Value */}
              <Box sx={{ width: '33%' }}>
                <Typography>{item.um03}</Typography>
              </Box>

              {/* Status */}
              <Box sx={{ width: '33%' }}>
                <Typography color={item.alarm_high === 1 ? 'error' : 'success'}>
                  {item.alarm_high === 1 ? 'NG' : 'OK'}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Card>
  );
}

export default DustReport;
