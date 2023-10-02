import { Action, decrementLives, incrementLevel, incrementProgress, incrementScore, Lane, spawnCrateLine } from "./Lane";
import * as PIXI from "pixi.js";
import { CrateType } from "./Crate";
import { GameState } from "./GameState";
import { deactivateAbility } from "./AbilityBar";
import { CompressType, FlushType } from "./Configuration";
import { moveCrate, swapCrate } from "./Slot";

function moveLaneForward(gameState: GameState, lane: Lane, fromCol = 0, isLane = true) {
	if (lane.lockTurnsLeft > 1) {
		lane.button.showLocked(lane.lockTurnsLeft);
	} else {
		lane.button.showLock();
	}
	if (lane.lockTurnsLeft > 0) {
		return;
	}
	for (let col = lane.slots.length - 1; col >= fromCol; col--) {
		if (lane.slots[col].crate === null) continue;

		if (col !== lane.slots.length - 1) {
			moveCrate(gameState, lane.slots[col], lane.slots[col + 1], isLane);
			continue;
		}

		const lastCrate = lane.slots[col].crate;
		lane.slots[col].pushCrateIntoWater();

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
				incrementScore(gameState, lane.boat.size);
				let wait = 0.5 * 60;
				const boat = lane.boat;
				gameState.boatManager?.removeBoat(lane, false);
				let speed = 0.5;
				gameState.nonBlockingAnimations.push(() => {
					wait--;
					if (wait > 0) return true;
					boat.boatGraphics.x += speed;
					speed += 0.005;
					speed = Math.min(2, speed);
					// boat.boatGraphics.alpha *= 0.95;
					// if (boat.boatGraphics.alpha <= 0.01) {
					if (boat.boatGraphics.x > 2000) {
						boat.manifestGraphics.destroy();
						boat.boatGraphics.destroy();
						return false;
					}
					return true;
				});
			}
		} else {
			decrementLives(gameState);
			const boat = lane.boat;
			gameState.boatManager?.removeBoat(lane, false);
			let ticker = 0;
			let initialX = boat.boatGraphics.x;
			gameState.nonBlockingAnimations.push(() => {
				boat.boatGraphics.y += 0.1;
				ticker += 1;
				boat.boatGraphics.x = initialX + 2 * Math.sin(ticker / 4)
				boat.boatGraphics.alpha *= 0.95;
				if (boat.boatGraphics.alpha <= 0.01) {
					boat.manifestGraphics.destroy();
					boat.boatGraphics.destroy();
					return false;
				}
				return true;
			});
		}

		incrementProgress(gameState, 1);
	}
}

export function tick(gameState: GameState, action: Action) {
	if (gameState.popupIsActive) return;
	if (gameState.laneAnimations.length > 0 || gameState.actionAnimations.length > 0) return;

	deactivateAbility(gameState);
	const lanes = gameState.lanes;
	if (action.type === "push" && action.dir === "up") {
		for (let row = 0; row < lanes.length - 1; row++) {
			if (lanes[row].slots[action.col].crate === null) {
				moveCrate(gameState, lanes[row + 1].slots[action.col], lanes[row].slots[action.col], false);
			}
		}
	} else if (action.type === "push" && action.dir === "down") {
		for (let row = lanes.length - 1; row > 0; row--) {
			if (lanes[row].slots[action.col].crate === null) {
				moveCrate(gameState, lanes[row - 1].slots[action.col], lanes[row].slots[action.col], false);
			}
		}
	} else if (action.type === "lock") {
		if (lanes[action.row].lockTurnsLeft <= 0) {
			lanes[action.row].lockTurnsLeft += gameState.configuration.holdForXTurns;
		} else {
			return;
		}
	} else if (action.type === "fast-forward") {
		for (let i = 0; i < gameState.configuration.fastForwardTicks; i++) {
			moveLaneForward(gameState, lanes[action.row], 0, false);
		}
		lanes[action.row].lockTurnsLeft = 1;
	} else if (action.type === "compress") {
		let lane = lanes[action.row];
		if (gameState.configuration.compressType === CompressType.Full) {
			for (let i = 0; i < lane.slots.length; i++) {
				const slot = lane.slots[i];
				if (slot.crate === null) {
					for (let j = i + 1; j < lane.slots.length; j++) {
						if (lane.slots[j].crate !== null) {
							moveCrate(gameState, lane.slots[j], slot, false);
							break;
						}
					}
				}
			}
		} else if (gameState.configuration.compressType === CompressType.EatGaps) {
			let rightSideEmpty = true;
			let foundGap = false;
			let gapLeftmostCol = -1;
			for (let col = lane.slots.length - 1; col >= 0; col--) {
				let currentEmpty = lane.slots[col].crate === null;
				if (!foundGap) {
					if (!rightSideEmpty && currentEmpty) {
						foundGap = true;
						gapLeftmostCol = col;
					}
				} else {
					if (!currentEmpty) {
						break;
					} else {
						gapLeftmostCol = col;
					}
				}
				rightSideEmpty = currentEmpty;
			}
			if (!foundGap) return;
			while (lane.slots[gapLeftmostCol].crate === null) {
				for (let col = gapLeftmostCol + 1; col < lane.slots.length; col++) {
					if (lane.slots[col].crate !== null) {
						moveCrate(gameState, lane.slots[col], lane.slots[col - 1], false);
					}
				}
			}
		} else throw new Error("Unreachable.");
		lane.lockTurnsLeft = 1;
	} else if (action.type === "swap") {
		swapCrate(gameState, action.from, action.to);
	} else if (action.type === "flush") {
		const lane = gameState.lanes[action.from.row()];
		let flushTicks = -1;
		if (gameState.configuration.flushType === FlushType.Full) {
			flushTicks = lane.slots.length - action.from.col();
		} else if (gameState.configuration.flushType === FlushType.OneTick) {
			flushTicks = 1;
		} else {
			throw new Error("Unreachable.");
		}
		for (let i = 0; i < flushTicks; i++) {
			moveLaneForward(gameState, lane, action.from.col());
		}
	} else if (action.type !== "none") {
		throw new Error(`Unhandled action type ${action.type}`);
	}

	for (let row = 0; row < lanes.length; row++) {
		moveLaneForward(gameState, lanes[row]);
	}

	spawnCrateLine(gameState, lanes.filter(l => l.lockTurnsLeft === 0).map(l => l.slots[0]));
	gameState.turn++;

	for (const lane of lanes) {
		if (lane.lockTurnsLeft > 0) lane.lockTurnsLeft--;
	}

	if (gameState.lives.value <= 0) {
		gameState.onDeath()
		return;
		const message = new PIXI.Text("You are become dead!", {
			fill: 0xFF0000,
			fontSize: 40
		});
		message.anchor.x = 0.5;
		message.anchor.y = 0.5;
		message.x = gameState.app.renderer.width / gameState.app.stage.scale.x / 2;
		message.y = gameState.app.renderer.height / gameState.app.stage.scale.y / 2;
		gameState.app.stage.addChild(message);
	} else if (gameState.progress.value >= gameState.configuration.shipsNeeded) {
		incrementLevel(gameState);
	}
}
