/* js/script.js
   Main logic for Mini Cricket game (vanilla JS)
   - Handles toss, innings, batting and bowling actions
   - Scoreboard and simple AI for opponent
   - Animations for ball, bat, wicket
*/

/* ---------- DOM refs ---------- */
const newGameBtn = document.getElementById('newGameBtn');
const tossBtn = document.getElementById('tossBtn');
const tossResult = document.getElementById('tossResult');
const oversSelect = document.getElementById('overs');

const modeText = document.getElementById('modeText');
const batControls = document.getElementById('batControls');
const bowlControls = document.getElementById('bowlControls');
const swingBtn = document.getElementById('swingBtn');
const bowlBtn = document.getElementById('bowlBtn');
const speedInput = document.getElementById('speed');
const lineSelect = document.getElementById('line');
const playerControls = document.getElementById('playerControls');

const runsEl = document.getElementById('runs');
const wicketsEl = document.getElementById('wickets');
const oversDisplay = document.getElementById('oversDisplay');
const targetEl = document.getElementById('target');
const inningEl = document.getElementById('inning');
const teamNameEl = document.getElementById('teamName');

const logList = document.getElementById('logList');

const ball = document.getElementById('ball');
const bat = document.getElementById('bat');
const wicket = document.getElementById('wicket');
const overlay = document.getElementById('overlay');
const tossArea = document.getElementById('tossArea');

/* ---------- Game state ---------- */
let state = {
  overs: 2,
  ballsPerOver: 6,
  totalBalls: 12, // computed
  ballCount: 0,
  runs: 0,
  wickets: 0,
  inning: 1,
  target: null,
  playerBatting: true, // true when player is batting
  matchOver: false,
  userIsPlayer: true,
  awaitingAction: false,
  aiScore: 0,
  aiWickets: 0,
  aiBallCount: 0
};

