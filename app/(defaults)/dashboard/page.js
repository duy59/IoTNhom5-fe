"use client";

import React, { useEffect, useState } from 'react';
import { database } from '../../../components/Database/firebaseConfig';
import { ref, onValue } from "firebase/database";
import { Container, Card, CardContent, Typography, Grid } from '@mui/material';
import OpacityIcon from '@mui/icons-material/Opacity';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Page = () => {
    const [sensorData, setSensorData] = useState(null);
    const [dataHistory, setDataHistory] = useState({
        humidity: [],
        lux: [],
        temperature: [],
        timestamps: []
    });

    useEffect(() => {
        const sensorRef = ref(database, 'Sensor');
        onValue(sensorRef, (snapshot) => {
            const data = snapshot.val();
            setSensorData(data);
            setDataHistory(prevHistory => ({
                humidity: [...prevHistory.humidity, data.humidity],
                lux: [...prevHistory.lux, data.lux],
                temperature: [...prevHistory.temperature, data.temperature],
                timestamps: [...prevHistory.timestamps, new Date().toLocaleTimeString()]
            }));
        });
    }, []);

    const chartData = {
        labels: dataHistory.timestamps,
        datasets: [
            {
                label: 'Humidity',
                data: dataHistory.humidity,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false,
            },
            {
                label: 'Lux',
                data: dataHistory.lux,
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                fill: false,
            },
            {
                label: 'Temperature',
                data: dataHistory.temperature,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: false,
            },
        ],
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Sensor Data
            </Typography>
            {sensorData ? (
                <>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" component="div">
                                        <OpacityIcon sx={{ color: 'blue' }} /> Humidity
                                    </Typography>
                                    <Typography variant="body2">
                                        {sensorData.humidity}%
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" component="div">
                                        <WbSunnyIcon sx={{ color: 'orange' }} /> Lux
                                    </Typography>
                                    <Typography variant="body2">
                                        {sensorData.lux} lx
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" component="div">
                                        <ThermostatIcon sx={{ color: 'red' }} /> Temperature
                                    </Typography>
                                    <Typography variant="body2">
                                        {sensorData.temperature}°C
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                    <Line data={chartData} />
                </>
            ) : (
                <Typography>Loading...</Typography>
            )}
        </Container>
    );
}

export default Page;