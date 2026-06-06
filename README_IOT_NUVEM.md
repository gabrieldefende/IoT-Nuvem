# Flowly 2.0 + Reconhecimento Facial (IoT na nuvem)

Pacote **pronto para integrar** no repositório da equipe [FATEC-Mobile-Group/flowly-2.0](https://github.com/FATEC-Mobile-Group/flowly-2.0).

Contém o Flowly 2.0 completo **já mesclado** com o módulo facial (API, web, mobile e microserviço Python `flowly_iot_face`).

## Para quem vai abrir o PR

Leia **[INTEGRACAO.md](./INTEGRACAO.md)** — passo a passo para copiar no clone da equipe e abrir a branch.

Deploy do Python no Cloud Run: **[DEPLOY_FACE_NUVEM.md](./DEPLOY_FACE_NUVEM.md)**.

Setup local: **[SETUP_FACE.md](./SETUP_FACE.md)**.

Documentação técnica: **[FACE_RECONHECIMENTO.md](./FACE_RECONHECIMENTO.md)**.

## O que não vem no Git

- `node_modules/` — rode `npm install` em `flowly_api` e `flowly_frontend`
- `flowly_iot_face/.venv/` — rode `pip install -r requirements.txt`
- Arquivos `.env` — copie de `.env.example`
- Modelo VGG-Face (~550 MB) — baixado na 1ª execução do serviço Python
