import {GameState} from "./GameState";
import {createBox} from "./Box";
import {VIEW_HEIGHT} from "./view";
import * as PIXI from 'pixi.js'
import {Lane} from "./Lane";
import {tick} from "./tick";

export enum AbilityType {
	Lock,
	FastForward,
	Compress,
	Move,
	Flush,
	Hold
}

export function deactivateAbility(state:GameState) {
	for (let lane of state.lanes) {
		if (lane.lockTurnsLeft === 0) lane.button.showLock();
	}
}

export function activateAbility(state:GameState, ability: AbilityType) {
	switch (ability) {
		case AbilityType.FastForward:
			for (let lane of state.lanes) {
				if (lane.lockTurnsLeft === 0) lane.button.showFastForward();
			}
			break;
		case AbilityType.Compress:
			for (let lane of state.lanes) {
				if (lane.lockTurnsLeft === 0) lane.button.showCompress();
			}
			break;
		case AbilityType.Move:
			// TODO:
			break;
		case AbilityType.Flush:
			// TODO:
			break;
		case AbilityType.Hold:
			for (let lane of state.lanes) {
				if (lane.lockTurnsLeft === 0) lane.button.showLock();
			}
			break;
		default:
			throw new Error('Unreachable.');
	}
}

export class AbilityBar {
	public static create(state: GameState) {
		const buttons: PIXI.Graphics[] = [];
		for (let i = 0; i < 5; i++) {
			const button = createBox(50, 50, 0xFFFFFF, true);
			button.y = VIEW_HEIGHT - button.height;
			button.x = 100 + (button.width) * i;
			state.app.stage.addChild(button);
			buttons.push(button);
		}
		const addText = (i: number, val: string) => {
			const text = new PIXI.Text(val);
			text.anchor.set(0.5, 0.5);
			text.x = buttons[i].width / 2;
			text.y = buttons[i].height / 2;
			buttons[i].addChild(text);
		};
		addText(0, "⏩");
		buttons[0].on('click', () => activateAbility(state, AbilityType.FastForward));
		addText(1, "🧲");
		buttons[1].on('click', () => activateAbility(state, AbilityType.Compress));
		addText(2, "🏗");
		buttons[2].on('click', () => activateAbility(state, AbilityType.Move));
		addText(3, "🌊");
		buttons[3].on('click', () => activateAbility(state, AbilityType.Flush));
		addText(4, "🕸")
		buttons[4].on('click', () => activateAbility(state, AbilityType.Hold));
	}
}
