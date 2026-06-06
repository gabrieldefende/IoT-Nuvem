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
    setCameraReady(false);
  }, []);

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
        setCameraError('');
      } catch (error) {
        setCameraError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      }
    };

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [stopCamera]);

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

  return (
    <div className="face-capture">
      {cameraError && <div className="face-capture-error">{cameraError}</div>}

      {!preview ? (
        <div className="face-capture-video-wrap">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="face-capture-video"
          />
          {!cameraReady && !cameraError && (
            <p className="face-capture-loading">Iniciando câmera...</p>
          )}
        </div>
      ) : (
        <img src={preview} alt="Prévia do rosto capturado" className="face-capture-preview" />
      )}

      <div className="face-capture-actions">
        <button
          type="button"
          className="glass-btn primary"
          onClick={handleCapture}
          disabled={disabled || !cameraReady}
        >
          {buttonLabel}
        </button>
        {preview && (
          <button
            type="button"
            className="glass-btn secondary"
            onClick={() => setPreview('')}
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
