class MinecraftGame {
  constructor() {
    // Check if Three.js is loaded
    if (typeof THREE === "undefined") {
      alert("Three.js failed to load! Please check your internet connection.");
      return;
    }

    console.log("Three.js version:", THREE.REVISION);

    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById("gameCanvas"),
      antialias: true,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87ceeb); // Sky blue
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Make sure canvas is visible and fullscreen
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.zIndex = "1";

    // Force canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    console.log("Three.js renderer initialized successfully");
    console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
    console.log("Canvas style:", canvas.style.width, "x", canvas.style.height);

    // Set up camera position and rotation
    this.camera.position.set(0, 35, 0); // Start at spawn position
    this.camera.lookAt(0, 35, -10); // Look forward (negative Z direction)

    console.log("Camera positioned at:", this.camera.position);
    console.log("Camera rotation:", this.camera.rotation);
    console.log("Camera matrix:", this.camera.matrix);

    // Add proper lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Soft white light
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    console.log("Lighting added to scene");

    // Add a test cube to verify Three.js works - position it right in front of camera
    const testGeometry = new THREE.BoxGeometry(2, 2, 2);
    const testMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(0, 35, -5); // Right in front of player, same Y level
    this.scene.add(testCube);
    console.log("Added test red cube at (0, 35, -5)");

