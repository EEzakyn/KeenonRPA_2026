import { useContext, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import ProgressCircle from './ProgressCircle';
import { DustDataContext } from '../Contexts/RealtimeDustDataContext';
import { FetchedData } from '../types/types';

function ProgressStatus() {
    const context = useContext(DustDataContext);

    if (!context) {
        return <Typography align="center">Context not available</Typography>;
    }

    const { dustData, loading } = context;

    const { total, pass, fail } = useMemo(() => {
        if (!dustData || dustData.length === 0) return { total: 0, pass: 0, fail: 0 };

        // Group by room, area, location_name
        const groupedData = dustData.reduce((acc, item) => {
            const key = `${item.room}-${item.area}-${item.location_name}`;

            if (!acc[key]) {
                acc[key] = [];
            }

            acc[key].push(item);

            return acc;
        }, {} as { [key: string]: FetchedData[] });

        let totalCount = 0;
        let passCount = 0;
        let failCount = 0;

        // Iterate through the grouped data to find the highest count for each location_name
        Object.keys(groupedData).forEach((key) => {
            const group = groupedData[key];

            // Get the most recent item for the current location_name
            const latestLocationData = group.reduce((latestItem, currentItem) => {
                return new Date(currentItem.measurement_datetime) > new Date(latestItem.measurement_datetime)
                    ? currentItem
                    : latestItem;
            });

            // Check alarm_high for the most recent item
            if (latestLocationData.alarm_high === 1) {
                failCount += 1;
            } else {
                passCount += 1;
            }

            totalCount += 1;
        });

        return { total: totalCount, pass: passCount, fail: failCount };
    }, [dustData]);

    const getPercentage = (count: number) => {
        return total === 0 ? 0 : Math.min(100, Math.round((count / total) * 100));
    };

    return (
        <Card sx={{ backgroundColor: '#f9f9f9' }}>
            <CardContent>
                <Typography variant="h5" align="center" gutterBottom>
                    Progress Status
                </Typography>

                {loading ? (
                    <Typography align="center">Loading...</Typography>
                ) : (
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="center"
                        alignItems="center"
                        flexWrap="wrap"
                    >
                        <Box textAlign="center">
                            <ProgressCircle percentage={Math.round((total / 19) * 100)} size={95} color="#4A90E2" />
                            <Box mt={1}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Overview ({total})
                                </Typography>
                            </Box>
                        </Box>

                        <Box textAlign="center">
                            <ProgressCircle percentage={getPercentage(pass)} size={95} color="#27AE60" />
                            <Box mt={1}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    OK ({pass})
                                </Typography>
                            </Box>
                        </Box>

                        <Box textAlign="center">
                            <ProgressCircle percentage={getPercentage(fail)} size={95} color="#E74C3C" />
                            <Box mt={1}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    NG ({fail})
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}

export default ProgressStatus;
