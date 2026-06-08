<div align="center">
  <h1>StudyTracker</h1>
  <p><strong>Your Ultimate All-in-One Desktop Study Companion</strong></p>
</div>

<br />

StudyTracker is a modern, native-feeling desktop application built for students and lifelong learners. It combines curriculum tracking, powerful timers, a built-in library, and rich note-taking capabilities into a beautifully designed, distraction-free environment.

---

## ✨ Features

- **📊 Comprehensive Dashboard & Statistics**: Track your progress with daily heatmaps, study streaks, and detailed time-tracking charts.
- **⏱️ Flexible Timers**: Built-in Pomodoro, Countdown, and Stopwatch timers. Split your screen seamlessly into a "Focus Session" that pairs a timer alongside any document from your library.
- **📚 Library & PDF Viewer**: Organize your reference materials. Open PDFs directly inside the app, complete with drawing tools, highlight text support, and a built-in bookmark manager.
- **📝 Advanced Notes**: A Notion-style rich text editor paired with an Excalidraw-powered infinite whiteboard.
- **📅 Curriculum & Calendar**: Manage subjects, break them down into actionable topics, and schedule study events on a full interactive calendar.
- **🖥️ Native Desktop Experience**: Built with Electron, featuring a frameless, dark-mode native window with smooth macOS-like window controls and local file system access.
- **🔒 Local-First & Private**: All your data, notes, and progress are stored entirely locally using IndexedDB.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ddhairya16/Study-Tracker.git
   cd Study-Tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server (runs React + Electron):
   ```bash
   npm run electron:dev
   ```

## 📦 Building for Production

StudyTracker uses GitHub Actions to automatically build `.exe` files on every push to the `main` branch. You can find the latest builds in the **Actions** tab of this repository.

To build locally for Windows:

```bash
npm run electron:build
```
The resulting installer and unpacked executable will be located in the `release/` directory.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **Desktop Wrapper**: Electron, Electron Builder
- **Styling**: Vanilla CSS, Framer Motion for fluid animations
- **State Management**: Zustand
- **PDF Rendering**: Mozilla PDF.js & Fabric.js (for annotations)
- **Note Taking**: Editor.js (Rich Text), Excalidraw (Whiteboarding)
- **Calendar**: FullCalendar

## 🎨 Design Philosophy

StudyTracker uses an immersive dark mode with "glassmorphism" panels and highly tuned Framer Motion physics. Every interaction—from dragging the window by its title bar, to the subtle glow of the sidebar navigation—is designed to feel native, premium, and focused.

## 📄 License

This project is licensed under the MIT License.
