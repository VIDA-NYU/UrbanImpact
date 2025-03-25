import L from 'leaflet';
import 'leaflet.heat';
import Papa from 'papaparse';
import './style.css';

import * as d3 from 'd3';
const img_path = 'http://127.0.0.1:8000/data/NYC/data/1-55252.csv'
let selected_latitude = 0;
let selected_longitude = 0;
let selected_images = [];

import cloud from 'd3-cloud';

import * as echarts from 'echarts';
function renderCollisionRiskFactors_StackedBar(data) {
    // Parse the JSON string from `data.answer`
    // const parsedData = JSON.parse(data.answer);
    const collisionFactors = data.collision_risk_factors;

    // Extract data for visualization
    const categories = collisionFactors.map(factor => factor.risk_factor);
    const visualObservation = collisionFactors.map(factor => factor.influence_attribution.visual_observation_percentage);
    const urbanInfrastructure = collisionFactors.map(factor => factor.influence_attribution.urban_infrastructure_percentage);

    // Ensure the chart is inside the chatbox
    const chatBox = document.getElementById('chat-box');

    // Remove previous charts
    document.getElementById("collision-chart")?.remove();

    // Create a new container
    const container = document.createElement("div");
    container.id = "collision-chart";
    container.style.width = "100%";
    container.style.height = "300px"; // Adjust as needed
    container.style.marginLeft = "20px"; // Adjust as needed

    chatBox.appendChild(container);

    // Initialize the chart
    const chart = echarts.init(container);

    // Set chart options
    const option = {
        title: { 
            text: 'Collision Risk Factors', 
            left: 'center',  
            bottom: 0        
        },        
        tooltip: { 
            trigger: 'axis',
            formatter: function(params) {
                const riskFactor = params[0].name;
                const factorData = collisionFactors.find(f => f.risk_factor === riskFactor);
                return `<b>${riskFactor}</b><br>${factorData.description}<br><b>Keywords:</b> ${factorData.keywords.join(', ')}`;
            }
        },
        legend: { data: ['Visual Observation', 'Urban Infrastructure'], top: 0 },
        xAxis: { 
            type: 'category', 
            data: categories, 
            axisLabel: { 
                rotate: 0,  
                interval: 0, 
                formatter: function(value) {
                    let words = value.split(' '); 
                    let lines = [];
                    let currentLine = '';
    
                    words.forEach(word => {
                        if ((currentLine + word).length > 15) { 
                            lines.push(currentLine); 
                            currentLine = word; 
                        } else {
                            currentLine += (currentLine ? ' ' : '') + word; 
                        }
                    });
    
                    if (currentLine) {
                        lines.push(currentLine); 
                    }
    
                    return lines.join('\n'); 
                }
            } 
        },
        yAxis: { type: 'value', name: 'Percentage (%)' },
        series: [
            {
                name: 'Visual Observation',
                type: 'bar',
                stack: 'total', // Makes it stacked
                data: visualObservation,
                itemStyle: { color: '#1E90FF' }, 
                emphasis: { itemStyle: { color: '#4682B4' } } 
            },
            {
                name: 'Urban Infrastructure',
                type: 'bar',
                stack: 'total', 
                data: urbanInfrastructure,
                itemStyle: { color: '#FF8C00' }, 
                emphasis: { itemStyle: { color: '#E67E22' } } 
            }
        ]
    };
    

    // Render the chart
    chart.setOption(option);
}

