// ========== CONFIG ==========
const canvas = document.getElementById('grid-canvas');
const ctx = canvas.getContext('2d');

let COLS = 30, ROWS = 20;
let CELL = 0;
let grid = []; // 0=empty,1=wall,2=start,3=end
let startPos = null, endPos = null;
let currentTool = 'start';
let isRunning = false;
let animSpeed = 50;
let mouseDown = false;

// Colors
const COLORS = {
    empty: '#0f0f1a',
    wall: '#1e1e35',
    start: '#00f5a0',
    end: '#f5a000',
    visited: '#0a3020',
    frontier: '#083828',
    path: '#f500a0',
    border: '#161625',
};

const ALGO_INFO = {
    bfs: {
        name: 'Breadth-First Search',
        desc: 'Explores all neighbors level by level. Guarantees shortest path in unweighted graphs.',
        time: 'O(V+E)', space: 'O(V)',
        complete: true, optimal: true, heuristic: false,
        unit: 'UNIT 2',
        agent: 'Goal-Based Agent — uses BFS to find goal from current state.'
    },
    dfs: {
        name: 'Depth-First Search',
        desc: 'Explores as deep as possible before backtracking. Fast but not guaranteed to find shortest path.',
        time: 'O(V+E)', space: 'O(V)',
        complete: false, optimal: false, heuristic: false,
        unit: 'UNIT 2',
        agent: 'Goal-Based Agent — explores one branch fully before others.'
    },
    ucs: {
        name: 'Uniform Cost Search',
        desc: 'Expands the lowest-cost node first. Optimal when all edge costs are non-negative.',
        time: 'O(b^(1+C/ε))', space: 'O(b^(1+C/ε))',
        complete: true, optimal: true, heuristic: false,
        unit: 'UNIT 2',
        agent: 'Utility-Based Agent — optimizes cost function.'
    },
    greedy: {
        name: 'Greedy Best-First',
        desc: 'Always expands the node closest to goal using heuristic. Fast but suboptimal.',
        time: 'O(b^m)', space: 'O(b^m)',
        complete: false, optimal: false, heuristic: true,
        unit: 'UNIT 2',
        agent: 'Goal-Based Agent — uses heuristic to rush toward goal.'
    },
    astar: {
        name: 'A* Algorithm',
        desc: 'Combines cost-so-far g(n) and heuristic h(n). Optimal and complete with admissible heuristic.',
        time: 'O(b^d)', space: 'O(b^d)',
        complete: true, optimal: true, heuristic: true,
        unit: 'UNIT 3',
        agent: 'Utility-Based Agent — maximizes f(n)=g(n)+h(n).'
    }
};

// ========== INIT ==========
function initGrid() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    startPos = null; endPos = null;
    resizeCanvas();
    drawGrid();
}

function resizeCanvas() {
    const area = document.querySelector('.grid-area');
    const aw = area.clientWidth - 40;
    const ah = area.clientHeight - 60;
    CELL = Math.floor(Math.min(aw / COLS, ah / ROWS));
    CELL = Math.max(CELL, 10);
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let v = grid[r][c];
            let color = COLORS.empty;
            if (v === 1) color = COLORS.wall;
            else if (v === 2) color = COLORS.start;
            else if (v === 3) color = COLORS.end;
            else if (v === 4) color = COLORS.visited;
            else if (v === 5) color = COLORS.frontier;
            else if (v === 6) color = COLORS.path;

            ctx.fillStyle = color;
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);

            ctx.strokeStyle = COLORS.border;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);

            // Draw start/end icons
            if (v === 2) {
                ctx.fillStyle = '#000';
                ctx.font = `bold ${CELL * 0.5}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('S', c * CELL + CELL / 2, r * CELL + CELL / 2);
            } else if (v === 3) {
                ctx.fillStyle = '#000';
                ctx.font = `bold ${CELL * 0.5}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('E', c * CELL + CELL / 2, r * CELL + CELL / 2);
            }
        }
    }
}

// ========== MOUSE ==========
function getCellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) return { r, c };
    return null;
}

