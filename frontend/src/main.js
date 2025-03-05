import L from 'leaflet';
import 'leaflet.heat';
import Papa from 'papaparse';

// Create a map centered on New York
const map = L.map('map').setView([40.7128, -74.0060], 12);  // New York coordinates

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// CSV file path (adjust if necessary)
const csvFilePath = '/Motor_Vehicle_Collisions_Crashes.csv'; // Path should be relative to public

// Store parsed data globally
let crashData = [];

// Tooltip for hover information
const tooltip = L.tooltip({
    permanent: false,
    direction: 'top',
    offset: [0, -10],
}); // Initialize as empty and off-screen

// Parse CSV file using PapaParse
Papa.parse(csvFilePath, {
    download: true,
    header: true, // Use the first row as header
    complete: function(results) {
        crashData = results.data.slice(0, 4000);
        // Parse the heatmap data after the CSV is loaded
        const heatData = crashData.map(row => {
        // // Extract latitude, longitude, and number of persons injured
        // const heatData = results.data.map(row => {
        // const heatData = results.data.slice(0, 200).map(row => {
            const latitude = parseFloat(row.LATITUDE);
            const longitude = parseFloat(row.LONGITUDE);
            const personsInjured = parseInt(row['NUMBER OF PERSONS INJURED'], 10);
            if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(personsInjured)) {
                return [latitude, longitude, personsInjured]; // Format: [lat, lon, intensity]
            }
        }).filter(Boolean); // Remove any invalid entries

        // Add the heatmap layer to the map
        L.heatLayer(heatData, {
            radius: 10,           // Radius of the heatmap points
            blur: 15,             // Blur effect to make heatmap more smooth
            maxZoom: 15,          // Maximum zoom level for heatmap intensity
        }).addTo(map);
        // Add the tooltip to the map only when it's needed
        map.on('mousemove', (e) => {
            const { lat, lng } = e.latlng;
        
            // Find the closest data point within a threshold
            const threshold = 0.002; // Adjust for sensitivity
            const closestPoint = crashData.find((row) => {
                const latitude = parseFloat(row.LATITUDE);
                const longitude = parseFloat(row.LONGITUDE);
        
                // Validate that latitude and longitude are numbers
                if (isNaN(latitude) || isNaN(longitude)) {
                    return false;
                }
        
                const latDiff = Math.abs(latitude - lat);
                const lngDiff = Math.abs(longitude - lng);
                return latDiff < threshold && lngDiff < threshold;
            });
        
            if (closestPoint) {
                const lat = parseFloat(closestPoint.LATITUDE);
                const lon = parseFloat(closestPoint.LONGITUDE);
        
                // Ensure the coordinates are valid before displaying the tooltip
                if (!isNaN(lat) && !isNaN(lon)) {
                    const tooltipContent = `
                        <strong>Location:</strong> ${closestPoint.LOCATION || 'N/A'}<br>
                        <strong>Street Name:</strong> ${closestPoint['ON STREET NAME'] || 'N/A'}<br>
                        <strong>Borough:</strong> ${closestPoint.BOROUGH || 'N/A'}<br>
                        <strong>Crash Date:</strong> ${closestPoint['CRASH DATE'] || 'N/A'}<br>
                        <strong>Persons Injured:</strong> ${closestPoint['NUMBER OF PERSONS INJURED'] || 0}<br>
                    `;
        
                    tooltip.setLatLng([lat, lon]).setContent(tooltipContent).openOn(map);
                } else {
                    tooltip.remove(); // Hide the tooltip if coordinates are invalid
                }
            } else {
                tooltip.remove(); // Hide the tooltip if no valid point is found
            }
        });
    },
    error: function(error) {
        console.error('Error parsing CSV:', error);
    }
});


// Search functionality
const searchBox = document.getElementById('search-box');
searchBox.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();

    // Filter the data based on the query (search by borough, zip, or street)
    const result = crashData.filter(row => {
        return (
            row.BOROUGH && row.BOROUGH.toLowerCase().includes(query) ||
            row['ZIP CODE'] && row['ZIP CODE'].toLowerCase().includes(query) ||
            row['ON STREET NAME'] && row['ON STREET NAME'].toLowerCase().includes(query)
        );
    });

    // If results are found, zoom to the first result
    if (result.length > 0) {
        const firstResult = result[0];
        const lat = parseFloat(firstResult.LATITUDE);
        const lon = parseFloat(firstResult.LONGITUDE);

        // Zoom in to the first matching location
        map.setView([lat, lon], 15);
    }
});