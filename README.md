# LifePilot 🚀

**Preventing Missed Deadlines through Proactive AI Intervention**

Traditional productivity tools and to-do lists are entirely passive—they rely on the user's discipline to check them, prioritize them, and start working. This often leads to procrastination, overwhelming backlogs, and ultimately, missed deadlines. 

LifePilot is an AI-powered productivity companion that shifts task management from passive tracking to active intervention, anticipating risks and helping you execute before time runs out.

## 🌟 Key Features

### 1. Visual Risk Dashboard (In-App Triage)
Instead of relying on push notifications that are often ignored, the application continuously evaluates task deadlines and presents the most critical work in a dedicated risk dashboard.
* Automatically identifies **"At Risk"** and **"Needs Attention"** tasks.
* Prioritizes tasks based on urgency and deadline risk.
* Gives users a clear visual overview of what requires immediate attention.
* Encourages action before deadlines are missed.

### 2. One-Click AI Task Breakdown
When a task feels overwhelming, the AI transforms it into a structured, actionable plan with a single click.
* Analyzes the selected task and its overall objective.
* Breaks complex work into clear, sequential micro-actions.
* Reduces the mental effort required to get started.
* Provides a practical roadmap that helps users maintain momentum.

### 3. Context-Aware Scheduling (Google Calendar Integration)
Integrates with Google Calendar to understand your real-world availability and plan work more effectively.
* Securely synchronizes the user's calendar events.
* Identifies available time slots between existing commitments.
* Recommends realistic work sessions based on actual availability.
* Helps reduce scheduling conflicts and the risk of missed deadlines.

### 4. On-Demand Voice Accountability Coach
Users can start a real-time voice conversation with the AI whenever they feel stuck, overwhelmed, or distracted.
* Provides conversational guidance during challenging tasks.
* Helps users work through roadblocks and regain focus.
* Acts as an accountability partner throughout the work session.
* Encourages steady progress toward task completion.

## 🛠 Technologies Used

**Frontend**
* React 18
* Vite
* Tailwind CSS
* Framer Motion

**Backend & Database**
* Node.js & Express.js
* Prisma ORM & SQLite

**Audio / Voice Processing**
* Deepgram API (Speech-to-Text)
* Web MediaRecorder API

## ☁️ Google Technologies Utilized

* **Google Gemini API (Gemini Flash):** Serves as the core intelligence engine. It powers the dynamic task decomposition, analyzes risk levels for upcoming deadlines, and generates structured proactive guidance.
* **Google Calendar API (OAuth 2.0):** Securely syncs the user's primary calendar events, allowing the AI to detect free schedule blocks and dynamically adjust task buffers.
* **Firebase Authentication:** Provides secure, frictionless user login via Google Sign-In and session management.
* **Google Cloud Run:** Hosts the fully deployed, production-ready full-stack container application.

## 🚀 Running Locally

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lifepilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add the necessary API keys (refer to `.env.example` if available).
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   DEEPGRAM_API_KEY=your_deepgram_api_key
   ```

4. **Initialize the Database**
   ```bash
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.