canvas.addEventListener('mousedown', e => {
    if (isRunning) return;
    mouseDown = true;
    handleCell(getCellFromEvent(e));
});
canvas.addEventListener('mousemove', e => {
    if (!mouseDown || isRunning) return;
    handleCell(getCellFromEvent(e));
});
canvas.addEventListener('mouseup', () => mouseDown = false);
canvas.addEventListener('mouseleave', () => mouseDown = false);

// Touch support
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (isRunning) return;
    mouseDown = true;
    handleCell(getCellFromEvent(e.touches[0]));
}, { passive: false });
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!mouseDown || isRunning) return;
    handleCell(getCellFromEvent(e.touches[0]));
}, { passive: false });
canvas.addEventListener('touchend', () => mouseDown = false);

function handleCell(pos) {
    if (!pos) return;
    const { r, c } = pos;
    if (currentTool === 'start') {
        if (startPos) grid[startPos.r][startPos.c] = 0;
        startPos = { r, c };
        grid[r][c] = 2;
    } else if (currentTool === 'end') {
        if (endPos) grid[endPos.r][endPos.c] = 0;
        endPos = { r, c };
        grid[r][c] = 3;
    } else if (currentTool === 'wall') {
        if (grid[r][c] !== 2 && grid[r][c] !== 3) grid[r][c] = 1;
    } else if (currentTool === 'erase') {
        if (grid[r][c] === 2) startPos = null;
        if (grid[r][c] === 3) endPos = null;
        grid[r][c] = 0;
    }
    drawGrid();
}

function setTool(t) {
    currentTool = t;
    ['start', 'end', 'wall', 'erase'].forEach(id => {
        const btn = document.getElementById('tool-' + id);
        btn.className = 'tool-btn';
        if (id === t) {
            if (t === 'start') btn.className += ' active-start';
            else if (t === 'end') btn.className += ' active-end';
            else btn.className += ' active-wall';
        }
    });
}

// ========== ALGORITHM SELECTION ==========
let currentAlgo = 'bfs';

document.getElementById('algo-grid').addEventListener('click', e => {
    const btn = e.target.closest('.algo-btn');
    if (!btn) return;
    document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentAlgo = btn.dataset.algo;
    updateAlgoInfo(currentAlgo);
    updateCompareTable(currentAlgo);
});

function updateAlgoInfo(algo) {
    const info = ALGO_INFO[algo];
    document.getElementById('info-name').textContent = info.name;
    document.getElementById('info-desc').textContent = info.desc;
    document.getElementById('info-time-c').textContent = info.time;
    document.getElementById('info-space-c').textContent = info.space;
    document.getElementById('agent-info').innerHTML = `<strong>Agent Type</strong><div style="font-size:0.58rem;color:var(--text-dim);line-height:1.6">${info.agent}</div>`;
    const props = document.getElementById('prop-list');
    props.innerHTML = `
    <div class="prop-item"><div class="prop-dot ${info.complete ? 'yes' : 'no'}"></div><span>Complete</span></div>
    <div class="prop-item"><div class="prop-dot ${info.optimal ? 'yes' : 'no'}"></div><span>Optimal</span></div>
    <div class="prop-item"><div class="prop-dot ${info.heuristic ? 'yes' : 'no'}"></div><span>Uses Heuristic</span></div>
  `;
}

function updateCompareTable(algo) {
    ['bfs', 'dfs', 'ucs', 'greedy', 'astar'].forEach(a => {
        const row = document.getElementById('row-' + a);
        if (row) row.className = (a === algo) ? 'active-row' : '';
    });
}

// ========== SPEED / SIZE ==========
function updateSpeed() {
    animSpeed = parseInt(document.getElementById('speed-slider').value);
    document.getElementById('speed-label').textContent = animSpeed + 'ms';
}

function updateGridSize() {
    const v = parseInt(document.getElementById('size-slider').value);
    COLS = v;
    ROWS = Math.floor(v * 2 / 3);
    document.getElementById('size-label').textContent = `${COLS}×${ROWS}`;
    initGrid();
}

