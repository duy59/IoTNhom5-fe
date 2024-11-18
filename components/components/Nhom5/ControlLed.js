"use client"

import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../Database/firebaseConfig';
import { Card, Switch, Input, Button, message } from 'antd';

const DeviceControl = () => {
    const [devices, setDevices] = useState({
        FAN: false,
        LED: false,
        Mist: false,
        servo: {
            enabled: false,
            term: 300000
        }
    });
    const [termInput, setTermInput] = useState('');

    useEffect(() => {
        // Lắng nghe thay đổi từ Realtime Database
        const devicesRef = ref(database, 'devices');
        const servoRef = ref(database, 'servo');

        const unsubscribeDevices = onValue(devicesRef, (snapshot) => {
            const data = snapshot.val();
            setDevices(prev => ({
                ...prev,
                FAN: data.FAN.state,
                LED: data.LED.state,
                Mist: data.Mist.state,
            }));
        });

        const unsubscribeServo = onValue(servoRef, (snapshot) => {
            const data = snapshot.val();
            setDevices(prev => ({
                ...prev,
                servo: {
                    enabled: data.enabled,
                    term: data.term
                }
            }));
        });

        return () => {
            unsubscribeDevices();
            unsubscribeServo();
        };
    }, []);

    const handleDeviceToggle = async (device) => {
        try {
            if (device === 'servo') {
                await set(ref(database, 'servo/enabled'), !devices.servo.enabled);
            } else {
                await set(ref(database, `devices/${device}/state`), !devices[device]);
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi điều khiển thiết bị!');
        }
    };

    const handleTermChange = async () => {
        try {
            const termValue = parseInt(termInput);
            if (isNaN(termValue) || termValue <= 0) {
                message.error('Vui lòng nhập thời gian hợp lệ!');
                return;
            }
            // Chuyển đổi giây thành milliseconds
            const termInMilliseconds = termValue * 1000;
            await set(ref(database, 'servo/term'), termInMilliseconds);
            message.success('Đã cập nhật thời gian servo!');
            setTermInput('');
        } catch (error) {
            message.error('Có lỗi xảy ra khi cập nhật thời gian!');
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Điều khiển thiết bị</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Quạt */}
                <Card title="Quạt" className="shadow-md">
                    <div className="flex justify-between items-center">
                        <span>Trạng thái</span>
                        <Switch
                            checked={devices.FAN}
                            onChange={() => handleDeviceToggle('FAN')}
                            checkedChildren="Bật"
                            unCheckedChildren="Tắt"
                        />
                    </div>
                </Card>

                {/* Đèn LED */}
                <Card title="Đèn LED" className="shadow-md">
                    <div className="flex justify-between items-center">
                        <span>Trạng thái</span>
                        <Switch
                            checked={devices.LED}
                            onChange={() => handleDeviceToggle('LED')}
                            checkedChildren="Bật"
                            unCheckedChildren="Tắt"
                        />
                    </div>
                </Card>

                {/* Phun sương */}
                <Card title="Phun sương" className="shadow-md">
                    <div className="flex justify-between items-center">
                        <span>Trạng thái</span>
                        <Switch
                            checked={devices.Mist}
                            onChange={() => handleDeviceToggle('Mist')}
                            checkedChildren="Bật"
                            unCheckedChildren="Tắt"
                        />
                    </div>
                </Card>

                {/* Servo */}
                <Card title="Servo" className="shadow-md">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span>Trạng thái</span>
                            <Switch
                                checked={devices.servo.enabled}
                                onChange={() => handleDeviceToggle('servo')}
                                checkedChildren="Bật"
                                unCheckedChildren="Tắt"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Nhập thời gian (giây)"
                                    value={termInput}
                                    onChange={(e) => setTermInput(e.target.value)}
                                    type="number"
                                    min="1"
                                    suffix="giây"
                                />
                                <Button type="primary" onClick={handleTermChange}>
                                    Cập nhật
                                </Button>
                            </div>
                            <div className="text-sm text-gray-500">
                                Thời gian hiện tại: {Math.round(devices.servo.term / 1000)} giây
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DeviceControl;