import { Action, moveCrate, destroyCrate, spawnCrateLine, incrementScore, decrementLives } from "./Lane";
import * as PIXI from "pixi.js";
import { GameState } from "./GameState";

export function tick(gameState: GameState, action: Action) {
	const lanes = gameState.lanes;
	let lockedLane: number | null = null;
	if (action.type === "push" && action.dir === "up") {
		for (let row = 0; row < lanes.length - 1; row++) {
			if (lanes[row].slots[action.col].crate === null) {
				moveCrate(lanes[row + 1].slots[action.col], lanes[row].slots[action.col]);
			}
		}
	} else if (action.type === "push" && action.dir === "down") {
		for (let row = lanes.length - 1; row > 0; row--) {
			if (lanes[row].slots[action.col].crate === null) {
				moveCrate(lanes[row - 1].slots[action.col], lanes[row].slots[action.col]);
			}
		}
	} else if (action.type === "lock") {
		lockedLane = action.row;
	}

	for (let row = 0; row < lanes.length; row++) {
		const lane = lanes[row];
		for (let col = lane.slots.length - 1; col >= 0; col--) {
			if (row === lockedLane) continue;
			if (lane.slots[col].crate === null) continue;

			if (col !== lane.slots.length - 1) {
				moveCrate(lane.slots[col], lane.slots[col + 1]);
				continue;
			}

			const lastCrate = lane.slots[col].crate;
			destroyCrate(lane.slots[col]);

			if (!lane.boat) {
				decrementLives(gameState);
				continue;
			}

			if (lane.boat.crates[lane.boat.lastFilled - 1].type === lastCrate?.type) {
				lane.boat.crates[--lane.boat.lastFilled].graphics.alpha = 1;
				incrementScore(gameState, 1);
				if (lane.boat.lastFilled > 0) {
					continue;
				} else {
					incrementScore(gameState, 1);
				}
			} else {
				decrementLives(gameState);
			}

			lane.boat.graphics.destroy();
			delete lane.boat;
		}
	}

	spawnCrateLine(lanes.map(l => l.slots[0]));
	gameState.turn++;

	if (gameState.lives.value <= 0) {
		const message = new PIXI.Text("You are become dead!", {
			fill: 0xFF0000,
			fontSize: 40
		});
		message.anchor.x = 0.5;
		message.anchor.y = 0.5;
		message.x = gameState.app.renderer.width / gameState.app.stage.scale.x / 2;
		message.y = gameState.app.renderer.height / gameState.app.stage.scale.y / 2;
		gameState.app.stage.addChild(message);
	}
}
