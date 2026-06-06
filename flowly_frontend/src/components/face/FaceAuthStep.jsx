import { useState } from 'react';
import apiClient from '../../config/apiClient';
import { API_ENDPOINTS } from '../../config/config';
import { authUtils } from '../../config/authUtils';
import FaceCapture from './FaceCapture';
import '../../styles/components/FaceAuthStep.css';

function FaceAuthStep({
  mode,
  faceSessionToken,
  user,
  onComplete,
  onCancel,
}) {
  const [imageBase64, setImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const finishLogin = (data) => {
    authUtils.saveAuthData(data.token, data.user);
    onComplete(data.user);
  };

  const handleSkip = async () => {
    setLoading(true);
    setErro('');

    try {
      const res = await apiClient.post(API_ENDPOINTS.FACE_SKIP_ENROLLMENT, {
        faceSessionToken,
      });
      finishLogin(res.data);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao pular cadastro facial.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!imageBase64) {
      setErro('Capture uma foto do rosto antes de continuar.');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const endpoint =
        mode === 'verify'
          ? API_ENDPOINTS.FACE_VERIFY
          : API_ENDPOINTS.FACE_ENROLL;

      const res = await apiClient.post(endpoint, {
        faceSessionToken,
        imageBase64,
      });

      finishLogin(res.data);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha na verificação facial.');
    } finally {
      setLoading(false);
    }
  };

  const isVerify = mode === 'verify';
  const title = isVerify ? 'Verificação facial' : 'Cadastro facial (opcional)';
  const subtitle = isVerify
    ? `Olá, ${user?.nome || 'usuário'}. Confirme sua identidade para concluir o login.`
    : 'Você pode cadastrar seu rosto para uma camada extra de segurança no login.';

  return (
    <div className="face-auth-step">
      <div className="face-auth-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      {erro && <div className="erro-container">{erro}</div>}

      <FaceCapture
        onCapture={setImageBase64}
        disabled={loading}
        buttonLabel={isVerify ? 'Capturar para verificar' : 'Capturar rosto'}
      />

      <div className="face-auth-buttons">
        <button
          type="button"
          className="glass-btn primary"
          onClick={handleSubmit}
          disabled={loading || !imageBase64}
        >
          {loading ? 'Processando...' : isVerify ? 'Verificar e entrar' : 'Cadastrar e entrar'}
        </button>

        {!isVerify && (
          <button
            type="button"
            className="glass-btn secondary"
            onClick={handleSkip}
            disabled={loading}
          >
            Pular por agora
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            className="auth-switch-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Voltar ao login
          </button>
        )}
      </div>
    </div>
  );
}

export default FaceAuthStep;
