import L from 'leaflet';
import 'leaflet.heat';
import Papa from 'papaparse';
import './style.css';

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
});