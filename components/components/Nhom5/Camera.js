'use client'
import React, { useState, useEffect } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../../Database/firebaseConfig';

const Camera = () => {
  const [mode, setMode] = useState('manual');
  const [latestPhoto, setLatestPhoto] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [timeUnit, setTimeUnit] = useState('minutes'); // 'minutes' or 'hours'

  useEffect(() => {
    // Lắng nghe thay đổi ảnh mới nhất
    const photosRef = ref(database, 'photos');
    onValue(photosRef, (snapshot) => {
      if (snapshot.exists()) {
        const photos = snapshot.val();
        const photoUrls = Object.values(photos);
        setLatestPhoto(photoUrls[photoUrls.length - 1]);
      }
    });
  }, []);

  const handleCapture = () => {
    const captureRef = ref(database, 'capture');
    set(captureRef, {
      command: true,
      mode: 'manual',
      interval: 0
    });
    
    // Reset command sau 1 giây
    setTimeout(() => {
      set(captureRef, {
        command: false,
        mode: 'manual',
        interval: 0
      });
    }, 1000);
  };

  const handleAutoMode = () => {
    const milliseconds = calculateMilliseconds();
    const captureRef = ref(database, 'capture');
    set(captureRef, {
      command: false,
      mode: 'auto',
      interval: milliseconds
    });
  };

  const calculateMilliseconds = () => {
    const value = parseInt(timeValue);
    if (timeUnit === 'minutes') {
      return value * 60 * 1000; // Chuyển phút sang milliseconds
    } else {
      return value * 60 * 60 * 1000; // Chuyển giờ sang milliseconds
    }
  };

  return (
    <div className="camera-container">
      <div className="card">
        <h2 className="title">Camera Control Panel</h2>
        
        <div className="mode-buttons">
          <button 
            className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}>
            <i className="fas fa-camera"></i>
            Manual Mode
          </button>
          <button 
            className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
            onClick={() => setMode('auto')}>
            <i className="fas fa-clock"></i>
            Auto Mode
          </button>
        </div>
  
        {mode === 'manual' ? (
          <div className="manual-container">
            <button className="capture-button" onClick={handleCapture}>
              <i className="fas fa-camera"></i>
              Chụp ảnh
            </button>
            {latestPhoto && (
              <div className="image-container">
                <img src={latestPhoto} alt="Preview" className="preview" />
              </div>
            )}
          </div>
        ) : (
          <div className="auto-container">
            <div className="input-group">
              <input
                type="number"
                className="time-input"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                placeholder="Nhập thời gian"
              />
              <div className="unit-buttons">
                <button 
                  className={`unit-btn ${timeUnit === 'minutes' ? 'active' : ''}`}
                  onClick={() => setTimeUnit('minutes')}>
                  Phút
                </button>
                <button 
                  className={`unit-btn ${timeUnit === 'hours' ? 'active' : ''}`}
                  onClick={() => setTimeUnit('hours')}>
                  Giờ
                </button>
              </div>
            </div>
            <button className="set-button" onClick={handleAutoMode}>
              <i className="fas fa-check"></i>
              Cài đặt
            </button>
          </div>
        )}
  
        <style jsx>{`
          .camera-container {
          width: 100%;
          height: 100%;
          min-height: calc(100vh - 60px); /* Trừ đi chiều cao của header nếu có */
          padding: 20px;
          background-color: #f8f9fa;
        }

        .card {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          width: 100%;
          height: 100%;
          min-height: calc(100vh - 100px); /* Trừ đi padding và các khoảng cách khác */
        }
  
          .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
          }
  
          .title {
            text-align: center;
            color: #2d3748;
            margin-bottom: 30px;
            font-size: 24px;
            font-weight: 600;
          }
  
          .mode-buttons {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
          }
  
          .mode-btn {
            flex: 1;
            padding: 12px;
            border-radius: 12px;
            border: none;
            background: #f7fafc;
            color: #4a5568;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
  
          .mode-btn:hover {
            background: #edf2f7;
          }
  
          .mode-btn.active {
            background: #4299e1;
            color: white;
          }
  
          .manual-container, .auto-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
  
          .capture-button, .set-button {
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
          }
  
          .capture-button:hover, .set-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(66, 153, 225, 0.4);
          }
  
          .image-container {
            width: 100%;
            padding: 10px;
            background: #f7fafc;
            border-radius: 12px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
          }
  
          .preview {
            width: 100%;
            height: auto;
            border-radius: 8px;
            display: block;
          }
  
          .input-group {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
  
          .time-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 16px;
            transition: all 0.2s ease;
          }
  
          .time-input:focus {
            border-color: #4299e1;
            outline: none;
            box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
          }
  
          .unit-buttons {
            display: flex;
            gap: 10px;
          }
  
          .unit-btn {
            flex: 1;
            padding: 10px;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
            background: white;
            color: #4a5568;
            cursor: pointer;
            transition: all 0.2s ease;
          }
  
          .unit-btn:hover {
            background: #f7fafc;
          }
  
          .unit-btn.active {
            border-color: #4299e1;
            background: #ebf8ff;
            color: #2b6cb0;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Camera;