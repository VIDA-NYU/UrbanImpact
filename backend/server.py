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
import pandas as pd
from io import StringIO
app = FastAPI()
import httpx


collisions_interceptions_path = "./data/NYC/Motor_Vehicle_Collisions_Crashes/NYC_Vehicle_Collisions_Crashes_at_intersections.csv"
# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



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

# Function to ask LLM for relevant columns
def get_relevant_columns(path_data, question):
    try:
        print(f"File path: {path_data}")
        # Load the CSV file into a DataFrame (reading just the first row for now)
        df = pd.read_csv(path_data, nrows=1)
        
        # # Get the column names
        column_names = df.columns.tolist()
        # column_names = [
        #     "CRASH DATE", "CRASH TIME", "BOROUGH", "ZIP CODE", "LATITUDE", "LONGITUDE", "LOCATION", "ON STREET NAME",
        #     "CROSS STREET NAME", "OFF STREET NAME", "NUMBER OF PERSONS INJURED", "NUMBER OF PERSONS KILLED",
        #     "NUMBER OF PEDESTRIANS INJURED", "NUMBER OF PEDESTRIANS KILLED", "NUMBER OF CYCLIST INJURED",
        #     "NUMBER OF CYCLIST KILLED", "NUMBER OF MOTORIST INJURED", "NUMBER OF MOTORIST KILLED",
        #     "CONTRIBUTING FACTOR VEHICLE 1", "CONTRIBUTING FACTOR VEHICLE 2", "CONTRIBUTING FACTOR VEHICLE 3",
        #     "CONTRIBUTING FACTOR VEHICLE 4", "CONTRIBUTING FACTOR VEHICLE 5", "COLLISION_ID", "VEHICLE TYPE CODE 1",
        #     "VEHICLE TYPE CODE 2", "VEHICLE TYPE CODE 3", "VEHICLE TYPE CODE 4", "VEHICLE TYPE CODE 5"
        # ]

        prompt = f"""
        Given the following columns from a dataset about vehicle collisions, please identify which columns would be most relevant to answer the following question:

        Columns: {', '.join(column_names)}
        Question: {question}

        Return only the relevant column names in a **comma-separated list**. Do not include any explanations or additional information. Just the column names, each separated by a comma and no extra text.
        """

        response = ollama.chat(
            model="llama3.2-vision", 
            messages=[{"role": "user", "content": prompt}])
        print(response["message"]["content"])

        relevant_columns = response.get('message', {}).get('content', '').strip()
        # If there are relevant columns in the response, split them into a list
        if relevant_columns:
            relevant_columns = relevant_columns.split(',')
            relevant_columns = [col.strip() for col in relevant_columns]  # Clean up any spaces
        else:
            relevant_columns = []

        print(relevant_columns)
        return relevant_columns
    except Exception as e:
        print(f"Error occurred: {e}")
        return None

import pandas as pd

