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
const saveDiagramButton = document.getElementById('saveDiagram');
let ladderBarn = null;
const ladderBarnButton = document.getElementById('ladderBarn');
let twinParadox = false;
const twinParadoxButton = document.getElementById('twinParadox');
const instructionsButton = document.getElementById("instructionsButton");
const instructionsPop = document.getElementById("instructionsPop");
const closeInstructions = document.getElementById("closeInstructions");
let hyperbola = false;
const hyperbolaButton = document.getElementById('hyperbola');

let offsetX = 0, offsetT = 0;
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let velocities = [];
let zoomFactor = 2;

let cats = [];
const velocityColors = ["#fe0000", "#ff6400", "green", "#33fff0", "blue", "#ae00ff"];
const catColor = "purple"; 

// resize canvas 
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight - document.getElementById('controls').offsetHeight;
}
window.addEventListener('resize', () => { resize(); update(); });
resize();

// Add mouse event listeners for dragging
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

// Add mouse wheel event listener for zooming
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
// Time dilation button event listener
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
  
  // Draw Ladder and Barn if it exists
  if (ladderBarn) {
    // --- Draw the Barn (same as the cat method) ---
    const barnDt = 2;
    let barnHeadPoints = [];
    let barnTailPoints = [];
    for (let t = 0; t <= domainT; t += barnDt) {
      let headEvent = lorentz(ladderBarn.barn.head, t, beta);
      let tailEvent = lorentz(ladderBarn.barn.tail, t, beta);
      barnHeadPoints.push(map(...headEvent));
      barnTailPoints.push(map(...tailEvent));
    }
    
    // Draw barn lines
    ctx.strokeStyle = ladderBarn.barn.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(barnHeadPoints[0][0], barnHeadPoints[0][1]);
    barnHeadPoints.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(barnTailPoints[0][0], barnTailPoints[0][1]);
    barnTailPoints.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.stroke();
    
    // Fill barn region with 10% opacity
    if (barnHeadPoints.length && barnTailPoints.length) {
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = ladderBarn.barn.color;
      ctx.beginPath();
      ctx.moveTo(barnHeadPoints[0][0], barnHeadPoints[0][1]);
      barnHeadPoints.forEach(p => ctx.lineTo(p[0], p[1]));
      barnTailPoints.slice().reverse().forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
    
    // --- Draw the Ladder ---
    const ladderDt = 2;
    let leftPoints = [];
    let rightPoints = [];
    // For each time t, compute x from the equations:
    // Left edge: x = t/1.25
    // Right edge: x = t/1.25 - 2
    for (let t = 0; t <= domainT; t += ladderDt) {
      let leftX = t / 1.25;
      let rightX = t / 1.25 - 2;
      // Transform the fixed coordinates using current beta
      let leftEvent = lorentz(leftX, t, beta);
      let rightEvent = lorentz(rightX, t, beta);
      leftPoints.push(map(...leftEvent));
      rightPoints.push(map(...rightEvent));
    }
    
    // Draw ladder edge lines
    ctx.strokeStyle = ladderBarn.ladder.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftPoints[0][0], leftPoints[0][1]);
    leftPoints.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(rightPoints[0][0], rightPoints[0][1]);
    rightPoints.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.stroke();
    
    // Fill ladder region with 10% opacity
    if (leftPoints.length && rightPoints.length) {
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = ladderBarn.ladder.color;
      ctx.beginPath();
      ctx.moveTo(leftPoints[0][0], leftPoints[0][1]);
      leftPoints.forEach(p => ctx.lineTo(p[0], p[1]));
      rightPoints.slice().reverse().forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }
  
  if (twinParadox) {
    // --- Draw Twin Paradox Lines ---
    // Line 1: x = 0, 0 <= t <= 8
    let twinLine1 = [];
    const dtTwin = 0.5;
    for (let t = 0; t <= 8; t += dtTwin) {
      let p = lorentz(0, t, beta); // Lorentz transform the fixed S-frame point (0, t)
      twinLine1.push(map(...p));
    }
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(twinLine1[0][0], twinLine1[0][1]);
    twinLine1.forEach(pt => ctx.lineTo(pt[0], pt[1]));
    ctx.stroke();
    
    // Line 2: t = 2x, 0 <= x <= 2
    let twinLine2 = [];
    const dxTwin = 0.1;
    for (let x = 0; x <= 2.05; x += dxTwin) {
      let t = 2 * x;
      let p = lorentz(x, t, beta);
      twinLine2.push(map(...p));
    }
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(twinLine2[0][0], twinLine2[0][1]);
    twinLine2.forEach(pt => ctx.lineTo(pt[0], pt[1]));
    ctx.stroke();
    
    // Line 3: t = -2x + 8, 0 <= x <= 2
    let twinLine3 = [];
    for (let x = 0; x <= 2.05; x += dxTwin) {
      let t = -2 * x + 8;
      let p = lorentz(x, t, beta);
      twinLine3.push(map(...p));
    }
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(twinLine3[0][0], twinLine3[0][1]);
    twinLine3.forEach(pt => ctx.lineTo(pt[0], pt[1]));
    ctx.stroke();
  }
  
  if (hyperbola) {
    // Array of proper time values (τ) for which to draw hyperbolas.
    const tauValues = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34];
    tauValues.forEach(tau => {
      let hyperPoints = [];
      // Sample x in a suitable range. Adjust step and range as needed.
      for (let x = -38; x <= 38; x += 0.1) {
        // Only take positive t; t = sqrt(x^2 + τ^2)
        let t = Math.sqrt(x * x + tau * tau);
        if (t >= 36) continue; // Skip points that are too high in t
        // Apply Lorentz transform with current beta.
        let p = lorentz(x, t, beta);
        hyperPoints.push(map(...p));
      }
      // Draw the hyperbola curve.
      ctx.strokeStyle = '#008800';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hyperPoints[0][0], hyperPoints[0][1]);
      hyperPoints.forEach(pt => ctx.lineTo(pt[0], pt[1]));
      ctx.stroke();
    });
  }
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
  cats = [];
  ladderBarn = null;
  twinParadox = false;
  hyperbola = false;  // Reset hyperbola flag
  update();
});

