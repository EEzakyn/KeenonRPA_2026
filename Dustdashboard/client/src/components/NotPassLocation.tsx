import { useContext } from 'react';
import { Card, Typography, Box, Stack } from '@mui/material';
import { DustDataContext } from '../Contexts/RealtimeDustDataContext';
import { FetchedData } from '../types/types';

function NotPassLocation() {
  const context = useContext(DustDataContext);

  if (!context) {
    return <Typography align="center">Context not available</Typography>;
  }

  const { dustData } = context;

  // Group data by location and get the item with the latest timestamp
  const groupedByLocation = dustData.reduce((acc, item) => {
    const key = item.location_name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as { [key: string]: FetchedData[] });

  // For each location, get the item with the latest timestamp
  const latestNotPassLocations = Object.values(groupedByLocation).map((items) => {
    return items.reduce((latestItem, currentItem) => {
      return new Date(currentItem.measurement_datetime) > new Date(latestItem.measurement_datetime) ? currentItem : latestItem;
    });
  }).filter(item => item.alarm_high === 1);  // Filter out the ones with NG status

  return (
    <Card sx={{ backgroundColor: '#f9f9f9', p: 3, mt: 2, height: '35%' }}>
      <Typography variant="h6" gutterBottom align="center">
        NG Location
      </Typography>

      {/* Scrollable Container for Not Pass Locations */}
      <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
        <Stack spacing={2}>
          {latestNotPassLocations.length === 0 ? (
            <Typography align="center">No locations with NG</Typography>
          ) : (
            <>
              {/* Header Row */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="flex-start"
                alignItems="flex-start"
                sx={{ marginBottom: 2 }}
              >
                <Box sx={{ width: '30%' }} textAlign="left">
                  <Typography variant="subtitle1" fontWeight="bold">
                    Location
                  </Typography>
                </Box>

                <Box sx={{ width: '30%' }} textAlign="left">
                  <Typography variant="subtitle1" fontWeight="bold">
                    um03
                  </Typography>
                </Box>

                <Box sx={{ width: '30%' }} textAlign="left">
                  <Typography variant="subtitle1" fontWeight="bold">
                    Status
                  </Typography>
                </Box>
              </Stack>

              {/* Data Rows for Not Pass Locations */}
              {latestNotPassLocations.map((item, index) => (
                <Stack
                  key={index}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="flex-start"
                  alignItems="flex-start"
                  mt={2}
                >
                  <Box sx={{ width: '30%' }} textAlign="left">
                    <Typography>{item.location_name}</Typography>
                  </Box>

                  <Box sx={{ width: '30%' }} textAlign="left">
                    <Typography>{item.um03}</Typography>
                  </Box>

                  <Box sx={{ width: '30%' }} textAlign="left">
                    <Typography color="error">NG</Typography>
                  </Box>
                </Stack>
              ))}
            </>
          )}
        </Stack>
      </Box>
    </Card>
  );
}

export default NotPassLocation;
