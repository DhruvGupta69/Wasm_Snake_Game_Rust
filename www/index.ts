import init, { World, Direction, GameStatus } from ".././pkg/snake_game";
import { rnd } from "./utils/rnd";

init().then((wasm: any) => {
  const CELL_SIZE = 20;
  const WORLD_WIDTH = 8;
  const SNKAE_SPAWN_IDX = rnd(WORLD_WIDTH * WORLD_WIDTH);

  const world = World.new(WORLD_WIDTH, SNKAE_SPAWN_IDX);
  const worldWidth = world.width();

  const points = document.getElementById("points");
  const gameStatus = document.getElementById("game-status");
  const gameControlBtn = document.getElementById("game-control-btn");
  gameControlBtn.addEventListener("click", (_) => {
    const Status = world.game_status();
    if (Status === undefined) {
      world.start_game();
      play();
    } else {
      location.reload();
    }
  });

  const canvas = <HTMLCanvasElement>document.getElementById("snake-canvas");
  const ctx = canvas.getContext("2d");

  canvas.height = worldWidth * CELL_SIZE;
  canvas.width = worldWidth * CELL_SIZE;

  const snake_cell_ptr = world.snake_cells();
  const snakeLen = world.snake_length();

  const snakeCells = new Uint32Array(
    wasm.memory.buffer,
    snake_cell_ptr,
    snakeLen
  );

  document.addEventListener("keydown", (event) => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        world.change_snake_direction(Direction.Up);
        break;
      case "ArrowRight":
      case "KeyD":
        world.change_snake_direction(Direction.Right);
        break;
      case "ArrowDown":
      case "KeyS":
        world.change_snake_direction(Direction.Down);
        break;
      case "ArrowLeft":
      case "KeyA":
        world.change_snake_direction(Direction.Left);
        break;
    }
  });

  function drawWorld() {
    ctx.beginPath();

    for (let x = 0; x < worldWidth + 1; x++) {
      ctx.moveTo(CELL_SIZE * x, 0);
      ctx.lineTo(CELL_SIZE * x, worldWidth * CELL_SIZE);
    }

    for (let y = 0; y < worldWidth + 1; y++) {
      ctx.moveTo(0, CELL_SIZE * y);
      ctx.lineTo(worldWidth * CELL_SIZE, CELL_SIZE * y);
    }

    ctx.stroke();
  }

  function drawGameStatus() {
    const status = world.game_status();
    gameStatus.textContent = world.game_status_text();
    points.textContent = world.points().toString();
  }

  function drawSnake() {
    const snakeCells = new Uint32Array(
      wasm.memory.buffer,
      world.snake_cells(),
      world.snake_length()
    );

    snakeCells
      // .filter((cellIdx, i) => !(i > 0 && cellIdx === snakeCells[0]))
      .slice()
      .reverse()
      .forEach((cellIdx, i) => {
        const col = cellIdx % worldWidth;
        const row = Math.floor(cellIdx / worldWidth);

        ctx.fillStyle = i === snakeCells.length - 1 ? "#7878db" : "#000000";

        ctx.beginPath();
        ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      });

    ctx.stroke();
  }

  function drawReward() {
    const idx = world.reward_cell();
    const col = idx % worldWidth;
    const row = Math.floor(idx / worldWidth);

    ctx.beginPath();
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.stroke();
  }

  function paint() {
    drawWorld();
    drawSnake();
    drawReward();
    drawGameStatus();
  }

  function play() {
    const status = world.game_status();

    if (status === GameStatus.Won || status === GameStatus.Lost) {
      gameControlBtn.textContent = "Re-Play";
      return;
    }

    const fps = 6;
    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      world.step();
      paint();
      // the method takes a callback to be invoked before next repaint
      requestAnimationFrame(play);
    }, 1000 / fps);
  }

  paint();
});
