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
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { ref, set, onValue } from 'firebase/database';
import { firestoreDb, database, storage } from '../../Database/firebaseConfig';
import {
  Card,
  Button,
  Form,
  Select,
  Input,
  Typography,
  notification,
  Space,
  Statistic,
  Row,
  Col,
  Image,
  Timeline,
  Progress,
  Tabs,
  Table,
  Tag,
  Divider,
} from 'antd';
import {
  CameraOutlined,
  DashboardOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  LineChartOutlined,
  EnvironmentOutlined,
  CloudOutlined,
  ClockCircleOutlined,
  PictureOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Cấu hình cho từng loại trứng
const DUCK_EGG_CONFIG = {
  young: {
    name: 'Vịt lộn non',
    temperature: 37.8,
    humidity: 60,
    duration: 12,
    stages: {
      1: { day: 1, description: 'Bắt đầu ấp trứng' },
      2: { day: 4, description: 'Kiểm tra phôi lần 1' },
      3: { day: 8, description: 'Kiểm tra phôi lần 2' },
      4: { day: 12, description: 'Thu hoạch' },
    }
  },
  old: {
    name: 'Vịt lộn già',
    temperature: 37.8,
    humidity: 60,
    duration: 14,
    stages: {
      1: { day: 1, description: 'Bắt đầu ấp trứng' },
      2: { day: 5, description: 'Kiểm tra phôi lần 1' },
      3: { day: 10, description: 'Kiểm tra phôi lần 2' },
      4: { day: 14, description: 'Thu hoạch' },
    }
  }
};

// Định nghĩa cột cho bảng dữ liệu hàng ngày
const dailyColumns = [
  {
    title: 'Ngày',
    dataIndex: 'date',
    key: 'date',
    render: (date) => new Date(date).toLocaleDateString(),
  },
  {
    title: 'Nhiệt độ trung bình',
    dataIndex: 'averageTemp',
    key: 'averageTemp',
    render: (temp) => (
      <span>
        <EnvironmentOutlined style={{ color: '#ff4d4f' }} /> {temp}°C
      </span>
    ),
  },
  {
    title: 'Độ ẩm trung bình',
    dataIndex: 'averageHumidity',
    key: 'averageHumidity',
    render: (humidity) => (
      <span>
        <CloudOutlined style={{ color: '#1890ff' }} /> {humidity}%
      </span>
    ),
  },
  {
    title: 'Số lần quay trứng',
    dataIndex: 'rotationCount',
    key: 'rotationCount',
    render: (count) => (
      <span>
        <ClockCircleOutlined /> {count} lần
      </span>
    ),
  },
  {
    title: 'Số ảnh chụp',
    dataIndex: 'photoCount',
    key: 'photoCount',
    render: (count) => (
      <span>
        <PictureOutlined /> {count} ảnh
      </span>
    ),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status) => {
      let color = 'green';
      let text = 'Bình thường';
      let icon = <CheckCircleOutlined />;

      if (status === 'warning') {
        color = 'orange';
        text = 'Cảnh báo';
        icon = <WarningOutlined />;
      } else if (status === 'error') {
        color = 'red';
        text = 'Nguy hiểm';
        icon = <WarningOutlined />;
      }

      return (
        <Tag color={color} icon={icon}>
          {text}
        </Tag>
      );
    },
  },
  {
    title: 'Ghi chú',
    dataIndex: 'notes',
    key: 'notes',
    ellipsis: true,
  },
];
const HatchCycleManager = () => {
  const [currentCycle, setCurrentCycle] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [cycleProgress, setCycleProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [latestPhoto, setLatestPhoto] = useState('');
  const [cyclePhotos, setCyclePhotos] = useState([]);
  const [form] = Form.useForm();

  // Lấy dữ liệu chu kỳ từ Firestore
  useEffect(() => {
    const q = query(
      collection(firestoreDb, 'chuki'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const cycleData = snapshot.docs[0].data();
        setCurrentCycle({
          id: snapshot.docs[0].id,
          ...cycleData,
          startDate: cycleData.startDate.toDate(),
          expectedDate: cycleData.expectedDate.toDate(),
        });
      } else {
        setCurrentCycle(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Lấy dữ liệu cảm biến từ Realtime Database
  useEffect(() => {
    const sensorRef = ref(database, 'Sensor');
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        setSensorData(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  // Lấy dữ liệu hình ảnh từ Storage
  useEffect(() => {
    if (!currentCycle) return;

    const fetchPhotos = async () => {
      // Logic lấy ảnh từ Firebase Storage
      // Cập nhật latestPhoto và cyclePhotos
    };

    fetchPhotos();
    
    // Thiết lập chụp ảnh tự động mỗi 1 giờ
    const photoInterval = setInterval(() => {
      handleCapture();
    }, 3600000);

    return () => clearInterval(photoInterval);
  }, [currentCycle]);

  // Xử lý chụp ảnh
  const handleCapture = async () => {
    try {
      const captureRef = ref(database, 'capture');
      await set(captureRef, {
        command: true,
        timestamp: Date.now()
      });

      notification.success({
        message: 'Chụp ảnh thành công',
        description: 'Ảnh mới sẽ được cập nhật sau vài giây',
      });
    } catch (error) {
      notification.error({
        message: 'Lỗi chụp ảnh',
        description: error.message,
      });
    }
  };

  // Tạo chu kỳ mới
  const createNewCycle = async (values) => {
    try {
      const config = DUCK_EGG_CONFIG[values.eggType];
      const startDate = new Date();
      const expectedDate = new Date(startDate);
      expectedDate.setDate(startDate.getDate() + config.duration);

      await addDoc(collection(firestoreDb, 'chuki'), {
        ...values,
        status: 'active',
        startDate: Timestamp.fromDate(startDate),
        expectedDate: Timestamp.fromDate(expectedDate),
        config: config,
      });

      // Cấu hình điều khiển tự động
      await set(ref(database, 'autoMode'), {
        enabled: true,
        config: {
          temperature: config.temperature,
          humidity: config.humidity,
        }
      });

      // Cấu hình servo
      await set(ref(database, 'servo'), {
        enabled: true,
        term: 300000, // 5 phút
        interval: 7200000, // 2 giờ
        restTime: 10000 // 10 giây
      });

      notification.success({
        message: 'Tạo chu kỳ thành công',
        description: 'Chu kỳ mới đã được bắt đầu',
      });
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: error.message,
      });
    }
  };

  return (
    <div className="p-6">
      <Title level={2}>Quản lý chu kỳ ấp trứng vịt lộn</Title>

      {loading ? (
        <Card loading={true} />
      ) : currentCycle ? (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={<span><DashboardOutlined />Tổng quan</span>}
            key="overview"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* Thông tin cơ bản */}
              <Card title="Thông tin chu kỳ">
                <Row gutter={16}>
                  <Col span={8}>
                    <Card className="inner-card">
                      <Statistic
                        title="Tiến độ chu kỳ"
                        value={cycleProgress}
                        suffix="%"
                        prefix={<Progress type="circle" percent={cycleProgress} width={80} />}
                      />
                      <Text type="secondary">
                        Ngày {Math.ceil((new Date() - currentCycle.startDate) / (1000 * 60 * 60 * 24))}/
                        {DUCK_EGG_CONFIG[currentCycle.eggType].duration}
                      </Text>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card className="inner-card">
                      <Statistic
                        title="Nhiệt độ hiện tại"
                        value={sensorData?.temperature}
                        suffix="°C"
                        prefix={<EnvironmentOutlined />}
                        valueStyle={{
                          color: sensorData?.temperature > 38.3 || sensorData?.temperature < 37.3
                            ? '#cf1322'
                            : '#3f8600',
                        }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card className="inner-card">
                      <Statistic
                        title="Độ ẩm hiện tại"
                        value={sensorData?.humidity}
                        suffix="%"
                        prefix={<CloudOutlined />}
                        valueStyle={{
                          color: sensorData?.humidity > 65 || sensorData?.humidity < 55
                            ? '#cf1322'
                            : '#3f8600',
                        }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>

              {/* Timeline tiến độ */}
              <Card title="Tiến độ chu kỳ">
                <Timeline mode="left">
                  {Object.values(DUCK_EGG_CONFIG[currentCycle.eggType].stages).map(stage => {
                    const stageDate = new Date(currentCycle.startDate);
                    stageDate.setDate(stageDate.getDate() + stage.day - 1);
                    const isPast = new Date() > stageDate;
                    
                    return (
                      <Timeline.Item
                        key={stage.day}
                        color={isPast ? 'green' : 'blue'}
                        label={stageDate.toLocaleDateString()}
                      >
                        <Text strong>{stage.description}</Text>
                        {isPast && <CheckCircleOutlined style={{ marginLeft: 8, color: '#52c41a' }} />}
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </Card>
            </Space>
          </TabPane>

          <TabPane
            tab={<span><CameraOutlined />Giám sát hình ảnh</span>}
            key="camera"
          >
            <Card title="Hình ảnh theo dõi">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="Camera trực tiếp">
                    <div className="live-camera">
                      <Image
                        src={latestPhoto}
                        alt="Live Camera"
                        style={{ width: '100%' }}
                        fallback="data:image/png;base64,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"
                      />
                      <Button
                        type="primary"
                        icon={<CameraOutlined />}
                        onClick={handleCapture}
                        style={{ marginTop: 16 }}
                      >
                        Chụp ảnh
                      </Button>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Lịch sử hình ảnh" style={{ maxHeight: 600, overflow: 'auto' }}>
                    <Row gutter={[8, 8]}>
                      {cyclePhotos.map((photo, index) => (
                        <Col span={12} key={index}>
                          <Card
                            hoverable
                            cover={<Image src={photo.url} alt={`Day ${photo.day}`} />}
                          >
                            <Card.Meta
                              title={`Ngày ${photo.day}`}
                              description={new Date(photo.timestamp).toLocaleString()}
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane
            tab={<span><HistoryOutlined />Dữ liệu hàng ngày</span>}
            key="daily"
          >
            <Card title="Thống kê hàng ngày">
              <Table
                columns={dailyColumns}
                dataSource={dailyData}
                rowKey="id"
                pagination={{ pageSize: 7 }}
              />
            </Card>
          </TabPane>
        </Tabs>
      ) : (
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={createNewCycle}
          >
            <Form.Item
              name="name"
              label="Tên chu kỳ"
              rules={[{ required: true, message: 'Vui lòng nhập tên chu kỳ!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="eggType"
              label="Loại trứng vịt lộn"
              rules={[{ required: true, message: 'Vui lòng chọn loại trứng!' }]}
            >
              <Select>
                <Option value="young">Vịt lộn non (12 ngày)</Option>
                <Option value="old">Vịt lộn già (14 ngày)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="numberOfEggs"
              label="Số lượng trứng"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng trứng!' }]}
            >
              <Input type="number" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Tạo chu kỳ mới
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      <style jsx global>{`
        .inner-card {
          text-align: center;
          background: #fafafa;
          border-radius: 8px;
          padding: 16px;
          height: 100%;
        }
        
        .live-camera {
          text-align: center;
          background: #f0f2f5;
          padding: 16px;
          border-radius: 8px;
        }

        .ant-timeline-item-label {
          width: 120px !important;
        }

        .ant-card-head-title {
          font-weight: 600;
        }

        .ant-statistic-title {
          color: rgba(0, 0, 0, 0.85);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default HatchCycleManager;