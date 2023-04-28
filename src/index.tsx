import * as ReactDOM from 'react-dom'
import {GameFrame} from './GameFrame';
import {UI} from './UI';
import * as React from 'react';
import {PixiRoot} from './PixiRoot';
import {createRoot} from 'react-dom/client';

const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(
	<GameFrame>
		<UI/>
		<PixiRoot/>
	</GameFrame>
);
