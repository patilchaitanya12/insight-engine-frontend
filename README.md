# Insight Engine Frontend

Interactive analytics dashboard that allows users to upload datasets, ask natural language questions, and visualize AI-generated insights.

The frontend communicates with the backend analytics engine to render tables, charts, and insights dynamically.

---

## Live App
🌐 https://insight-engine-frontend-beige.vercel.app/

---

## Features

* CSV dataset upload
* Natural language query interface
* Dynamic chart rendering
* Interactive insights display
* Real-time API integration
* Responsive dashboard UI

---

## Tech Stack

* React
* Vite
* TypeScript
* Chart.js / MUI Charts
* Axios

---

## Project Structure

```
src/
│
├── components/
│   ├── UploadPanel.tsx
│   ├── QueryPanel.tsx
│   ├── ChartPanel.tsx
│   └── InsightsPanel.tsx
│
├── pages/
│   └── Dashboard.tsx
│
├── services/
│   └── api.ts
│
├── types/
│   └── analytics.ts
│
└── main.tsx
```

---

## Installation

Clone the repository:

```
git clone <repo-url>
cd insight-engine-frontend
```

Install dependencies:

```
npm install
```

Run the development server:

```
npm run dev
```

Application runs at:

```
http://localhost:5173
```

---

## Usage

1. Upload a CSV dataset
2. Ask a natural language question about the data
3. View generated charts, tables, and insights

Example queries:

```
Top 5 products by sales
Sales by country
Which product contributes most to turnover
```

---

## Backend Connection

The frontend communicates with the analytics backend via:

```
POST /upload/
POST /query/
```

Ensure the backend server is running before starting the frontend.

---

## Future Improvements

* Chart customization
* Drill-down analytics
* Multi-chart dashboards
* AI-generated follow-up insights
* Query history and memory

---