function renderCollisionRiskFactors(data) {
    const collisionFactors = data.collision_risk_factors;

    // Extract data for visualization
    const categories = collisionFactors.map(factor => factor.risk_factor);
    const visualObservation = collisionFactors.map(factor => factor.influence_attribution.visual_observation_percentage);
    const urbanInfrastructure = collisionFactors.map(factor => factor.influence_attribution.urban_infrastructure_percentage);

    // Ensure the chart is inside the chatbox
    const chatBox = document.getElementById('chat-box');

    // Remove previous charts if they exist
    // document.getElementById("collision-chart")?.remove();
    // document.getElementById("donut-chart")?.remove();
    // document.getElementById("stacked-bar-chart")?.remove();

    // Create a new container for the bar chart
    const barContainer = document.createElement("div");
    barContainer.id = "collision-chart";
    barContainer.style.width = "100%";
    barContainer.style.height = "300px"; 
    barContainer.style.marginLeft = "10px"; 

    chatBox.appendChild(barContainer);

    // Initialize the chart
    // const chart = echarts.init(container);
    // Initialize the bar chart
    const barChart = echarts.init(barContainer);

    // Set chart options
    const option = {
        title: { 
            text: 'Collision Risk Factors', 
            left: 'center',  
            bottom: 0        
        },        
        tooltip: { trigger: 'axis' },
        legend: { data: ['Visual Observation', 'Urban Infrastructure'], top: 0 },
        xAxis: { 
            type: 'category', 
            data: categories, 
            axisLabel: { 
                rotate: 0,  
                interval: 0, 
                formatter: function(value) {
                    let words = value.split(' '); 
                    let lines = [];
                    let currentLine = '';
    
                    words.forEach(word => {
                        if ((currentLine + word).length > 15) { 
                            lines.push(currentLine); 
                            currentLine = word; 
                        } else {
                            currentLine += (currentLine ? ' ' : '') + word; 
                        }
                    });
    
                    if (currentLine) {
                        lines.push(currentLine); 
                    }
    
                    return lines.join('\n'); 
                }
            } 
        },
        yAxis: { type: 'value', name: 'Percentage (%)' },
        series: [
            {
                name: 'Visual Observation',
                type: 'bar',
                data: visualObservation,
                itemStyle: { color: '#1E90FF' },  // Updated Blue
                emphasis: { itemStyle: { color: '#4682B4' } } // Slightly darker blue on hover
            },
            {
                name: 'Urban Infrastructure',
                type: 'bar',
                data: urbanInfrastructure,
                itemStyle: { color: '#FF8C00' }, // Updated Orange
                emphasis: { itemStyle: { color: '#E67E22' } } // Slightly darker orange on hover
            }
        ]
    };

    // // Create a new container for the donut chart
    // const donutContainer = document.createElement("div");
    // donutContainer.id = "donut-chart";
    // donutContainer.style.width = "300px";
    // donutContainer.style.height = "300px"; 
    // donutContainer.style.margin = "20px auto"; 

    // chatBox.appendChild(donutContainer);

    // // Initialize the donut chart
    // const donutChart = echarts.init(donutContainer);

    // const totalVisual = visualObservation.reduce((a, b) => a + b, 0);
    // const totalUrban = urbanInfrastructure.reduce((a, b) => a + b, 0);

    // const donutOption = {
    //     title: {
    //         text: 'Overall Influence Attribution',
    //         left: 'center',
    //         top: 'bottom'
    //     },
    //     tooltip: { trigger: 'item' },
    //     series: [{
    //         type: 'pie',
    //         radius: ['50%', '70%'], // Donut shape
    //         data: [
    //             { value: totalVisual, name: 'Visual Observation', itemStyle: { color: '#1E90FF' } },
    //             { value: totalUrban, name: 'Urban Infrastructure', itemStyle: { color: '#FF8C00' } }
    //         ]
    //     }]
    // };

    // // Render both charts
    // barChart.setOption(option);
    // donutChart.setOption(donutOption);

    // Create a new container for the stacked bar chart
    const stackedBarContainer = document.createElement("div");
    stackedBarContainer.id = "stacked-bar-chart";
    stackedBarContainer.style.width = "100%";
    stackedBarContainer.style.height = "80px";  // More compact height
    stackedBarContainer.style.margin = "10px 10px 0";

    chatBox.appendChild(stackedBarContainer);

    // Initialize the stacked bar chart
    const stackedBarChart = echarts.init(stackedBarContainer);

    const totalVisual = visualObservation.reduce((a, b) => a + b, 0);
    const totalUrban = urbanInfrastructure.reduce((a, b) => a + b, 0);

    const stackedBarOption = {
        title: { text: 'Overall Influence Attribution', left: 'center', bottom: 0 },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: { type: 'value', show: false }, 
        yAxis: { type: 'category', data: ['Influence'], show: false },
        series: [
            {
                name: 'Visual Observation',
                type: 'bar',
                stack: 'total',
                data: [totalVisual],
                itemStyle: { color: '#1E90FF' }
            },
            {
                name: 'Urban Infrastructure',
                type: 'bar',
                stack: 'total',
                data: [totalUrban],
                itemStyle: { color: '#FF8C00' }
            }
        ]
    };

    // Create new container
    const container = document.createElement("div");
    barContainer.id = "collision-tree-chart";
    container.style.width = "100%";
    container.style.height = "230px";

    chatBox.appendChild(container);

    // Initialize chart
    const chart = echarts.init(container);

    // Construct the tree structure
    const treeData = {
        name: "CRF",  // Display "CRF" instead of full name
        tooltip: { value: "Collision Risk Factors" },  // Tooltip shows full name
        children: data.collision_risk_factors.map(factor => ({
            name: factor.risk_factor,
            children: factor.keywords.map(keyword => ({ name: keyword }))
        }))
    };

    // ECharts Tree option
    const optionTree = {
        title: { 
            text: 'Collision Risk Factors (Keywords)', 
            left: 'center',  
            bottom: 0        
        },     
        tooltip: {
            trigger: "item",
            formatter: function (params) {
                // If hovering over "CRF", show full name
                return params.data.name === "CRF" ? "Collision Risk Factors" : params.data.name;
            }
        },
        series: [
            {
                type: "tree",
                data: [treeData],
                orient: "LR", // Left-to-Right
                left: "10%",  // Move tree closer to left
                right: "30%", // More space for labels
                symbol: "circle",
                symbolSize: 10, // Smaller node circles
                initialTreeDepth: 2, // Keep all levels visible
                label: {
                    position: "left",
                    verticalAlign: "middle",
                    align: "right",
                    fontSize: 14,
                    width: 150,  // Set a fixed width for labels
                    overflow: "break" // Allow line breaks if needed
                },
                lineStyle: {
                    color: "#888",
                    width: 1
                },
                itemStyle: {
                    color: "#888"
                },
                leaves: {
                    label: {
                        position: "right",
                        verticalAlign: "middle",
                        align: "left",
                        fontSize: 12,
                        width: 120, // Ensure space for keyword labels
                        overflow: "break"
                    },
                    itemStyle: {
                        color: "#888"
                    }
                },
                expandAndCollapse: true,
                animationDuration: 550,
                animationDurationUpdate: 750
            }
        ]
    };


    // Render both charts
    chart.setOption(optionTree);

    barChart.setOption(option);
    stackedBarChart.setOption(stackedBarOption);
}