def get_relevant_rows(file_path, selected_lat, selected_lon, relevant_columns, tolerance=0.0001):
    """
    Filters rows from a CSV file where the latitude and longitude match the selected coordinates.
    Also selects only the relevant columns.
    
    :param file_path: Path to the CSV file
    :param selected_lat: Latitude to match
    :param selected_lon: Longitude to match
    :param relevant_columns: List of relevant columns to keep
    :param tolerance: Allowable difference in lat/lon for fuzzy matching
    :return: Filtered DataFrame
    """
    try:
        print(f"Loading relevant columns from: {file_path}")
        
        # Ensure LATITUDE and LONGITUDE are included if not already present
        required_columns = set(relevant_columns)  # Convert to set to avoid duplicates
        if "LATITUDE" not in required_columns:
            required_columns.add("LATITUDE")
        if "LONGITUDE" not in required_columns:
            required_columns.add("LONGITUDE")

        # Load only the necessary columns
        df = pd.read_csv(file_path, usecols=list(required_columns))

        # Convert LATITUDE and LONGITUDE to numeric
        df["LATITUDE"] = pd.to_numeric(df["LATITUDE"], errors="coerce")
        df["LONGITUDE"] = pd.to_numeric(df["LONGITUDE"], errors="coerce")

        # Drop rows with missing lat/lon
        df = df.dropna(subset=["LATITUDE", "LONGITUDE"])

        # Filter rows where lat/lon are within a small tolerance
        filtered_df = df[
            (df["LATITUDE"].between(selected_lat - tolerance, selected_lat + tolerance)) &
            (df["LONGITUDE"].between(selected_lon - tolerance, selected_lon + tolerance))
        ]

        # Drop LATITUDE & LONGITUDE if they were **not originally** part of relevant_columns
        if "LATITUDE" not in relevant_columns:
            filtered_df = filtered_df.drop(columns=["LATITUDE"])
        if "LONGITUDE" not in relevant_columns:
            filtered_df = filtered_df.drop(columns=["LONGITUDE"])

        print(f"Found {len(filtered_df)} matching rows.")
        return filtered_df

    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def summarize_crash_data(df):
    """
    Dynamically summarizes crash data based on available columns.
    
    :param df: Filtered DataFrame of relevant crashes
    :return: Summary dictionary with key statistics
    """
    if df.empty:
        return "No relevant crashes found for this location."

    summary = {}

    # Identify numeric and categorical columns
    numeric_columns = df.select_dtypes(include=['number']).columns.tolist()
    categorical_columns = df.select_dtypes(include=['object']).columns.tolist()

    # Aggregate numeric columns (sum for counts, mean for continuous values)
    for col in numeric_columns:
        if "NUMBER" in col or "COUNT" in col or "INJURED" in col or "KILLED" in col:
            summary[f"Total {col}"] = df[col].sum()
        else:
            summary[f"Average {col}"] = df[col].mean()

    # Aggregate categorical columns (Top occurrences)
    for col in categorical_columns:
        top_values = df[col].value_counts().head(3).to_dict()
        summary[f"Top {col} Values"] = top_values

    return summary

class ChatRequest(BaseModel):
    question: str
    image: str  # Base64-encoded image string
    latitude: str
    longitude: str


@app.post("/api/chat")

