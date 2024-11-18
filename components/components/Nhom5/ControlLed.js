// "use client"

// import { useState, useEffect } from 'react';
// import { ref, onValue, set } from 'firebase/database';
// import { database } from '../../Database/firebaseConfig';
// import { Card, Switch, Input, Button, message } from 'antd';

// const DeviceControl = () => {
//     const [devices, setDevices] = useState({
//         FAN: false,
//         LED: false,
//         Mist: false,
//         servo: {
//             enabled: false,
//             term: 300000
//         }
//     });
//     const [termInput, setTermInput] = useState('');

//     useEffect(() => {
//         // Lắng nghe thay đổi từ Realtime Database
//         const devicesRef = ref(database, 'devices');
//         const servoRef = ref(database, 'servo');

//         const unsubscribeDevices = onValue(devicesRef, (snapshot) => {
//             const data = snapshot.val();
//             setDevices(prev => ({
//                 ...prev,
//                 FAN: data.FAN.state,
//                 LED: data.LED.state,
//                 Mist: data.Mist.state,
//             }));
//         });

//         const unsubscribeServo = onValue(servoRef, (snapshot) => {
//             const data = snapshot.val();
//             setDevices(prev => ({
//                 ...prev,
//                 servo: {
//                     enabled: data.enabled,
//                     term: data.term
//                 }
//             }));
//         });

//         return () => {
//             unsubscribeDevices();
//             unsubscribeServo();
//         };
//     }, []);

//     const handleDeviceToggle = async (device) => {
//         try {
//             if (device === 'servo') {
//                 await set(ref(database, 'servo/enabled'), !devices.servo.enabled);
//             } else {
//                 await set(ref(database, `devices/${device}/state`), !devices[device]);
//             }
//         } catch (error) {
//             message.error('Có lỗi xảy ra khi điều khiển thiết bị!');
//         }
//     };

//     const handleTermChange = async () => {
//         try {
//             const termValue = parseInt(termInput);
//             if (isNaN(termValue) || termValue <= 0) {
//                 message.error('Vui lòng nhập thời gian hợp lệ!');
//                 return;
//             }
//             // Chuyển đổi giây thành milliseconds
//             const termInMilliseconds = termValue * 1000;
//             await set(ref(database, 'servo/term'), termInMilliseconds);
//             message.success('Đã cập nhật thời gian servo!');
//             setTermInput('');
//         } catch (error) {
//             message.error('Có lỗi xảy ra khi cập nhật thời gian!');
//         }
//     };

//     return (
//         <div className="p-4">
//             <h1 className="text-2xl font-bold mb-4">Điều khiển thiết bị</h1>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                 {/* Quạt */}
//                 <Card title="Quạt" className="shadow-md">
//                     <div className="flex justify-between items-center">
//                         <span>Trạng thái</span>
//                         <Switch
//                             checked={devices.FAN}
//                             onChange={() => handleDeviceToggle('FAN')}
//                             checkedChildren="Bật"
//                             unCheckedChildren="Tắt"
//                         />
//                     </div>
//                 </Card>

//                 {/* Đèn LED */}
//                 <Card title="Đèn LED" className="shadow-md">
//                     <div className="flex justify-between items-center">
//                         <span>Trạng thái</span>
//                         <Switch
//                             checked={devices.LED}
//                             onChange={() => handleDeviceToggle('LED')}
//                             checkedChildren="Bật"
//                             unCheckedChildren="Tắt"
//                         />
//                     </div>
//                 </Card>

//                 {/* Phun sương */}
//                 <Card title="Phun sương" className="shadow-md">
//                     <div className="flex justify-between items-center">
//                         <span>Trạng thái</span>
//                         <Switch
//                             checked={devices.Mist}
//                             onChange={() => handleDeviceToggle('Mist')}
//                             checkedChildren="Bật"
//                             unCheckedChildren="Tắt"
//                         />
//                     </div>
//                 </Card>

