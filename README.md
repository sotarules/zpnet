# ZPNet Server

ZPNet Server is the **server-side back end** for the ZPNet Sensor Suite. Its primary purpose is to provide a reliable **REST endpoint** for receiving telemetry — a near-real-time stream of events emitted by the Sensor Suite. By centralizing data capture, ZPNet ensures that all incoming telemetry is **safely preserved regardless of what happens** at the sensor level.

---

## Overview

- **Framework**: Built with JavaScript on top of **React / Meteor / Node.js / MongoDB**.  
- **Foundation**: Developed on **VXFrame**, a multitenant open-source framework. While VXFrame is overkill for this application, it provides familiar scaffolding, including authentication and login for remote access.  
- **Deployment**: Can easily be deployed to **AWS**, but will initially run locally at [sota.ddns.net](http://sota.ddns.net) (port 80 forwarded).  

---

## Core Functions

1. **Telemetry Ingestion**  
   - ZPNet exposes a REST API endpoint for the ZPNet Sensor Suite.  
   - Sensor events are emitted in a generalized JSON format.  
   - These events are stored **raw in MongoDB** for durability and long-term preservation.  

2. **Command Polling**  
   - The Sensor Suite will periodically poll the REST API (`GET`) for commands.  
   - Commands originate from ZPNet Server and are relayed back to the Sensor Suite.  

3. **Event Storage**  
   - Incoming events are stored as-is in MongoDB.  
   - Over time, events may be organized into multiple collections.  
   - The **raw event stream is always kept intact** in perpetuity.

---

## Vision

ZPNet is designed to evolve into a **“poor man’s oscilloscope”**, with the ability to visualize telemetry streams in various formats. Planned visualizations include:

- **Line graphs** showing **Casimir pressure over time** (crucial).  
- Graphs for **temperature**, **battery life**, **relative humidity**, **weight**, **altitude**, **EM spikes**, and other metrics.  

The emphasis is on **visualizing the data** and making insights accessible in real time.

---

## Notes & Future Work

- VXFrame provides a robust authentication/login layer for remote access.  
- A possible **reverse shell terminal** is under consideration but may be implemented separately from ZPNet Server.  
- The system will grow iteratively as more event types and visualizations are introduced.  

---

## Summary

ZPNet Server is the backbone of the ZPNet ecosystem. It captures, preserves, and visualizes sensor telemetry in real time — providing both durability and insight. Starting simple but with room to grow, ZPNet is the platform where **raw event streams become meaningful information**.
