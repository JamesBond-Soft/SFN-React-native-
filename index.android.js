// @flow
import App from './src/App'
import { AppRegistry } from 'react-native'
import type { ReactComponent } from 'react-native'

AppRegistry.registerComponent('SFN', (): ReactComponent<*,*,*> => App)
