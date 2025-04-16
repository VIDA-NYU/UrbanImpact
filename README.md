# UrbanImpact
Reflects urban data exploration and its societal implications.

UrbanImpact is a platform designed to analyze and visualize urban data, enabling users to explore the relationships between urban environments and societal factors. The project leverages modern web technologies for both backend and frontend development.

## Features

- **Backend**: Powered by FastAPI, providing a robust and scalable API for data processing and analysis.
- **Frontend**: Built with modern JavaScript tools, offering an interactive and user-friendly interface.
- **Data Integration**: Supports integration with external datasets, including OSMNX for geospatial data.
- **LLM Integration**: Utilizes large language models (LLMs) to analyze data, extract insights, and provide detailed responses to user queries.
- **Image Support**: Enhances LLM responses by incorporating image-based context.

## Leveraging LLMs

UrbanImpact integrates LLMs to enhance data analysis and user interaction. Key use cases include:

- Identifying relevant columns in datasets based on user queries.
- Summarizing filtered data dynamically to provide actionable insights.
- Generating detailed explanations and structured responses for urban analysis.
- Enabling advanced reasoning by combining geospatial data with contextual information.

### Using Images to Improve LLM Responses

UrbanImpact leverages images to provide additional context for LLMs, improving the quality and relevance of responses. For example:

- Street view images are used to analyze urban infrastructure and identify potential collision risks.
- Images are processed and converted to Base64 format before being sent to the LLM for analysis.
- This integration allows the LLM to combine visual observations with data-driven insights for more comprehensive results.

The project uses the **Ollama LLM API** to process both textual and image-based inputs, ensuring a seamless and intelligent interaction experience.

## How to Start the Application

1. Navigate to the backend directory and install the dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Start the backend server:
   ```bash
   uvicorn server:app --reload
   ```

3. Navigate to the frontend directory and install the dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Start the frontend development server:
   ```bash
   npx webpack serve --open
   ```

## Accessing the Application

- Once the backend server is running, you can access the API at:  
  [http://localhost:8000](http://localhost:8000)

- After starting the frontend server, the application will automatically open in your default browser. If not, you can manually access it at:  
  [http://localhost:8080](http://localhost:8080)

## License

This project is licensed under the MIT License.