// New Add Cat event listener – when clicked, add a cat object.
addCatButton.addEventListener('click', () => {
  if (cats.length === 0) {
    cats.push({ head: 0, tail: 2, color: catColor });
  } else {
    alert("Only one cat is allowed.");
  }
  update();
});

// Save Diagram button event listener – when clicked, save the current canvas as an image file.
saveDiagramButton.addEventListener('click', () => {
  const dataURL = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'LorentzTransformDiagram.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// New Ladder/Barn button event listener – when clicked, add the ladder and barn objects.
ladderBarnButton.addEventListener('click', () => {
  if (!ladderBarn) {
    const currentBeta = parseFloat(betaRange.value);
    ladderBarn = {
      // Change barn boundaries to x = -1 and x = 1 instead of 0 and 2.
      barn: { head: 0, tail: 2, color: "#ff00dc", beta: currentBeta },
      // Ladder remains unchanged.
      ladder: { left: -1, right: 1, color: "#0071ff", beta: currentBeta }
    };
  } else {
    alert("Ladder and Barn already added.");
  }
  update();
});

// New Twin Paradox button event listener
twinParadoxButton.addEventListener('click', () => {
  if (!twinParadox) {
    twinParadox = true;
  } else {
    alert("Twin Paradox already visualized.");
  }
  update();
});

// Instructions button event listener
instructionsButton.addEventListener("click", () => {
  instructionsPop.style.display = "block";
});

// Close instructions pop-up
closeInstructions.addEventListener("click", () => {
  instructionsPop.style.display = "none";
});

// New Hyperbola button event listener
hyperbolaButton.addEventListener('click', () => {
  if (!hyperbola) {
    hyperbola = true;
  } else {
    alert("Hyperbola already visualized.");
  }
  update();
});