function renderWordCloud(parsedData) {
    const chatBox = document.getElementById("chat-box");

    // Remove previous word cloud if it exists
    d3.select("#word-cloud-container").remove();

    // Create a container for the word cloud inside the chatbox
    const container = document.createElement("div");
    container.id = "word-cloud-container";
    container.style.marginTop = "10px"; // Add spacing
    chatBox.appendChild(container);

    // Extract keywords from risk factors
    const keywords = parsedData.collision_risk_factors.flatMap(factor => factor.keywords);

    // Count keyword frequency
    const keywordCounts = {};
    keywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });

    // Convert to D3-friendly array
    const wordData = Object.keys(keywordCounts).map(word => ({
        text: word,
        size: 12 + keywordCounts[word] * 10 // Scale size based on frequency
    }));

    // Set up dimensions
    const width = 400, height = 250;
    const svg = d3.select("#word-cloud-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Generate word cloud layout
    cloud()
        .size([width, height])
        .words(wordData)
        .padding(5)
        .rotate(() => Math.random() * 90 - 45)
        .fontSize(d => d.size)
        .on("end", words => {
            svg.selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", d => `${d.size}px`)
                .style("fill", (d, i) => d3.schemeCategory10[i % 10])
                .attr("text-anchor", "middle")
                .attr("transform", d => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
                .text(d => d.text);
        })
        .start();
}


function renderCollisionRiskFactorsD3(data) {
    const chatBox = document.getElementById('chat-box');

    // Remove previous visualizations (optional)
    d3.select("#collision-chart").remove();

    // Create a container for the visualization
    const container = document.createElement("div");
    container.id = "collision-chart";
    chatBox.appendChild(container);

    // Extract risk factors
    const riskFactors = data.collision_risk_factors.map(d => ({
        name: d.risk_factor,
        visual: d.influence_attribution.visual_observation_percentage,
        infrastructure: d.influence_attribution.urban_infrastructure_percentage
    }));

    // Set up dimensions
    const width = 300, height = 200, margin = { top: 20, right: 20, bottom: 40, left: 120 };

    // Create SVG
    const svg = d3.select("#collision-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Scale for bars
    const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
        .domain(riskFactors.map(d => d.name))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);

    // Draw bars for visual influence
    svg.selectAll(".bar-visual")
        .data(riskFactors)
        .enter()
        .append("rect")
        .attr("class", "bar-visual")
        .attr("x", xScale(0))
        .attr("y", d => yScale(d.name))
        .attr("width", d => xScale(d.visual) - xScale(0))
        .attr("height", yScale.bandwidth() / 2)
        .attr("fill", "#3498db");

    // Draw bars for infrastructure influence
    svg.selectAll(".bar-infra")
        .data(riskFactors)
        .enter()
        .append("rect")
        .attr("class", "bar-infra")
        .attr("x", xScale(0))
        .attr("y", d => yScale(d.name) + yScale.bandwidth() / 2)
        .attr("width", d => xScale(d.infrastructure) - xScale(0))
        .attr("height", yScale.bandwidth() / 2)
        .attr("fill", "#e74c3c");

    // Labels
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5));

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));
}