//                 {/* Servo */}
//                 <Card title="Servo" className="shadow-md">
//                     <div className="space-y-4">
//                         <div className="flex justify-between items-center">
//                             <span>Trạng thái</span>
//                             <Switch
//                                 checked={devices.servo.enabled}
//                                 onChange={() => handleDeviceToggle('servo')}
//                                 checkedChildren="Bật"
//                                 unCheckedChildren="Tắt"
//                             />
//                         </div>
//                         <div className="space-y-2">
//                             <div className="flex items-center gap-2">
//                                 <Input
//                                     placeholder="Nhập thời gian (giây)"
//                                     value={termInput}
//                                     onChange={(e) => setTermInput(e.target.value)}
//                                     type="number"
//                                     min="1"
//                                     suffix="giây"
//                                 />
//                                 <Button type="primary" onClick={handleTermChange}>
//                                     Cập nhật
//                                 </Button>
//                             </div>
//                             <div className="text-sm text-gray-500">
//                                 Thời gian hiện tại: {Math.round(devices.servo.term / 1000)} giây
//                             </div>
//                         </div>
//                     </div>
//                 </Card>
//             </div>
//         </div>
//     );
// };

// export default DeviceControl;



"use client";

import React, { useState, useEffect } from 'react';
import { Container, Typography, Switch, FormControlLabel, Box, Grid, TextField, Button } from '@mui/material';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../Database/firebaseConfig';

