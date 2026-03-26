# 🧭 PathFinder AI: Multi-Algorithm Search Visualizer

An interactive web-based tool for visualizing AI pathfinding and search algorithms on a dynamic grid. Built to help understand how different search strategies explore state spaces and find optimal paths.

---

## ✨ Features

- **5 Search Algorithms** — BFS, DFS, UCS, Greedy Best-First, and A*
- **Interactive Grid** — Click to place start/end nodes and draw walls
- **Real-Time Animation** — Watch algorithms explore the grid step by step
- **Maze Generation** — Auto-generate mazes using recursive division
- **Adjustable Speed & Grid Size** — Fine-tune visualization parameters
- **Algorithm Info Panel** — View time/space complexity, properties, and agent type for each algorithm
- **Live Statistics** — Track visited nodes, path length, and execution time

---

## 🧠 Algorithms

| Algorithm | Type | Optimal | Uses Heuristic |
|-----------|------|---------|----------------|
| **BFS** | Uninformed | ✅ | ❌ |
| **DFS** | Uninformed | ❌ | ❌ |
| **UCS** | Uninformed | ✅ | ❌ |
| **Greedy Best-First** | Informed | ❌ | ✅ |
| **A*** | Informed | ✅ | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 |
| Styling | Vanilla CSS (CSS Custom Properties) |
| Logic | Vanilla JavaScript (ES6+) |
| Rendering | HTML5 Canvas API |
| Fonts | Google Fonts (JetBrains Mono, Syne) |

> No frameworks, no build tools, no dependencies — runs directly in the browser.

---

## 📁 Project Structure

```
├── index.html   # Page structure and layout
├── style.css    # All styling and design tokens
├── script.js    # Algorithm implementations, grid logic, and UI interactions
└── README.md
```

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```

2. **Open in browser**
   ```bash
   open index.html
   ```
   Or simply double-click `index.html` — no server required.

---

## 🎮 How to Use

1. Select an **algorithm** from the left panel
2. Use the **Drawing Tool** to place a Start node, End node, and walls
3. Adjust **Speed** and **Grid Size** sliders as needed
4. Click **▶ RUN** to visualize the algorithm
5. Use **⊞ Generate Maze** for a random maze to solve

---

## 📸 Screenshots

<!-- Add screenshots of your project here -->
<!-- ![Screenshot](screenshot.png) -->

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
