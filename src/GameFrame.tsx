import * as React from 'react'
import styles from './GameFrame.sass'

export const GameFrame = (props: React.PropsWithChildren) => {
	return <div className={styles.gameFrame}>
		<div>
			{props.children}
		</div>
	</div>
}
