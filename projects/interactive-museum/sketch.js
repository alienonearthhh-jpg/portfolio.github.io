// Immersive Museum + sliding puzzle 


// ---------- Modes ----------
let mode = "menu";                // "menu" or "puzzle"
let currentIdx = -1;              // which artwork is active in puzzle
let startedSound = false;

// ---------- Assets ----------
let thumbs = {};                  // image cache by filename
let ambience = {};                // sound cache by painter key

// 8 artworks 
const ARTWORKS = [
  // row 1 — portraits
  {
    key: "vangogh_portrait",
    artist: "Vincent van Gogh",
    work: "Self-Portrait with Bandaged Ear",
    img: "vangogh_portrait.jpg",
    painterKey: "vangogh",
    caption:
      "Vincent van Gogh: Self-Portrait with Bandaged Ear, oil on canvas, 1889; in the collection of the Courtauld Institute of Art."
  },
  {
    key: "monet_portrait",
    artist: "Claude Monet",
    work: "Self-portrait in a Beret",
    img: "monet_portrait.jpg",
    painterKey: "monet",
    caption:
      "Claude Monet: Self-portrait in a Beret, oil on canvas; in a private collection."
  },
  {
    key: "hopper_portrait",
    artist: "Edward Hopper",
    work: "Self-Portrait",
    img: "hopper_portrait.jpg",
    painterKey: "hopper",
    caption:
      "Edward Hopper: Self-Portrait, 1925–1930, oil on canvas."
  },
  {
    key: "nara_portrait",
    artist: "Yoshitomo Nara",
    work: "Miss Moonlight",
    img: "nara_portrait.jpg",
    painterKey: "nara",
    caption:
      "Yoshitomo Nara, Miss Moonlight, 2020. Courtesy of Mori Art Museum, Tokyo, and Yoshitomo Nara Foundation."
  },

  // row 2 — landscapes
  {
    key: "vangogh_starrynight",
    artist: "Vincent van Gogh",
    work: "The Starry Night",
    img: "vangogh_starrynight.jpg",
    painterKey: "vangogh",
    caption:
      "Vincent van Gogh: The Starry Night, oil on canvas, 1889; in the collection of The Alfred H. Barr, Jr. Galleries."
  },
  {
    key: "monet_bridge",
    artist: "Claude Monet",
    work: "Water Lilies and Japanese Bridge",
    img: "monet_bridge.jpg",
    painterKey: "monet",
    caption:
      "Claude Monet: Water Lilies and Japanese Bridge, 1899; Princeton University Art Museum."
  },
  {
    key: "hopper_nighthawks",
    artist: "Edward Hopper",
    work: "Nighthawks",
    img: "hopper_nighthawks.jpg",
    painterKey: "hopper",
    caption:
      "Edward Hopper: Nighthawks, 1942, oil on canvas; Art Institute of Chicago."
  },
  {
    key: "nara_walkon",
    artist: "Yoshitomo Nara",
    work: "Walk On",
    img: "nara_walkon.jpg",
    painterKey: "nara",
    caption:
      "Yoshitomo Nara: Walk On; acrylic on canvas; private collection."
  }
];

// ambience files by painter
const AMBIENCE_FILES = {
  vangogh: "vangogh_ambience.mp3",
  monet:   "monet_ambience.mp3",
  hopper:  "hopper_ambience.mp3",
  nara:    "nara_ambience.mp3"
};

//  Gallery layout 
const GCOLS = 4;
const GROWS = 2;
let tiles = []; // [{x,y,w,h,idx}] computed each draw so it’s responsive

//  Puzzle state 
const PUZZLE_SIZE = 3;           
let board = [];                 
let emptyIdx = -1;
let puzzle = { x: 0, y: 0, w: 0, h: 0 };

// pixelation density
const PIXEL_SCALE = 60; 
function pixelStep(viewW, viewH) {
  const base = Math.min(viewW, viewH);
  return Math.max(3, Math.floor(base / PIXEL_SCALE));
}

// Timer & Solved popup 
let puzzleStartMs = 0;
let puzzleSolved = false;
let solvedTimeSec = 0;

//  Preload
function preload() {
  soundFormats("mp3", "ogg");
  for (const a of ARTWORKS) thumbs[a.img] = loadImage(a.img);
  for (const k in AMBIENCE_FILES) ambience[k] = loadSound(AMBIENCE_FILES[k]);
}

// Setup / Resize 
function setup() {
  createCanvas(windowWidth, Math.min(windowHeight, 800));
  textFont("monospace");
}

function windowResized() {
  resizeCanvas(windowWidth, Math.min(windowHeight, 800));
}

// Draw
function draw() {
  if (mode === "menu") {
    drawGallery();
  } else {
    drawPuzzleScreen();
  }
}

// GALLERY

