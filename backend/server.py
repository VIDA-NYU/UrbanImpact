import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, File, Form, UploadFile
from pydantic import BaseModel
import ollama
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import re
import requests
import base64
import asyncio

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import httpx

async def fetch_image_as_base64(image_path: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.get(image_path, timeout=10)
        response.raise_for_status()
        return base64.b64encode(response.content).decode("utf-8")

async def fetch_multiple_images(image_paths: list[str]) -> dict[str, str]:
    """Fetch multiple images asynchronously and return a dictionary of base64 strings."""
    tasks = [fetch_image_as_base64(path) for path in image_paths]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    return {path: result if isinstance(result, str) else f"Error: {result}" 
            for path, result in zip(image_paths, results)}

def fetch_image_as_base64_(image_path: str) -> str:
    """Fetch image from disk or URL and convert it to Base64."""
    print("Fetching image from:", image_path)
    try:
        if image_path.startswith("http"):  # Handle URL-based images
            print("IF Fetching image from:", image_path)
            response = requests.get(image_path)
            print("requests Fetching image from:", image_path)

            response.raise_for_status()
            print("requests Fetching image from:", image_path)

            image_data = response.content
            print("image_data Fetching image from:", image_path)

        else:  # Handle local file paths
            print("else Fetching image from:", image_path)
            with open(image_path, "rb") as image_file:
                print("open Fetching image from:", image_path)
                image_data = image_file.read()
        print("return Fetching image from:", image_path)
        return base64.b64encode(image_data).decode("utf-8")
    except Exception as e:
        raise Exception(f"Image processing error: {str(e)}")  # Standard Exception


class ChatRequest(BaseModel):
    question: str
    image: str  # Base64-encoded image string


@app.post("/api/chat")

async def chat(request: ChatRequest):
    print("base64_image")
    # Asking the LLM to return coordinates in a specific format
    user_question = request.question
    image_urls = request.image  # Image in Base64 format
    image_list = image_urls.split(',') if image_urls else []  # Convert to list

    print("Received images:", image_list)  # Debugging
    # Example usage:
    # image_urls = ["http://127.0.0.1:8000/data/NYC/data/750426175646560.jpg",
    #             "http://127.0.0.1:8000/data/NYC/data/788625419835339.jpg"]

    # Limit to a maximum of 3 images
    limited_image_urls = image_list[:3] 
    # Fetch multiple images
    base64_images = await asyncio.gather(*(fetch_image_as_base64(url) for url in limited_image_urls))

    prompt = f"{user_question} Your response should top 3 reasons. Please parse your respond in the following format: {{'first_reason': <first explanation>, 'second_reason': <second explanation>, 'second_reason': <second explanation>, 'latitude': <lat>, 'longitude': <lon>}}."
    
    # Prepare the messages array (one image per message)
    messages = [{"role": "user", "content": prompt}]
    messages += [{"role": "user", "images": [img]} for img in base64_images]
    
    try:
        # Sending both text and image to the LLM
        response = ollama.chat(
            model="llama3.2-vision",
            messages= messages
        )
        response_text = response["message"]["content"]
        print("LLM Response:", response_text)  # Print the response for debugging

        # region = extract_region_from_response(response_text)
        
        # return {"answer": response_text, "region": "region"}
        return {"answer": response_text, "region": ""}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# async def chat(request: ChatRequest):
#     user_question = request.question
#     image_pathpy = request.image_path
#     print (image_pathpy)
#     # Convert image to Base64
#     # base64_image = fetch_image_as_base64(image_pathpy)
#     # print (base64_image)
#     # if "," in base64_image:
#     #     base64_image = base64_image.split(",")[1]  # Keep only the actual Base64 part
#     prompt = f"{user_question} Your response should top 3 reasons. Please parse your response in the following format: {{'first_reason': <first explanation>, 'second_reason': <second explanation>, 'third_reason': <third explanation>,'latitude': <lat>, 'longitude': <lon>}}."
#     # print (prompt)
#     try:
#         response = ollama.chat(
#             model="llama3.2-vision",
#             messages=[{"role": "user", "content": prompt }] #, "images": [base64_image]}]
#         )
#         response_text = response["message"]["content"]
#         print("LLM Response:", response_text)

#         return {"answer": response_text, "region": ""}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


#     # response = ollama.chat(model="llama3.2-vision", messages=[{"role": "user", "content": request.question}])
#     # # Extract coordinates or region from the response using regex or other parsing methods
#     # region = extract_region_from_response(response["message"]["content"])
#     # return {"answer": response["message"]["content"], "region": region}
#     # # return {"answer": response["message"]["content"]}


# import requests
# import osmnx as ox

# def extractLocationDescritption(text):
#     # Coordinates
#     # lat, lon = 40.6959659, -73.9845903
#     lat, lon = extract_latlon_using_split(text)

#     # Get detailed location info from OSM
#     url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&addressdetails=1"
#     headers = {"User-Agent": "YourAppName/1.0 (your@email.com)"}
#     response = requests.get(url, headers=headers)
#     data = response.json()

#     # Extract road and cross street
#     road = data["address"].get("road", "Unknown road")
#     suburb = data["address"].get("suburb", "")
#     city = data["address"].get("city", "")
#     state = data["address"].get("state", "")
#     country = data["address"].get("country", "")

#     # Use OSMnx to find connected streets (intersection)
#     G = ox.graph_from_point((lat, lon), dist=50, network_type="all")
#     nearest_node = ox.distance.nearest_nodes(G, lon, lat)
#     streets = list(G[nearest_node].keys())

#     street_names = set()
#     for street in streets:
#         edge_data = G.get_edge_data(nearest_node, street)
#         for _, edge in edge_data.items():
#             name = edge.get("name", "Unnamed road")
#             if name:
#                 street_names.add(name)

#     # Construct a structured location description
#     cross_streets = ", ".join(street_names) if street_names else "Unknown intersection"
#     location_description = f"This is an urban intersection at {road} and {cross_streets}, located in {suburb}, {city}, {state}, {country}."

#     # Query Ollama with refined location data
#     query = f"Analyze the urban infrastructure at {location_description}. Discuss transportation, connectivity, and urban features."

#     # Send to LLM
#     import ollama
#     result = ollama.chat(model="llama3.2-vision", messages=[{"role": "user", "content": query}])
#     print(result["message"]["content"])

def extract_latlon_using_split(text):
    lat_lon_part = text.split("latitude:")[1].strip()
    lat_part, lon_part = lat_lon_part.split(" and longitude:")
    latitude = lat_part.strip().replace("${", "").replace("}", "")
    longitude = lon_part.strip().replace("${", "").replace("}", "")
    return latitude, longitude

def extract_region_from_response(response_text):
    # Try to parse the response based on the format we're expecting
    match = re.search(r"\{'latMin':\s*([+-]?\d+\.\d+),\s*'latMax':\s*([+-]?\d+\.\d+),\s*'lonMin':\s*([+-]?\d+\.\d+),\s*'lonMax':\s*([+-]?\d+\.\d+)\}", response_text)
    
    if match:
        lat_min = float(match.group(1))
        lat_max = float(match.group(2))
        lon_min = float(match.group(3))
        lon_max = float(match.group(4))
        
        return {"latMin": lat_min, "latMax": lat_max, "lonMin": lon_min, "lonMax": lon_max}
    
    # If no match, return None
    return None

# Get absolute path of the "data" directory
data_directory = os.path.abspath("data")
print(f"Serving static files from: {data_directory}")

# Mount static files
app.mount("/data", StaticFiles(directory=data_directory, html=True), name="data")
