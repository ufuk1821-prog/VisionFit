import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import axios from 'axios';
import Sidebar from '../components/sidebar';

function Dashboard() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const [statusText, setStatusText] = useState('Model Yukleniyor...');
  const [angle, setAngle] = useState(0);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    let poseLandmarker;
    let stream;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      poseLandmarkerRef.current = poseLandmarker;

      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadeddata = () => {
        setStatusText('Harekete Basla');
        detectLoop();
      };
    };

    const detectLoop = () => {
      if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const drawingUtils = new DrawingUtils(ctx);
      const token = localStorage.getItem('token');
      let lastSentTime = 0;

      const detect = () => {
        const now = performance.now();
        const results = poseLandmarkerRef.current.detectForVideo(videoRef.current, now);

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
          drawingUtils.drawConnectors(results.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, { color: '#3b82f6', lineWidth: 3 });
          drawingUtils.drawLandmarks(results.landmarks[0], { color: '#10b981', lineWidth: 1, radius: 3 });

          if (now - lastSentTime > 500) {
            lastSentTime = now;
            const flat = [];
            results.landmarks[0].forEach((lm) => {
              flat.push(lm.x, lm.y, lm.z, lm.visibility ?? 0);
            });

            axios.post(
              `${import.meta.env.VITE_API_URL}/api/analyze/squat`,
              { landmarks: flat },
              { headers: { Authorization: `Bearer ${token}` } }
            ).then((res) => {
              setStatusText(res.data.antrenor_mesaji);
              setAngle(res.data.aci);
              setConfidence(res.data.eminlik);
            }).catch(() => {
              setStatusText('Sunucu Baglantisi Kesildi');
            });
          }
        }

        ctx.restore();
        animFrameRef.current = requestAnimationFrame(detect);
      };

      animFrameRef.current = requestAnimationFrame(detect);
    };

    init().catch(() => setStatusText('Kamera erisimi reddedildi.'));

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (poseLandmarker) poseLandmarker.close();
    };
  }, []);

  return (
    <div>
      <Sidebar />
      <div className="main-wrapper">
        <div className="video-container">
          <video ref={videoRef} id="webcam" autoPlay playsInline muted></video>
          <canvas ref={canvasRef} id="output_canvas" width="640" height="480"></canvas>
        </div>

        <div className="dashboard">
          <div className="card status-card">
            <div className="card-title">Antrenor Notu</div>
            <div className="card-value" style={{ fontSize: '1.2rem' }}>{statusText}</div>
          </div>
          <div className="card angle-card">
            <div className="card-title">Eklem Acisi</div>
            <div className="card-value">{angle}°</div>
          </div>
          <div className="card confidence-card">
            <div className="card-title">Eminlik Skoru</div>
            <div className="card-value">%{confidence}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;