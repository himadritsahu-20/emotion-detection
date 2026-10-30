# 🎭 Real-Time Facial Emotion Detection & Holographic HUD

An interactive, browser-based facial emotion detection web application built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. It leverages on-device computer vision models (BlazeFace & FaceMesh) to track facial landmarks and predict emotional states in real time.

---

## ✨ Features

- **Real-Time Inference:** Live webcam feed analysis running client-side with minimal latency.
- **On-Device Machine Learning:** Local model execution using BlazeFace for face tracking and specialized emotion classification weights.
- **Interactive Hologram & HUD:** Futuristic visualization overlay featuring landmark meshes, confidence telemetry, and softmax probability distributions.
- **Stream Simulation Mode:** Built-in video/stream simulation fallback (`useSimStream`) for testing without a live camera.
- **Benchmark & Telemetry Suite:** Real-time FPS, inference speed, and classification confidence monitoring.

---

## 🛠️ Tech Stack

- **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) / Custom Modern UI
- **Computer Vision & ML:** BlazeFace, MediaPipe FaceMesh, Custom Emotion Classifier (`.bin` / `.json` weights)
- **Deployment:** [Vercel](https://vercel.com/)

---

## 📁 Project Structure

```text
├── public/                 # Static assets & model weights
│   ├── blazeface.bin
│   ├── blazeface.json
│   ├── emotion.bin
│   ├── emotion.json
│   └── facemesh.bin
├── src/
│   ├── components/
│   │   ├── Backdrop.tsx       # Ambient lighting & dynamic background
│   │   ├── Benchmarks.tsx     # Latency & FPS telemetry display
│   │   ├── Footer.tsx         # App footer & repo links
│   │   ├── HeroHologram.tsx   # Holographic face mesh visualization
│   │   ├── Inference.tsx      # Video capture & prediction pipeline
│   │   ├── Overview.tsx       # Project overview & model explanation
│   │   └── SoftmaxBars.tsx    # Emotion probability distribution bars
│   ├── hooks/
│   │   └── useSimStream.ts    # Fallback simulated video stream hook
│   ├── engine.ts              # Core inference and model loading logic
│   ├── emotions.ts            # Emotion class definitions & labels
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Application entry point
├── vercel.json                # Vercel deployment configuration
├── vite.config.ts             # Vite configuration
└── package.json

```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18 or newer recommended) installed.

### Installation

1. **Clone the repository:**
```bash
git clone [https://github.com/himadritsahu-20/emotion-detection.git](https://github.com/himadritsahu-20/emotion-detection.git)
cd emotion-detection

```


2. **Install dependencies:**
```bash
npm install

```


3. **Run the local development server:**
```bash
npm run dev

```


Open `http://localhost:5173` in your browser.
4. **Build for production:**
```bash
npm run build

```


5. **Preview production build:**
```bash
npm run preview

```



---

## 🧠 Detected Emotions

The model predicts probabilities across primary facial emotion categories:

| Emotion | Description |
| --- | --- |
| **Neutral** | Relaxed facial state without pronounced cues |
| **Happy** | Smiling, cheek raise, lip corner pull |
| **Sad** | Drooping mouth corners, brow furrow |
| **Surprise** | Raised eyebrows, widened eyes, dropped jaw |
| **Angry** | Lowered brow, tightened lips, furrowed forehead |
| **Fear / Disgust** | Distinct micro-expression activation |

---

## ⚡ Deployment

This project is pre-configured for seamless deployment on **Vercel**:

1. Push your repository to GitHub.
2. Import the repository into your Vercel Dashboard.
3. The framework preset will automatically detect **Vite**.
4. Click **Deploy**.

---

## 📄 License

This project is open-source and licensed under the MIT License.
