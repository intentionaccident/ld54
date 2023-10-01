import {GameState} from "./GameState";
import {createBox} from "./Box";
import {VIEW_HEIGHT} from "./view";
import * as PIXI from 'pixi.js'

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
		addText(1, "🧲");
		addText(2, "🏗");
		addText(3, "🌊");
	}
}
