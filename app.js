let boxes = document.querySelectorAll(".box");
let resetbtn = document.querySelector("#reset-btn");
let newGameBtn = document.querySelector("#new-btn");
let msgContainer = document.querySelector(".msg-container");
let msg = document.querySelector("#msg");

let turnO = true; // true -> O's turn, false -> X's turn

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

// ✅ Reset / New Game function
const resetGame = () => {
  turnO = true;
  enableBoxes();
  msgContainer.classList.add("hide");
};

// ✅ Handle each box click
boxes.forEach((box) => {
  box.addEventListener("click", () => {
    if (turnO) {
      box.innerText = "O";
      turnO = false;
    } else {
      box.innerText = "X";
      turnO = true;
    }
    box.disabled = true;
    checkWinner();
  });
});

// ✅ Disable all boxes
const disableBoxes = () => {
  boxes.forEach((box) => (box.disabled = true));
};

// ✅ Enable all boxes (for reset)
const enableBoxes = () => {
  boxes.forEach((box) => {
    box.disabled = false;
    box.innerText = "";
  });
};

// ✅ Show winner message
const showWinner = (winner) => {
  msg.innerText = `🎉 Congratulations! Winner is ${winner}`;
  msgContainer.classList.remove("hide");
  disableBoxes();
};

// ✅ Show draw message
const showDraw = () => {
  msg.innerText = "🤝 It's a Draw! Click 'Play Again' to retry.";
  msgContainer.classList.remove("hide");
  disableBoxes();
};

// ✅ Check winner or draw
const checkWinner = () => {
  let winnerFound = false;

  // check all winning patterns
  for (let pattern of winPatterns) {
    let pos1Val = boxes[pattern[0]].innerText;
    let pos2Val = boxes[pattern[1]].innerText;
    let pos3Val = boxes[pattern[2]].innerText;

    if (pos1Val !== "" && pos2Val !== "" && pos3Val !== "") {
      if (pos1Val === pos2Val && pos2Val === pos3Val) {
        winnerFound = true;
        showWinner(pos1Val);
        return;
      }
    }
  }

  // If no winner and all boxes filled → draw
  let allFilled = true;
  boxes.forEach((box) => {
    if (box.innerText === "") allFilled = false;
  });

  if (!winnerFound && allFilled) {
    showDraw();
  }
};

// ✅ Buttons for reset & new game
newGameBtn.addEventListener("click", resetGame);
resetbtn.addEventListener("click", resetGame);

};

newGameBtn.addEventListener("click", resetGame);
resetbtn.addEventListener("click", resetGame);