function drawGallery() {
  background(255);
  tiles = [];

  const marginX = width * 0.08;
  const contentW = width - marginX * 2;

  // Title
  fill(0);
  textAlign(LEFT, TOP);
  textSize(36);
  text("IMMERSIVE\nMUSEUM", marginX, 40);

  // Grid numbers & sizes
  const gridTop = 140;
  const gap = 16;
  const tileW = (contentW - gap * (GCOLS - 1)) / GCOLS;
  const tileH = tileW * 0.75;
  const capH  = 64;

  for (let r = 0; r < GROWS; r++) {
    for (let c = 0; c < GCOLS; c++) {
      const idx = r * GCOLS + c;
      const a = ARTWORKS[idx];
      const x = marginX + c * (tileW + gap);
      const y = gridTop + r * (tileH + capH + 28);

      const img = thumbs[a.img];
      if (img) drawImageCover(img, x, y, tileW, tileH);

      noFill(); stroke(0, 100); rect(x, y, tileW, tileH);

      noStroke(); fill(0); textSize(12); textAlign(LEFT, TOP);
      text(`${a.artist}: ${a.work}`, x, y + tileH + 10, tileW, capH);

      tiles.push({ x, y, w: tileW, h: tileH, idx });
    }
  }
}

function drawImageCover(img, x, y, w, h) {
  const iw = img.width, ih = img.height;
  const boxRatio = w / h, imgRatio = iw / ih;

  let sw, sh, sx, sy;
  if (imgRatio > boxRatio) { sh = ih; sw = ih * boxRatio; sx = (iw - sw) / 2; sy = 0; }
  else { sw = iw; sh = iw / boxRatio; sx = 0; sy = (ih - sh) / 2; }
  image(img, x, y, w, h, sx, sy, sw, sh);
}

// Gallery input 
function mousePressed() {
  if (mode === "menu") {
    for (const t of tiles) {
      if (mouseX >= t.x && mouseX <= t.x + t.w && mouseY >= t.y && mouseY <= t.y + t.h) {
        startPuzzle(t.idx);
        return;
      }
    }
  } else if (mode === "puzzle") {
    handlePuzzleClick();
  }
}

function keyPressed() {
  if (mode === "puzzle" && key === "Escape") {
    stopAllAmbience();
    mode = "menu";
    currentIdx = -1;
  }
}


// PUZZLE

function startPuzzle(idx) {
  currentIdx = idx;
  mode = "puzzle";
  startedSound = false;

  const s = Math.min(width * 0.8, height * 0.6);
  puzzle.w = puzzle.h = s;
  puzzle.x = (width - s) / 2;
  puzzle.y = 140;

  const n = PUZZLE_SIZE * PUZZLE_SIZE;
  board = Array.from({ length: n }, (_, i) => i);
  emptyIdx = n - 1;
  board[emptyIdx] = -1;

  shuffleLegal(100);

  puzzleSolved = false;
  solvedTimeSec = 0;
  puzzleStartMs = millis();
}

function drawPuzzleScreen() {
  background(255);

  const art = ARTWORKS[currentIdx];
  const img = thumbs[art.img];

  fill(0); textAlign(LEFT, TOP); textSize(28);
  text("SLIDING\nPUZZLE", puzzle.x, 40);

  if (!img) { textAlign(CENTER, CENTER); text("Loading image…", width/2, height/2); return; }

  fill(0); textAlign(LEFT, TOP); textSize(12);
  const liveSec = puzzleSolved ? solvedTimeSec : ((millis() - puzzleStartMs) / 1000).toFixed(1);
  text(`Time: ${liveSec}s`, puzzle.x, puzzle.y - 22);

  drawPuzzleTiles(img);

  // caption
  fill(0); textAlign(LEFT, TOP); textSize(12);
  text(art.caption, puzzle.x, puzzle.y + puzzle.h + 16, puzzle.w, 80);

  // hint
  textAlign(RIGHT, BOTTOM); fill(80); textSize(11);
  text("ESC to return to museum", width - 20, height - 16);

  // solved overlay (text-only feedback)
  if (puzzleSolved) drawSolvedOverlay();
}

