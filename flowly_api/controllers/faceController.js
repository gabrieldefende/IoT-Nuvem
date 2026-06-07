const User = require('../models/User');
const FaceProfile = require('../models/FaceProfile');
const faceService = require('../services/faceService');
const {
  buildUserPayload,
  issueAuthToken,
  verifyFaceSessionToken,
} = require('../utils/faceAuth');
const { normalizeFaceError } = require('../utils/faceErrorMessages');

const completeLoginResponse = (user) => ({
  token: issueAuthToken(user),
  user: buildUserPayload(user),
});

const saveFaceProfile = async (userId, embedding, model = 'VGG-Face') => {
  const profile = await FaceProfile.findOneAndUpdate(
    { userId },
    {
      userId,
      embedding,
      model,
      enrolled: true,
      enrolledAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return profile;
};

exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'faceEnrollmentOffered faceEnrollmentSkipped'
    );
    const profile = await FaceProfile.findOne({ userId: req.user.id, enrolled: true });

    if (!user) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json({
      enrolled: Boolean(profile),
      skipped: Boolean(user.faceEnrollmentSkipped),
      offered: Boolean(user.faceEnrollmentOffered),
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao consultar status facial.', detalhe: err.message });
  }
};

exports.enrollWithSession = async (req, res) => {
  try {
    const { faceSessionToken, imageBase64 } = req.body;

    if (!faceSessionToken || !imageBase64) {
      return res.status(400).json({ erro: 'faceSessionToken e imageBase64 são obrigatórios.' });
    }

    const decoded = verifyFaceSessionToken(faceSessionToken, 'face_enroll');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const embedResult = await faceService.extractEmbedding(imageBase64, 'enroll');

    if (!embedResult.face_detected || !embedResult.embedding) {
      return res.status(400).json({
        erro: normalizeFaceError(embedResult.erro, 'enroll'),
      });
    }

    await saveFaceProfile(user._id, embedResult.embedding, embedResult.model);

    res.json({
      msg: 'Verificação facial cadastrada com sucesso.',
      ...completeLoginResponse(user),
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      erro: normalizeFaceError(err.message, 'enroll') || 'Erro ao cadastrar rosto.',
      detalhe: err.details,
    });
  }
};

exports.enrollFromProfile = async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ erro: 'imageBase64 é obrigatório.' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const embedResult = await faceService.extractEmbedding(imageBase64, 'profile');

    if (!embedResult.face_detected || !embedResult.embedding) {
      return res.status(400).json({
        erro: normalizeFaceError(embedResult.erro, 'profile'),
      });
    }

    await saveFaceProfile(user._id, embedResult.embedding, embedResult.model);

    res.json({
      msg: 'Verificação facial cadastrada com sucesso.',
      enrolled: true,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      erro: normalizeFaceError(err.message, 'profile') || 'Erro ao cadastrar rosto.',
      detalhe: err.details,
    });
  }
};

exports.verifyWithSession = async (req, res) => {
  try {
    const { faceSessionToken, imageBase64 } = req.body;

    if (!faceSessionToken || !imageBase64) {
      return res.status(400).json({ erro: 'faceSessionToken e imageBase64 são obrigatórios.' });
    }

    const decoded = verifyFaceSessionToken(faceSessionToken, 'face_verify');
    const user = await User.findById(decoded.id);
    const profile = await FaceProfile.findOne({ userId: decoded.id, enrolled: true });

    if (!user || !profile) {
      return res.status(404).json({ erro: 'Perfil facial não encontrado.' });
    }

    const verifyResult = await faceService.verifyFace(profile.embedding, imageBase64);

    if (!verifyResult.face_detected) {
      return res.status(400).json({
        erro: normalizeFaceError(verifyResult.erro, 'verify'),
      });
    }

    if (!verifyResult.match) {
      return res.status(401).json({
        erro: 'Rosto não reconhecido. Tente capturar outra foto com o rosto bem visível.',
        distance: verifyResult.distance,
      });
    }

    res.json({
      msg: 'Verificação facial concluída.',
      ...completeLoginResponse(user),
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      erro: normalizeFaceError(err.message, 'verify') || 'Erro na verificação facial.',
      detalhe: err.details,
    });
  }
};

exports.skipEnrollment = async (req, res) => {
  try {
    const { faceSessionToken } = req.body;

    if (!faceSessionToken) {
      return res.status(400).json({ erro: 'faceSessionToken é obrigatório.' });
    }

    const decoded = verifyFaceSessionToken(faceSessionToken, 'face_enroll');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    user.faceEnrollmentSkipped = true;
    user.faceEnrollmentOffered = true;
    await user.save();

    res.json({
      msg: 'Cadastro facial ignorado. Você pode cadastrar depois no perfil.',
      ...completeLoginResponse(user),
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ erro: err.message || 'Erro ao ignorar cadastro facial.' });
  }
};

exports.health = async (_req, res) => {
  try {
    const faceHealth = await faceService.checkHealth();
    res.json({ api: 'ok', faceService: faceHealth });
  } catch (err) {
    res.status(503).json({
      api: 'ok',
      faceService: null,
      erro: 'Serviço facial indisponível.',
      detalhe: err.message,
    });
  }
};