// ========== STATUS ==========
function setStatus(msg, state = 'idle') {
    document.getElementById('status-text').textContent = msg;
    const dot = document.getElementById('status-dot');
    dot.className = 'status-dot' + (state !== 'idle' ? ' ' + state : '');
    document.getElementById('stat-status').textContent =
        state === 'running' ? 'Running…' : state === 'done' ? 'Found!' : state === 'no-path' ? 'No Path' : 'Ready';
    document.getElementById('stat-status').style.color =
        state === 'done' ? 'var(--accent3)' : state === 'no-path' ? 'var(--accent4)' : 'var(--accent)';
}

// ========== HELPERS ==========
const heuristic = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c);

const DIRS = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];

function getNeighbors(r, c) {
    return DIRS
        .map(d => ({ r: r + d.r, c: c + d.c }))
        .filter(n => n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS && grid[n.r][n.c] !== 1);
}

function clearPath() {
    for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
            if ([4, 5, 6].includes(grid[r][c])) grid[r][c] = 0;
    drawGrid();
    document.getElementById('stat-visited').textContent = '—';
    document.getElementById('stat-path').textContent = '—';
    document.getElementById('stat-time').textContent = '—';
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('quality-bar').style.width = '0%';
    setStatus('Path cleared. Ready to run again.');
}

function clearAll() {
    initGrid();
    document.getElementById('stat-visited').textContent = '—';
    document.getElementById('stat-path').textContent = '—';
    document.getElementById('stat-time').textContent = '—';
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('quality-bar').style.width = '0%';
    setStatus('Grid cleared. Place start and end nodes, then draw walls.');
}

// ========== MAZE GENERATION (Recursive Division) ==========
function generateMaze() {
    if (isRunning) return;
    clearAll();
    // Fill borders
    for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
            if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) grid[r][c] = 1;

    // Random internal walls
    for (let r = 1; r < ROWS - 1; r++)
        for (let c = 1; c < COLS - 1; c++)
            if (Math.random() < 0.3) grid[r][c] = 1;

    // Recursive subdivision
    divide(1, 1, ROWS - 2, COLS - 2);

    // Place start and end
    startPos = { r: 1, c: 1 };
    endPos = { r: ROWS - 2, c: COLS - 2 };
    grid[1][1] = 2;
    grid[ROWS - 2][COLS - 2] = 3;
    // Clear paths around start/end
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (grid[1 + dr] && grid[1 + dr][1 + dc] === 1) grid[1 + dr][1 + dc] = 0;
        if (grid[ROWS - 2 + dr] && grid[ROWS - 2 + dr][COLS - 2 + dc] === 1) grid[ROWS - 2 + dr][COLS - 2 + dc] = 0;
    }
    grid[1][1] = 2;
    grid[ROWS - 2][COLS - 2] = 3;
    drawGrid();
    setStatus('Maze generated! Press RUN to solve it.');
}

function divide(r1, c1, r2, c2) {
    if (r2 - r1 < 2 || c2 - c1 < 2) return;
    const horizontal = (r2 - r1) > (c2 - c1);
    if (horizontal) {
        const wallR = r1 + 1 + Math.floor(Math.random() * (r2 - r1 - 1));
        const passC = c1 + Math.floor(Math.random() * (c2 - c1 + 1));
        for (let c = c1; c <= c2; c++)
            if (c !== passC) grid[wallR][c] = 1;
        divide(r1, c1, wallR - 1, c2);
        divide(wallR + 1, c1, r2, c2);
    } else {
        const wallC = c1 + 1 + Math.floor(Math.random() * (c2 - c1 - 1));
        const passR = r1 + Math.floor(Math.random() * (r2 - r1 + 1));
        for (let r = r1; r <= r2; r++)
            if (r !== passR) grid[r][wallC] = 1;
        divide(r1, c1, r2, wallC - 1);
        divide(r1, wallC + 1, r2, c2);
    }
}

// ========== ANIMATION ENGINE ==========
let animQueue = [];
let animTimer = null;

function animateSteps(steps, onDone) {
    let i = 0;
    const totalSteps = steps.length;
    function step() {
        if (i >= steps.length) {
            if (onDone) onDone();
            return;
        }
        const s = steps[i++];
        if (s.type === 'visit') {
            if (grid[s.r][s.c] !== 2 && grid[s.r][s.c] !== 3)
                grid[s.r][s.c] = s.val || 4;
        } else if (s.type === 'path') {
            if (grid[s.r][s.c] !== 2 && grid[s.r][s.c] !== 3)
                grid[s.r][s.c] = 6;
        }
        drawGrid();
        // Update progress
        document.getElementById('stat-visited').textContent = i;
        document.getElementById('progress-bar').style.width = Math.min(100, (i / totalSteps) * 100) + '%';
        animTimer = setTimeout(step, animSpeed);
    }
    step();
}

