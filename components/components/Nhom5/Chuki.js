"use client";
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  listAll,
  getDownloadURL,
  getMetadata
} from 'firebase/storage';
import { firestoreDb, storage } from '../../Database/firebaseConfig';
import {
  Card,
  Button,
  List,
  Alert,
  Space,
  Typography,
  notification,
  Input,
  Modal,
  Image,
  Carousel,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const HatchCycleManager = () => {
  const [hatchCycle, setHatchCycle] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [photoURLs, setPhotoURLs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [cycleName, setCycleName] = useState('');
  const [numberOfEggs, setNumberOfEggs] = useState('');

  // Lấy danh sách ảnh từ Firebase Storage
  // Sửa lại hàm fetchPhotos
  const fetchPhotos = async () => {
    try {
      const photosRef = storageRef(storage, 'photos/');
      const result = await listAll(photosRef);
      
      // Lấy thời gian bắt đầu của chu kỳ
      const cycleStartTime = hatchCycle.startDate.toDate().getTime();

      // Lấy metadata của từng ảnh và lọc theo thời gian
      const photoPromises = result.items.map(async (item) => {
        try {
          const metadata = await getMetadata(item);
          const photoTimeCreated = new Date(metadata.timeCreated).getTime();
          
          // Chỉ lấy URL của ảnh nếu thời gian tạo lớn hơn thời gian bắt đầu chu kỳ
          if (photoTimeCreated > cycleStartTime) {
            const url = await getDownloadURL(item);
            return {
              url,
              timeCreated: photoTimeCreated
            };
          }
        } catch (metadataError) {
          console.error('Lỗi khi lấy metadata:', metadataError);
        }
        return null;
      });

      const photos = await Promise.all(photoPromises);
      // Lọc bỏ các giá trị null và sắp xếp theo thời gian tạo
      const validPhotos = photos
        .filter(photo => photo !== null)
        .sort((a, b) => b.timeCreated - a.timeCreated);

      setPhotoURLs(validPhotos.map(photo => photo.url));
    } catch (error) {
      console.error('Lỗi khi tải ảnh:', error);
    }
  };

console.log("photo " , photoURLs)

  // Lấy dữ liệu cảm biến từ Firestore
  useEffect(() => {
    if (!hatchCycle) return;

    const fetchSensorData = () => {
      setLoading(true);

      const startDate = hatchCycle.startDate; // Firestore Timestamp
      const q = query(
        collection(firestoreDb, 'SensorData'),
        // where('timestamp', '>=', startDate), // Lấy dữ liệu từ startDate trở đi
        orderBy('timestamp', 'asc') // Sắp xếp theo thời gian tăng dần
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSensorData(data);
        fetchPhotos();
        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchSensorData();
  }, [hatchCycle]);

  // Lấy dữ liệu chu kỳ ấp từ Firestore
  useEffect(() => {
    const fetchHatchCycle = () => {
      setLoading(true);
      const q = query(
        collection(firestoreDb, 'chuki'),
        where('status', '==', 'doing')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setHatchCycle({ id: querySnapshot.docs[0].id, ...data });
        } else {
          setHatchCycle(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchHatchCycle();
  }, []);

  // Bắt đầu chu kỳ ấp mới
  const startNewHatchCycle = async () => {
    if (!cycleName || !numberOfEggs) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin trước khi tạo chu kỳ mới.',
      });
      return;
    }

    const startDate = new Date();
    const expectedDate = new Date(startDate);
    expectedDate.setDate(startDate.getDate() + 21); // 21 ngày

    const status = 'doing';

    try {
      await addDoc(collection(firestoreDb, 'chuki'), {
        name: cycleName,
        startDate: Timestamp.fromDate(startDate),
        expectedDate: Timestamp.fromDate(expectedDate),
        numberOfEggs: Number(numberOfEggs),
        status,
      });
      notification.success({
        message: 'Thành công',
        description: 'Chu kỳ mới đã được tạo!',
      });
      setCycleName('');
      setNumberOfEggs('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating new hatch cycle:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tạo chu kỳ mới.',
      });
    }
  };

  // Quản lý chu kỳ ấp
  const manageHatchCycle = () => {
    Modal.confirm({
      title: 'Quản lý chu kỳ',
      content: 'Bạn muốn làm gì với chu kỳ này?',
      okText: 'Hoàn thành',
      cancelText: 'Đóng',
      onOk: async () => {
        try {
          if (hatchCycle) {
            const cycleDocRef = doc(firestoreDb, 'chuki', hatchCycle.id);
            await updateDoc(cycleDocRef, { status: 'done' });
            notification.success({
              message: 'Thành công',
              description: 'Chu kỳ đã được đánh dấu là hoàn thành!',
            });
            setHatchCycle(null);
          }
        } catch (error) {
          console.error('Error completing hatch cycle:', error);
          notification.error({
            message: 'Lỗi',
            description: 'Không thể hoàn thành chu kỳ.',
          });
        }
      },
      onCancel: () => {},
      afterClose: () => {},
    });
  };

  // Tính toán giá trị trung bình
  const calculateAverage = (key) => {
    if (sensorData.length === 0) return 'N/A';
    const total = sensorData.reduce((sum, item) => sum + item[key], 0);
    return (total / sensorData.length).toFixed(1);
  };

  // Dự đoán trạng thái lồng ấp
  const predictIncubatorStatus = (avgTemperature, avgHumidity) => {
    if (avgTemperature === 'N/A' || avgHumidity === 'N/A') {
      return 'Dữ liệu không đủ để dự đoán.';
    }

    const isTemperatureStable =
      avgTemperature >= 37 && avgTemperature <= 39; // Tiêu chuẩn nhiệt độ
    const isHumidityStable = avgHumidity >= 55 && avgHumidity <= 65; // Tiêu chuẩn độ ẩm

    if (isTemperatureStable && isHumidityStable) {
      return 'Lồng ấp đang hoạt động ổn định.';
    } else if (!isTemperatureStable && !isHumidityStable) {
      return 'Cảnh báo: Nhiệt độ và độ ẩm không đạt yêu cầu!';
    } else if (!isTemperatureStable) {
      return 'Cảnh báo: Nhiệt độ không đạt yêu cầu!';
    } else {
      return 'Cảnh báo: Độ ẩm không đạt yêu cầu!';
    }
  };

  const averageTemperature = calculateAverage('temperature');
  const averageHumidity = calculateAverage('humidity');

  return (
    <div className="p-6">   
        <style>
        {`
          .ant-modal-confirm-btns .ant-btn-primary {
            background-color: #1890ff; /* Màu nền xanh */
            border-color: #1890ff; /* Màu viền xanh */
          }

          .ant-modal-confirm-btns .ant-btn-primary:hover {
            background-color: #40a9ff; /* Màu nền khi hover */
            border-color: #40a9ff; /* Màu viền khi hover */
          }
        `}
      </style>
      <Title level={2} style={{ textAlign: 'center' }}>
        Quản lý chu kỳ ấp trứng
      </Title>

      {loading ? (
        <Text>Đang tải dữ liệu...</Text>
      ) : hatchCycle ? (
        <>
          <Card>
            <Title level={4}>Thông tin chu kỳ</Title>
            <Text>Tên chu kỳ: {hatchCycle.name}</Text>
            <br />
            <Text>
              Ngày bắt đầu:{' '}
              {new Date(hatchCycle.startDate.toDate()).toLocaleDateString()}
            </Text>
            <br />
            <Text>
              Ngày dự kiến hoàn thành:{' '}
              {new Date(hatchCycle.expectedDate.toDate()).toLocaleDateString()}
            </Text>
            <br />
            <Text>Số lượng trứng: {hatchCycle.numberOfEggs}</Text>
            <br />
            <Text>
              Trạng thái:{' '}
              {hatchCycle.status === 'doing' ? 'Đang ấp' : 'Hoàn thành'}
            </Text>
            <br />
            <Button
              type="primary"
              danger
              icon={<ReloadOutlined />}
              onClick={manageHatchCycle}
              style={{ marginTop: '10px' }}
            >
              Quản lý chu kỳ
            </Button>
          </Card>

          <Card style={{ marginTop: '20px' }}>
            <Title level={4}>Dữ liệu cảm biến</Title>
            <Text>
              Nhiệt độ trung bình toàn chu kỳ: {averageTemperature}°C
            </Text>
            <br />
            <Text>Độ ẩm trung bình toàn chu kỳ: {averageHumidity}%</Text>
            <br />
            <Text type="danger" style={{ fontWeight: 'bold', marginTop: '10px' }}>
              {predictIncubatorStatus(
                parseFloat(averageTemperature),
                parseFloat(averageHumidity)
              )}
            </Text>
          </Card>

          <Card style={{ marginTop: '20px' }}>
            <Title level={4}>Ảnh từ lồng ấp</Title>
            {photoURLs.length > 0 ? (
              <Carousel autoplay>
                {photoURLs.map((url, index) => (
                  <div key={index}>
                    <Image src={url} alt={`Photo ${index}`} />
                  </div>
                ))}
              </Carousel>
            ) : (
              <Text>Không có ảnh nào được chụp trong chu kỳ này.</Text>
            )}
          </Card>
        </>
      ) : showCreateForm ? (
        <Card>
          <Title level={4} style={{ textAlign: 'center' }}>
            Tạo chu kỳ mới
          </Title>
          <Input
            placeholder="Tên chu kỳ"
            value={cycleName}
            onChange={(e) => setCycleName(e.target.value)}
            style={{ marginBottom: '15px' }}
          />
          <Input
            placeholder="Số lượng trứng"
            value={numberOfEggs}
            onChange={(e) => setNumberOfEggs(e.target.value)}
            style={{ marginBottom: '15px' }}
            type="number"
          />
          <Space style={{ justifyContent: 'center' }}>
            <Button type="primary" style={{backgroundColor : '#1890ff'}} onClick={startNewHatchCycle}>
              Tạo
            </Button>
            <Button onClick={() => setShowCreateForm(false)}>Hủy</Button>
          </Space>
        </Card>
      ) : (
        <Card>
          <Text style={{ fontSize: '18px', color: '#757575' }}>
            Chưa có chu kỳ nào đang hoạt động.
          </Text>
          <Button
            type="primary"
            onClick={() => setShowCreateForm(true)}
            style={{ marginTop: '20px', backgroundColor: '#1890ff' }}
          >
            Tạo chu kỳ mới
          </Button>
        </Card>
      )}
    </div>
  );
};

export default HatchCycleManager;