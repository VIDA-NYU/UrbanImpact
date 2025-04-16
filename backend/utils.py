import json
import ollama

def fix_json_with_llm(raw_text):
    prompt = f"""
    Extract the JSON structure from the following text, ensuring it is well-formed and syntactically correct. 
    Return only the corrected JSON object without any extra text or explanations.

    {raw_text}
    """

    response = ollama.chat(model="llama3", messages=[{"role": "user", "content": prompt}])
    fixed_json = response["message"]["content"].strip()

    try:
        return json.loads(fixed_json)  # Parse to ensure it's valid JSON
    except json.JSONDecodeError as e:
        print("Failed to parse JSON:", e)
        return None  # Handle error gracefully

# Example raw text from LLM
raw_output = """Here is the response in the specified JSON structure:
{"location":{"intersection":"Tech Place and Jay Street","latitude":40.6949665,"longitude":-73.987162},"collision_risk_factors":[{"risk_factor":"Driver Inattention/Distraction","description":"The intersection appears to have a high volume of traffic, which may contribute to driver distraction. The surrounding buildings and pedestrian activity also suggest that drivers may be distracted by other factors such as pedestrians or road construction. Additionally, the road layout and signal placement may not be optimized for safe driving practices.","keywords":["Driver Inattention","Distraction","Traffic Volume","Road Layout"],"influence_attribution":{"visual_observation_percentage":60,"urban_infrastructure_percentage":40}},{"risk_factor":"Failure to Yield Right-of-Way","description":"The intersection has a complex road layout with multiple lanes and turning options, which may contribute to confusion among drivers. The signal placement appears to be adequate, but the surrounding infrastructure does not provide clear visual cues for drivers to yield to pedestrians or other vehicles.","keywords":["Right-of-Way","Road Layout","Signal Placement","Infrastructure"],"influence_attribution":{"visual_observation_percentage":40,"urban_infrastructure_percentage":60}},{"risk_factor":"Unspecified","description":"The intersection has a high number of unspecified contributing factors, which may indicate that there are underlying issues with the urban infrastructure or driver behavior that are not immediately apparent. Further investigation is needed to determine the root causes of these collisions.","keywords":["Unspecified","Urban Infrastructure","Driver Behavior","Collision Data"],"influence_attribution":{"visual_observation_percentage":30,"urban_infrastructure_percentage":70}},"conclusion":"The intersection at Tech Place and Jay Street has a complex road layout, high traffic volume, and inadequate visual cues for drivers to yield to pedestrians or other vehicles, contributing to driver inattention/distraction, failure to yield right-of-way, and unspecified factors."}   
"""

# Fix and extract JSON
cleaned_json = fix_json_with_llm(raw_output)

if cleaned_json:
    print("Fixed JSON:", cleaned_json)
else:
    print("Could not extract valid JSON.")