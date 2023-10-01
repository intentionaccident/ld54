import { BoatManager } from "./BoatManager";
import {ActionButton, Lane, LaneButton} from "./Lane";
import * as PIXI from "pixi.js";
import {Features} from "./Features";

export interface GameState {
	app: PIXI.Application;
	actionButtons: ActionButton[];
	lanes: Lane[];
	turn: number;
	score: { value: number, graphics: PIXI.Text };
	lives: { value: number, graphics: PIXI.Text };
	boatManager?: BoatManager;
	features: Features;
}