const DeviceControl = () => {
  const [devices, setDevices] = useState({
    FAN: false,
    LED: false,
    Mist: false,
    servo: {
      enabled: false,
      term: 300000, // Thời gian mặc định (ms)
    },
  });
  const [termInput, setTermInput] = useState('');
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [config, setConfig] = useState({
    temperatureThreshold: 37.5,
    humidityThreshold: 60,
    luxThreshold: 200,
  });
  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    lux: null,
  });

  // Tải cấu hình từ local storage
  useEffect(() => {
    const savedConfig = localStorage.getItem('sensorConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Lấy dữ liệu cảm biến từ Firebase
  useEffect(() => {
    const sensorRef = ref(database, 'Sensor');
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData({
          temperature: data.temperature,
          humidity: data.humidity,
          lux: data.lux,
        });
      }
    }, (error) => {
      console.error('Error fetching sensor data:', error);
    });

    return () => {
      unsubscribeSensor();
    };
  }, []);

  // Lắng nghe thay đổi trạng thái thiết bị từ Firebase
  useEffect(() => {
    const deviceRefs = {
      FAN: ref(database, 'devices/FAN/state'),
      LED: ref(database, 'devices/LED/state'),
      Mist: ref(database, 'devices/Mist/state'),
    };
    const servoRef = ref(database, 'servo');

    const unsubscribes = Object.keys(deviceRefs).map((device) =>
      onValue(deviceRefs[device], (snapshot) => {
        const data = snapshot.val();
        if (data !== null) {
          setDevices((prevDevices) => ({ ...prevDevices, [device]: data }));
        }
      })
    );

    const unsubscribeServo = onValue(servoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDevices((prevDevices) => ({
          ...prevDevices,
          servo: {
            enabled: data.enabled,
            term: data.term,
          },
        }));
      }
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      unsubscribeServo();
    };
  }, []);

  // Tự động điều khiển thiết bị dựa trên dữ liệu cảm biến và cấu hình
  useEffect(() => {
    if (sensorData && isAutoMode) {
      const { temperature, humidity, lux } = sensorData;

      // Điều khiển Quạt
      if (temperature > config.temperatureThreshold && !devices.FAN) {
        toggleDevice('FAN');
      } else if (temperature <= config.temperatureThreshold && devices.FAN) {
        toggleDevice('FAN');
      }

      // Điều khiển Đèn LED
      if (temperature < config.temperatureThreshold && !devices.LED) {
        toggleDevice('FAN');
      } else if (temperature >= config.temperatureThreshold && devices.FAN) {
        toggleDevice('FAN');
      }

      // Điều khiển Phun sương
      if (humidity < config.humidityThreshold && !devices.Mist) {
        toggleDevice('Mist');
      } else if (humidity >= config.humidityThreshold && devices.Mist) {
        toggleDevice('Mist');
      }
    }
  }, [sensorData, devices, isAutoMode, config]);

  const toggleDevice = async (device) => {
    try {
      if (device === 'servo') {
        const newEnabledState = !devices.servo.enabled;
        setDevices((prevDevices) => ({
          ...prevDevices,
          servo: { ...prevDevices.servo, enabled: newEnabledState },
        }));
        await set(ref(database, 'servo/enabled'), newEnabledState);
      } else {
        const newState = !devices[device];
        setDevices((prevDevices) => ({ ...prevDevices, [device]: newState }));
        await set(ref(database, `devices/${device}/state`), newState);
      }
    } catch (error) {
      console.error(`Error updating ${device} state: `, error);
    }
  };

  const handleTermChange = async () => {
    try {
      const termValue = parseInt(termInput);
      if (isNaN(termValue) || termValue <= 0) {
        alert('Vui lòng nhập thời gian hợp lệ!');
        return;
      }
      const termInMilliseconds = termValue * 1000;
      await set(ref(database, 'servo/term'), termInMilliseconds);
      alert('Đã cập nhật thời gian servo!');
      setTermInput('');
    } catch (error) {
      console.error('Error updating servo term:', error);
      alert('Có lỗi xảy ra khi cập nhật thời gian!');
    }
  };

  const handleAutoModeToggle = () => {
    setIsAutoMode(!isAutoMode);
  };

  const handleConfigChange = (key, value) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [key]: value === '' ? '' : parseFloat(value),
    }));
  };

  const saveConfig = () => {
    localStorage.setItem('sensorConfig', JSON.stringify(config));
    alert('Cấu hình đã được lưu!');
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom style={{ color: '#1976d2' }}>
        Điều khiển thiết bị
      </Typography>
      <Box mt={2} mb={2}>
        <FormControlLabel
          control={
            <Switch
              checked={isAutoMode}
              onChange={handleAutoModeToggle}
              color="primary"
            />
          }
          label="Chế độ tự động"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Thiết bị */}
        {['FAN', 'LED', 'Mist'].map((device) => (
          <Grid item xs={12} sm={4} key={device}>
            <Box
              bgcolor={devices[device] ? '#e0f7fa' : '#ffebee'}
              p={2}
              borderRadius={2}
              textAlign="center"
              boxShadow={3}
            >
              <Typography variant="h6" gutterBottom>
                {device === 'FAN' ? 'Quạt' : device === 'LED' ? 'Đèn LED' : 'Phun sương'}
              </Typography>
              <Switch
                checked={devices[device]}
                onChange={() => toggleDevice(device)}
                color="primary"
                disabled={isAutoMode}
              />
            </Box>
          </Grid>
        ))}

        {/* Servo */}
        <Grid item xs={12} sm={4}>
          <Box
            bgcolor={devices.servo.enabled ? '#e0f7fa' : '#ffebee'}
            p={2}
            borderRadius={2}
            textAlign="center"
            boxShadow={3}
          >
            <Typography variant="h6" gutterBottom>
              Servo
            </Typography>
            <Switch
              checked={devices.servo.enabled}
              onChange={() => toggleDevice('servo')}
              color="primary"
            />
            <Box mt={2}>
              <TextField
                label="Thời gian (giây)"
                variant="outlined"
                fullWidth
                type="number"
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
              />
              <Box mt={1} textAlign="center">
                <Button variant="contained" color="primary" onClick={handleTermChange}>
                  Cập nhật
                </Button>
              </Box>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Thời gian hiện tại: {Math.round(devices.servo.term / 1000)} giây
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Cấu hình chế độ tự động */}
      <Box mt={4} p={2} bgcolor="#f5f5f5" borderRadius={2} boxShadow={1}>
        <Typography variant="h5" gutterBottom style={{ color: '#1976d2' }}>
          Cấu hình chế độ tự động
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Ngưỡng nhiệt độ (°C)"
              variant="outlined"
              fullWidth
              type="number"
              value={config.temperatureThreshold}
              onChange={(e) => handleConfigChange('temperatureThreshold', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Ngưỡng độ ẩm (%)"
              variant="outlined"
              fullWidth
              type="number"
              value={config.humidityThreshold}
              onChange={(e) => handleConfigChange('humidityThreshold', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Ngưỡng ánh sáng (lux)"
              variant="outlined"
              fullWidth
              type="number"
              value={config.luxThreshold}
              onChange={(e) => handleConfigChange('luxThreshold', e.target.value)}
            />
          </Grid>
        </Grid>
        <Box mt={2} textAlign="center">
          <Button variant="contained" color="primary" onClick={saveConfig}>
            Lưu cấu hình
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default DeviceControl;