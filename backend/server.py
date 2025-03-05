from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str

@app.post("/api/chat")
async def chat(request: ChatRequest):
    response = ollama.chat(model="llama3.2-vision", messages=[{"role": "user", "content": request.question}])
    return {"answer": response["message"]["content"]}
