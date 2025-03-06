import L from 'leaflet';
import 'leaflet.heat';
import Papa from 'papaparse';
import './style.css';

import * as d3 from 'd3';


document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    sendButton.addEventListener('click', async () => {
        const question = input.value.trim();
        if (!question) return;

        const userMessage = document.createElement('p');
        userMessage.innerText = `You: ${question}`;
        chatBox.appendChild(userMessage);

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question }),
        });

        const data = await response.json();
        const botMessage = document.createElement('p');
        botMessage.innerText = `AI: ${data.answer}`;
        chatBox.appendChild(botMessage);

        input.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Create a map centered on New York
    const map = L.map('map').setView([40.7128, -74.0060], 12);  // New York coordinates

    // Add a tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Define the color scale using D3 (sequential colors)
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, 7]);  // Min and Max building heights (can adjust based on data)

    // Function to load CSV and add circle markers
    async function addCircleMarkers(city) {
        const response = await fetch(`http://127.0.0.1:8000/data/building_height/${city}_updated_test_building_height.csv`);
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: function(results) {
                console.log("Parsed CSV data:", results.data);

                // Iterate over the data and add markers
                results.data.forEach(d => {
                    const height = d.Built_Height_2018;  // Building height
                    const color = colorScale(height);  // Get the color based on height

                    // Create a circle marker for each building location
                    const circle = L.circleMarker([d.latitude, d.longitude], {
                        radius: 4,  // Radius of the circle
                        color: color,  // Border color
                        fillColor: color,  // Fill color
                        fillOpacity: 0.7  // Opacity of the fill color
                    })
                    .bindPopup(`
                        <h3><b>Building Height: ${height}m</b></h3>
                        <p><img src="http://127.0.0.1:8000/data/streetview/${city}_updated_test/${d.latitude}_${d.longitude}.jpg" alt="Building Image" style="width:250px;height:150px;border:2px solid black;"></p>
                    `)
                    .addTo(map);
                });
            }
        });
    }

    // Load the circle markers for NYC by default
    addCircleMarkers("NYC");

    // // Function to load CSV and add heatmap
    // async function addHeatmap(city) {
    //     const response = await fetch(`http://127.0.0.1:8000/data/building_height/${city}_updated_test_building_height.csv`);
    //     const csvText = await response.text();

    //     Papa.parse(csvText, {
    //         header: true,
    //         skipEmptyLines: true,
    //         dynamicTyping: true,
    //         complete: function(results) {
    //             console.log("Parsed CSV data:", results.data); // Access the parsed CSV data
    //             const heatData = results.data.map(d => [
    //                 d.latitude,
    //                 d.longitude,
    //                 d.Built_Height_2018 / 200  // Normalize height for visualization
    //             ]);

    //             const heat = L.heatLayer(heatData, {
    //                 radius: 20,
    //                 blur: 15,
    //                 maxZoom: 17
    //             }).addTo(map);
    //         }
    //     });
    // }

    // // Load the heatmap for NYC by default
    // addHeatmap("NYC");
});