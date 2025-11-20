## Deployment link

## GitHub repository

A compact, responsive mini cricket game built with vanilla HTML, CSS and JavaScript.  
It includes basic batting & bowling mechanics, a real-time scoreboard, match logic, animations, and is fully responsive.



## How to play (Game instructions)
1. Open `index.html` in a modern browser (Chrome/Edge/Firefox).
2. Choose the number of overs (default is 2) then click **New Game**.
3. Click **Toss** to start.
   - If you win the toss you bat first (for simplicity: random call determines toss).
   - If you lose, AI bats first and you will bowl.
4. **When batting (you):**
   - Click **Swing** when the ball is delivered to attempt a hit.
   - Hits yield 0,1,2,4 or 6 runs or a wicket based on probabilities.
   - Innings ends on overs/wicket limit and then the opponent chases.
5. **When bowling (you):**
   - Choose **Speed** and **Line**, then click **Bowl**.
   - Outcomes are influenced by speed and line choices.
6. The scoreboard updates in real-time. The match runs two innings (first innings and chase).
7. The overlay and event log show events and results. When innings finish, the match outcome is shown.


## Technologies used
- HTML5
- CSS3 (flexbox, grid, transitions)
- Vanilla JavaScript (ES6)
