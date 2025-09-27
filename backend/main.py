from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import time

app = FastAPI(title="Breathing App API", version="1.0.0")

# Configurar CORS para permitir requests do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique o domínio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BreathingSession(BaseModel):
    rounds: int
    breaths_per_round: int = 30
    breath_duration: float = 3.55

class SessionResponse(BaseModel):
    session_id: str
    rounds: int
    breaths_per_round: int
    breath_duration: float
    total_duration: float

# Armazenar sessões em memória (em produção, usar banco de dados)
sessions = {}

@app.get("/")
async def root():
    return {"message": "Breathing App API"}

@app.post("/sessions", response_model=SessionResponse)
async def create_session(session: BreathingSession):
    """Criar uma nova sessão de respiração"""
    session_id = str(int(time.time()))
    
    total_duration = session.rounds * session.breaths_per_round * session.breath_duration
    
    session_data = {
        "session_id": session_id,
        "rounds": session.rounds,
        "breaths_per_round": session.breaths_per_round,
        "breath_duration": session.breath_duration,
        "total_duration": total_duration,
        "created_at": time.time()
    }
    
    sessions[session_id] = session_data
    
    return SessionResponse(**session_data)

@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Obter detalhes de uma sessão específica"""
    if session_id not in sessions:
        return {"error": "Sessão não encontrada"}
    
    return sessions[session_id]

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
