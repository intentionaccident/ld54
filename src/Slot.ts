import {Crate} from "./Crate";
import {AbilityType} from "./AbilityBar";
import {GameState} from "./GameState";
import * as PIXI from "pixi.js";
import {CranePattern, CraneType} from "./Configuration";
import {tick} from "./tick";

export class Slot {
	private ability: AbilityType | null = null;

	constructor(
		private readonly gameState: GameState,
		public readonly graphics: PIXI.Graphics,
		public crate: Crate | null = null
	) {
		this.graphics.on('click', () => {
			if (this.ability === null) return;
			if (this.ability === AbilityType.Swap) {
				if (gameState.selectedSlot === null) {
					gameState.selectedSlot = this;
					gameState.activeAbility = null;
					this.showSelected();
					for (let row = 0; row < gameState.lanes.length; row++) {
						const lane = gameState.lanes[row];
						for (let col = 0; col < lane.slots.length; col++) {
							const slot = lane.slots[col];
							if (slot !== this) slot.showDefault();
							const enableSlotIfEmpty = (slot: Slot) => {
								if (slot === this) return;
								if (gameState.configuration.craneType === CraneType.OnlyEmpty) {
									if (slot.crate === null) slot.showButton(AbilityType.Swap);
								} else if (gameState.configuration.craneType === CraneType.Swap) {

								} else throw new Error("Unreachable.");
							}
							if (this.gameState.configuration.cranePattern === CranePattern.Anywhere) {
								enableSlotIfEmpty(slot);
							} else if (this.gameState.configuration.cranePattern === CranePattern.SameLane) {
								for (let i = 1; i < this.gameState.configuration.craneRange+1; i++) {
									if (
										(row === this.row() && col === this.col() - i)
										|| (row === this.row() && col === this.col() + i)
									) enableSlotIfEmpty(slot);
								}
							} else if (this.gameState.configuration.cranePattern === CranePattern.Cross) {
								for (let i = 1; i < this.gameState.configuration.craneRange+1; i++) {
									if (
										(row === this.row() && col === this.col() - i)
										|| (row === this.row() && col === this.col() + i)
										|| (row === this.row() - i && col === this.col())
										|| (row === this.row() + i && col === this.col())
									) enableSlotIfEmpty(slot);
								}
							} else throw new Error("Unreachable.");
						}
					}
				} else {
					tick(gameState, {type: "swap", from: gameState.selectedSlot, to: this});
				}
			} else if (this.ability === AbilityType.Flush) {
				tick(gameState, {type: "flush", from: this});
			} else {
				throw new Error("Unsupported ability");
			}
		});
	}

	public col(): number {
		for (let row = 0; row < this.gameState.lanes.length; row++) {
			for (let col = 0; col < this.gameState.lanes[row].slots.length; col++) {
				if (this.gameState.lanes[row].slots[col] === this) return col;
			}
		}
		throw new Error('Unreachable.');
	}

	public row(): number {
		for (let row = 0; row < this.gameState.lanes.length; row++) {
			for (let col = 0; col < this.gameState.lanes[row].slots.length; col++) {
				if (this.gameState.lanes[row].slots[col] === this) return row;
			}
		}
		throw new Error('Unreachable.');
	}

	public showSelected() {
		if (this.crate === null) throw new Error('`crate` is null.');
		this.graphics.interactive = false;
		this.graphics.cursor = "default";
		this.ability = null;
		this.graphics.alpha = 1;
	}

	public showDefault() {
		this.graphics.interactive = false;
		this.graphics.cursor = "default";
		this.ability = null;
		this.graphics.alpha = 1;
	}

	public showButton(ability: AbilityType) {
		this.graphics.interactive = true;
		this.graphics.cursor = "pointer";
		this.ability = ability;
		this.graphics.alpha = 0.7;
	}

	public addCrate(crate: Crate | null) {
		if (this.crate !== null) throw Error("`slot` is not empty.");
		if (crate === null) return;
		this.crate = crate;
		this.graphics.addChild(crate.graphics);
		crate.graphics.y = this.graphics.height / 2 - this.crate.graphics.height / 2;
		crate.graphics.x = this.graphics.width / 2 - this.crate.graphics.width / 2;
	}

	public destroyCrate() {
		if (this.crate === null) throw Error("`slot` is empty.");
		this.crate.graphics.destroy();
		this.crate = null;
	}
}


export function moveCrate(from: Slot, to: Slot) {
	if (to.crate !== null) throw Error("`to` is not empty.");
	if (from.crate === null) return;
	to.crate = from.crate;
	to.graphics.addChild(from.crate.graphics);
	from.crate = null;
}

export function swapCrate(from: Slot, to: Slot) {
	if (from.crate !== null) {
		from.crate.graphics.removeFromParent();
		to.graphics.addChild(from.crate.graphics);
	}
	if (to.crate !== null) {
		to.crate.graphics.removeFromParent();
		from.graphics.addChild(to.crate.graphics);
	}
	[to.crate, from.crate] = [from.crate, to.crate];
}
