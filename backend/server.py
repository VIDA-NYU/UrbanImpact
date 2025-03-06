import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse


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

# Get absolute path of the "data" directory
data_directory = os.path.abspath("data")
print(f"Serving static files from: {data_directory}")

# Mount static files
app.mount("/data", StaticFiles(directory=data_directory, html=True), name="data")