async def chat(request: ChatRequest):
    print("base64_image")
    # Asking the LLM to return coordinates in a specific format
    user_question = request.question
    selected_lat = float(request.latitude)
    selected_lon = float(request.longitude)
    image_urls = request.image  # Image in Base64 format
    image_list = image_urls.split(',') if image_urls else []  # Convert to list

    print("Received images:", image_list)  # Debugging
    # Example usage:
    # image_urls = ["http://127.0.0.1:8000/data/NYC/data/750426175646560.jpg",
    #             "http://127.0.0.1:8000/data/NYC/data/788625419835339.jpg"]

    # Limit to a maximum of 3 images
    limited_image_urls = image_list[:1] 
    # Fetch multiple images
    base64_images = await asyncio.gather(*(fetch_image_as_base64(url) for url in limited_image_urls))

    prompt = f"{user_question}"
    # print(base64_images)

    # get_relevant_columns("http://127.0.0.1:8000/data/filtered_car_accidents.csv", user_question)
    relevant_columns = get_relevant_columns(collisions_interceptions_path, user_question)
    relevant_rows = get_relevant_rows(collisions_interceptions_path, selected_lat, selected_lon, relevant_columns, tolerance=0.0001)
    data_summary = summarize_crash_data(relevant_rows)
    exact_location = getAddress(selected_lat, selected_lon)

    # Including step-by-step reasoning for collision analysis
    # prompt += f"""
    # Follow this chain of thought:

    # Add the data summary to the prompt for additional context
    prompt += f"""
    Here is a summary of the relevant data for vehicle collisions at the intersection near {exact_location}:

    {data_summary}

    Now, follow this chain of thought:
    1. Analyze the urban infrastructure of the intersection at {exact_location}. Discuss key aspects such as transportation, connectivity, and notable urban features.

    2. Next, using available street view imagery, provide a detailed description of this intersection, highlighting relevant characteristics such as road layout, pedestrian facilities, traffic signals, and surrounding structures. 

    3. Then, based on the urban infrastructure and imagery analysis analysis, determine the top three potential reasons of vehicle collisions at this intersection. 
       For each reason, provide a detailed explanation and specify the percentage of influence attributed to:
        - Visual observations from the image.
        - Urban infrastructure factors (such as road design, signal placement, and traffic rules).

    Additionally:
        - Provide exactly **four keywords** for each collision risk factor.
        - Include a **short conclusion (max 350 characters)** summarizing key insights.

    ### **IMPORTANT INSTRUCTION:**  
    ❗ **Ensure the response follows this strict JSON structure and is formatted correctly:**  

    """
    prompt += """
    {
    "location": {
        "intersection": "<intersection_name>",
        "latitude": <lat>,
        "longitude": <lon>
    },
    "collision_risk_factors": [
        {
        "risk_factor": "<name_of_risk_1>",
        "description": "<detailed_explanation>",
        "keywords": ["<keyword_1>", "<keyword_2>", "<keyword_3>", "<keyword_4>"],
        "influence_attribution": {
            "visual_observation_percentage": <percentage>,
            "urban_infrastructure_percentage": <percentage>
        }
        },
        {
        "risk_factor": "<name_of_risk_2>",
        "description": "<detailed_explanation>",
        "keywords": ["<keyword_1>", "<keyword_2>", "<keyword_3>", "<keyword_4>"],
        "influence_attribution": {
            "visual_observation_percentage": <percentage>,
            "urban_infrastructure_percentage": <percentage>
        }
        },
        {
        "risk_factor": "<name_of_risk_3>",
        "description": "<detailed_explanation>",
        "keywords": ["<keyword_1>", "<keyword_2>", "<keyword_3>", "<keyword_4>"],
        "influence_attribution": {
            "visual_observation_percentage": <percentage>,
            "urban_infrastructure_percentage": <percentage>
        }
        }
    ],
    "conclusion": "<summary_text (max 350 characters)>"
    }

    Important:
    ❗ **Return only JSON. No additional explanations, text, or formatting.**
    ❗ **Validate the JSON structure before returning, ensuring there are no unescaped characters or syntax errors.**  
    """

    print(prompt)    

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

# import requests
import osmnx as ox

def getAddress(lat, lon):
    # Ensure latitude and longitude are floats
    lat, lon = float(lat), float(lon)

    print("Latitude:", lat)
    print("Longitude:", lon)
    # Get detailed location info from OSM
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&addressdetails=1"
    headers = { "User-Agent": "MyGeoApp/1.0 (scq202@nyu.edu)"}
    response = requests.get(url, headers=headers)
    data = response.json()
    print(data)
    # Extract road and cross street
    road = data["address"].get("road", "Unknown road")
    suburb = data["address"].get("suburb", "")
    city = data["address"].get("city", "")
    state = data["address"].get("state", "")
    country = data["address"].get("country", "")

    # Use OSMnx to find connected streets (intersection)
    G = ox.graph_from_point((lat, lon), dist=50, network_type="all")
    nearest_node = ox.distance.nearest_nodes(G, lon, lat)
    streets = list(G[nearest_node].keys())

    street_names = set()
    for street in streets:
        edge_data = G.get_edge_data(nearest_node, street)
        for _, edge in edge_data.items():
            name = edge.get("name", "Unnamed road")
            if name:
                street_names.add(name)

    # Construct a structured location description
    cross_streets = ", ".join(street_names) if street_names else "Unknown intersection"
    location_description = f"{cross_streets}, {suburb}, {city}, {state}, {country}."

    # Query Ollama with refined location data
    address = f" {location_description} (Latitude: {lat}, Longitude: {lon})"

    # # Send to LLM
    # import ollama
    # result = ollama.chat(model="llama3.2-vision", messages=[{"role": "user", "content": query}])
    # print(result["message"]["content"])
    print(address)
    return address

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
