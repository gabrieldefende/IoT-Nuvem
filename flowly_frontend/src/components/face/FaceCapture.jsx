import { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/components/FaceCapture.css';

function FaceCapture({ onCapture, disabled = false, buttonLabel = 'Capturar rosto' }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [preview, setPreview] = useState('');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const isStreamAlive = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      return false;
    }
    return stream.getVideoTracks().some((track) => track.readyState === 'live');
  }, []);

  const attachStream = useCallback((stream) => {
    streamRef.current = stream;

    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        setCameraReady(false);
      };
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }

    setCameraReady(true);
    setCameraError('');
  }, []);

  const startCamera = useCallback(async () => {
    if (isStreamAlive()) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
      setCameraError('');
      return;
    }

    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      attachStream(stream);
    } catch (error) {
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      setCameraReady(false);
    }
  }, [attachStream, isStreamAlive, stopCamera]);

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !cameraReady) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.92);
    setPreview(imageBase64);
    onCapture(imageBase64);
  };

  const handleRetake = async () => {
    setPreview('');
    onCapture('');

    if (!isStreamAlive()) {
      await startCamera();
    }
  };

  return (
    <div className="face-capture">
      {cameraError && <div className="face-capture-error">{cameraError}</div>}

      <div className="face-capture-video-wrap">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="face-capture-video"
        />
        {preview && (
          <img
            src={preview}
            alt="Prévia do rosto capturado"
            className="face-capture-preview-overlay"
          />
        )}
        {!cameraReady && !cameraError && !preview && (
          <p className="face-capture-loading">Iniciando câmera...</p>
        )}
      </div>

      <div className="face-capture-actions">
        <button
          type="button"
          className="glass-btn primary"
          onClick={handleCapture}
          disabled={disabled || !cameraReady || !!preview}
        >
          {buttonLabel}
        </button>
        {preview && (
          <button
            type="button"
            className="glass-btn secondary"
            onClick={handleRetake}
            disabled={disabled}
          >
            Tirar outra foto
          </button>
        )}
      </div>
    </div>
  );
}

export default FaceCapture;