// ========== RECONSTRUCT PATH ==========
function reconstructPath(parent, start, end) {
    const path = [];
    let cur = `${end.r},${end.c}`;
    const startKey = `${start.r},${start.c}`;
    while (cur && cur !== startKey) {
        const [r, c] = cur.split(',').map(Number);
        path.push({ r, c });
        cur = parent[cur];
    }
    return path.reverse();
}

// ========== ALGORITHMS ==========

// BFS
function runBFS() {
    const steps = [];
    const parent = {};
    const visited = new Set();
    const queue = [{ r: startPos.r, c: startPos.c }];
    const startKey = `${startPos.r},${startPos.c}`;
    const endKey = `${endPos.r},${endPos.c}`;
    visited.add(startKey);
    parent[startKey] = null;
    let found = false;

    while (queue.length) {
        const { r, c } = queue.shift();
        const key = `${r},${c}`;
        if (key === endKey) { found = true; break; }
        steps.push({ type: 'visit', r, c });
        for (const n of getNeighbors(r, c)) {
            const nk = `${n.r},${n.c}`;
            if (!visited.has(nk)) {
                visited.add(nk);
                parent[nk] = key;
                queue.push(n);
            }
        }
    }
    return { steps, found, parent };
}

// DFS
function runDFS() {
    const steps = [];
    const parent = {};
    const visited = new Set();
    const stack = [{ r: startPos.r, c: startPos.c }];
    const startKey = `${startPos.r},${startPos.c}`;
    const endKey = `${endPos.r},${endPos.c}`;
    parent[startKey] = null;
    let found = false;

    while (stack.length) {
        const { r, c } = stack.pop();
        const key = `${r},${c}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (key === endKey) { found = true; break; }
        steps.push({ type: 'visit', r, c });
        for (const n of getNeighbors(r, c)) {
            const nk = `${n.r},${n.c}`;
            if (!visited.has(nk)) {
                if (!parent[nk]) parent[nk] = key;
                stack.push(n);
            }
        }
    }
    return { steps, found, parent };
}

// UCS (uniform cost — same as BFS on unweighted grid)
function runUCS() {
    const steps = [];
    const parent = {};
    const dist = {};
    const startKey = `${startPos.r},${startPos.c}`;
    const endKey = `${endPos.r},${endPos.c}`;
    dist[startKey] = 0;
    parent[startKey] = null;
    // Min-heap via sorted array
    const pq = [{ r: startPos.r, c: startPos.c, g: 0 }];
    let found = false;

    while (pq.length) {
        pq.sort((a, b) => a.g - b.g);
        const { r, c, g } = pq.shift();
        const key = `${r},${c}`;
        if (key === endKey) { found = true; break; }
        steps.push({ type: 'visit', r, c });
        for (const n of getNeighbors(r, c)) {
            const nk = `${n.r},${n.c}`;
            const ng = g + 1;
            if (dist[nk] === undefined || ng < dist[nk]) {
                dist[nk] = ng;
                parent[nk] = key;
                pq.push({ r: n.r, c: n.c, g: ng });
            }
        }
    }
    return { steps, found, parent };
}

// Greedy Best-First
function runGreedy() {
    const steps = [];
    const parent = {};
    const visited = new Set();
    const startKey = `${startPos.r},${startPos.c}`;
    const endKey = `${endPos.r},${endPos.c}`;
    parent[startKey] = null;
    const pq = [{ r: startPos.r, c: startPos.c, h: heuristic(startPos, endPos) }];
    let found = false;

    while (pq.length) {
        pq.sort((a, b) => a.h - b.h);
        const { r, c } = pq.shift();
        const key = `${r},${c}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (key === endKey) { found = true; break; }
        steps.push({ type: 'visit', r, c });
        for (const n of getNeighbors(r, c)) {
            const nk = `${n.r},${n.c}`;
            if (!visited.has(nk)) {
                if (!parent[nk]) parent[nk] = key;
                pq.push({ r: n.r, c: n.c, h: heuristic(n, endPos) });
            }
        }
    }
    return { steps, found, parent };
}

