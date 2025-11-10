// ===== Your original selectors =====
let boxes = document.querySelectorAll(".box");
let resetbtn = document.querySelector("#reset-btn");
let newGameBtn = document.querySelector("#new-btn");
let msgContainer = document.querySelector(".msg-container");
let msg = document.querySelector("#msg");

// ===== New optional UI elements (add in HTML) =====
// <select id="modeSelect"><option value="pvp">2 Players</option><option value="ai">Vs AI</option></select>
// <button id="undo-btn">Undo</button>
// <div class="scoreboard">X: <b id="scoreX">0</b> | O: <b id="scoreO">0</b> | Draw: <b id="scoreDraw">0</b></div>
const modeSelect = document.querySelector("#modeSelect");
const undoBtn = document.querySelector("#undo-btn");
const scoreXEl = document.querySelector("#scoreX");
const scoreOEl = document.querySelector("#scoreO");
const scoreDrawEl = document.querySelector("#scoreDraw");

// ===== State =====
let turnO = true; // true -> O's turn, false -> X's turn
let gameOver = false;
let history = []; // undo ke liye stack: [{idx, prevTurnO}]
let scores = JSON.parse(localStorage.getItem("ttt-scores") || '{"X":0,"O":0,"D":0}');

// Winning patterns
const winPatterns = [
  [0, 1, 2],
  [0, 3, 6],
  [0, 4, 8],
  [1, 4, 7],
  [2, 5, 8],
  [2, 4, 6],
  [3, 4, 5],
  [6, 7, 8],
];

// ===== Sounds (optional, add files or comment out) =====
const sounds = {
  move: new Audio("move.mp3"),
  win: new Audio("win.mp3"),
  draw: new Audio("draw.mp3"),
  undo: new Audio("undo.mp3"),
};
Object.values(sounds).forEach(a => a.addEventListener?.("error", ()=>{}));

// ===== Helpers =====
const setScoresUI = () => {
  if (scoreXEl) scoreXEl.innerText = scores.X;
  if (scoreOEl) scoreOEl.innerText = scores.O;
  if (scoreDrawEl) scoreDrawEl.innerText = scores.D;
};
const saveScores = () => localStorage.setItem("ttt-scores", JSON.stringify(scores));
const currentPlayer = () => (turnO ? "O" : "X");
const gridValues = () => Array.from(boxes, b => b.innerText);

// Highlights
const clearHighlights = () => boxes.forEach(b => b.classList.remove("last-move","win"));
const highlightCells = (indices, cls="last-move") => indices.forEach(i => boxes[i].classList.add(cls));

// ===== Disable/Enable =====
const disableBoxes = () => {
  boxes.forEach((box) => (box.disabled = true));
};
const enableBoxes = () => {
  boxes.forEach((box, i) => {
    box.disabled = false;
    box.innerText = "";
    box.dataset.idx = i;
  });
  clearHighlights();
  history = [];
  gameOver = false;
};

// ===== Messages =====
const showWinner = (winner, line=null) => {
  msg.innerText = `🎉 Congratulations! Winner is ${winner}`;
  msgContainer.classList.remove("hide");
  gameOver = true;
  if (line) highlightCells(line, "win");
  disableBoxes();
  scores[winner] += 1;
  saveScores();
  setScoresUI();
  sounds.win.play?.();
};

const showDraw = () => {
  msg.innerText = "🤝 It's a Draw! Click 'Play Again' to retry.";
  msgContainer.classList.remove("hide");
  gameOver = true;
  disableBoxes();
  scores.D += 1;
  saveScores();
  setScoresUI();
  sounds.draw.play?.();
};

// ===== Winner/Draw Check =====
const checkWinner = () => {
  const vals = gridValues();
  for (let pattern of winPatterns) {
    let [a,b,c] = pattern;
    let pos1Val = vals[a], pos2Val = vals[b], pos3Val = vals[c];
    if (pos1Val && pos1Val === pos2Val && pos2Val === pos3Val) {
      showWinner(pos1Val, pattern);
      return true;
    }
  }
  if (vals.every(v => v !== "")) {
    showDraw();
    return true;
  }
  return false;
};

// ===== Undo Feature =====
// Hindi: Agar galti se wrong click ho gaya to undo se last move hata sakte ho.
const undoMove = () => {
  if (gameOver || history.length === 0) return;
  const last = history.pop();
  const box = boxes[last.idx];
  box.innerText = "";
  box.disabled = false;
  turnO = last.prevTurnO; // jis turn pe tha, usi ko wapas karo
  msgContainer.classList.add("hide");
  clearHighlights();
  gameOver = false;
  sounds.undo.play?.();
  startMoveTimer(); // timer reset
};

