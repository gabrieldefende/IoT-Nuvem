"""
Microserviço IoT de reconhecimento facial — Flowly 2.0
Expõe endpoints para extrair embeddings e comparar rostos via DeepFace.
"""

import base64
import os
import tempfile

import numpy as np
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

MODEL = os.getenv("FACE_MODEL", "VGG-Face")
DETECTOR = os.getenv("FACE_DETECTOR", "opencv")
DEFAULT_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.4"))


def decode_image_to_path(image_base64: str) -> str:
    payload = image_base64
    if "," in payload:
        payload = payload.split(",", 1)[1]

    raw = base64.b64decode(payload)
    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    tmp.write(raw)
    tmp.close()
    return tmp.name


def cosine_distance(source: np.ndarray, probe: np.ndarray) -> float:
    source = source.astype(np.float64)
    probe = probe.astype(np.float64)
    dot = float(np.dot(source, probe))
    norm = float(np.linalg.norm(source) * np.linalg.norm(probe))
    if norm == 0:
        return 1.0
    return 1.0 - (dot / norm)


def extract_embedding(image_path: str) -> list[float]:
    from deepface import DeepFace

    results = DeepFace.represent(
        img_path=image_path,
        model_name=MODEL,
        detector_backend=DETECTOR,
        enforce_detection=True,
    )
    if not results:
        raise ValueError("Nenhum rosto detectado na imagem.")
    return results[0]["embedding"]


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "flowly_iot_face",
            "model": MODEL,
            "detector": DETECTOR,
            "threshold_default": DEFAULT_THRESHOLD,
        }
    )


@app.post("/embed")
def embed():
    data = request.get_json(silent=True) or {}
    image_base64 = data.get("image_base64")

    if not image_base64:
        return jsonify({"erro": "image_base64 é obrigatório."}), 400

    image_path = decode_image_to_path(image_base64)
    try:
        embedding = extract_embedding(image_path)
        return jsonify(
            {
                "face_detected": True,
                "embedding": embedding,
                "model": MODEL,
            }
        )
    except Exception as exc:
        return jsonify({"face_detected": False, "erro": str(exc)}), 400
    finally:
        if os.path.exists(image_path):
            os.unlink(image_path)


@app.post("/verify")
def verify():
    data = request.get_json(silent=True) or {}
    reference = data.get("reference_embedding")
    image_base64 = data.get("image_base64")
    threshold = float(data.get("threshold", DEFAULT_THRESHOLD))

    if reference is None or not image_base64:
        return jsonify(
            {"erro": "reference_embedding e image_base64 são obrigatórios."}
        ), 400

    image_path = decode_image_to_path(image_base64)
    try:
        probe_embedding = extract_embedding(image_path)
        ref = np.array(reference, dtype=np.float64)
        probe = np.array(probe_embedding, dtype=np.float64)
        distance = cosine_distance(ref, probe)
        match = distance <= threshold

        return jsonify(
            {
                "match": bool(match),
                "distance": round(distance, 6),
                "threshold": threshold,
                "face_detected": True,
                "model": MODEL,
            }
        )
    except Exception as exc:
        return jsonify({"match": False, "face_detected": False, "erro": str(exc)}), 400
    finally:
        if os.path.exists(image_path):
            os.unlink(image_path)


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5001"))
    app.run(host=host, port=port, debug=os.getenv("FLASK_DEBUG", "0") == "1")
