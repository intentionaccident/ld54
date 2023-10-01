import * as React from "react";
import * as PIXI from "pixi.js";
import { GameFrame } from "./GameFrame";
import { UIRoot } from "./UIRoot";
import { PixiRoot } from "./PixiRoot";
import { Boat, createBoat, getBoatLength, getBoatWidth } from "./Boat";
import { VIEW_HEIGHT, VIEW_WIDTH } from "./view";
import { Lane, addLaneGraphics, GameState } from "./Lane";
import { tick } from "./tick";

function moorBoat(boat: Boat, moorIndex: number, lanes: Lane[], mooredBoats: Boat[], app: PIXI.Container) {
	boat.graphics.rotation = Math.PI / 8 * 3
	boat.graphics.x = VIEW_WIDTH - (getBoatLength(boat) * Math.cos(boat.graphics.rotation))
		- moorIndex * (getBoatLength(boat) * Math.cos(boat.graphics.rotation) + getBoatWidth(boat) * Math.sin(boat.graphics.rotation));
	const deltaY = (getBoatWidth(boat) * Math.cos(boat.graphics.rotation))
	const initialPosition = (VIEW_HEIGHT) - (getBoatLength(boat) * Math.sin(boat.graphics.rotation)) + deltaY;
	boat.graphics.y = initialPosition
	boat.graphics.on("mouseenter", () => boat.graphics.y -= deltaY)
	boat.graphics.on("mouseleave", () => boat.graphics.y = initialPosition)

	mooredBoats[moorIndex] = boat

	boat.graphics.on("click", () => {
		for (const lane of lanes) {
			lane.addBoatButton.visible = !lane.boat
			lane.addBoatButton.off("click")
			if (!lane.addBoatButton.visible) {
				continue
			}

			lane.addBoatButton.on("click", () => {
				moveBoatToLane(boat, lane)
				lane.boat = boat
				const removedBoat = mooredBoats.findIndex(m => m === boat)
				unmoorBoat(boat)

				mooredBoats[removedBoat] = createBoat(3)
				app.addChild(mooredBoats[removedBoat].graphics)

				moorBoat(mooredBoats[removedBoat], removedBoat, lanes, mooredBoats, app)
				for (const lane of lanes) {
					lane.addBoatButton.visible = false
					lane.addBoatButton.off("click")
				}
			})
		}
	})
}

export function Root() {
	const app = new PIXI.Application({
		width: 1280,
		height: 640,
		antialias: false,
		backgroundColor: 0x3AC5B9
	});
	app.stage.scale.set(2);
	const texture = PIXI.Texture.from('assets/bunny.png');
	const bunny = new PIXI.Sprite(texture);
	bunny.x = app.renderer.width / app.stage.scale.x / 2;
	bunny.y = app.renderer.height / app.stage.scale.y / 2;

	bunny.anchor.x = 0.5;
	bunny.anchor.y = 0.5;
	app.stage.addChild(bunny);
	const [lanes, actionButtons] = addLaneGraphics(app);
	app.ticker.add(() => {
		bunny.rotation += 0.01;
	});

	const mooredBoats: Boat[] = []
	for (let i = 0; i < 2; i++) {
		const boat = createBoat(3)
		moorBoat(boat, i, lanes, mooredBoats, app.stage)
		app.stage.addChild(boat.graphics)
	}

	const score = new PIXI.Text();
	score.x = 520
	app.stage.addChild(score);

	const lives = new PIXI.Text();
	lives.x = 520
	lives.y = 30
	app.stage.addChild(lives)

	const gameState: GameState = {
		actionButtons, lanes, turn: 0,
		score: {value: 0, graphics: score},
		lives: {value: 0, graphics: lives}
	};
	setScore(gameState, 0);
	setLives(gameState, 3)
	for (const button of actionButtons) {
		button.graphics.on('click', () => tick(gameState, button.action));
	}

	return <div>
		<GameFrame>
			<UIRoot />
			<PixiRoot app={app} />
		</GameFrame>
	</div>;
}

function moveBoatToLane(boat: Boat, lane: Lane) {
	boat.graphics.rotation = 0
	boat.graphics.y = 0
	boat.graphics.x = 500
	lane.graphics.addChild(boat.graphics)
}

function unmoorBoat(boat: Boat) {
	boat.graphics.interactive = false
	boat.graphics.off("mouseenter")
	boat.graphics.off("mouseleave")
}