/* ---------- Utility helpers ---------- */
function logEvent(text) {
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()}: ${text}`;
  logList.prepend(li);
}

function resetPitchPositions() {
  ball.style.left = 'calc(50% - 13px)';
  ball.style.top = '18px';
  ball.style.transform = 'translateY(0)';
  bat.classList.remove('swing');
  wicket.classList.remove('fall');
}

/* ---------- UI updates ---------- */
function updateScoreboard() {
  runsEl.textContent = state.playerBatting ? state.runs : state.aiScore;
  wicketsEl.textContent = state.playerBatting ? state.wickets : state.aiWickets;
  // overs display shows completed overs . balls
  const ballNo = state.playerBatting ? state.ballCount : state.aiBallCount;
  const oversDone = Math.floor(ballNo / state.ballsPerOver);
  const ballsInOver = ballNo % state.ballsPerOver;
  oversDisplay.textContent = `${oversDone}.${ballsInOver}`;
  inningEl.textContent = state.inning;
  targetEl.textContent = state.target === null ? '—' : state.target;
}

/* ---------- Game flow functions ---------- */
function startNewGame() {
  // initialize state
  state.overs = parseInt(oversSelect.value, 10);
  state.ballsPerOver = 6;
  state.totalBalls = state.overs * state.ballsPerOver;
  state.ballCount = 0;
  state.aiBallCount = 0;
  state.runs = 0;
  state.wickets = 0;
  state.aiScore = 0;
  state.aiWickets = 0;
  state.inning = 1;
  state.target = null;
  state.matchOver = false;
  state.playerBatting = true;
  tossResult.textContent = '';
  logList.innerHTML = '';
  updateScoreboard();
  resetPitchPositions();
  playerControls.classList.remove('hidden');
  tossArea.classList.remove('hidden');
  modeText.textContent = '';
  batControls.classList.add('hidden');
  bowlControls.classList.add('hidden');
  showOverlay('Click Toss to start the match');
  teamNameEl.textContent = 'You';
  logEvent('New match created');
}

function showOverlay(msg, duration=1600) {
  overlay.innerHTML = `<div class="msg">${msg}</div>`;
  overlay.style.pointerEvents = 'none';
  overlay.style.opacity = '1';
  overlay.style.transition = 'opacity 0.3s';
  setTimeout(() => overlay.innerHTML = '', duration);
}

/* ---------- Toss ---------- */
function doToss() {
  const coin = Math.random() < 0.5 ? 'Heads' : 'Tails';
  const userCall = Math.random() < 0.5 ? 'Heads' : 'Tails'; // quick random "call" to avoid prompt
  const userWins = coin === userCall;
  tossResult.textContent = `Coin: ${coin}. You ${userWins ? 'won' : 'lost'} toss`;
  logEvent(`Toss: ${coin}. ${userWins ? 'You won' : 'You lost'}`);
  // If win, ask player to choose; for simplicity: if won -> bat; else AI chooses
  if (userWins) {
    state.playerBatting = true;
    modeText.textContent = 'You elected to bat first';
    batControls.classList.remove('hidden');
    bowlControls.classList.add('hidden');
    tossArea.classList.add('hidden');
    showOverlay('You bat first');
    logEvent('You elected to bat first');
  } else {
    state.playerBatting = false;
    modeText.textContent = 'Opponent bats first';
    batControls.classList.add('hidden');
    bowlControls.classList.remove('hidden');
    tossArea.classList.add('hidden');
    showOverlay('Opponent bats first');
    logEvent('Opponent will bat first');
    // Immediately let AI bat for the first innings
    aiPlayInnings();
  }
  updateScoreboard();
}

/* ---------- Animations: ball travel, bat swing, wicket ---------- */
function animateBallTo(targetY = 260, duration = 600) {
  // animate ball downward then reset
  ball.style.transition = `transform ${duration}ms cubic-bezier(.2,.9,.2,1)`;
  ball.style.transform = `translateY(${targetY}px)`;
  // Return a promise to wait for animation end
  return new Promise((res) => {
    setTimeout(() => res(), duration + 50);
  });
}

function animateBatSwing() {
  bat.classList.add('swing');
  setTimeout(() => bat.classList.remove('swing'), 250);
}

/* ---------- Batting logic (player bats) ---------- */
async function playerBats() {
  if (state.matchOver) return;
  if (!state.playerBatting) return;
  if (state.ballCount >= state.totalBalls) return;

  state.awaitingAction = true;
  showOverlay('Ball delivered...', 800);

  // animate ball coming in
  await animateBallTo(210, 650);

  // allow bat click window: swing within small ms window influences hit success
  const hitResult = calculateHitResult();
  animateBatSwing();

  // determine outcome
  if (hitResult.wicket) {
    // wicket animation
    wicket.classList.add('fall');
    state.wickets += 1;
    logEvent(`OUT! (Got bowled)`);
    showOverlay('WICKET!', 900);
  } else {
    state.runs += hitResult.runs;
    logEvent(`Runs: ${hitResult.runs}`);
    showOverlay(`+${hitResult.runs}`, 700);
  }

  state.ballCount += 1;
  updateScoreboard();

  // check innings or match end conditions
  checkAfterBall();
  resetPitchPositions();
  state.awaitingAction = false;
}

/* Hit probability model: returns {runs:0-6, wicket:false}
   Slightly influenced by "timing" (we won't implement real-time input timing to keep reliable).
   We keep it deterministic random with some weighted probabilities.
*/
function calculateHitResult() {
  // chance of wicket ~10%, dot ~25%, 1-4 usual, occasional 6
  const r = Math.random();
  if (r < 0.10) return { wicket: true, runs: 0 };
  if (r < 0.35) return { wicket: false, runs: 0 }; // dot
  if (r < 0.65) return { wicket: false, runs: 1 };
  if (r < 0.85) return { wicket: false, runs: 2 };
  if (r < 0.95) return { wicket: false, runs: 4 };
  return { wicket: false, runs: 6 };
}

/* ---------- Bowling logic (player bowls) ----------
   Player chooses speed and line; AI batting outcome depends on those choices.
*/
async function playerBowls() {
  if (state.matchOver) return;
  if (state.playerBatting) return; // player is bowling only when playerBatting=false
  if (state.aiBallCount >= state.totalBalls) return;

  const speed = parseInt(speedInput.value, 10); // 1..3
  const line = lineSelect.value; // center/off/leg

  showOverlay('You bowl...', 800);
  await animateBallTo(220, 600);

  // outcome depends on speed and line (simple)
  const outcome = aiBattingOutcome(speed, line);
  if (outcome.wicket) {
    wicket.classList.add('fall');
    state.aiWickets += 1;
    logEvent('You took a wicket!');
    showOverlay('WICKET!', 900);
  } else {
    state.aiScore += outcome.runs;
    logEvent(`AI scored ${outcome.runs}`);
    showOverlay(`AI +${outcome.runs}`, 700);
  }

  state.aiBallCount += 1;
  updateScoreboard();
  resetPitchPositions();

  // check if chase/win conditions
  checkAfterBall();
}

/* Simple AI batting outcome based on chosen speed and line */
function aiBattingOutcome(speed, line) {
  // base probabilities
  let r = Math.random();
  // speed 3 -> faster -> more likely dot/out, less big hits
  // line 'center' makes more scoring likely
  let wicketChance = 0.08 + (speed === 3 ? 0.06 : speed === 1 ? -0.01 : 0);
  let dotChance = 0.22 + (speed === 3 ? 0.10 : 0);
  let fourChance = 0.10 + (line === 'center' ? 0.12 : 0);
  let sixChance = 0.05 + (line === 'center' && speed < 3 ? 0.06 : 0);

  if (r < wicketChance) return { wicket: true, runs: 0 };
  r -= wicketChance;
  if (r < dotChance) return { wicket: false, runs: 0 };
  r -= dotChance;
  if (r < 0.45) return { wicket: false, runs: 1 };
  if (r < 0.75) return { wicket: false, runs: 2 };
  if (r < 0.75 + fourChance) return { wicket: false, runs: 4 };
  if (r < 1.0) return { wicket: false, runs: 6 };
  return { wicket: false, runs: 1 };
}

/* ---------- AI playing entire innings (used when AI bats first) ---------- */
async function aiPlayInnings() {
  // AI will bat for 'totalBalls' or until wickets exhausted (3 wickets limit to keep short)
  // For quicker runs we limit wickets to 3 per innings (configurable)
  const maxWickets = 3;
  while (state.aiBallCount < state.totalBalls && state.aiWickets < maxWickets) {
    await new Promise(res => setTimeout(res, 650)); // pacing
    const speed = Math.floor(Math.random() * 3) + 1;
    const lineOptions = ['center','off','leg'];
    const line = lineOptions[Math.floor(Math.random()*3)];
    const out = aiBattingOutcome(speed, line);
    if (out.wicket) {
      state.aiWickets++;
      logEvent('AI lost a wicket');
    } else {
      state.aiScore += out.runs;
      logEvent(`AI +${out.runs}`);
    }
    state.aiBallCount++;
    updateScoreboard();

    // If AI finished first innings, set target and switch to player batting
    if (state.aiBallCount >= state.totalBalls || state.aiWickets >= maxWickets) {
      finalizeFirstInningsByAI();
      return;
    }
  }
}

/* finalize when AI completes first innings */
function finalizeFirstInningsByAI() {
  state.target = state.aiScore + 1;
  // switch to player batting for chase
  state.playerBatting = true;
  state.inning = 2;
  state.ballCount = 0;
  state.wickets = 0;
  updateScoreboard();
  modeText.textContent = `Chase: Target ${state.target}`;
  batControls.classList.remove('hidden');
  bowlControls.classList.add('hidden');
  logEvent(`AI finished. Target: ${state.target}`);
  showOverlay(`Target ${state.target} — You bat now`, 1400);
}

/* ---------- End of ball & innings checks ---------- */
function checkAfterBall() {
  // If player was batting and first innings done:
  if (state.playerBatting) {
    // if first innings ended
    if (state.ballCount >= state.totalBalls || state.wickets >= 3) {
      // finalize first innings
      if (state.inning === 1) {
        state.target = state.runs + 1;
        // switch to AI batting
        state.playerBatting = false;
        state.inning = 2;
        state.aiBallCount = 0;
        state.aiWickets = 0;
        modeText.textContent = `AI chasing Target ${state.target}`;
        batControls.classList.add('hidden');
        bowlControls.classList.remove('hidden');
        updateScoreboard();
        logEvent(`End of Innings. Target for AI: ${state.target}`);
        showOverlay(`End of innings. AI chase ${state.target}`, 1400);
        // Let AI play its innings automatically
        setTimeout(() => aiPlayAIChase(), 700);
      } else {
        // End of match if second innings
        finalizeMatch();
      }
    } else {
      // If chasing and already chasing check for win
      if (state.target !== null && state.runs >= state.target) {
        finalizeMatch();
      }
    }
  } else {
    // Player is bowling (AI batting)
    if (state.aiBallCount >= state.totalBalls || state.aiWickets >= 3) {
      // AI innings over
      if (state.inning === 1) {
        // set target and switch to player batting
        state.target = state.aiScore + 1;
        state.playerBatting = true;
        state.inning = 2;
        state.ballCount = 0;
        state.wickets = 0;
        modeText.textContent = `Chase: Target ${state.target}`;
        batControls.classList.remove('hidden');
        bowlControls.classList.add('hidden');
        updateScoreboard();
        logEvent(`AI finished first innings. Target ${state.target}`);
        showOverlay(`Target ${state.target} — You bat now`, 1300);
      } else {
        finalizeMatch();
      }
    } else {
      // if player bowling during chase, check if AI reached target
      if (state.target !== null && state.aiScore >= state.target) {
        finalizeMatch();
      }
    }
  }
}

/* AI chase vs player bowling (automated) */
async function aiPlayAIChase() {
  // AI will play until balls exhausted or target reached
  while (state.aiBallCount < state.totalBalls && state.aiScore < state.target && state.aiWickets < 3) {
    await new Promise(res => setTimeout(res, 700));
    // simple pace and random
    const speed = Math.floor(Math.random() * 3) + 1;
    const line = ['center','off','leg'][Math.floor(Math.random()*3)];
    const out = aiBattingOutcome(speed, line);
    if (out.wicket) {
      state.aiWickets++;
      logEvent('AI lost a wicket (chase)');
    } else {
      state.aiScore += out.runs;
      logEvent(`AI +${out.runs} (chase)`);
    }
    state.aiBallCount++;
    updateScoreboard();
    if (state.aiScore >= state.target) break;
  }
  // After AI chase completed
  checkAfterBall();
}

/* Finalize match and declare winner */
function finalizeMatch() {
  state.matchOver = true;
  let result = '';
  const playerScore = state.playerBatting ? state.runs : state.runs; // player's final
  // Determine player final score: if player batted in innings 1 or 2
  let playerFinal, aiFinal;
  // If inning 2 has started, determine from state
  if (state.inning === 2 && state.playerBatting) {
    // player batting in 2nd innings
    playerFinal = state.runs;
    aiFinal = state.aiScore;
  } else {
    // player batte
    playerFinal = state.runs;
    aiFinal = state.aiScore;
  }

  if (playerFinal > aiFinal) {
    result = `You win! ${playerFinal} - ${aiFinal}`;
  } else if (playerFinal < aiFinal) {
    result = `You lose. ${aiFinal} - ${playerFinal}`;
  } else {
    result = `Match tied: ${playerFinal} - ${aiFinal}`;
  }
  showOverlay(result, 4000);
  logEvent(`Match over: ${result}`);
  // hide controls
  batControls.classList.add('hidden');
  bowlControls.classList.add('hidden');
  playerControls.classList.remove('hidden');
  tossArea.classList.add('hidden');
}


newGameBtn.addEventListener('click', startNewGame);
tossBtn.addEventListener('click', doToss);

swingBtn.addEventListener('click', async () => {
  if (!state.playerBatting || state.awaitingAction || state.matchOver) return;
  await playerBats();
});

bowlBtn.addEventListener('click', async () => {
  if (state.playerBatting || state.matchOver) return;
  await playerBowls();
});


startNewGame();
updateScoreboard();
