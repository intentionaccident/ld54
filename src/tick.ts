import { Action, decrementLives, destroyCrate, incrementScore, moveCrate, spawnCrateLine } from "./Lane";
import * as PIXI from "pixi.js";
import { CrateType } from "./Crate";
import { GameState } from "./GameState";

export function tick(gameState: GameState, action: Action) {
	const lanes = gameState.lanes;
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
		if (lanes[action.row].holdTurnsLeft <= 1) {
			lanes[action.row].holdTurnsLeft += gameState.features.holdForXTurns;
		} else {
			return;
		}
	}

	for (let row = 0; row < lanes.length; row++) {
		const lane = lanes[row];
		if (lane.holdTurnsLeft > 1) {
			gameState.lockButtonTexts[row].text = `L\n${lane.holdTurnsLeft - 1}`;
		} else {
			gameState.lockButtonTexts[row].text = "";
		}
		if (lane.holdTurnsLeft > 0) {
			lane.holdTurnsLeft--;
			continue;
		}
		for (let col = lane.slots.length - 1; col >= 0; col--) {
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

			if (
				lane.boat.crates[lane.boat.lastFilled - 1].type === lastCrate?.type
				|| lastCrate?.type === CrateType.Joker
				|| lane.boat.crates[lane.boat.lastFilled - 1].type === CrateType.Joker
			) {
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

			gameState.boatManager?.removeBoat(lane);
		}
	}

	spawnCrateLine(gameState, lanes.map(l => l.slots[0]));
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
