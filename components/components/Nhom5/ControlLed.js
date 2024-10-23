"use client";
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Container, Typography, Switch, FormControlLabel, Box } from '@mui/material';

const ControlLed = () => {
    const [led1, setLed1] = useState(false);
    const [led2, setLed2] = useState(false);
    const [led3, setLed3] = useState(false);

    const handleLedToggle = (led, state) => {
        axios.put(`https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app/LED/${led}.json`, { state })
            .then(response => {
                console.log(`LED ${led} state updated to ${state}`);
            })
            .catch(error => {
                console.error(`Error updating LED ${led} state:`, error);
            });
    };

    useEffect(() => {
        // Fetch initial states from Firebase
        const fetchInitialStates = async () => {
            try {
                const response1 = await axios.get('https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app/LED/LED1.json');
                setLed1(response1.data.state);

                const response2 = await axios.get('https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app/LED/LED2.json');
                setLed2(response2.data.state);

                const response3 = await axios.get('https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app/LED/LED3.json');
                setLed3(response3.data.state);
            } catch (error) {
                console.error('Error fetching initial LED states:', error);
            }
        };

        fetchInitialStates();
    }, []);

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" gutterBottom>
                Control LEDs
            </Typography>
            <Box display="flex" flexDirection="column" alignItems="center">
                <FormControlLabel
                    control={
                        <Switch
                            checked={led1}
                            onChange={() => { setLed1(!led1); handleLedToggle('LED1', !led1); }}
                            color="primary"
                        />
                    }
                    label="LED 1"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={led2}
                            onChange={() => { setLed2(!led2); handleLedToggle('LED2', !led2); }}
                            color="primary"
                        />
                    }
                    label="LED 2"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={led3}
                            onChange={() => { setLed3(!led3); handleLedToggle('LED3', !led3); }}
                            color="primary"
                        />
                    }
                    label="LED 3"
                />
            </Box>
        </Container>
    );
};

export default ControlLed;