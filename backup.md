// Grab DOM elements
const canvas       = document.getElementById('canvas');
const ctx          = canvas.getContext('2d');
const betaRange    = document.getElementById('betaRange');
const betaVal      = document.getElementById('betaVal');
const betaInput    = document.getElementById('betaInput');
const velInput     = document.getElementById('velInput');
const addVelButton = document.getElementById('addVel');
const timeDilationButton = document.getElementById('timeDilation');
const clearVelButton = document.getElementById('clearVel');
const addCatButton = document.getElementById('addCat');

// Global variables and arrays (existing)
let offsetX = 0, offsetT = 0;
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let velocities = [];
let zoomFactor = 2;

// New array for cats (for length contraction visualization)
let cats = [];

// Colors for new velocities and cats
const velocityColors = ["#fe0000", "#ff6400", "green", "#33fff0", "blue", "#ae00ff"];
const catColor = "purple"; // you can choose a fixed color or use a rotating list

// 2. Resize canvas to match its CSS size
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight - document.getElementById('controls').offsetHeight;
}
window.addEventListener('resize', () => { resize(); update(); });
resize();

// Add mouse event listeners for dragging...
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMousePos = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - lastMousePos.x;
  const dy = e.clientY - lastMousePos.y;
  const w = canvas.width, h = canvas.height;
  const margin = 32;
  const scaleX = (w - 2 * margin) / 24;
  const scaleY = (h - 2 * margin) / 12;
  offsetX += dx / scaleX;
  offsetT -= dy / scaleY;
  lastMousePos = { x: e.clientX, y: e.clientY };
  update();
});
canvas.addEventListener('mouseup', () => { isDragging = false; });
canvas.addEventListener('mouseleave', () => { isDragging = false; });

// Modify the button event listener to limit to 6 velocities and store as objects
addVelButton.addEventListener('click', () => {
  const v = parseFloat(velInput.value);
  if (!isNaN(v) && Math.abs(v) < 1) {
    if (velocities.length < 6) {
      velocities.push({ v: v, color: velocityColors[velocities.length] });
      update();
    } else {
      alert("Maximum of 6 velocities reached.");
    }
  }
});
velInput.addEventListener('keyup', (e) => {
  if (e.key === "Enter") {
    addVelButton.click();
  }
});

// New event listener for Time Dilation button
timeDilationButton.addEventListener('click', () => {
  if (velocities.length === 0) {
    alert("No velocity lines available.");
    return;
  }
  // Build a prompt message listing each velocity line by index and its value.
  let msg = "Select a velocity line by entering its number:\n";
  velocities.forEach((obj, index) => {
    msg += (index + 1) + ": v = " + obj.v.toFixed(2) + "\n";
  });
  let inputVal = prompt(msg, "1");
  let idx = parseInt(inputVal) - 1;
  if (!isNaN(idx) && idx >= 0 && idx < velocities.length) {
    // Set beta to the selected velocity's value
    let selectedV = velocities[idx].v;
    betaRange.value = selectedV;
    betaInput.value = selectedV;
    update();
  } else {
    alert("Invalid selection.");
  }
});

// Synchronize beta slider and number input
betaRange.addEventListener('input', () => {
  betaInput.value = betaRange.value;
  update();
});
betaInput.addEventListener('input', () => {
  betaRange.value = betaInput.value;
  update();
});

// (Existing lorentz transform function)
function lorentz(x, t, beta) {
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const xp = gamma * (x - beta * t);
  const tp = gamma * (t - beta * x);
  return [xp, tp];
}

// Inverse Lorentz transform: from cat's rest frame (x', t') to S frame (x, t)
function inverseLorentz(xp, tp, beta) {
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const x = gamma * (xp + beta * tp);
  const t = gamma * (tp + beta * xp);
  return [x, t];
}

