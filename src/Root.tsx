import * as React from "react";
import {Application, Sprite, Texture} from "pixi.js";
import {GameFrame} from "./GameFrame";
import {UIRoot} from "./UIRoot";
import {PixiRoot} from "./PixiRoot";

export function Root() {
	const app = new Application({
		width: 640,
		height: 480
	});
	const texture = Texture.from('assets/bunny.png');
	const bunny = new Sprite(texture);
	bunny.x = app.renderer.width / 2;
	bunny.y = app.renderer.height / 2;
	bunny.anchor.x = 0.5;
	bunny.anchor.y = 0.5;
	app.stage.addChild(bunny);
	app.ticker.add(() => {
		bunny.rotation += 0.01;
	});

	return <div>
		<GameFrame>
			<UIRoot/>
			<PixiRoot app={app}/>
		</GameFrame>
	</div>;
}