    // Also add a giant green cube that should be impossible to miss
    const giantGeometry = new THREE.BoxGeometry(10, 10, 10);
    const giantMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });
    const giantCube = new THREE.Mesh(giantGeometry, giantMaterial);
    giantCube.position.set(0, 25, -20); // Big cube further out
    this.scene.add(giantCube);
    console.log("Added giant green wireframe cube at (0, 25, -20)");

    // Add a blue cube to the right
    const blueGeometry = new THREE.BoxGeometry(3, 3, 3);
    const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const blueCube = new THREE.Mesh(blueGeometry, blueMaterial);
    blueCube.position.set(10, 35, 0); // To the right of player
    this.scene.add(blueCube);
    console.log("Added blue cube at (10, 35, 0)");

    console.log(
      "Total objects in scene after test cubes:",
      this.scene.children.length
    );

    // Initialize socket connection
    this.socket = io();
    this.setupSocketEvents();

    // Game state
    this.playerId = null;
    this.players = {};
    this.blocks = {};
    this.blockMeshes = {};
    this.playerMeshes = {};
    this.selectedBlock = "grass";

    // Controls
    this.controls = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      sprint: false,
    };

    // Camera/Player position
    this.playerPosition = new THREE.Vector3(0, 35, 0);
    this.velocity = new THREE.Vector3();
    this.isPointerLocked = false;
    this.chatVisible = false;

    // Mouse look
    this.euler = new THREE.Euler(0, 0, 0, "YXZ");
    this.PI_2 = Math.PI / 2;

    // Materials
    this.materials = this.createMaterials();

    // Setup
    this.setupLighting();
    this.setupInput();
    this.setupUI();
    this.setupCamera();

    // Raycaster for block interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    console.log("Game initialized successfully");

    // Force an immediate render to test
    console.log("Forcing immediate test render...");
    this.renderer.render(this.scene, this.camera);

    // Start game loop
    this.clock = new THREE.Clock();
    this.gameLoop();
  }

  createMaterials() {
    // Create simple colored materials for now
    return {
      grass: new THREE.MeshLambertMaterial({ color: 0x4caf50 }),
      dirt: new THREE.MeshLambertMaterial({ color: 0x8d6e63 }),
      stone: new THREE.MeshLambertMaterial({ color: 0x9e9e9e }),
      wood: new THREE.MeshLambertMaterial({ color: 0x6d4c41 }),
      leaves: new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
      player: new THREE.MeshLambertMaterial({ color: 0xff5722 }),
    };
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);
  }

  setupCamera() {
    this.camera.position.copy(this.playerPosition);
    // Look down slightly to see blocks
    this.euler.x = -0.3; // Look down 17 degrees
    this.camera.quaternion.setFromEuler(this.euler);
    console.log("Camera setup at position:", this.camera.position);
  }

  setupSocketEvents() {
    this.socket.on("gameState", (data) => {
      this.playerId = data.playerId;
      this.players = data.players;
      this.blocks = data.blocks;

      // Set camera to spawn position
      if (this.players[this.playerId]) {
        this.playerPosition.set(
          this.players[this.playerId].x,
          this.players[this.playerId].y,
          this.players[this.playerId].z
        );
        this.camera.position.copy(this.playerPosition);
      }

      console.log("Connected as player:", this.playerId);
      console.log("Loaded", Object.keys(this.blocks).length, "blocks");
      console.log("Camera position:", this.playerPosition);

      // Skip automatic test blocks for now to improve performance
      // Focus on movement first
      console.log("Skipping test block creation for better performance");

      // Create block meshes (but there are none yet)
      this.createBlockMeshes();
      this.updatePlayerList();

      // Add welcome message
      this.addChatMessage(
        "System",
        "Welcome to Minecraft! CLICK THE CANVAS FIRST to enable movement!",
        "#ff0"
      );
      this.addChatMessage(
        "System",
        "Use WASD to move, mouse to look around.",
        "#0ff"
      );
      this.addChatMessage(
        "System",
        "Left click to destroy blocks, right click to place them.",
        "#0ff"
      );
    });

    this.socket.on("playerJoined", (player) => {
      this.players[player.id] = player;
      this.createPlayerMesh(player);
      this.updatePlayerList();
      this.addChatMessage(
        "System",
        `${player.username} joined the game`,
        "#0f0"
      );
    });

    this.socket.on("playerLeft", (playerId) => {
      if (this.players[playerId]) {
        this.addChatMessage(
          "System",
          `${this.players[playerId].username} left the game`,
          "#f00"
        );
        this.removePlayerMesh(playerId);
        delete this.players[playerId];
        this.updatePlayerList();
      }
    });

    this.socket.on("playerMoved", (player) => {
      this.players[player.id] = player;
      this.updatePlayerMesh(player);
    });

    this.socket.on("blockPlaced", (block) => {
      const key = `${block.x},${block.y},${block.z}`;
      this.blocks[key] = block;
      this.createBlockMesh(block, key);
      document.getElementById("blockCount").textContent = Object.keys(
        this.blocks
      ).length;
    });

    this.socket.on("blockDestroyed", (pos) => {
      const key = `${pos.x},${pos.y},${pos.z}`;
      this.removeBlockMesh(key);
      delete this.blocks[key];
      document.getElementById("blockCount").textContent = Object.keys(
        this.blocks
      ).length;
    });

    this.socket.on("chunkUpdate", (newBlocks) => {
      Object.assign(this.blocks, newBlocks);
      this.createBlockMeshes();
      document.getElementById("blockCount").textContent = Object.keys(
        this.blocks
      ).length;
    });

    this.socket.on("chatMessage", (data) => {
      this.addChatMessage(data.username, data.message);
    });
  }

  createBlockMeshes() {
    // Clear existing block meshes
    Object.values(this.blockMeshes).forEach((mesh) => {
      this.scene.remove(mesh);
    });
    this.blockMeshes = {};

    // Create new block meshes (limit to nearby blocks for performance)
    const viewRange = 20; // Reduced for testing
    let meshCount = 0;

    Object.entries(this.blocks).forEach(([key, block]) => {
      const dx = block.x - this.playerPosition.x;
      const dz = block.z - this.playerPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= viewRange) {
        this.createBlockMesh(block, key);
        meshCount++;
      }
    });

    console.log(
      "Created",
      meshCount,
      "block meshes out of",
      Object.keys(this.blocks).length,
      "total blocks"
    );
    console.log("Player position:", this.playerPosition);
    console.log("Scene has", this.scene.children.length, "total objects");

    // Force a render to see if blocks appear
    this.render();
  }

  createBlockMesh(block, key) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = this.materials[block.type] || this.materials.stone;
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(block.x + 0.5, block.y + 0.5, block.z + 0.5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { blockKey: key, blockData: block };

    this.scene.add(mesh);
    this.blockMeshes[key] = mesh;

    // Debug: log first few blocks
    if (Object.keys(this.blockMeshes).length <= 3) {
      console.log(
        `Created block mesh at (${block.x}, ${block.y}, ${block.z}) type: ${block.type}`
      );
    }
  }

  removeBlockMesh(key) {
    if (this.blockMeshes[key]) {
      this.scene.remove(this.blockMeshes[key]);
      delete this.blockMeshes[key];
    }
  }

  createPlayerMesh(player) {
    if (player.id === this.playerId) return; // Don't render self

    const geometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const material = this.materials.player;
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(player.x, player.y + 0.9, player.z);
    mesh.castShadow = true;

    this.scene.add(mesh);
    this.playerMeshes[player.id] = mesh;
  }

  updatePlayerMesh(player) {
    if (player.id === this.playerId) return;

    if (!this.playerMeshes[player.id]) {
      this.createPlayerMesh(player);
    } else {
      this.playerMeshes[player.id].position.set(
        player.x,
        player.y + 0.9,
        player.z
      );
    }
  }

  removePlayerMesh(playerId) {
    if (this.playerMeshes[playerId]) {
      this.scene.remove(this.playerMeshes[playerId]);
      delete this.playerMeshes[playerId];
    }
  }

  setupInput() {
    // Keyboard events
    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyW":
          this.controls.forward = true;
          break;
        case "KeyS":
          this.controls.backward = true;
          break;
        case "KeyA":
          this.controls.left = true;
          break;
        case "KeyD":
          this.controls.right = true;
          break;
        case "Space":
          this.controls.up = true;
          e.preventDefault();
          break;
        case "ShiftLeft":
          this.controls.down = true;
          break;
        case "ControlLeft":
          this.controls.sprint = true;
          break;
      }

      // Block selection
      if (e.code >= "Digit1" && e.code <= "Digit5") {
        const blocks = ["grass", "dirt", "stone", "wood", "leaves"];
        const index = parseInt(e.code.slice(-1)) - 1;
        this.selectBlock(blocks[index]);
      }

      // Chat
      if (e.code === "KeyT" && !this.chatVisible) {
        this.openChat();
        e.preventDefault();
      }

      if (e.code === "Enter" && this.chatVisible) {
        this.sendChat();
        e.preventDefault();
      }

      if (e.code === "Escape") {
        if (this.chatVisible) {
          this.closeChat();
        } else if (this.isPointerLocked) {
          document.exitPointerLock();
        }
      }
    });

    document.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW":
          this.controls.forward = false;
          break;
        case "KeyS":
          this.controls.backward = false;
          break;
        case "KeyA":
          this.controls.left = false;
          break;
        case "KeyD":
          this.controls.right = false;
          break;
        case "Space":
          this.controls.up = false;
          break;
        case "ShiftLeft":
          this.controls.down = false;
          break;
        case "ControlLeft":
          this.controls.sprint = false;
          break;
      }
    });

    // Mouse events - Fix pointer lock
    this.renderer.domElement.addEventListener("click", () => {
      console.log(
        "Canvas clicked, pointer locked:",
        this.isPointerLocked,
        "chat visible:",
        this.chatVisible
      );
      if (!this.isPointerLocked && !this.chatVisible) {
        this.renderer.domElement.requestPointerLock();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked =
        document.pointerLockElement === this.renderer.domElement;
      console.log("Pointer lock changed:", this.isPointerLocked);
    });

    document.addEventListener("pointerlockerror", () => {
      console.error("Pointer lock failed");
    });

    document.addEventListener("mousemove", (e) => {
      if (this.isPointerLocked) {
        const sensitivity = 0.008; // Super fast mouse sensitivity
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= e.movementX * sensitivity;
        this.euler.x -= e.movementY * sensitivity;
        this.euler.x = Math.max(-this.PI_2, Math.min(this.PI_2, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
      }
    });

    // Mouse clicks for block interaction
    this.renderer.domElement.addEventListener("mousedown", (e) => {
      if (!this.isPointerLocked) return;

      const intersect = this.raycastBlocks();
      if (!intersect) return;

      if (e.button === 0) {
        // Left click - destroy
        const blockData = intersect.object.userData.blockData;
        this.socket.emit("destroyBlock", {
          x: blockData.x,
          y: blockData.y,
          z: blockData.z,
        });
      } else if (e.button === 2) {
        // Right click - place
        const blockData = intersect.object.userData.blockData;
        const face = intersect.face;
        const normal = face.normal.clone();

        const placePos = {
          x: blockData.x + Math.round(normal.x),
          y: blockData.y + Math.round(normal.y),
          z: blockData.z + Math.round(normal.z),
        };

        // Don't place blocks inside player
        const playerPos = this.playerPosition;
        const dx = Math.abs(placePos.x - Math.floor(playerPos.x));
        const dy = Math.abs(placePos.y - Math.floor(playerPos.y));
        const dz = Math.abs(placePos.z - Math.floor(playerPos.z));

        if (dx > 0.1 || dy > 0.1 || dz > 0.1) {
          this.socket.emit("placeBlock", {
            x: placePos.x,
            y: placePos.y,
            z: placePos.z,
            type: this.selectedBlock,
          });
        }
      }

      e.preventDefault();
    });

    this.renderer.domElement.addEventListener("contextmenu", (e) =>
      e.preventDefault()
    );

    // Handle window resize
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  raycastBlocks() {
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    const intersects = this.raycaster.intersectObjects(
      Object.values(this.blockMeshes)
    );
    return intersects.length > 0 ? intersects[0] : null;
  }

  setupUI() {
    // Inventory selection
    document.querySelectorAll(".inventory-slot").forEach((slot) => {
      slot.addEventListener("click", () => {
        this.selectBlock(slot.dataset.block);
      });
    });

    // Chat input
    const chatInput = document.getElementById("chatInput");
    chatInput.addEventListener("blur", () => {
      if (this.chatVisible) {
        this.closeChat();
      }
    });
  }

  update(deltaTime) {
    // Debug movement
    if (Object.values(this.controls).some((val) => val)) {
      console.log(
        "Controls active:",
        this.controls,
        "Pointer locked:",
        this.isPointerLocked
      );
    }

    if (!this.isPointerLocked || this.chatVisible) return;

    // Movement with super fast speed
    let baseSpeed = 100; // Base super fast movement
    if (this.controls.sprint) {
      baseSpeed = 250; // Sprint speed - flying fast!
    }
    const moveSpeed = baseSpeed * deltaTime;
    const direction = new THREE.Vector3();

    if (this.controls.forward) direction.z -= 1;
    if (this.controls.backward) direction.z += 1;
    if (this.controls.left) direction.x -= 1;
    if (this.controls.right) direction.x += 1;
    if (this.controls.up) direction.y += 1;
    if (this.controls.down) direction.y -= 1;

    // Apply camera rotation to movement direction (except Y)
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    forward.applyQuaternion(this.camera.quaternion);
    right.applyQuaternion(this.camera.quaternion);

    const moveDirection = new THREE.Vector3();
    moveDirection.addScaledVector(forward, -direction.z);
    moveDirection.addScaledVector(right, direction.x);
    moveDirection.y = direction.y;

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      this.playerPosition.addScaledVector(moveDirection, moveSpeed);
      this.camera.position.copy(this.playerPosition);

      // Update server less frequently for better performance
      if (!this.lastServerUpdate || Date.now() - this.lastServerUpdate > 50) {
        // 20fps updates
        this.lastServerUpdate = Date.now();
        if (this.playerId) {
          this.socket.emit("playerMove", {
            x: this.playerPosition.x,
            y: this.playerPosition.y,
            z: this.playerPosition.z,
            rotX: this.euler.x,
            rotY: this.euler.y,
          });
        }
      }
    }

    // Update UI less frequently
    if (!this.lastUIUpdate || Date.now() - this.lastUIUpdate > 100) {
      // 10fps updates
      this.lastUIUpdate = Date.now();
      document.getElementById("position").textContent = `${Math.floor(
        this.playerPosition.x
      )}, ${Math.floor(this.playerPosition.y)}, ${Math.floor(
        this.playerPosition.z
      )}`;
      document.getElementById("blockCount").textContent = Object.keys(
        this.blocks
      ).length;
    }
  }

  render() {
    // Debug first few renders
    if (!this.renderCount) this.renderCount = 0;
    this.renderCount++;

    if (this.renderCount <= 3) {
      console.log(
        `Render #${this.renderCount} - Camera pos:`,
        this.camera.position,
        "Scene children:",
        this.scene.children.length
      );
    }

    this.renderer.render(this.scene, this.camera);
  }

  selectBlock(blockType) {
    this.selectedBlock = blockType;

    // Update UI
    document.querySelectorAll(".inventory-slot").forEach((slot) => {
      slot.classList.remove("selected");
      if (slot.dataset.block === blockType) {
        slot.classList.add("selected");
      }
    });
  }

  openChat() {
    this.chatVisible = true;
    const chatInput = document.getElementById("chatInput");
    chatInput.style.display = "block";
    chatInput.focus();
  }

  closeChat() {
    this.chatVisible = false;
    const chatInput = document.getElementById("chatInput");
    chatInput.style.display = "none";
    chatInput.value = "";
  }

  sendChat() {
    const chatInput = document.getElementById("chatInput");
    const message = chatInput.value.trim();

    if (message) {
      this.socket.emit("chatMessage", message);
    }

    this.closeChat();
  }

  addChatMessage(username, message, color = "#fff") {
    const chatDiv = document.getElementById("chat");
    const messageDiv = document.createElement("div");
    messageDiv.className = "chat-message";

    const usernameSpan = document.createElement("span");
    usernameSpan.className = "chat-username";
    usernameSpan.textContent = username + ": ";
    usernameSpan.style.color = color;

    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;

    messageDiv.appendChild(usernameSpan);
    messageDiv.appendChild(messageSpan);
    chatDiv.appendChild(messageDiv);

    // Auto-scroll
    chatDiv.scrollTop = chatDiv.scrollHeight;

    // Remove old messages
    while (chatDiv.children.length > 50) {
      chatDiv.removeChild(chatDiv.firstChild);
    }
  }

  updatePlayerList() {
    const playersDiv = document.getElementById("players");
    playersDiv.innerHTML = "";

    Object.values(this.players).forEach((player) => {
      const playerDiv = document.createElement("div");
      playerDiv.textContent = player.username;
      if (player.id === this.playerId) {
        playerDiv.style.color = "#ff0";
        playerDiv.textContent += " (You)";
      }
      playersDiv.appendChild(playerDiv);
    });

    document.getElementById("playerCount").textContent = Object.keys(
      this.players
    ).length;
  }

  gameLoop() {
    const deltaTime = this.clock.getDelta();

    // Cap delta time to prevent large jumps
    const cappedDeltaTime = Math.min(deltaTime, 1 / 30); // Max 30fps worth of time

    // Update FPS counter less frequently
    if (!this.lastFPSUpdate || Date.now() - this.lastFPSUpdate > 500) {
      // Every 0.5 seconds
      this.lastFPSUpdate = Date.now();
      document.getElementById("fps").textContent = Math.round(1 / deltaTime);
    }

    this.update(cappedDeltaTime);
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start the game when page loads
window.addEventListener("load", () => {
  new MinecraftGame();
});