// Main draw routine
function draw(beta) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width, h = canvas.height;
  const margin = 32;
  
  // Domain parameters remain unchanged.
  const originalDomainX = 36; // originally -18 to 18 in world units
  const originalDomainT = 18; // originally 0 to 18 in world units
  
  // Compute a uniform scaling factor so each world unit is the same on both axes.
  const uniformScale = Math.min((w - 2 * margin) / originalDomainX, (h - 2 * margin) / originalDomainT) * zoomFactor;
  const scaleX = uniformScale;
  const scaleY = uniformScale;
  
  // Extended world domain remains unchanged.
  const domainX = 72; // x from -36 to 36
  const domainT = 36; // t from 0 to 36
  
  // Define the origin (center bottom).
  const originX = w / 2;
  const originY = h - margin;
  
  // Mapping function stays the same.
  function map(x, t) {
    return [originX + (x + offsetX) * scaleX,
            originY - (t + offsetT) * scaleY];
  }
  
  // 4a. Draw invariant light-cone lines t = ±x (orange)
  ctx.strokeStyle = '#FFCC33';
  ctx.lineWidth = 2.6;
  let p0 = map(0, 0), p1 = map(36, 36);
  ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke();
  p0 = map(-36, 36), p1 = map(0, 0);
  ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke();
  
  // 4b. Draw original frame grid (light gray)
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  for (let t = 0; t <= domainT; t++) {
    let [x0, y0] = map(-36, t), [x1, y1] = map(36, t);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  for (let x = -36; x <= 36; x++) {
    let [x0, y0] = map(x, 0), [x1, y1] = map(x, domainT);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  
  // 4c. Draw transformed grid (semi-transparent blue)
  ctx.strokeStyle = 'rgba(0,0,200,0.5)';
  for (let t = 0; t <= domainT; t++) {
    let a = lorentz(-36, t, beta), b = lorentz(36, t, beta);
    let [X0, Y0] = map(...a), [X1, Y1] = map(...b);
    ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y1); ctx.stroke();
  }
  for (let x = -36; x <= 36; x++) {
    let a = lorentz(x, 0, beta), b = lorentz(x, domainT, beta);
    let [X0, Y0] = map(...a), [X1, Y1] = map(...b);
    ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y1); ctx.stroke();
  }
  
  // 4d. Draw S-frame axes (black)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  let [ax0, ay0] = map(0, 0), [ax1, ay1] = map(0, domainT);
  ctx.beginPath(); ctx.moveTo(ax0, ay0); ctx.lineTo(ax1, ay1); ctx.stroke();
  [ax0, ay0] = map(-36, 0);
  [ax1, ay1] = map(36, 0);
  ctx.beginPath(); ctx.moveTo(ax0, ay0); ctx.lineTo(ax1, ay1); ctx.stroke();
  
  // 4e. Draw each user-specified velocity worldline with its assigned color and Lorentz transformed
  velocities.forEach(obj => {
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = 2;
    // Untransformed endpoints of worldline: (0,0) and (obj.v * domainT, domainT)
    let start = [0, 0];
    let end = [obj.v * domainT, domainT];
    // Apply Lorentz transform using the current beta
    let tStart = lorentz(start[0], start[1], beta);
    let tEnd = lorentz(end[0], end[1], beta);
    // Map the transformed endpoints to canvas pixels
    let vp0 = map(...tStart);
    let vp1 = map(...tEnd);
    ctx.beginPath();
    ctx.moveTo(...vp0);
    ctx.lineTo(...vp1);
    ctx.stroke();

    // Draw time interval markers along the velocity worldline
    // Choose a time step (for instance, every 2 world units)
    const dt = 2;
    for (let tMark = dt; tMark < domainT; tMark += dt) {
      // Untransformed marker point: (obj.v * tMark, tMark)
      let markUntransformed = [obj.v * tMark, tMark];
      // Apply Lorentz transform
      let markTransformed = lorentz(markUntransformed[0], markUntransformed[1], beta);
      // Map to canvas coordinates
      let [mx, my] = map(...markTransformed);
      // Draw a small dot to represent the time click
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  // New code: draw each cat (for length contraction visualization)
  // For each cat object, draw its head worldline (x=0) and tail worldline (x=2) with dots at intervals.
  cats.forEach(cat => {
    const dtCat = 2;   // time interval for markers
    let headPoints = [];
    let tailPoints = [];
    ctx.strokeStyle = cat.color;
    ctx.lineWidth = 2;
    for (let t = 0; t <= domainT; t += dtCat) {
      // Head event at (x=0, t)
      let headEvent = lorentz(cat.head, t, beta);
      let headMapped = map(...headEvent);
      headPoints.push(headMapped);
      // Tail event at (x=2, t)
      let tailEvent = lorentz(cat.tail, t, beta);
      let tailMapped = map(...tailEvent);
      tailPoints.push(tailMapped);
      // Draw a dot for head marker
      ctx.fillStyle = cat.color;
      ctx.beginPath();
      ctx.arc(headMapped[0], headMapped[1], 4, 0, 2 * Math.PI);
      ctx.fill();
      // Draw a dot for tail marker
      ctx.beginPath();
      ctx.arc(tailMapped[0], tailMapped[1], 4, 0, 2 * Math.PI);
      ctx.fill();
    }
    // Connect head markers with a continuous line
    if (headPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(headPoints[0][0], headPoints[0][1]);
      headPoints.forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.stroke();
    }
    // Connect tail markers with a continuous line
    if (tailPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(tailPoints[0][0], tailPoints[0][1]);
      tailPoints.forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.stroke();
    }
    
    // Fill the region between the head and tail lines:
    if (headPoints.length > 0 && tailPoints.length > 0) {
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = cat.color;
      ctx.beginPath();
      // Draw the polygon from head line then tail line in reverse order
      ctx.moveTo(headPoints[0][0], headPoints[0][1]);
      headPoints.forEach(p => ctx.lineTo(p[0], p[1]));
      tailPoints.slice().reverse().forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  });
}

// Add a wheel event listener to zoom in/out on the canvas.
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  // Zoom in if wheel scrolled up, out if scrolled down.
  zoomFactor *= (e.deltaY < 0) ? 1.05 : 0.95;
  update();
});

// 5. Update function to redraw the diagram
function update() {
  const beta = parseFloat(betaRange.value);
  betaVal.textContent = beta.toFixed(2);
  draw(beta);
}
betaRange.addEventListener('input', update);
betaInput.addEventListener('input', () => {
  betaRange.value = betaInput.value;
  update();
});

// Initial render
update();

// Clear velocities button event listener
clearVelButton.addEventListener('click', () => {
  velocities = [];
  update();
});

// New Add Cat event listener – when clicked, add a cat object.
// The cat object has head at x=0 and tail at x=2 (world units)
addCatButton.addEventListener('click', () => {
  if (cats.length === 0) {
    cats.push({ head: 0, tail: 2, color: catColor });
  } else {
    alert("Only one cat is allowed.");
  }
  update();
});
