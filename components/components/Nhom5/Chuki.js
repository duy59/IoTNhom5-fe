"use client"
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { firestoreDb } from '../../Database/firebaseConfig';
import { Card, Button, List, Alert, Space, Typography, notification } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const HatchCycleManager = () => {
    const [hatchCycle, setHatchCycle] = useState(null);
    const [sensorData, setSensorData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load hatch cycle data on mount
    useEffect(() => {
        const loadHatchCycle = async () => {
            try {
                const savedCycle = localStorage.getItem('hatchCycle');
                if (savedCycle) {
                    setHatchCycle(JSON.parse(savedCycle));
                }
            } catch (error) {
                console.error('Error loading hatch cycle:', error);
            }
        };

        loadHatchCycle();
    }, []);

    // Fetch real-time sensor data from Firebase
    useEffect(() => {
        if (!hatchCycle) return;

        const fetchSensorData = () => {
            setLoading(true);

            const startDate = Timestamp.fromDate(new Date(hatchCycle.startDate));
            const q = query(
                collection(firestoreDb, 'SensorData'),
                where('timestamp', '>=', startDate),
                orderBy('timestamp', 'desc')
            );

            const unsubscribe = onSnapshot(q, querySnapshot => {
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                console.log('Sensor data:', data);
                setSensorData(data);
                checkConditions(data); // Kiểm tra điều kiện và hiển thị thông báo
                setLoading(false);
            });

            return () => unsubscribe();
        };

        fetchSensorData();
    }, [hatchCycle]);

    // Kiểm tra điều kiện và hiển thị thông báo
    const checkConditions = (data) => {
        if (data.length === 0) return;

        const latestData = data[0];
        const avgTemp = calculateAverage(data, 'temperature');
        const avgHumidity = calculateAverage(data, 'humidity');

        // Kiểm tra nhiệt độ
        if (latestData.temperature > 38.5) {
            notification.warning({
                message: 'Cảnh báo nhiệt độ cao',
                description: 'Nhiệt độ hiện tại vượt quá 38.5°C. Cần điều chỉnh giảm nhiệt độ.',
                duration: 0,
            });
        } else if (latestData.temperature < 37) {
            notification.warning({
                message: 'Cảnh báo nhiệt độ thấp',
                description: 'Nhiệt độ hiện tại dưới 37°C. Cần điều chỉnh tăng nhiệt độ.',
                duration: 0,
            });
        }

        // Kiểm tra độ ẩm
        if (latestData.humidity > 65) {
            notification.warning({
                message: 'Cảnh báo độ ẩm cao',
                description: 'Độ ẩm hiện tại vượt quá 65%. Cần giảm độ ẩm.',
                duration: 0,
            });
        } else if (latestData.humidity < 55) {
            notification.warning({
                message: 'Cảnh báo độ ẩm thấp',
                description: 'Độ ẩm hiện tại dưới 55%. Cần tăng độ ẩm.',
                duration: 0,
            });
        }

        // Kiểm tra trung bình
        if (avgTemp > 38 || avgTemp < 37.5) {
            notification.warning({
                message: 'Cảnh báo nhiệt độ trung bình',
                description: `Nhiệt độ trung bình (${avgTemp}°C) nằm ngoài khoảng tối ưu (37.5°C - 38°C).`,
                duration: 0,
            });
        }

        if (avgHumidity > 63 || avgHumidity < 57) {
            notification.warning({
                message: 'Cảnh báo độ ẩm trung bình',
                description: `Độ ẩm trung bình (${avgHumidity}%) nằm ngoài khoảng tối ưu (57% - 63%).`,
                duration: 0,
            });
        }
    };

    const startHatchCycle = async () => {
        const startDate = new Date();
        const expectedHatchDate = new Date(startDate);
        expectedHatchDate.setDate(startDate.getDate() + 21);

        const newCycle = {
            startDate: startDate.toISOString(),
            expectedHatchDate: expectedHatchDate.toISOString(),
            daysElapsed: 0,
            sensorLogs: [],
        };

        try {
            localStorage.setItem('hatchCycle', JSON.stringify(newCycle));
            setHatchCycle(newCycle);
            notification.success({
                message: 'Thành công',
                description: 'Chu kỳ ấp trứng đã bắt đầu!',
            });
        } catch (error) {
            console.error('Error starting hatch cycle:', error);
        }
    };

    const resetHatchCycle = async () => {
        try {
            localStorage.removeItem('hatchCycle');
            setHatchCycle(null);
            notification.success({
                message: 'Thành công',
                description: 'Chu kỳ ấp trứng đã được đặt lại!',
            });
        } catch (error) {
            console.error('Error resetting hatch cycle:', error);
        }
    };

    const calculateAverage = (data, key) => {
        if (data.length === 0) return 0;
        const total = data.reduce((sum, item) => sum + item[key], 0);
        return Number((total / data.length).toFixed(1));
    };

    const averageTemperature = calculateAverage(sensorData, 'temperature');
    const averageHumidity = calculateAverage(sensorData, 'humidity');

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <Title level={2}>Quản lý chu kỳ ấp trứng</Title>
                {hatchCycle && (
                    <Button
                        type="primary"
                        danger
                        icon={<ReloadOutlined />}
                        onClick={resetHatchCycle}
                    >
                        Đặt lại
                    </Button>
                )}
            </div>

            {!hatchCycle ? (
                <Card>
                    <Text className="block mb-4 text-gray-600 text-lg">
                        Chưa có chu kỳ ấp trứng nào.
                    </Text>
                    <Button type="primary" onClick={startHatchCycle}>
                        Bắt đầu chu kỳ ấp trứng
                    </Button>
                </Card>
            ) : (
                <Space direction="vertical" className="w-full" size="large">
                    <Card title="Thông tin chu kỳ">
                        <Text>Ngày bắt đầu: {new Date(hatchCycle.startDate).toLocaleDateString()}</Text>
                        <br />
                        <Text>Ngày dự kiến nở: {new Date(hatchCycle.expectedHatchDate).toLocaleDateString()}</Text>
                        <br />
                        <Text>Số ngày đã trôi qua: {hatchCycle.daysElapsed}</Text>
                    </Card>

                    <Card title="Thống kê">
                        <Text>Nhiệt độ trung bình: {averageTemperature}°C</Text>
                        <br />
                        <Text>Độ ẩm trung bình: {averageHumidity}%</Text>
                    </Card>

                    <Card title="Dữ liệu cảm biến hiện tại">
                        {loading ? (
                            <Text>Đang tải dữ liệu...</Text>
                        ) : (
                            <List
                                dataSource={sensorData}
                                renderItem={item => (
                                    <List.Item>
                                        <Space direction="vertical">
                                            <Text>Thời gian: {new Date(item.timestamp.toDate()).toLocaleString()}</Text>
                                            <Text>Nhiệt độ: {item.temperature}°C</Text>
                                            <Text>Độ ẩm: {item.humidity}%</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Space>
            )}
        </div>
    );
};

export default HatchCycleManager;