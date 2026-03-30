import { useContext, useEffect, useState } from 'react';
import { Card, Typography, Pagination } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import dayjs from 'dayjs';
import axios from 'axios';
import { DustDataContext } from '../Contexts/RealtimeDustDataContext';
import { API_BASE_URL } from '../configs/apiConfig';
import { FetchedData } from '../types/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ITEMS_PER_PAGE = 5;

function DustTrend() {
  const { dustData } = useContext(DustDataContext) ?? { dustData: [] };
  const [lastWeekData, setLastWeekData] = useState<FetchedData[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchLastWeek = async () => {
      const startDate = dayjs().subtract(7, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const endDate = dayjs().subtract(1, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss');

      try {
        const response = await axios.post(`${API_BASE_URL}/api/dust-measurements/date-range`, {
          startDate,
          endDate,
        });
        setLastWeekData(response.data);
      } catch (error) {
        console.error('Failed to fetch last week data', error);
      }
    };

    fetchLastWeek();
  }, []);

  // Get unique location names
  const locations = Array.from(
    new Set([...dustData, ...lastWeekData].map((d) => d.location_name))
  ).sort();

  // Paginate location names
  const paginatedLocations = locations.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Calculate average dust values per location
  const calcAvg = (data: FetchedData[], location: string) => {
    const filtered = data.filter((d) => d.location_name === location);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, cur) => acc + (cur.um03 ?? 0), 0);
    return +(sum / filtered.length).toFixed(2);
  };

  const chartData = {
    labels: paginatedLocations,
    datasets: [
      {
        label: 'Today',
        data: paginatedLocations.map((loc) => calcAvg(dustData, loc)),
        backgroundColor: '#00aaff',
      },
      {
        label: 'Last Week',
        data: paginatedLocations.map((loc) => calcAvg(lastWeekData, loc)),
        backgroundColor: '#ff6600',
      },
    ],
  };

  return (
    <Card sx={{ backgroundColor: '#f9f9f9', p: 3 }}>
      <Typography variant="h6" align="center" gutterBottom>
        Dust Average Comparison
      </Typography>

      <Bar data={chartData} options={{ responsive: true }} />

      <Pagination
        count={Math.ceil(locations.length / ITEMS_PER_PAGE)}
        page={page}
        onChange={(_, value) => setPage(value)}
        sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
      />
    </Card>
  );
}

export default DustTrend;
