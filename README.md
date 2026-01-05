# JackSport — Where Computer Vision Meets the Bleachers

JackSport is a hackathon-built sports analytics and fan engagement platform that explores how **computer vision**, **AI-generated insights**, and **interactive social features** can transform live sports viewing into a more data-rich and engaging experience.

**Project context:** Built during **HackGT12 (Oct 2025)** as an exploratory prototype. The project focuses on system integration and interaction design rather than production-scale guarantees.

---

## Inspiration

Sports fans shouldn’t need five different apps to enjoy a single game.  
Today’s experience is fragmented: one app for stats, another for reactions, another for betting, and another for community discussion.

JackSport explores what it would look like to **collapse the sports viewing experience into a single platform** — combining live video interaction, contextual AI insights, and social engagement into one cohesive interface.

---

## What JackSport Does

JackSport acts as an **interactive intelligence layer** on top of live sports content:

### 🏃 Player-Centric Interaction
- Detects players in video frames using computer vision
- Enables **click-to-query interactions** that surface player-related stats and AI-generated insights

### 🤖 AI-Assisted Sports Insights
- Uses Gemini-powered analysis to generate contextual explanations about players and in-game situations
- Focuses on interpretability and fan understanding rather than automated betting decisions

### 💬 Social & Fan Engagement
- Prototype-level social features such as shared discussions and interactive elements
- Designed to explore synchronized fan interaction during live viewing

### 📊 Exploratory Betting Analytics
- Tracks user interaction patterns such as betting frequency, exposure, and win/loss trends
- Generates **automated warnings** to encourage responsible experimentation
- Supports **CSV export** for transparency and analysis

---

## How We Built It

### Computer Vision
- Integrated **YOLO-based player detection** to identify players within video frames
- Detection outputs are linked to frontend interactions rather than fully automated pipelines

### AI Integration
- Connected the **Gemini API** with custom prompts to generate contextual sports insights
- AI responses are triggered by user interaction and game context

### Frontend
- Built with **React** for component-based architecture
- Styled using **Tailwind CSS**
- Uses lightweight JavaScript-based visual overlays for responsiveness

### Data & Analytics
- Aggregates interaction and betting-related events
- Enables CSV export for offline analysis and visualization

### Hackathon Architecture
- Designed as a **prototype system**
- Emphasized rapid integration of multiple services over production-grade optimization

---

## Tech Stack

- **Frontend:** React, JavaScript, Tailwind CSS  
- **Computer Vision:** YOLO (player detection)  
- **AI / LLM:** Gemini API  
- **Data & Analytics:** CSV export, basic aggregation logic  
- **APIs:** Multiple third-party APIs for vision, AI, and data services  

---

## Screenshots & Demo

[Logo](docs/logo.jpg)
[Player Overlay](docs/gallery.jpg)
[Analytics Dashboard](docs/chat.png)
[Other Features](docs/analytics.png)



---

## What This Project Demonstrates

- Integrating **computer vision outputs** into interactive user interfaces
- Combining **LLM-based reasoning** with structured data
- Designing user-driven workflows around AI systems
- Rapid system prototyping under hackathon constraints

---

## Future Work

- Support for additional sports and video formats
- Improved player tracking and event recognition
- More advanced analytics and visualization
- Enhanced social co-watching features
- Performance and latency optimization

---

## Team & Credits

Built collaboratively during **HackGT12 (Oct 2025)** as a hackathon prototype exploring the intersection of sports, AI, and interactive systems.