document.addEventListener('DOMContentLoaded', () => {

    const chatBox = document.getElementById('chat-box');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    // Example JSON data structure
    // const collisionData = {
    //     "location": {
    //         "intersection": "Tillary Street and Flatbush Avenue Extension",
    //         "latitude": 40.6959659,
    //         "longitude": -73.9845903
    //     },
    //     "collision_risk_factors": [
    //         {
    //             "risk_factor": "High Traffic Volume and Speeding",
    //             "description": "Located just off I-278, this intersection experiences significant traffic flow from the interstate onto surface streets. The abrupt transition from high-speed highways to lower-speed city streets can lead to increased collision risks.",
    //             "keywords": ["high traffic volume", "speeding", "interstate access", "speed limit transition"],
    //             "influence_attribution": {
    //                 "visual_observation_percentage": 50,
    //                 "urban_infrastructure_percentage": 50
    //             }
    //         },
    //         {
    //             "risk_factor": "Complex Intersection Design",
    //             "description": "The convergence of multiple streets creates a multifaceted intersection with numerous lanes and turning options. This complexity can confuse drivers, leading to improper lane usage and collisions.",
    //             "keywords": ["complex intersection", "multiple lanes", "turning options", "driver confusion"],
    //             "influence_attribution": {
    //                 "visual_observation_percentage": 40,
    //                 "urban_infrastructure_percentage": 60
    //             }
    //         },
    //         {
    //             "risk_factor": "High Pedestrian Activity",
    //             "description": "The presence of parks, hotels, and attractions results in substantial pedestrian foot traffic. Insufficient pedestrian crossings and inadequate signage increase the risk of vehicle-pedestrian collisions.",
    //             "keywords": ["high pedestrian activity", "insufficient crossings", "inadequate signage", "vehicle-pedestrian collisions"],
    //             "influence_attribution": {
    //                 "visual_observation_percentage": 60,
    //                 "urban_infrastructure_percentage": 40
    //             }
    //         }
    //     ],
    //     "conclusion": "This intersection is a high-risk area for collisions due to heavy traffic volume, complex design, and significant pedestrian activity. Addressing these issues through infrastructure improvements and enhanced traffic management could improve safety."
    // };
    // const LLM_Response  = {
    //     "location": {
    //     "intersection": "Adams Street and Tillary Street",
    //     "latitude": 40.6962415,
    //     "longitude": -73.9886456
    //     },
    //     "collision_risk_factors": [
    //     {
    //     "risk_factor": "Inadequate Sight Distance",
    //     "description": "The intersection has a complex geometry with multiple lanes, pedestrian crossings, and limited visibility due to tall buildings. This can lead to drivers underestimating the distance or speed of other vehicles, pedestrians, or bicyclists.",
    //     "keywords": ["Sight Distance", "Intersection Design", "Pedestrian Safety", "Driver Error"],
    //     "influence_attribution": {
    //     "visual_observation_percentage": 60,
    //     "urban_infrastructure_percentage": 40
    //     }
    //     },
    //     {
    //     "risk_factor": "Insufficient Traffic Signal Timing",
    //     "description": "The traffic signal timing at this intersection may not be optimized for the high volume of traffic, pedestrians, and bicyclists. This can lead to conflicts between vehicles, pedestrians, or bicyclists trying to cross the intersection.",
    //     "keywords": ["Traffic Signal Timing", "Intersection Capacity", "Pedestrian Flow", "Driver Behavior"],
    //     "influence_attribution": {
    //     "visual_observation_percentage": 30,
    //     "urban_infrastructure_percentage": 70
    //     }
    //     },
    //     {
    //     "risk_factor": "Aggressive Driving",
    //     "description": "The intersection is prone to aggressive driving behaviors such as speeding, tailgating, or failure to yield. This can lead to vehicle collisions, especially during peak hours.",
    //     "keywords": ["Aggressive Driving", "Speed Management", "Driver Behavior", "Road Safety"],
    //     "influence_attribution": {
    //     "visual_observation_percentage": 20,
    //     "urban_infrastructure_percentage": 80
    //     }
    //     }
    //     ],
    //     "conclusion": "The intersection of Adams Street and Tillary Street is prone to vehicle collisions due to inadequate sight distance, insufficient traffic signal timing, and aggressive driving behaviors. Improving the urban infrastructure and driver behavior can help reduce collision risk."
    //     }
    // renderCollisionRiskFactors(LLM_Response);

    sendButton.addEventListener('click', async () => {
        let question = input.value.trim();
        if (!question) return;
        question = `${question}. The area is located at latitude: ${selected_latitude} and longitude:${selected_longitude}`;
        const userMessage = document.createElement('p');
        userMessage.innerText = `You: ${question}.`;
        chatBox.appendChild(userMessage);

        console.log("selected_images before join:", selected_images);
        const imageString = selected_images.length > 0 ? selected_images.join(',') : ''; 

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, image: imageString }),
        });

        const data = await response.json();
        const botMessage = document.createElement('p');
        botMessage.innerText = `AI: ${data.answer}`;
        chatBox.appendChild(botMessage);




        // Parse `data.answer` since it is a JSON string
        let parsedData;
        try {
            parsedData = JSON.parse(data.answer);
        } catch (error) {
            console.error("Error parsing response:", error);
        }

        // Append AI response text
        // const botMessage = document.createElement('p');
        // botMessage.innerText = `AI: ${parsedData.conclusion}`;
        // chatBox.appendChild(botMessage);

        // Check if parsedData contains collision risk factors before rendering
        if (parsedData?.collision_risk_factors) {
            renderCollisionRiskFactors(parsedData);
            renderWordCloud(parsedData);
        }
        input.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;
        // Parse the region data from the response
        const region = data.region; // Expecting the region as a JSON object, e.g., {latMin, latMax, lonMin, lonMax}
        console.log("region frontend");
        console.log(region);

        if (region) {
            highlightRegion(region);
        }
    });

    // Create a map centered on New York
    const map = L.map('map').setView([40.7128, -74.0060], 12);  // New York coordinates

    // Add a tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Declare a global variable to hold the current highlighted rectangle
    let highlightedArea = null;

    // Function to highlight a region on the map
    function highlightRegion(region) {
        // If there's already a highlighted area, remove it
        if (highlightedArea) {
            map.removeLayer(highlightedArea);
        }

        // Define the bounding box for the region
        const bounds = [
            [region.latMin, region.lonMin],  // Southwest corner
            [region.latMax, region.lonMax]   // Northeast corner
        ];

        // Create a new rectangle to highlight the region
        highlightedArea = L.rectangle(bounds, {
            color: "#ff7800",  // Border color
            weight: 2,
            fillOpacity: 0.2
        }).addTo(map);

        map.fitBounds(bounds);  // Zoom the map to fit the bounds
    }

    // Define the color scale using D3 (sequential colors)
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, 7]);  // Min and Max building heights (can adjust based on data)

    // Function to fetch population data for the city
    async function getPopulationData(city) {
        const response = await fetch(`http://127.0.0.1:8000/data/pop/${city}_updated_test_pop.csv`);
        const csvText = await response.text();

        return new Promise((resolve) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: function(results) {
                    console.log("Parsed Population data:", results.data);
                    resolve(results.data);
                }
            });
        });
    }

    async function fetchAndFindImgIds(csvUrl, targetLat, targetLng) {
        try {
            // Fetch the CSV file
            let response = await fetch(csvUrl);
            let csvData = await response.text(); // Convert response to text
            // Parse CSV
            let rows = Papa.parse(csvData, { header: true }).data;
            let imgIds = [];

            for (let row of rows) {
                let lat = parseFloat(row.y); // latitude
                let lng = parseFloat(row.x); // longitude

                // Check if latitude and longitude match
                if (lat === targetLat && lng === targetLng) {
                    imgIds.push(row.img_id); // Collect all matching img_id values
                }
            }
            return imgIds; // Return array of img_id values
        } catch (error) {
            console.error("Error fetching or parsing CSV:", error);
            return [];
        }
    }

    async function addCircleMarkerCollisions(city) {
        const feature_name = "Motor_Vehicle_Collisions_Crashes";
        try {
            // const response = await fetch(`http://127.0.0.1:8000/data/${feature_name}/${city}_updated_test_${feature_name}.csv`);
            const response = await fetch(`http://127.0.0.1:8000/data/NYC/Motor_Vehicle_Collisions_Crashes/NYC_Vehicle_Collisions_Crashes_at_intersections_summary.csv`);

            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: function(results) {
                    console.log("Parsed CSV data:", results.data);
                    // Extract the number of accidents
                    const numAccidentsList = results.data.map(row => parseInt(row['number_accidents']) || 0);

                    // Find the minimum and maximum number of accidents
                    const minAccidents = Math.min(...numAccidentsList);
                    const maxAccidents = Math.max(...numAccidentsList);

                    console.log("Min Accidents:", minAccidents);
                    console.log("Max Accidents:", maxAccidents);

                    // Define a color scale (e.g., from blue to red)
                    const colorScale = d3.scaleLinear()
                        .domain([minAccidents, maxAccidents])
                        .range(["blue", "red"]);

                    const population = null;
                    // Add circle markers for each data point
                    results.data.forEach(row => {
                        if (row.latitude == null || row.longitude == null) {
                            return; // Skip this iteration if lat/lon is missing
                        }
                        const latitude = parseFloat(row.latitude);
                        const longitude = parseFloat(row.longitude);
                        const numAccidents = parseInt(row['number_accidents']) || 0;

                        // if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(numAccidents)) {

                            // Create a circle marker for each building location
                    const circle = L.circleMarker([latitude, longitude], {
                        radius: 1 + (numAccidents / maxAccidents) * 10, // Scale radius based on collisions
                                fillColor: colorScale(numAccidents), // Set color based on collisions
                                color: "#000", // Border color
                                weight: 1, // Border width
                                opacity: 1, // Border opacity
                                fillOpacity: 0.8 // Fill opacity
                    })
                    .bindTooltip(`Collisions: ${numAccidents}`, { permanent: false, direction: 'top' }) // Add tooltip
                    .addTo(map);
                    // Attach click event to fetch img_id dynamically
                    circle.on('click', async function() {
                        selected_latitude = latitude;
                        selected_longitude = longitude;
                        let imgIds = await fetchAndFindImgIds(img_path, latitude, longitude);
                        // selected_image = `http://127.0.0.1:8000/data/NYC/data/${imgIds[0]}.jpg`
                        selected_images = imgIds.map(id => `http://127.0.0.1:8000/data/NYC/data/${id}.jpg`);

                        console.log(imgIds);
                        let imgHtml = imgIds.length > 0 
                            ? `<div class="image-gallery">
                                    ${imgIds.map(id => `
                                        <div class="gallery-item">
                                            <img src="http://127.0.0.1:8000/data/NYC/data/${id}.jpg" 
                                                alt="Building Image">
                                        </div>`).join('')}
                            </div>`
                            : `<p>No images available</p>`;
                    
                        // Bind popup with image gallery
                        circle.bindPopup(`
                            <h3><b>Collisions: ${numAccidents}</b></h3>
                            ${imgHtml}
                            <p><b>Image Location:</b> ${latitude}, ${longitude}</p>
                            <style>
                                .image-gallery {
                                    display: flex;
                                    overflow-x: auto;
                                    gap: 5px;
                                    max-width: 250px; /* Prevents excessive width */
                                    padding: 5px;
                                    white-space: nowrap;
                                }
                                .gallery-item img {
                                    width: 200px;
                                    height: 160px;
                                    object-fit: cover;
                                    border: 2px solid black;
                                    border-radius: 5px;
                                }
                            </style>
                        `).openPopup();
                    });
                    });
                },
                error: function(error) {
                    console.error("Error parsing CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error fetching CSV:", error);
        }
    }

    addCircleMarkerCollisions("Brooklyn");

    // Load the circle markers for NYC by default
    // addCircleMarkers("NYC");
    // addCircleMarkers("Hongkong");
    // addCircleMarkers("LA");
    // addCircleMarkers("London");



    async function fetchAndFindImgIdsDowntown(csvUrl, targetLat, targetLng, city) {

        try {
            // Fetch the CSV file
            let response = await fetch(`http://127.0.0.1:8000/data/streetview/${city}_updated_test/images.csv`);
            let csvData = await response.text(); // Convert response to text
            // Parse CSV
            let rows = Papa.parse(csvData, { header: true }).data;
            let imgIds = [];

            for (let row of rows) {
                let lat = parseFloat(row.latitude); // latitude
                let lng = parseFloat(row.longitude); // longitude

                // Check if latitude and longitude match
                if (lat === targetLat && lng === targetLng) {
                    imgIds.push(row.ID + "_"+row.img_id); // Collect all matching img_id values
                }
            }
            return imgIds; // Return array of img_id values
        } catch (error) {
            console.error("Error fetching or parsing CSV:", error);
            return [];
        }
    }


    // Function to load CSV and add circle markers
    async function addCircleMarkers(city) {
        // // Fetch population data
        // const populationData = await getPopulationData(city);
        // const feature_name = 'building_height';
        // const feature_name = 'cross_interceptions'
        const feature_name = "Motor_Vehicle_Collisions_Crashes"

        const response = await fetch(`http://127.0.0.1:8000/data/${feature_name}/${city}_updated_test_${feature_name}.csv`);
        const csvText = await response.text();


        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: function(results) {
                console.log("Parsed CSV data:", results.data);

                // Iterate over the data and add markers
                results.data.forEach(d => {
                    if (d.latitude == null || d.longitude == null) {
                        return; // Skip this iteration if lat/lon is missing
                    }
                    const height = d.Built_Height_2018;  // Building height
                    const color = colorScale(height);  // Get the color based on height
                    const population = null;

                    // Create a circle marker for each building location
                    const circle = L.circleMarker([d.latitude, d.longitude], {
                        radius: 4,  // Radius of the circle
                        color: color,  // Border color
                        fillColor: color,  // Fill color
                        fillOpacity: 0.7  // Opacity of the fill color
                    })
                    .addTo(map);
                    // Attach click event to fetch img_id dynamically
                    circle.on('click', async function() {
                        let imgIds = await fetchAndFindImgIdsDowntown(img_path, d.latitude, d.longitude, city);
                        let imgHtml = imgIds.length > 0 
                            ? `<div class="image-gallery">
                                    ${imgIds.map(id => `
                                        <div class="gallery-item">
                                            <img src="http://127.0.0.1:8000/data/streetview/${city}_updated_test/${id}.jpg" 
                                                alt="Building Image">
                                        </div>`).join('')}
                            </div>`
                            : `<p>No images available</p>`;
                    
                        // Bind popup with image gallery
                        circle.bindPopup(`
                            <h3><b>Height: ${height}m</b></h3>
                            ${imgHtml}
                            <p><b>Image Location:</b> ${d.latitude}, ${d.longitude}</p>
                            <style>
                                .image-gallery {
                                    display: flex;
                                    overflow-x: auto;
                                    gap: 5px;
                                    max-width: 250px; /* Prevents excessive width */
                                    padding: 5px;
                                    white-space: nowrap;
                                }
                                .gallery-item img {
                                    width: 200px;
                                    height: 160px;
                                    object-fit: cover;
                                    border: 2px solid black;
                                    border-radius: 5px;
                                }
                            </style>
                        `).openPopup();
                    });
                    
                });
            }
        });
    }
    addCircleMarkers("Brooklyn");



    // Function to load CSV and add heatmap
    async function addHeatmap(city) {
        const feature_name = "Motor_Vehicle_Collisions_Crashes";
        try {
            // const response = await fetch(`http://127.0.0.1:8000/data/${feature_name}/${city}_updated_test_${feature_name}.csv`);
            const response = await fetch(`http://127.0.0.1:8000/data/NYC/Motor_Vehicle_Collisions_Crashes/NYC_Vehicle_Collisions_Crashes_at_intersections_summary.csv`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: function(results) {
                    console.log("Parsed CSV data:", results.data);

                    // Extract the number of accidents and apply logarithmic scaling
                    const logIntensities = results.data.map(row => {
                        const numAccidents = parseInt(row['number_accidents']) || 0;
                        return Math.log10(numAccidents + 1); // Apply logarithmic scaling
                    }).filter(value => !isNaN(value)); // Filter out invalid values

                    // Find the minimum and maximum log intensities
                    const minLogIntensity = Math.min(...logIntensities);
                    const maxLogIntensity = Math.max(...logIntensities);

                    console.log("Min Log Intensity:", minLogIntensity);
                    console.log("Max Log Intensity:", maxLogIntensity);

                    // Normalize log intensities to [0, 1] using min-max scaling
                    const heatData = results.data.map(row => {
                        const latitude = parseFloat(row.latitude);
                        const longitude = parseFloat(row.longitude);
                        const numAccidents = parseInt(row['number_accidents']) || 0;

                        if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(numAccidents)) {
                            const logIntensity = Math.log10(numAccidents + 1); // Apply logarithmic scaling
                            const normalizedIntensity = (logIntensity - minLogIntensity) / (maxLogIntensity - minLogIntensity); // Min-max normalization
                            return [latitude, longitude, normalizedIntensity, numAccidents]; // Include numAccidents for tooltip
                        }
                    }).filter(Boolean); // Remove invalid entries

                    console.log("Normalized Heatmap Data:", heatData);

                    // Add the heatmap layer
                    const heat = L.heatLayer(heatData.map(point => [point[0], point[1], point[2]]), {
                        radius: 20,
                        blur: 1,
                        max: 1, // Set max intensity to 1
                        gradient: {
                            0.1: 'blue',
                            0.3: 'cyan',
                            0.6: 'lime',
                            1: 'red'
                        }
                    }).addTo(map);
                },
                error: function(error) {
                    console.error("Error parsing CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error fetching CSV:", error);
        }
    }
    // Load the heatmap for NYC by default
    addHeatmap("Brooklyn");



    // async function addHeatmap(city) {
    //     const feature_name = "Motor_Vehicle_Collisions_Crashes"
    //     const response = await fetch(`http://127.0.0.1:8000/data/${feature_name}/${city}_updated_test_${feature_name}.csv`);
    //     const csvText = await response.text();

    //     Papa.parse(csvText, {
    //         header: true,
    //         skipEmptyLines: true,
    //         dynamicTyping: true,
    //         complete: function(results) {
    //             console.log("Parsed CSV data:", results.data); // Access the parsed CSV data
    //             // const heatData = results.data.map(d => [
    //                 // d.latitude,
    //                 // d.longitude,
    //                 // d.Built_Height_2018 / 200  // Normalize height for visualization
    //             const heatData = results.data.map(row => {
    //                 const latitude = parseFloat(row.latitude);
    //                 const longitude = parseFloat(row.longitude);

    //                 const numAccidents = parseInt(row['number_accidents']) || 0;
    //                 if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(numAccidents)) {
    //                     return [latitude, longitude, numAccidents]; // Format: [lat, lon, intensity]
    //                 }
    //             }).filter(Boolean); // Remove any invalid entries
    //             // ]);

    //             const heat = L.heatLayer(heatData, {
    //                 radius: 20,
    //                 blur: 15,
    //                 maxZoom: 17
    //             }).addTo(map);
    //         }
    //     });
    // }


});