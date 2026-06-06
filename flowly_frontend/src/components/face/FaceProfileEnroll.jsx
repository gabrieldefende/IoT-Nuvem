import { useState } from 'react';
import apiClient from '../../config/apiClient';
import { API_ENDPOINTS } from '../../config/config';
import FaceCapture from './FaceCapture';
import '../../styles/components/FaceAuthStep.css';

function FaceProfileEnroll({ enrolled, onEnrolled }) {
  const [imageBase64, setImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async () => {
    if (!imageBase64) {
      setErro('Capture uma foto do rosto antes de salvar.');
      return;
    }

    setLoading(true);
    setErro('');
    setMensagem('');

    try {
      await apiClient.post(API_ENDPOINTS.FACE_ENROLL_PROFILE, { imageBase64 });
      setMensagem('Verificação facial cadastrada com sucesso.');
      setImageBase64('');
      if (onEnrolled) {
        onEnrolled();
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao cadastrar verificação facial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="perfil-card face-profile-section">
      <h3>Verificação facial</h3>
      <p className="face-profile-desc">
        {enrolled
          ? 'Seu rosto já está cadastrado. Você pode recadastrar para atualizar a referência.'
          : 'Cadastre seu rosto para usar verificação facial no login (opcional).'}
      </p>

      {erro && <p className="perfil-erro">{erro}</p>}
      {mensagem && <p className="perfil-sucesso">{mensagem}</p>}

      <FaceCapture
        onCapture={setImageBase64}
        disabled={loading}
        buttonLabel="Capturar rosto"
      />

      <button type="button" onClick={handleSubmit} disabled={loading || !imageBase64}>
        {loading ? 'Salvando...' : enrolled ? 'Atualizar rosto' : 'Cadastrar verificação facial'}
      </button>
    </section>
  );
}

export default FaceProfileEnroll;