// ===== Move Timer (per move) =====
let moveTimerId = null;
const startMoveTimer = (ms=10000) => {
  clearTimeout(moveTimerId);
  moveTimerId = setTimeout(()=>{
    if (!gameOver) {
      msg.innerText = `⏱️ Time over! ${currentPlayer()} missed the move. Turn switched.`;
      msgContainer.classList.remove("hide");
      turnO = !turnO;
      if (modeSelect?.value === "ai" && !turnO) {
        setTimeout(aiMove, 250);
      }
      startMoveTimer(ms);
    }
  }, ms);
};

// ===== Make a move (single place to handle all clicks) =====
const makeMove = (box) => {
  if (gameOver || box.innerText !== "") return;
  const prevTurnO = turnO;

  box.innerText = currentPlayer();
  box.disabled = true;

  const idx = Number(box.dataset.idx ?? Array.from(boxes).indexOf(box));
  history.push({ idx, prevTurnO });

  clearHighlights();
  highlightCells([idx], "last-move");
  sounds.move.play?.();

  if (checkWinner()) return;

  turnO = !turnO; // switch turn
  startMoveTimer(); // restart timer for next player

  // If AI mode and now AI's turn (assume Human=O starts, AI=X)
  if (modeSelect?.value === "ai" && !turnO) {
    setTimeout(aiMove, 250);
  }
};

// ===== AI (Minimax with alpha-beta) =====
const aiMove = () => {
  if (gameOver) return;
  const vals = gridValues();
  // AI will play as 'X' (since default first player is 'O')
  const best = bestMove(vals, "X");
  if (best.idx !== -1) {
    makeMove(boxes[best.idx]);
  } else {
    // fallback random
    const empty = vals.map((v,i)=>v===""?i:-1).filter(i=>i!==-1);
    if (empty.length) makeMove(boxes[empty[0]]);
  }
};

function bestMove(board, ai) {
  const human = ai === "X" ? "O" : "X";

  function winner(b) {
    for (const [a,b1,c] of winPatterns) {
      if (b[a] && b[a] === b[b1] && b[b1] === b[c]) return b[a];
    }
    if (b.every(v=>v!=="")) return "D";
    return null;
    }

  function minimax(b, depth, isMax, alpha, beta) {
    const w = winner(b);
    if (w) {
      if (w === ai) return 10 - depth;
      if (w === "D") return 0;
      return depth - 10;
    }

    if (isMax) {
      let best = -Infinity;
      for (let i=0;i<9;i++) if (b[i]==="") {
        b[i] = ai;
        const val = minimax(b, depth+1, false, alpha, beta);
        b[i] = "";
        best = Math.max(best, val);
        alpha = Math.max(alpha, val);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (let i=0;i<9;i++) if (b[i]==="") {
        b[i] = human;
        const val = minimax(b, depth+1, true, alpha, beta);
        b[i] = "";
        best = Math.min(best, val);
        beta = Math.min(beta, val);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  let bestVal = -Infinity, bestIdx = -1, ties=[];
  for (let i=0;i<9;i++) if (board[i]==="") {
    board[i] = ai;
    const val = minimax(board, 0, false, -Infinity, Infinity);
    board[i] = "";
    if (val > bestVal) { bestVal = val; bestIdx = i; ties=[i]; }
    else if (val === bestVal) { ties.push(i); }
  }
  if (ties.length) bestIdx = ties[Math.floor(Math.random()*ties.length)];
  return { idx: bestIdx, score: bestVal };
}

// ===== Reset / New Game =====
// resetbtn: hard reset (scores clear), newGameBtn: soft reset (scores keep)
const resetGame = (keepScores=true) => {
  turnO = true;
  enableBoxes();
  msgContainer.classList.add("hide");
  gameOver = false;
  clearTimeout(moveTimerId);
  startMoveTimer();
  if (!keepScores) {
    scores = { X:0, O:0, D:0 };
    saveScores();
    setScoresUI();
  }
};

// ===== Event bindings (your original + enhancements) =====
boxes.forEach((box, i) => {
  box.dataset.idx = i;
  box.addEventListener("click", () => makeMove(box));
  // Keyboard accessibility (Enter/Space)
  box.addEventListener("keydown", (e)=> {
    if ((e.key === "Enter" || e.key === " ") && !box.disabled) makeMove(box);
  });
});

newGameBtn.addEventListener("click", () => resetGame(true));
resetbtn.addEventListener("click", () => resetGame(false));
modeSelect?.addEventListener("change", () => resetGame(true));
undoBtn?.addEventListener("click", undoMove);

// ===== Boot =====
setScoresUI();
resetGame(true);





