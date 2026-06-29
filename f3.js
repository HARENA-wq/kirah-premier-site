/* ==========================================================================
   RETROFORGE ARCADE - LOGIQUE ET MOTEUR DE JEU (f3.js)
   100% OFFLINE COMPATIBLE - NO EXTERNAL DEPENDENCIES OR ONLINE FONTS REQUIRED
   Palette de couleurs stricte : Bleu, Blanc, Noir, Vert (High Contrast)
   Gère : Particules, Sons Web Audio, 3 Jeux Canvas, Avis, Téléchargements
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  
  // ==========================================================================
  // 1. DOCKING DU THÈME ET CHARGEMENT DYNAMIQUE DES JEUX ADMIN
  // ==========================================================================
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.getElementById("nav-links");

  // Charger le thème depuis localStorage
  const currentTheme = localStorage.getItem("retroforge-theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeIcon(currentTheme);

  themeToggleBtn.addEventListener("click", () => {
    const theme = document.documentElement.getAttribute("data-theme");
    const newTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("retroforge-theme", newTheme);
    updateThemeIcon(newTheme);
    
    // Effet sonore de clic
    RetroSynth.playSelect();
    
    // Micro-effet visuel de flash sur le canvas de fond
    triggerScreenFlash(newTheme === "dark" ? "var(--color-primary-glow)" : "var(--color-secondary-glow)");
  });

  function updateThemeIcon(theme) {
    if (theme === "light") {
      themeIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
        </svg>
      `;
    } else {
      themeIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c.132 0 .263 0 .393.007a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 3z"/>
        </svg>
      `;
    }
  }

  // Hamburger menu pour mobile
  mobileMenuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    mobileMenuBtn.textContent = navLinks.classList.contains("active") ? "✕" : "☰";
    RetroSynth.playSelect();
  });

  // Fermer le menu sur clic de lien
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      mobileMenuBtn.textContent = "☰";
    });
  });

  // ==========================================================================
  // RETRO SOUND SYNTHESIZER (API WEB AUDIO)
  // ==========================================================================
  const RetroSynth = {
    ctx: null,
    enabled: true,

    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    },

    playSelect() {
      if (!this.enabled) return;
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    },

    playPoint() {
      if (!this.enabled) return;
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    },

    playHit() {
      if (!this.enabled) return;
      this.init();
      
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.15);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      noise.start();
      noise.stop(this.ctx.currentTime + 0.15);
    },

    playDefeat() {
      if (!this.enabled) return;
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    },

    playVictory() {
      if (!this.enabled) return;
      this.init();
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.1 + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.3);
      });
    },

    playNote(freq, duration = 0.2) {
      if (!this.enabled) return;
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }
  };

  // Audio Toggle Switch
  const soundToggle = document.getElementById("sound-toggle");
  if (soundToggle) {
    soundToggle.addEventListener("change", (e) => {
      RetroSynth.enabled = e.target.checked;
      RetroSynth.playSelect();
    });
  }


  // ==========================================================================
  // MASQUAGE DYNAMIQUE DES JEUX NATIFS SUPPRIMÉS & CHARGEMENT DES JEUX ADMIN
  // ==========================================================================
  const deletedDefaults = JSON.parse(localStorage.getItem("rf-deleted-defaults")) || [];
  
  // Masquer les cartes physiques dans f1.html si elles ont été supprimées
  deletedDefaults.forEach(id => {
    const card = document.getElementById(`card-${id}`);
    if (card) card.style.display = "none";
  });

  const customGames = JSON.parse(localStorage.getItem("rf-custom-games")) || [];
  const gamesGrid = document.getElementById("games-grid");

  if (gamesGrid) {
    customGames.forEach(game => {
      const card = document.createElement("article");
      card.className = "game-card";
      card.setAttribute("data-genre", game.category);
      card.id = `card-${game.id}`;
      
      let grad = "radial-gradient(circle, rgba(0, 136, 255, 0.2) 0%, rgba(0, 0, 0, 0.95) 100%)";
      let tagColor = "var(--color-primary)";
      let tagLabel = "Module Externe";
      
      if (game.category === "tir") {
        grad = "radial-gradient(circle, rgba(0, 230, 118, 0.2) 0%, rgba(0, 0, 0, 0.95) 100%)";
        tagColor = "var(--color-secondary)";
        tagLabel = "Tir Custom";
      } else if (game.category === "puzzle") {
        grad = "radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, rgba(0, 0, 0, 0.95) 100%)";
        tagColor = "var(--color-accent)";
        tagLabel = "Puzzle Custom";
      }
      
      card.innerHTML = `
        <span class="game-tag" style="border-color: ${tagColor}; color: ${tagColor};">${tagLabel}</span>
        <div class="game-visual" style="background-image: ${grad};">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="30" fill="none" stroke="${tagColor}" stroke-width="4" stroke-dasharray="10 5" filter="drop-shadow(0 0 8px ${tagColor})" />
            <path d="M40 35L70 50L40 65V35Z" fill="white" />
          </svg>
        </div>
        <div class="game-info">
          <h3>${game.name}</h3>
          <p class="game-description">${game.description}</p>
          
          <div class="evaluation-row">
            <div class="rating-interactive" data-game-id="${game.id}">
              <span class="star-icon" data-value="1" aria-label="1 étoile">&#9733;</span>
              <span class="star-icon" data-value="2" aria-label="2 étoiles">&#9733;</span>
              <span class="star-icon" data-value="3" aria-label="3 étoiles">&#9733;</span>
              <span class="star-icon" data-value="4" aria-label="4 étoiles">&#9733;</span>
              <span class="star-icon" data-value="5" aria-label="5 étoiles">&#9733;</span>
              <span class="rating-count" id="rating-count-${game.id}">(0 votes)</span>
            </div>
            
            <button class="like-btn" id="like-btn-${game.id}" data-game-id="${game.id}" aria-label="Aimer ${game.name}">
              <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <span class="like-counter" id="like-count-${game.id}">0</span>
            </button>
          </div>
          
          <div class="game-footer-actions">
            <button class="btn btn-primary play-game-btn" data-game="${game.id}" id="btn-play-${game.id}">Jouer</button>
            <button class="btn btn-secondary download-game-btn" data-game="${game.id}" id="btn-down-${game.id}">Télécharger</button>
          </div>
        </div>
      `;
      
      gamesGrid.appendChild(card);
    });
  }


  // ==========================================================================
  // PARTICULES INTERACTIVES EN ARRIÈRE-PLAN (Palette Bleu/Vert)
  // ==========================================================================
  const particleCanvas = document.getElementById("particle-canvas");
  const pCtx = particleCanvas.getContext("2d");
  
  let particlesArray = [];
  const numberOfParticles = 50;
  let mouse = { x: null, y: null };

  function resizeParticleCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeParticleCanvas);
  resizeParticleCanvas();

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
  });

  window.addEventListener("mouseout", () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * particleCanvas.width;
      this.y = Math.random() * particleCanvas.height;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedX = Math.random() * 0.4 - 0.2;
      this.speedY = Math.random() * 0.4 - 0.2;
      // Exclusivement bleu néon ou vert matrix
      this.color = Math.random() > 0.5 ? 'rgba(0, 136, 255, 0.4)' : 'rgba(0, 230, 118, 0.4)';
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x > particleCanvas.width) this.x = 0;
      if (this.x < 0) this.x = particleCanvas.width;
      if (this.y > particleCanvas.height) this.y = 0;
      if (this.y < 0) this.y = particleCanvas.height;

      if (mouse.x && mouse.y) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 150) {
          this.x += dx * 0.005;
          this.y += dy * 0.005;
        }
      }
    }

    draw() {
      pCtx.fillStyle = this.color;
      pCtx.beginPath();
      pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      pCtx.fill();
    }
  }

  function initParticles() {
    particlesArray = [];
    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle());
    }
  }

  function animateParticles() {
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
  }

  initParticles();
  animateParticles();

  function triggerScreenFlash(color) {
    // Flash visual hook
  }


  // ==========================================================================
  // SYSTÈME DE SUPPORTS D'ÉVALUATIONS DYNAMIQUES
  // ==========================================
  const ratingContainers = document.querySelectorAll(".rating-interactive");
  const likeButtons = document.querySelectorAll(".like-btn");

  const initialLikes = { snake: 28, shooter: 42, puzzle: 19 };
  const initialRatings = { 
    snake: { sum: 92, count: 20 }, 
    shooter: { sum: 188, count: 40 }, 
    puzzle: { sum: 72, count: 16 } 
  };

  customGames.forEach(game => {
    if (!initialLikes[game.id]) initialLikes[game.id] = 0;
    if (!initialRatings[game.id]) initialRatings[game.id] = { sum: 0, count: 0 };
  });

  const storedLikes = JSON.parse(localStorage.getItem("rf-likes")) || initialLikes;
  const storedRatings = JSON.parse(localStorage.getItem("rf-ratings")) || initialRatings;
  const userReviews = JSON.parse(localStorage.getItem("rf-user-reviews")) || {};
  const userLikes = JSON.parse(localStorage.getItem("rf-user-likes")) || {};

  function saveStorageData() {
    localStorage.setItem("rf-likes", JSON.stringify(storedLikes));
    localStorage.setItem("rf-ratings", JSON.stringify(storedRatings));
    localStorage.setItem("rf-user-reviews", JSON.stringify(userReviews));
    localStorage.setItem("rf-user-likes", JSON.stringify(userLikes));
    updateStatsDashboard();
  }

  function updateRatingsUI(gameId) {
    const data = storedRatings[gameId] || { sum: 0, count: 0 };
    const avg = data.count > 0 ? (data.sum / data.count).toFixed(1) : "0.0";
    
    const countEl = document.getElementById(`rating-count-${gameId}`);
    if (countEl) countEl.textContent = `(${avg}/5 - ${data.count} votes)`;

    const container = document.querySelector(`.rating-interactive[data-game-id="${gameId}"]`);
    if (container) {
      const userVal = userReviews[gameId] || 0;
      const stars = container.querySelectorAll(".star-icon");
      stars.forEach(star => {
        const val = parseInt(star.getAttribute("data-value"));
        if (val <= (userVal || Math.round(avg))) {
          star.classList.add("active");
        } else {
          star.classList.remove("active");
        }
      });
    }
  }

  ratingContainers.forEach(container => {
    const gameId = container.getAttribute("data-game-id");
    updateRatingsUI(gameId);

    const stars = container.querySelectorAll(".star-icon");
    stars.forEach(star => {
      star.addEventListener("click", () => {
        const value = parseInt(star.getAttribute("data-value"));
        const alreadyVoted = userReviews[gameId] > 0;
        
        if (!storedRatings[gameId]) storedRatings[gameId] = { sum: 0, count: 0 };

        if (alreadyVoted) {
          storedRatings[gameId].sum = storedRatings[gameId].sum - userReviews[gameId] + value;
        } else {
          storedRatings[gameId].sum += value;
          storedRatings[gameId].count += 1;
        }

        userReviews[gameId] = value;
        saveStorageData();
        updateRatingsUI(gameId);
        RetroSynth.playPoint();
      });

      star.addEventListener("mouseenter", () => {
        const value = parseInt(star.getAttribute("data-value"));
        stars.forEach(s => {
          const val = parseInt(s.getAttribute("data-value"));
          if (val <= value) s.classList.add("active");
          else s.classList.remove("active");
        });
      });

      star.addEventListener("mouseleave", () => {
        updateRatingsUI(gameId);
      });
    });
  });

  likeButtons.forEach(btn => {
    const gameId = btn.getAttribute("data-game-id");
    const countEl = document.getElementById(`like-count-${gameId}`);
    
    if (countEl) {
      countEl.textContent = storedLikes[gameId] || 0;
      if (userLikes[gameId]) btn.classList.add("liked");

      btn.addEventListener("click", () => {
        const liked = userLikes[gameId];
        if (!storedLikes[gameId]) storedLikes[gameId] = 0;

        if (liked) {
          storedLikes[gameId] -= 1;
          userLikes[gameId] = false;
          btn.classList.remove("liked");
        } else {
          storedLikes[gameId] += 1;
          userLikes[gameId] = true;
          btn.classList.add("liked");
          RetroSynth.playPoint();
        }
        
        countEl.textContent = storedLikes[gameId];
        saveStorageData();
      });
    }
  });


  // ==========================================================================
  // RETRO INTERFACE CONSOLE & RUNTIME DES JEUX ADMIN INJECTÉS
  // ==========================================================================
  const modal = document.getElementById("arcade-modal");
  const modalTitle = document.getElementById("modal-game-title");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const restartGameBtn = document.getElementById("restart-game-btn");
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const scoreValEl = document.getElementById("hud-score-val");
  const livesValEl = document.getElementById("hud-lives-val");
  const livesContainer = document.getElementById("hud-lives-container");
  const instructionsBox = document.getElementById("game-instructions");
  
  let currentGameId = "";
  let gameLoopId = null;
  let gameActive = false;
  let gameScore = 0;
  let gameLives = 3;
  let keys = {};

  if (canvas) {
    canvas.width = 640;
    canvas.height = 480;

    Object.defineProperty(window, "gameScore", {
      get: () => gameScore,
      set: (v) => { gameScore = v; scoreValEl.textContent = v; },
      configurable: true
    });
    Object.defineProperty(window, "gameLives", {
      get: () => gameLives,
      set: (v) => { gameLives = v; livesValEl.textContent = v; },
      configurable: true
    });
    Object.defineProperty(window, "gameOver", {
      get: () => gameOver,
      configurable: true
    });

    canvas.addEventListener("mousedown", (e) => {
      if (gameActive && currentGameId.startsWith("custom_")) {
        const rect = canvas.getBoundingClientRect();
        keys["click"] = true;
        keys["mouseX"] = ((e.clientX - rect.left) / rect.width) * canvas.width;
        keys["mouseY"] = ((e.clientY - rect.top) / rect.height) * canvas.height;
      }
    });

    canvas.addEventListener("touchstart", (e) => {
      if (gameActive && currentGameId.startsWith("custom_")) {
        const rect = canvas.getBoundingClientRect();
        keys["click"] = true;
        keys["mouseX"] = ((e.touches[0].clientX - rect.left) / rect.width) * canvas.width;
        keys["mouseY"] = ((e.touches[0].clientY - rect.top) / rect.height) * canvas.height;
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " "].includes(e.key) && gameActive) {
      e.preventDefault();
    }
    keys[e.key === " " ? "Space" : e.key] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key === " " ? "Space" : e.key] = false;
  });

  document.querySelectorAll(".play-game-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const gameId = btn.getAttribute("data-game");
      openArcadeConsole(gameId);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeArcadeConsole);
  if (restartGameBtn) {
    restartGameBtn.addEventListener("click", () => {
      RetroSynth.playSelect();
      initGame(currentGameId);
    });
  }

  function openArcadeConsole(gameId) {
    currentGameId = gameId;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    RetroSynth.playSelect();
    
    let titleText = "Jeu Retro";
    if (gameId === "snake") titleText = "Neon Snake";
    else if (gameId === "shooter") titleText = "Space Ranger";
    else if (gameId === "puzzle") titleText = "Memory Matrix";
    else {
      const match = customGames.find(g => g.id === gameId);
      if (match) titleText = match.name;
    }
    modalTitle.textContent = titleText;

    initGame(gameId);
  }

  function closeArcadeConsole() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    gameActive = false;
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    RetroSynth.playSelect();
  }

  let customInit = () => {};
  let customUpdate = () => {};
  let customDraw = () => {};

  function initGame(gameId) {
    gameScore = 0;
    scoreValEl.textContent = "0";
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameActive = true;
    keys = {};

    if (gameId === "snake") {
      livesContainer.style.display = "none";
      instructionsBox.innerHTML = `
        <div class="key-item"><span>Déplacement</span> <span class="keyboard-key">🡡 🡣 🡠 🡢</span></div>
        <div class="key-item"><span>Alternative</span> <span class="keyboard-key">Z S Q D</span></div>
        <div class="key-item"><span>Vitesse</span> <span style="color:var(--color-secondary);">Évolutive</span></div>
      `;
      setupSnakeGame();
    } else if (gameId === "shooter") {
      livesContainer.style.display = "block";
      gameLives = 3;
      livesValEl.textContent = "3";
      instructionsBox.innerHTML = `
        <div class="key-item"><span>Déplacement</span> <span class="keyboard-key">🡠 🡢</span></div>
        <div class="key-item"><span>Alternative</span> <span class="keyboard-key">Q D</span></div>
        <div class="key-item"><span>Tirer Laser</span> <span class="keyboard-key">Espace</span></div>
        <div class="key-item"><span>Souris</span> <span style="color:var(--color-secondary);">Clic / Drag</span></div>
      `;
      setupShooterGame();
    } else if (gameId === "puzzle") {
      livesContainer.style.display = "block";
      gameLives = 3;
      livesValEl.textContent = "3";
      instructionsBox.innerHTML = `
        <div class="key-item"><span>Matrice</span> <span style="color:var(--color-secondary);">Simon musical</span></div>
        <div class="key-item"><span>Sélection</span> <span class="keyboard-key">Clic Gauche</span></div>
      `;
      setupPuzzleGame();
    } else {
      const match = customGames.find(g => g.id === gameId);
      if (!match) {
        alert("Impossible de charger le jeu personnalisé.");
        closeArcadeConsole();
        return;
      }

      livesContainer.style.display = "block";
      gameLives = 3;
      livesValEl.textContent = "3";
      instructionsBox.innerHTML = `
        <div class="key-item"><span>Module</span> <span style="color:var(--color-secondary);">Code Admin</span></div>
        <div class="key-item"><span>Interaction</span> <span class="keyboard-key">Clic / Espace</span></div>
      `;

      try {
        const runCode = new Function("canvas", "ctx", "keys", "RetroSynth", "gameOver", `
          ${match.code}
          return {
            init: typeof init !== 'undefined' ? init : () => {},
            update: typeof update !== 'undefined' ? update : () => {},
            draw: typeof draw !== 'undefined' ? draw : () => {}
          };
        `);
        const gameHarness = runCode(canvas, ctx, keys, RetroSynth, gameOver);
        customInit = gameHarness.init;
        customUpdate = gameHarness.update;
        customDraw = gameHarness.draw;

        customInit();
        runCustomGameLoop();
      } catch (err) {
        console.error("Erreur d'exécution du jeu custom :", err);
        alert("Le script de votre jeu comporte des erreurs. Veuillez inspecter la console développeur.");
        closeArcadeConsole();
      }
    }
  }

  function runCustomGameLoop() {
    if (!gameActive) return;
    try {
      customUpdate();
      customDraw();
    } catch(e) {
      console.error("Crash dans la boucle de rendu :", e);
      gameActive = false;
      return;
    }
    gameLoopId = requestAnimationFrame(runCustomGameLoop);
  }

  // ==========================================
  // JEU 1 : NEON SNAKE LOGIC (Palette Bleu/Vert/Noir/Blanc)
  // ==========================================
  let snake, apple, snakeDir, gridCellSize, snakeSpeed, lastTickTime;

  function setupSnakeGame() {
    gridCellSize = 20;
    snake = [
      { x: 10 * gridCellSize, y: 12 * gridCellSize },
      { x: 9 * gridCellSize, y: 12 * gridCellSize },
      { x: 8 * gridCellSize, y: 12 * gridCellSize }
    ];
    snakeDir = { x: gridCellSize, y: 0 };
    spawnApple();
    snakeSpeed = 120;
    lastTickTime = performance.now();
    runSnakeGameLoop();
  }

  function spawnApple() {
    const cols = canvas.width / gridCellSize;
    const rows = canvas.height / gridCellSize;
    apple = {
      x: Math.floor(Math.random() * cols) * gridCellSize,
      y: Math.floor(Math.random() * rows) * gridCellSize
    };
    for (let segment of snake) {
      if (segment.x === apple.x && segment.y === apple.y) {
        spawnApple();
        break;
      }
    }
  }

  function runSnakeGameLoop() {
    if (!gameActive) return;
    
    if ((keys["ArrowUp"] || keys["z"] || keys["Z"]) && snakeDir.y === 0) snakeDir = { x: 0, y: -gridCellSize };
    else if ((keys["ArrowDown"] || keys["s"] || keys["S"]) && snakeDir.y === 0) snakeDir = { x: 0, y: gridCellSize };
    else if ((keys["ArrowLeft"] || keys["q"] || keys["Q"]) && snakeDir.x === 0) snakeDir = { x: -gridCellSize, y: 0 };
    else if ((keys["ArrowRight"] || keys["d"] || keys["D"]) && snakeDir.x === 0) snakeDir = { x: gridCellSize, y: 0 };

    const now = performance.now();
    if (now - lastTickTime > snakeSpeed) {
      updateSnake();
      lastTickTime = now;
    }

    drawSnakeGame();
    gameLoopId = requestAnimationFrame(runSnakeGameLoop);
  }

  function updateSnake() {
    const head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };

    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
      gameOver();
      return;
    }

    for (let segment of snake) {
      if (head.x === segment.x && head.y === segment.y) {
        gameOver();
        return;
      }
    }

    snake.unshift(head);

    if (head.x === apple.x && head.y === apple.y) {
      gameScore += 10;
      scoreValEl.textContent = gameScore;
      RetroSynth.playPoint();
      spawnApple();
      if (snakeSpeed > 50) snakeSpeed -= 3;
    } else {
      snake.pop();
    }
  }

  function drawSnakeGame() {
    ctx.fillStyle = "#000000"; /* Pure black */
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grille bleue haute visibilité
    ctx.strokeStyle = "rgba(0, 136, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += gridCellSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridCellSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Pomme blanche
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(apple.x + gridCellSize/2, apple.y + gridCellSize/2, gridCellSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Serpent vert
    snake.forEach((segment, idx) => {
      ctx.shadowBlur = idx === 0 ? 15 : 6;
      ctx.shadowColor = idx === 0 ? "var(--color-secondary)" : "var(--color-primary)";
      ctx.fillStyle = idx === 0 ? "var(--color-secondary)" : "var(--color-primary)";
      
      ctx.beginPath();
      ctx.roundRect(segment.x + 1, segment.y + 1, gridCellSize - 2, gridCellSize - 2, 4);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  // ==========================================
  // JEU 2 : SPACE RANGER LOGIC (Palette Bleu/Vert/Noir/Blanc)
  // ==========================================
  let playerX, lasers, enemies, stars, enemySpawnRate, lastEnemySpawn, lastLaserShot;

  function setupShooterGame() {
    playerX = canvas.width / 2;
    lasers = [];
    enemies = [];
    stars = [];
    enemySpawnRate = 1200;
    lastEnemySpawn = 0;
    lastLaserShot = 0;

    for (let i = 0; i < 30; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 1
      });
    }

    function getCanvasCoordinates(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      return ((clientX - rect.left) / rect.width) * canvas.width;
    }

    canvas.addEventListener("mousemove", (e) => {
      if (gameActive && currentGameId === "shooter") playerX = getCanvasCoordinates(e);
    });

    canvas.addEventListener("mousedown", () => {
      if (gameActive && currentGameId === "shooter") shootLaser();
    });

    canvas.addEventListener("touchstart", (e) => {
      if (gameActive && currentGameId === "shooter") {
        playerX = getCanvasCoordinates(e);
        shootLaser();
      }
    });

    runShooterGameLoop(0);
  }

  function shootLaser() {
    const now = performance.now();
    if (now - lastLaserShot > 250) {
      lasers.push({ x: playerX, y: canvas.height - 40 });
      RetroSynth.playNote(800, 0.08);
      lastLaserShot = now;
    }
  }

  function runShooterGameLoop(timestamp) {
    if (!gameActive) return;
    updateShooter(timestamp);
    drawShooterGame();
    gameLoopId = requestAnimationFrame(runShooterGameLoop);
  }

  function updateShooter(timestamp) {
    if (keys["ArrowLeft"] || keys["q"] || keys["Q"]) playerX -= 6;
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) playerX += 6;
    if (keys["Space"]) shootLaser();

    playerX = Math.max(20, Math.min(canvas.width - 20, playerX));

    stars.forEach(star => {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });

    lasers.forEach((laser, idx) => {
      laser.y -= 8;
      if (laser.y < 0) lasers.splice(idx, 1);
    });

    if (timestamp - lastEnemySpawn > enemySpawnRate) {
      enemies.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -20,
        width: 32,
        height: 24,
        speed: Math.random() * 1.5 + 1.5
      });
      lastEnemySpawn = timestamp;
      if (enemySpawnRate > 500) enemySpawnRate -= 10;
    }

    enemies.forEach((enemy, eIdx) => {
      enemy.y += enemy.speed;

      if (enemy.y > canvas.height) {
        enemies.splice(eIdx, 1);
        loseLife();
        return;
      }

      lasers.forEach((laser, lIdx) => {
        let dx = Math.abs(laser.x - enemy.x);
        let dy = Math.abs(laser.y - enemy.y);
        if (dx < enemy.width / 2 + 3 && dy < enemy.height / 2 + 5) {
          enemies.splice(eIdx, 1);
          lasers.splice(lIdx, 1);
          gameScore += 25;
          scoreValEl.textContent = gameScore;
          RetroSynth.playHit();
        }
      });

      let pDist = Math.abs(enemy.x - playerX);
      if (pDist < 25 && enemy.y > canvas.height - 50) {
        enemies.splice(eIdx, 1);
        loseLife();
        RetroSynth.playHit();
      }
    });
  }

  function loseLife() {
    gameLives--;
    livesValEl.textContent = gameLives;
    if (gameLives <= 0) {
      gameOver();
    } else {
      RetroSynth.playDefeat();
    }
  }

  function drawShooterGame() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    stars.forEach(star => {
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Vaisseau vert
    ctx.fillStyle = "var(--color-secondary)";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "var(--color-secondary)";
    ctx.beginPath();
    ctx.moveTo(playerX, canvas.height - 42);
    ctx.lineTo(playerX - 16, canvas.height - 16);
    ctx.lineTo(playerX + 16, canvas.height - 16);
    ctx.closePath();
    ctx.fill();

    // Flamme bleue
    ctx.fillStyle = "var(--color-primary)";
    ctx.shadowColor = "var(--color-primary)";
    ctx.beginPath();
    ctx.moveTo(playerX - 6, canvas.height - 16);
    ctx.lineTo(playerX, canvas.height - 6 - Math.random()*8);
    ctx.lineTo(playerX + 6, canvas.height - 16);
    ctx.closePath();
    ctx.fill();

    // Lasers verts
    ctx.fillStyle = "var(--color-secondary)";
    ctx.shadowColor = "var(--color-secondary)";
    lasers.forEach(laser => {
      ctx.fillRect(laser.x - 2, laser.y, 4, 15);
    });

    // Vaisseaux ennemis blancs à lueur bleue (Pas de rouge !)
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "var(--color-primary)";
    enemies.forEach(enemy => {
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y + 12);
      ctx.lineTo(enemy.x - 16, enemy.y - 12);
      ctx.lineTo(enemy.x + 16, enemy.y - 12);
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  // ==========================================
  // JEU 3 : MEMORY MATRIX LOGIC (Palette Bleu/Vert/Noir/Blanc)
  // ==========================================
  let sequence, playerSequence, matrixSize, matrixLevel, isShowingSequence, gridBoxes;

  function setupPuzzleGame() {
    matrixLevel = 1;
    sequence = [];
    playerSequence = [];
    isShowingSequence = false;
    gridBoxes = [];

    startPuzzleTurn();
    canvas.addEventListener("click", handlePuzzleClick);
  }

  function startPuzzleTurn() {
    isShowingSequence = true;
    playerSequence = [];
    matrixSize = matrixLevel <= 3 ? 2 : 3;
    buildMatrixGrid();
    sequence.push(Math.floor(Math.random() * gridBoxes.length));
    playPuzzleSequence();
  }

  function buildMatrixGrid() {
    gridBoxes = [];
    const size = matrixSize;
    const padding = 20;
    const containerWidth = 320;
    const boxWidth = (containerWidth - (padding * (size - 1))) / size;

    const startX = (canvas.width - containerWidth) / 2;
    const startY = (canvas.height - containerWidth) / 2;

    let idx = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        gridBoxes.push({
          id: idx++,
          x: startX + c * (boxWidth + padding),
          y: startY + r * (boxWidth + padding),
          width: boxWidth,
          height: boxWidth,
          active: false,
          color: idx % 2 === 0 ? "var(--color-primary)" : "var(--color-secondary)"
        });
      }
    }
  }

  async function playPuzzleSequence() {
    for (let i = 0; i < sequence.length; i++) {
      if (!gameActive) return;
      await delay(400);
      const boxIdx = sequence[i];
      flashGridBox(boxIdx);
      await delay(450);
    }
    isShowingSequence = false;
  }

  function flashGridBox(idx) {
    if (!gridBoxes[idx]) return;
    gridBoxes[idx].active = true;
    const freqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    RetroSynth.playNote(freqs[idx % freqs.length], 0.35);

    setTimeout(() => {
      if (gridBoxes[idx]) gridBoxes[idx].active = false;
    }, 300);
  }

  function handlePuzzleClick(e) {
    if (!gameActive || currentGameId !== "puzzle" || isShowingSequence) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    gridBoxes.forEach((box, idx) => {
      if (clickX >= box.x && clickX <= box.x + box.width && clickY >= box.y && clickY <= box.y + box.height) {
        flashGridBox(idx);
        playerSequence.push(idx);
        validatePuzzleInput();
      }
    });
  }

  function validatePuzzleInput() {
    const currentStep = playerSequence.length - 1;

    if (playerSequence[currentStep] !== sequence[currentStep]) {
      losePuzzleLife();
      return;
    }

    if (playerSequence.length === sequence.length) {
      gameScore += matrixLevel * 50;
      scoreValEl.textContent = gameScore;
      matrixLevel++;
      RetroSynth.playVictory();

      isShowingSequence = true;
      setTimeout(() => {
        if (gameActive) startPuzzleTurn();
      }, 1000);
    }
  }

  function losePuzzleLife() {
    gameLives--;
    livesValEl.textContent = gameLives;
    
    if (gameLives <= 0) {
      gameOver();
    } else {
      RetroSynth.playDefeat();
      isShowingSequence = true;
      setTimeout(() => {
        if (gameActive) {
          playerSequence = [];
          playPuzzleSequence();
        }
      }, 1000);
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function runPuzzleGameLoop() {
    if (!gameActive) return;
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    gridBoxes.forEach(box => {
      ctx.fillStyle = box.active ? box.color : "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = box.active ? "#ffffff" : "rgba(255,255,255,0.1)";

      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.width, box.height, 12);
      ctx.fill();
      ctx.stroke();
    });

    gameLoopId = requestAnimationFrame(runPuzzleGameLoop);
  }

  // --- FIN DE PARTIE ---
  function gameOver() {
    gameActive = false;
    RetroSynth.playDefeat();
    
    const savedScores = JSON.parse(localStorage.getItem("rf-highscores")) || {};
    if (!savedScores[currentGameId] || gameScore > savedScores[currentGameId]) {
      savedScores[currentGameId] = gameScore;
      localStorage.setItem("rf-highscores", JSON.stringify(savedScores));
    }

    setTimeout(() => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "var(--color-secondary)";
      ctx.font = "bold 38px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PARTIE TERMINÉE", canvas.width / 2, canvas.height / 2 - 20);

      ctx.fillStyle = "white";
      ctx.font = "20px sans-serif";
      ctx.fillText(`SCORE FINAL : ${gameScore}`, canvas.width / 2, canvas.height / 2 + 25);
      
      const best = savedScores[currentGameId] || gameScore;
      ctx.fillStyle = "var(--color-primary)";
      ctx.font = "16px sans-serif";
      ctx.fillText(`MEILLEUR RECORD : ${best}`, canvas.width / 2, canvas.height / 2 + 60);

      updateStatsDashboard();
    }, 200);
  }


  // ==========================================================================
  // TÉLÉCHARGEMENT DIRECT ET COMPILATION HORS-LIGNE
  // ==========================================
  const downloadButtons = document.querySelectorAll(".download-game-btn");
  const offlineLibrary = JSON.parse(localStorage.getItem("rf-library")) || {};

  customGames.forEach(game => {
    if (typeof offlineLibrary[game.id] === 'undefined') offlineLibrary[game.id] = false;
  });

  function updateLibraryUI() {
    const listContainer = document.getElementById("installed-list-container");
    const emptyMsg = document.getElementById("empty-library-msg");
    const downloadedCountEl = document.getElementById("stats-downloaded-count");
    
    if (!listContainer) return; // Si exécuté sur une page sans bibliothèque

    let downloadedCount = 0;
    listContainer.innerHTML = "";

    const gamesData = {
      snake: { name: "Neon Snake", tag: "Arcade", size: "28 KB", color: "var(--color-primary)" },
      shooter: { name: "Space Ranger", tag: "Tir Spatial", size: "44 KB", color: "var(--color-secondary)" },
      puzzle: { name: "Memory Matrix", tag: "Réflexion", size: "32 KB", color: "var(--color-accent)" }
    };

    customGames.forEach(g => {
      gamesData[g.id] = { name: g.name, tag: "Personnalisé", size: "36 KB", color: "var(--color-primary)" };
    });

    Object.keys(offlineLibrary).forEach(gameId => {
      if (offlineLibrary[gameId]) {
        downloadedCount++;
        const g = gamesData[gameId] || { name: "Jeu personnalisé", tag: "Personnalisé", size: "36 KB", color: "var(--color-primary)" };

        const item = document.createElement("div");
        item.className = "installed-item";
        item.innerHTML = `
          <div class="installed-meta">
            <div class="installed-thumb">
              <svg viewBox="0 0 24 24" fill="${g.color}">
                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div>
              <div class="installed-name">${g.name}</div>
              <div class="installed-size">Poids en mémoire : ${g.size} (Stockage Local)</div>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 1.5rem;">
            <div class="storage-bar-wrapper">
              <div class="storage-bar-header">
                <span>Disponible hors-ligne</span>
                <span>100%</span>
              </div>
              <div class="storage-bar-track">
                <div class="storage-bar-fill" style="width: 100%;"></div>
              </div>
            </div>
            
            <button class="btn btn-secondary btn-sm play-game-btn" data-game="${gameId}">Jouer</button>
          </div>
        `;
        listContainer.appendChild(item);
        
        item.querySelector(".play-game-btn").addEventListener("click", () => {
          openArcadeConsole(gameId);
        });
      }
    });

    const totalGames = 3 + customGames.length;

    if (downloadedCount > 0) {
      if (emptyMsg) emptyMsg.style.display = "none";
    } else {
      if (emptyMsg) emptyMsg.style.display = "block";
    }

    downloadedCountEl.textContent = `${downloadedCount} / ${totalGames}`;
  }

  downloadButtons.forEach(btn => {
    const gameId = btn.getAttribute("data-game");
    btn.addEventListener("click", () => {
      compileAndDownloadOfflineGame(gameId, btn);
    });
  });

  function compileAndDownloadOfflineGame(gameId, buttonElement) {
    buttonElement.classList.add("loading");
    buttonElement.textContent = "Téléchargement...";

    RetroSynth.playSelect();
    
    setTimeout(() => {
      const standaloneHTML = generateStandaloneGameHTML(gameId);
      
      const blob = new Blob([standaloneHTML], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      
      const tempLink = document.createElement("a");
      tempLink.href = url;
      tempLink.download = `RetroForge_${gameId}_offline.html`;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(url);

      offlineLibrary[gameId] = true;
      localStorage.setItem("rf-library", JSON.stringify(offlineLibrary));
      
      buttonElement.classList.remove("loading");
      buttonElement.textContent = "Télécharger";
      
      updateLibraryUI();
      RetroSynth.playVictory();
    }, 1200);
  }

  function generateStandaloneGameHTML(gameId) {
    let gameTitle = "Jeu RetroForge";
    let initFunctionBody = "";
    let updateFunctionBody = "";
    let drawFunctionBody = "";
    let controlsHTML = "";
    let extraVars = "";

    if (gameId.startsWith("custom_")) {
      const match = customGames.find(g => g.id === gameId);
      if (match) {
        gameTitle = match.name + " Standalone";
        controlsHTML = `<div>Code injecté par le développeur. Utilisez les boutons tactiles ou le clavier.</div>`;
        
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>RetroForge - ${gameTitle} (Offline)</title>
  <style>
    body { background: #000000; color: #ffffff; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .container { background: #070913; border: 3px solid #0088ff; border-radius: 20px; box-shadow: 0 0 30px rgba(0, 136, 255, 0.4); padding: 20px; text-align: center; width: 600px; }
    canvas { background: #000000; border: 2.5px solid #0088ff; border-radius: 8px; display: block; margin: 15px auto; }
    .hud { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; }
    .btn { background: linear-gradient(135deg, #0088ff, #00e676); color: black; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${gameTitle} 🎮</h1>
    <div class="hud">
      <div>SCORE : <span id="score-val">0</span></div>
      <div>VIES : <span id="lives-val">3</span></div>
    </div>
    <canvas id="standalone-canvas" width="600" height="450"></canvas>
    <button class="btn" onclick="resetGame()">Recommencer la partie</button>
  </div>

  <script>
    const canvas = document.getElementById("standalone-canvas");
    const ctx = canvas.getContext("2d");
    const scoreVal = document.getElementById("score-val");
    const livesVal = document.getElementById("lives-val");

    let gameActive = true;
    let gameScore = 0;
    let gameLives = 3;
    let keys = {};

    const RetroSynth = {
      ctx: new (window.AudioContext || window.webkitAudioContext)(),
      playNote(freq, dur) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine"; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(); osc.stop(this.ctx.currentTime + dur);
        } catch(e){}
      },
      playPoint() { this.playNote(520, 0.15); },
      playDefeat() { this.playNote(150, 0.3); }
    };

    Object.defineProperty(window, "gameScore", {
      get: () => gameScore,
      set: (v) => { gameScore = v; scoreVal.textContent = v; }
    });
    Object.defineProperty(window, "gameLives", {
      get: () => gameLives,
      set: (v) => { gameLives = v; livesVal.textContent = v; }
    });

    window.addEventListener("keydown", (e) => { keys[e.key === " " ? "Space" : e.key] = true; });
    window.addEventListener("keyup", (e) => { keys[e.key === " " ? "Space" : e.key] = false; });
    
    canvas.addEventListener("mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();
      keys["click"] = true;
      keys["mouseX"] = ((e.clientX - rect.left) / rect.width) * canvas.width;
      keys["mouseY"] = ((e.clientY - rect.top) / rect.height) * canvas.height;
    });

    ${match.code}

    function gameOver() {
      gameActive = false;
      ctx.fillStyle = "rgba(0,0,0,0.95)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00e676"; ctx.font = "bold 32px sans-serif"; ctx.fillText("PARTIE TERMINÉE", canvas.width/2 - 140, canvas.height/2);
    }

    function resetGame() {
      gameScore = 0; gameLives = 3; gameActive = true;
      scoreVal.textContent = "0"; livesVal.textContent = "3";
      init();
    }

    function loop() { if (gameActive) { update(); draw(); } requestAnimationFrame(loop); }
    
    init(); loop();
  </script>
</body>
</html>
        `;
      }
    }

    if (gameId === "snake") {
      gameTitle = "Neon Snake Standalone";
      extraVars = `let snake, apple, snakeDir, gridCellSize, snakeSpeed, lastTickTime;`;
      initFunctionBody = `
        gridCellSize = 20;
        snake = [
          { x: 10 * gridCellSize, y: 12 * gridCellSize },
          { x: 9 * gridCellSize, y: 12 * gridCellSize },
          { x: 8 * gridCellSize, y: 12 * gridCellSize }
        ];
        snakeDir = { x: gridCellSize, y: 0 };
        spawnApple();
        snakeSpeed = 120;
        lastTickTime = performance.now();
        function spawnApple() {
          const cols = canvas.width / gridCellSize;
          const rows = canvas.height / gridCellSize;
          apple = { x: Math.floor(Math.random() * cols) * gridCellSize, y: Math.floor(Math.random() * rows) * gridCellSize };
        }
      `;
      updateFunctionBody = `
        if ((keys["ArrowUp"] || keys["z"] || keys["Z"]) && snakeDir.y === 0) snakeDir = { x: 0, y: -gridCellSize };
        else if ((keys["ArrowDown"] || keys["s"] || keys["S"]) && snakeDir.y === 0) snakeDir = { x: 0, y: gridCellSize };
        else if ((keys["ArrowLeft"] || keys["q"] || keys["Q"]) && snakeDir.x === 0) snakeDir = { x: -gridCellSize, y: 0 };
        else if ((keys["ArrowRight"] || keys["d"] || keys["D"]) && snakeDir.x === 0) snakeDir = { x: gridCellSize, y: 0 };

        const now = performance.now();
        if (now - lastTickTime > snakeSpeed) {
          const head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };
          if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) { gameOver(); return; }
          for (let segment of snake) { if (head.x === segment.x && head.y === segment.y) { gameOver(); return; } }
          snake.unshift(head);
          if (head.x === apple.x && head.y === apple.y) { gameScore += 10; spawnApple(); if (snakeSpeed > 50) snakeSpeed -= 3; }
          else { snake.pop(); }
          lastTickTime = now;
        }
      `;
      drawFunctionBody = `
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(apple.x + gridCellSize/2, apple.y + gridCellSize/2, gridCellSize/2 - 2, 0, Math.PI * 2); ctx.fill();
        snake.forEach((segment, idx) => {
          ctx.fillStyle = idx === 0 ? "#00e676" : "#0088ff";
          ctx.beginPath(); ctx.roundRect(segment.x + 1, segment.y + 1, gridCellSize - 2, gridCellSize - 2, 4); ctx.fill();
        });
      `;
      controlsHTML = `<div>Utilisez <b>Flèches directionnelles</b> ou <b>Z-Q-S-D</b>.</div>`;
    } else if (gameId === "shooter") {
      gameTitle = "Space Ranger Standalone";
      extraVars = `let playerX, lasers, enemies, stars, enemySpawnRate, lastEnemySpawn, lastLaserShot;`;
      initFunctionBody = `
        playerX = canvas.width / 2; lasers = []; enemies = []; stars = []; enemySpawnRate = 1200; lastEnemySpawn = 0; lastLaserShot = 0;
        for (let i = 0; i < 30; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: Math.random() * 2 + 1 });
      `;
      updateFunctionBody = `
        if (keys["ArrowLeft"] || keys["q"] || keys["Q"]) playerX -= 6;
        if (keys["ArrowRight"] || keys["d"] || keys["D"]) playerX += 6;
        if (keys["Space"]) {
          const now = performance.now();
          if (now - lastLaserShot > 250) { lasers.push({ x: playerX, y: canvas.height - 40 }); lastLaserShot = now; }
        }
        playerX = Math.max(20, Math.min(canvas.width - 20, playerX));
        stars.forEach(star => { star.y += star.speed; if (star.y > canvas.height) { star.y = 0; star.x = Math.random() * canvas.width; } });
        lasers.forEach((laser, idx) => { laser.y -= 8; if (laser.y < 0) lasers.splice(idx, 1); });
        const timestamp = performance.now();
        if (timestamp - lastEnemySpawn > enemySpawnRate) {
          enemies.push({ x: Math.random() * (canvas.width - 40) + 20, y: -20, speed: Math.random() * 1.5 + 1.5 });
          lastEnemySpawn = timestamp;
        }
        enemies.forEach((enemy, eIdx) => {
          enemy.y += enemy.speed;
          if (enemy.y > canvas.height) { enemies.splice(eIdx, 1); gameLives--; if(gameLives<=0) gameOver(); return; }
          lasers.forEach((laser, lIdx) => {
            if (Math.abs(laser.x - enemy.x) < 20 && Math.abs(laser.y - enemy.y) < 20) { enemies.splice(eIdx, 1); lasers.splice(lIdx, 1); gameScore += 25; }
          });
        });
      `;
      drawFunctionBody = `
        ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white"; stars.forEach(star => ctx.fillRect(star.x, star.y, 2, 2));
        ctx.fillStyle = "#0088ff"; ctx.beginPath(); ctx.moveTo(playerX, canvas.height - 40); ctx.lineTo(playerX - 15, canvas.height - 15); ctx.lineTo(playerX + 15, canvas.height - 15); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#00e676"; lasers.forEach(laser => ctx.fillRect(laser.x - 2, laser.y, 4, 15));
        ctx.fillStyle = "#ffffff"; enemies.forEach(enemy => { ctx.beginPath(); ctx.moveTo(enemy.x, enemy.y + 10); ctx.lineTo(enemy.x - 12, enemy.y - 10); ctx.lineTo(enemy.x + 12, enemy.y - 10); ctx.closePath(); ctx.fill(); });
      `;
      controlsHTML = `<div>Utilisez <b>Gauches/Droites</b> ou <b>Q-D</b>, et <b>Espace</b> pour tirer.</div>`;
    } else {
      gameTitle = "Memory Matrix Standalone";
      extraVars = `let sequence, playerSequence, gridBoxes, matrixLevel;`;
      initFunctionBody = `
        matrixLevel = 1; sequence = []; gridBoxes = []; startNewTurn();
        function startNewTurn() {
          playerSequence = []; gridBoxes = [];
          const size = matrixLevel <= 3 ? 2 : 3;
          const containerWidth = 300; const boxWidth = containerWidth / size - 10;
          const startX = (canvas.width - containerWidth)/2; const startY = (canvas.height - containerWidth)/2;
          let idx = 0;
          for (let r=0; r<size; r++) {
            for (let c=0; c<size; c++) { gridBoxes.push({ id: idx++, x: startX + c*(boxWidth+10), y: startY + r*(boxWidth+10), width: boxWidth, height: boxWidth, active: false }); }
          }
          sequence.push(Math.floor(Math.random() * gridBoxes.length)); playSequence();
        }
        async function playSequence() {
          for (let i = 0; i < sequence.length; i++) {
            await new Promise(r => setTimeout(r, 400));
            const idx = sequence[i];
            if (gridBoxes[idx]) { gridBoxes[idx].active = true; setTimeout(() => { if (gridBoxes[idx]) gridBoxes[idx].active = false; }, 300); }
            await new Promise(r => setTimeout(r, 450));
          }
        }
      `;
      updateFunctionBody = ``;
      drawFunctionBody = `
        ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white"; ctx.font = "16px Arial"; ctx.fillText("Matrix Level: " + matrixLevel, canvas.width/2 - 50, 40);
        gridBoxes.forEach(box => {
          ctx.fillStyle = box.active ? "#0088ff" : "rgba(255,255,255,0.05)"; ctx.strokeStyle = "#0088ff";
          ctx.fillRect(box.x, box.y, box.width, box.height); ctx.strokeRect(box.x, box.y, box.width, box.height);
        });
      `;
      controlsHTML = `<div>Cliquez sur les dalles de la matrice.</div>`;
    }

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>RetroForge - ${gameTitle} (Offline)</title>
  <style>
    body { background: #000000; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .container { background: #070913; border: 3px solid #0088ff; border-radius: 20px; box-shadow: 0 0 30px rgba(0, 136, 255, 0.4); padding: 20px; text-align: center; width: 100%; max-width: 660px; }
    h1 { margin-bottom: 5px; color: #00e676; }
    canvas { background: #000000; border: 2px solid #0088ff; border-radius: 8px; display: block; margin: 15px auto; max-width: 100%; }
    .hud { display: flex; justify-content: space-between; padding: 0 10px; font-weight: bold; font-size: 1.1rem; }
    .btn { background: linear-gradient(135deg, #0088ff, #00e676); color: black; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 15px; }
    .btn:hover { transform: scale(1.05); }
    .instructions { background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; margin-top: 15px; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${gameTitle} 🎮</h1>
    <p>Version autonome hors-ligne fournie par RetroForge Arcade</p>
    
    <div class="hud">
      <div>SCORE : <span id="score-val">0</span></div>
      <div>VIES : <span id="lives-val">3</span></div>
    </div>

    <canvas id="standalone-canvas" width="600" height="450"></canvas>
    
    <div class="instructions">
      ${controlsHTML}
    </div>

    <button class="btn" onclick="resetGame()">Recommencer la partie</button>
  </div>

  <script>
    const canvas = document.getElementById("standalone-canvas");
    const ctx = canvas.getContext("2d");
    const scoreVal = document.getElementById("score-val");
    const livesVal = document.getElementById("lives-val");

    let gameActive = true;
    let gameScore = 0;
    let gameLives = 3;
    let keys = {};
    
    ${extraVars}

    window.addEventListener("keydown", (e) => { keys[e.key === " " ? "Space" : e.key] = true; });
    window.addEventListener("keyup", (e) => { keys[e.key === " " ? "Space" : e.key] = false; });

    function init() {
      gameScore = 0; gameLives = 3; gameActive = true; scoreVal.textContent = "0"; livesVal.textContent = "3"; keys = {};
      ${initFunctionBody}
    }

    function update() { ${updateFunctionBody} }
    function draw() { ${drawFunctionBody} }

    function gameOver() {
      gameActive = false;
      ctx.fillStyle = "rgba(0,0,0,0.95)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00e676"; ctx.font = "bold 32px sans-serif"; ctx.fillText("PARTIE TERMINÉE", canvas.width/2 - 140, canvas.height/2);
    }

    function resetGame() { init(); }

    if ("${gameId}" === "puzzle") {
      canvas.addEventListener("click", (e) => {
        if (!gameActive) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
        gridBoxes.forEach((box, idx) => {
          if (clickX >= box.x && clickX <= box.x + box.width && clickY >= box.y && clickY <= box.y + box.height) {
            box.active = true; setTimeout(() => { box.active = false; }, 200); playerSequence.push(idx);
            const step = playerSequence.length - 1;
            if (playerSequence[step] !== sequence[step]) { gameLives--; livesVal.textContent = gameLives; if (gameLives<=0) gameOver(); }
            else if (playerSequence.length === sequence.length) { gameScore += matrixLevel * 50; scoreVal.textContent = gameScore; matrixLevel++; setTimeout(() => { startNewTurn(); }, 600); }
          }
        });
      });
    }

    function gameLoop() { if (gameActive) { update(); draw(); } requestAnimationFrame(gameLoop); }

    init(); gameLoop();
  </script>
</body>
</html>
    `;
  }


  // ==========================================================================
  // GESTION DES RECHERCHES ET FILTRES DANS LA GRILLE DE JEUX
  // ==========================================================================
  const searchInput = document.getElementById("search-input");
  const filterChips = document.querySelectorAll(".filter-chip");

  function filterGames() {
    const query = searchInput.value.toLowerCase().trim();
    const activeChip = document.querySelector(".filter-chip.active");
    const activeCategory = activeChip ? activeChip.getAttribute("data-category") : "all";
    const deletedDefaults = JSON.parse(localStorage.getItem("rf-deleted-defaults")) || [];
    
    const allGameCards = document.querySelectorAll(".game-card");

    allGameCards.forEach(card => {
      const gameId = card.id.replace("card-", "");
      if (deletedDefaults.includes(gameId)) {
        card.style.display = "none";
        return;
      }

      const title = card.querySelector("h3").textContent.toLowerCase();
      const desc = card.querySelector(".game-description").textContent.toLowerCase();
      const genre = card.getAttribute("data-genre");

      const matchesSearch = title.includes(query) || desc.includes(query);
      const matchesCategory = activeCategory === "all" || genre === activeCategory;

      if (matchesSearch && matchesCategory) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterGames);
  }

  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      RetroSynth.playSelect();
      filterGames();
    });
  });


  // ==========================================================================
  // TABLEAU DE BORD STATISTIQUES GLOBAL (LIVELINK AVEC LES JEUX)
  // ==========================================================================
  function updateStatsDashboard() {
    const likesCountEl = document.getElementById("stats-likes-count");
    const highscoreSumEl = document.getElementById("stats-highscore-sum");

    if (likesCountEl) {
      const activeLikes = Object.values(userLikes).filter(Boolean).length;
      likesCountEl.textContent = activeLikes;
    }

    if (highscoreSumEl) {
      const savedScores = JSON.parse(localStorage.getItem("rf-highscores")) || {};
      const sum = Object.values(savedScores).reduce((a, b) => a + b, 0);
      highscoreSumEl.textContent = sum;
    }
  }


  // ==========================================================================
  // INITIALISATION GLOBALE DE L'INTERFACE AU CHARGEMENT
  // ==========================================================================
  updateLibraryUI();
  updateStatsDashboard();
});