function drawPuzzleTiles(img) {
  const { x, y, w, h } = puzzle;
  const tileW = w / PUZZLE_SIZE;
  const tileH = h / PUZZLE_SIZE;

  for (let i = 0; i < board.length; i++) {
    const bx = x + (i % PUZZLE_SIZE) * tileW;
    const by = y + floor(i / PUZZLE_SIZE) * tileH;
    const id = board[i];
    if (id === -1) continue;

    const sx = (id % PUZZLE_SIZE) * (img.width / PUZZLE_SIZE);
    const sy = floor(id / PUZZLE_SIZE) * (img.height / PUZZLE_SIZE);
    const sw = img.width / PUZZLE_SIZE;
    const sh = img.height / PUZZLE_SIZE;

    image(img, bx, by, tileW, tileH, sx, sy, sw, sh);

    const step = pixelStep(w, h);
    noStroke();
    for (let py = 0; py < tileH; py += step) {
      for (let px = 0; px < tileW; px += step) {
        const u = map(px, 0, tileW, sx, sx + sw);
        const v = map(py, 0, tileH, sy, sy + sh);
        const c = img.get(int(u), int(v));
        fill(red(c), green(c), blue(c), 170);
        rect(bx + px, by + py, step, step);
      }
    }
  }

  noFill(); stroke(0, 60); strokeWeight(2);
  rect(x - 4, y - 4, w + 8, h + 8);
}

// click inside puzzle
function handlePuzzleClick() {
  if (currentIdx < 0 || puzzleSolved) return;

  if (!startedSound) {
    userStartAudio();
    const painter = ARTWORKS[currentIdx].painterKey;
    const s = ambience[painter];
    stopAllAmbience();
    if (s) { s.loop(); s.setVolume(0.3); }
    startedSound = true;
  }

  const { x, y, w, h } = puzzle;
  if (mouseX < x || mouseX > x + w || mouseY < y || mouseY > y + h) return;

  const c = floor((mouseX - x) / (w / PUZZLE_SIZE));
  const r = floor((mouseY - y) / (h / PUZZLE_SIZE));
  const i = r * PUZZLE_SIZE + c;

  if (neighbors(emptyIdx).includes(i)) {
    swapTiles(i, emptyIdx);

    if (!puzzleSolved && isSolved()) {
      puzzleSolved = true;
      solvedTimeSec = ((millis() - puzzleStartMs) / 1000).toFixed(1);
      // stopAllAmbience(); // optional
    }
  }
}

// puzzle helpers
function shuffleLegal(steps) {
  for (let k = 0; k < steps; k++) {
    const nbs = neighbors(emptyIdx);
    const pick = random(nbs);
    swapTiles(emptyIdx, pick);
  }
}

function neighbors(i) {
  const r = floor(i / PUZZLE_SIZE), c = i % PUZZLE_SIZE, out = [];
  if (r > 0)               out.push((r - 1) * PUZZLE_SIZE + c);
  if (r < PUZZLE_SIZE - 1) out.push((r + 1) * PUZZLE_SIZE + c);
  if (c > 0)               out.push(r * PUZZLE_SIZE + (c - 1));
  if (c < PUZZLE_SIZE - 1) out.push(r * PUZZLE_SIZE + (c + 1));
  return out;
}

function swapTiles(a, b) {
  const t = board[a]; board[a] = board[b]; board[b] = t;
  if (board[a] === -1) emptyIdx = a;
  if (board[b] === -1) emptyIdx = b;
}

function stopAllAmbience() {
  for (const k in ambience) {
    const s = ambience[k];
    if (s && s.isPlaying()) s.stop();
  }
}


// Solved popup overlay 

function drawSolvedOverlay() {
  const { x, y, w, h } = puzzle;

  // dim
  noStroke(); fill(0, 160);
  rect(x - 4, y - 4, w + 8, h + 8, 8);

  // card
  const cardW = Math.min(w * 0.8, 560);
  const cardH = 180;
  const cx = x + w / 2;
  const cy = y + h / 2;

  push();
  rectMode(CENTER);
  drawingContext.shadowColor = "rgba(0,0,0,0.18)";
  drawingContext.shadowBlur = 16;
  drawingContext.shadowOffsetY = 6;
  fill(255); noStroke(); rect(cx, cy, cardW, cardH, 14);
  pop();

  // textbox area
  const padX = 28, padY = 24;
  const boxX = cx - cardW / 2 + padX;
  const boxY = cy - cardH / 2 + padY;
  const boxW = cardW - padX * 2;

  // headline (auto-fit)
  const msg = "Well done!  you have solved the puzzle\n(:";
  fill(0); textAlign(CENTER, TOP); textStyle(BOLD);
  let size = 22; textSize(size);
  while (size > 14 && textWidth("Well done!  you have solved the puzzle") > boxW) {
    size -= 1; textSize(size);
  }
  text(msg, boxX, boxY, boxW, 60);

  // time line
  textStyle(NORMAL); textSize(16); fill(0);
  const timeStr = `You solved this in ${solvedTimeSec} seconds!`;
  text(timeStr, boxX, boxY + 70, boxW, 24);

  // hint
  fill(70); textSize(12); textAlign(CENTER, BOTTOM);
  text("Press ESC to return to the museum", cx, cy + cardH / 2 - padY + 2);
}

// 
function isSolved() {
  for (let i = 0; i < board.length - 1; i++) if (board[i] !== i) return false;
  return board[board.length - 1] === -1;
}
