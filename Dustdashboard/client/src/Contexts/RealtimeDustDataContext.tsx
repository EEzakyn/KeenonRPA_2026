import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { API_BASE_URL } from "../configs/apiConfig";
import { FetchedData } from "../types/types";

interface DustDataContextType {
    dustData: FetchedData[];
    loading: boolean;
}

export const DustDataContext = createContext<DustDataContextType | null>(null);

export const DustDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dustData, setDustData] = useState<FetchedData[]>([]);
    const [loading, setLoading] = useState(true);
    const [pollingInterval, setPollingInterval] = useState(10000);

    const fetchData = async (): Promise<FetchedData[]> => {
        try {
            const startDate = dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const endDate = dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss");

            const response = await axios.post(`${API_BASE_URL}/api/dust-measurements/date-range`, {
                startDate,
                endDate,
            });

            return response.data;
        } catch (error) {
            console.error("Error fetching data:", error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const locationsToInclude = Array.from({ length: 19 }, (_, i) =>
        `IS-1K-${String(i + 1).toString().padStart(3, "0")}`
    );

    // OPTION 1: Basic 10s polling (no interval change)
    /*
    useEffect(() => {
        const interval = setInterval(async () => {
            const data = await fetchData();
            const filtered = data.filter((item: FetchedData) =>
                locationsToInclude.includes(item.location_name)
            );
            setDustData(filtered);
        }, 10000);

        // Initial fetch
        fetchData().then(data => {
            const filtered = data.filter((item: FetchedData) =>
                locationsToInclude.includes(item.location_name)
            );
            setDustData(filtered);
        });

        return () => clearInterval(interval);
    }, []);
    */

    // OPTION 2: Start with 10s and change to 30s when reaching 19 locations
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const startPolling = async () => {
            const data = await fetchData();
            const filtered = data.filter((item: FetchedData) =>
                locationsToInclude.includes(item.location_name)
            );
            setDustData(filtered);

            const uniqueLocations = new Set(filtered.map(d => d.location_name));

            // Switch interval to 30s if 19 locations are reached
            if (uniqueLocations.size >= 19 && pollingInterval === 10000) {
                setPollingInterval(30000); // This will restart the effect
            }
        };

        // Initial call
        startPolling();

        interval = setInterval(startPolling, pollingInterval);

        return () => clearInterval(interval);
    }, [pollingInterval]);

    // OPTION 3: Poll every 10s until 19 locations are measured, then stop
    // useEffect(() => {
    //     let interval: NodeJS.Timeout;

    //     const startPolling = async () => {
    //         const data = await fetchData();
    //         const filtered = data.filter((item: FetchedData) =>
    //             locationsToInclude.includes(item.location_name)
    //         );
    //         setDustData(filtered);

    //         const uniqueLocations = new Set(filtered.map(d => d.location_name));

    //         if (uniqueLocations.size >= 19) {
    //             clearInterval(interval); // stop polling
    //         }
    //     };

    //     // Initial call
    //     startPolling();

    //     interval = setInterval(startPolling, 10000); // 10s interval

    //     return () => clearInterval(interval);
    // }, []);

    return (
        <DustDataContext.Provider value={{ dustData, loading }}>
            {children}
        </DustDataContext.Provider>
    );
};
