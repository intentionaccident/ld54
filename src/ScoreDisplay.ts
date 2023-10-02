import * as PIXI from "pixi.js";

export const scoreTextures = [1, 2, 3, 4, 5, 6].map(i =>
	PIXI.Texture.from(`assets/score${i}.png`)
);

export class ScoreDisplay {
	private readonly container = new PIXI.Container();

	constructor(app: PIXI.Application) {
		for (const texture of scoreTextures) {
			const sprite = new PIXI.Sprite(texture);
			this.container.addChild(sprite);
		}
		const text = new PIXI.Text("SCORE", {
			fontFamily: 'Allura',
			align: "center",
			fill: 0xFFFFFF,
			fontSize: 38,
			stroke: 0,
			strokeThickness: 2
		});
		text.x = 480;
		text.y = 546;
		text.anchor.set(0.5);
		this.container.addChild(text);
		this.container.x = 120;
		app.stage.addChild(this.container)
	}

	public update(score: number) {
		(this.container.children[6] as PIXI.Text).text = score;
		for (let i = 0; i < this.container.children.length - 1; i++) {
			this.container.children[i].visible = false;
		}

		if (score < 3) {
		} else if (score < 50) {
			this.container.children[0].visible = true;
		} else if (score < 100) {
			this.container.children[1].visible = true;
		} else if (score < 150) {
			this.container.children[2].visible = true;
		} else if (score < 200) {
			this.container.children[3].visible = true;
		} else if (score < 300) {
			this.container.children[4].visible = true;
		} else if (score < 500) {
			this.container.children[5].visible = true;
		}
	}
}
