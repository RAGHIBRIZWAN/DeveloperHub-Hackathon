import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Camera,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  Activity
} from 'lucide-react';
import { proctorAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProctoringMonitor = ({
  sessionId,
  onViolation,
  onTrustScoreChange,
}) => {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  
  const [isActive, setIsActive] = useState(false);
  const [trustScore, setTrustScore] = useState(100);
  const [violations, setViolations] = useState([]);
  const [faceDetected, setFaceDetected] = useState(true);
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [tabFocused, setTabFocused] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setPermissionGranted(true);
        }
      } catch (error) {
        console.error('Camera access denied:', error);
        toast.error('Camera access is required for proctoring');
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(`ws://localhost:8000/api/proctor/ws/${sessionId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'trust_score_update') {
        setTrustScore(data.score);
        onTrustScoreChange?.(data.score);
      }
      
      if (data.type === 'violation') {
        addViolation(data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

  // Tab focus detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const focused = !document.hidden;
      setTabFocused(focused);
      
      if (!focused) {
        reportViolation('tab_switch', 'User switched tabs');
      }
    };

    const handleBlur = () => {
      setTabFocused(false);
      reportViolation('window_blur', 'User left the window');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Start face detection analysis
  useEffect(() => {
    if (!permissionGranted || !isActive) return;

    const analyzeInterval = setInterval(() => {
      captureAndAnalyze();
    }, 5000); // Analyze every 5 seconds

    return () => clearInterval(analyzeInterval);
  }, [permissionGranted, isActive]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const response = await proctorAPI.analyzeFrame(sessionId, {
        image: imageData,
        timestamp: Date.now(),
      });

      const result = response.data;
      setFaceDetected(result.face_detected);
      setMultipleFaces(result.multiple_faces);

      if (!result.face_detected) {
        reportViolation('no_face', 'Face not detected in frame');
      }

      if (result.multiple_faces) {
        reportViolation('multiple_faces', 'Multiple faces detected');
      }

      setTrustScore(result.trust_score);
      onTrustScoreChange?.(result.trust_score);
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  const reportViolation = async (type, description) => {
    const violation = {
      type,
      description,
      timestamp: new Date(),
    };

    setViolations(prev => [...prev.slice(-9), violation]);
    onViolation?.(violation);

    try {
      await proctorAPI.reportEvent(sessionId, {
        event_type: type,
        description,
        severity: type === 'multiple_faces' ? 'high' : 'medium',
      });
    } catch (error) {
      console.error('Failed to report violation:', error);
    }
  };

  const addViolation = (data) => {
    const violation = {
      type: data.event_type,
      description: data.description,
      timestamp: new Date(data.timestamp),
    };
    
    setViolations(prev => [...prev.slice(-9), violation]);
    onViolation?.(violation);
  };

  const startProctoring = () => {
    setIsActive(true);
    toast.success('Proctoring started');
  };

  const getTrustScoreColor = () => {
    if (trustScore >= 80) return 'text-green-400';
    if (trustScore >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrustScoreBg = () => {
    if (trustScore >= 80) return 'from-green-500 to-emerald-500';
    if (trustScore >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-blue-400" />
          <span className="text-white font-semibold">Exam Proctoring</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${tabFocused ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
            <span className="text-gray-400 text-xs">{tabFocused ? 'Focused' : 'Unfocused'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
            <span className="text-gray-400 text-xs">{faceDetected ? 'Face OK' : 'No Face'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4">
        {/* Camera Feed */}
        <div className="col-span-2 relative">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlays */}
            {!permissionGranted && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                <div className="text-center">
                  <Camera size={48} className="mx-auto text-gray-500 mb-2" />
                  <p className="text-gray-400">Camera permission required</p>
                </div>
              </div>
            )}

            {!faceDetected && permissionGranted && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                <div className="text-center">
                  <AlertTriangle size={48} className="mx-auto text-red-400 mb-2" />
                  <p className="text-red-400 font-semibold">Face not detected!</p>
                </div>
              </div>
            )}

            {multipleFaces && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                <div className="text-center">
                  <AlertTriangle size={48} className="mx-auto text-red-400 mb-2" />
                  <p className="text-red-400 font-semibold">Multiple faces detected!</p>
                </div>
              </div>
            )}

            {/* Recording Indicator */}
            {isActive && (
              <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-red-500 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-semibold">REC</span>
              </div>
            )}
          </div>

          {/* Controls */}
          {!isActive && permissionGranted && (
            <button
              onClick={startProctoring}
              className="mt-4 w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90"
            >
              Start Proctoring
            </button>
          )}
        </div>

        {/* Stats & Violations */}
        <div className="space-y-4">
          {/* Trust Score */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Trust Score</span>
              <Activity size={16} className="text-gray-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold ${getTrustScoreColor()}`}>
                {trustScore}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${getTrustScoreBg()}`}
                initial={{ width: 0 }}
                animate={{ width: `${trustScore}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Status Checks */}
          <div className="bg-gray-900 rounded-lg p-4 space-y-3">
            <h4 className="text-gray-400 text-sm font-semibold">Status Checks</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Camera</span>
                {permissionGranted ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  <XCircle size={16} className="text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Face Detection</span>
                {faceDetected ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  <XCircle size={16} className="text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Tab Focus</span>
                {tabFocused ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  <XCircle size={16} className="text-red-400" />
                )}
              </div>
            </div>
          </div>

          {/* Recent Violations */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-gray-400 text-sm font-semibold mb-2">Recent Alerts</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              <AnimatePresence>
                {violations.length === 0 ? (
                  <p className="text-gray-500 text-sm">No violations</p>
                ) : (
                  violations.slice(-5).reverse().map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-xs"
                    >
                      <AlertTriangle size={12} className="text-yellow-400" />
                      <span className="text-gray-300">{v.description}</span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringMonitor;
