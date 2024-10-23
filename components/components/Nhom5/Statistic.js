"use client";

import React, { useEffect, useState } from 'react';
import { database } from '../../../components/Database/firebaseConfig';
import { ref, onValue } from "firebase/database";
import { Container, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const Statistic = () => {
    const [data, setData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const sensorRef = ref(database, 'Sensor');
        onValue(sensorRef, (snapshot) => {
            const fetchedData = snapshot.val();
            console.log('Fetched Data:', fetchedData); // Debugging log
            if (fetchedData) {
                const formattedData = Object.keys(fetchedData).map(key => {
                    const entry = fetchedData[key];
                    console.log('Entry:', entry); // Debugging log for each entry
                    return {
                        humidity: fetchedData.humidity ?? 'N/A',
                        lux: fetchedData.lux ?? 'N/A',
                        temperature: fetchedData.temperature ?? 'N/A',
                        timestamp: entry?.timestamp ?? new Date().toLocaleString()
                    };
                });
                console.log('Formatted Data:', formattedData); // Debugging log
                setData(formattedData);
            } else {
                console.log('No data available');
            }
        }, (error) => {
            console.error('Error fetching data:', error);
        });
    }, []);

    const handleSearch = (event) => {
        setSearchQuery(event.target.value);
    };

    const filteredData = data.filter(item =>
        (item.humidity && item.humidity.toString().includes(searchQuery)) ||
        (item.lux && item.lux.toString().includes(searchQuery)) ||
        (item.temperature && item.temperature.toString().includes(searchQuery)) ||
        (item.timestamp && item.timestamp.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
                Device Statistics
            </Typography>
            <TextField
                label="Search"
                variant="outlined"
                fullWidth
                margin="normal"
                value={searchQuery}
                onChange={handleSearch}
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Humidity (%)</TableCell>
                            <TableCell>Lux</TableCell>
                            <TableCell>Temperature (°C)</TableCell>
                            <TableCell>Timestamp</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell>{row.humidity}</TableCell>
                                <TableCell>{row.lux}</TableCell>
                                <TableCell>{row.temperature}</TableCell>
                                <TableCell>{row.timestamp}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default Statistic;