// A*
function runAStar() {
    const steps = [];
    const parent = {};
    const g = {};
    const startKey = `${startPos.r},${startPos.c}`;
    const endKey = `${endPos.r},${endPos.c}`;
    g[startKey] = 0;
    parent[startKey] = null;
    const open = [{ r: startPos.r, c: startPos.c, f: heuristic(startPos, endPos) }];
    const closed = new Set();
    let found = false;

    while (open.length) {
        open.sort((a, b) => a.f - b.f);
        const cur = open.shift();
        const key = `${cur.r},${cur.c}`;
        if (closed.has(key)) continue;
        closed.add(key);
        if (key === endKey) { found = true; break; }
        steps.push({ type: 'visit', r: cur.r, c: cur.c });
        for (const n of getNeighbors(cur.r, cur.c)) {
            const nk = `${n.r},${n.c}`;
            if (closed.has(nk)) continue;
            const ng = (g[key] || 0) + 1;
            if (g[nk] === undefined || ng < g[nk]) {
                g[nk] = ng;
                parent[nk] = key;
                open.push({ r: n.r, c: n.c, f: ng + heuristic(n, endPos) });
            }
        }
    }
    return { steps, found, parent };
}



// ========== RUN ==========
function runAlgorithm() {
    if (isRunning) return;
    if (!startPos || !endPos) {
        setStatus('⚠ Place both start (S) and end (E) nodes first!');
        return;
    }
    clearPath();
    isRunning = true;
    document.getElementById('run-btn').disabled = true;
    setStatus('Running ' + ALGO_INFO[currentAlgo].name + '…', 'running');

    const t0 = performance.now();

    let result;
    if (currentAlgo === 'bfs') result = runBFS();
    else if (currentAlgo === 'dfs') result = runDFS();
    else if (currentAlgo === 'ucs') result = runUCS();
    else if (currentAlgo === 'greedy') result = runGreedy();
    else if (currentAlgo === 'astar') result = runAStar();

    const t1 = performance.now();
    document.getElementById('stat-time').textContent = (t1 - t0).toFixed(1) + 'ms';

    const pathSteps = result.found ? reconstructPath(result.parent, startPos, endPos).map(p => ({ type: 'path', r: p.r, c: p.c })) : [];

    animateSteps(result.steps, () => {
        // Animate path
        let pi = 0;
        function drawPath() {
            if (pi >= pathSteps.length) {
                isRunning = false;
                document.getElementById('run-btn').disabled = false;
                if (result.found) {
                    document.getElementById('stat-path').textContent = pathSteps.length;
                    document.getElementById('quality-bar').style.width = Math.min(100, (pathSteps.length / (ROWS + COLS)) * 100) + '%';
                    setStatus(`✓ Path found! Visited ${result.steps.length} cells, path length ${pathSteps.length}.`, 'done');
                } else {
                    setStatus('✕ No path found — grid is blocked!', 'no-path');
                    document.getElementById('stat-path').textContent = 'N/A';
                }
                return;
            }
            const s = pathSteps[pi++];
            if (grid[s.r][s.c] !== 2 && grid[s.r][s.c] !== 3) {
                grid[s.r][s.c] = 6;
            }
            drawGrid();
            setTimeout(drawPath, Math.max(10, animSpeed / 2));
        }
        drawPath();
    });
}

// ========== RESIZE ==========
window.addEventListener('resize', () => {
    resizeCanvas();
    drawGrid();
});

// ========== INIT ==========
initGrid();
updateAlgoInfo('bfs');

// Place default start/end
startPos = { r: Math.floor(ROWS / 2), c: 2 };
endPos = { r: Math.floor(ROWS / 2), c: COLS - 3 };
grid[startPos.r][startPos.c] = 2;
grid[endPos.r][endPos.c] = 3;
drawGrid();
setStatus('Ready! Click cells to draw walls. Select an algorithm and press RUN.');

