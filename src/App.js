// @flow
import React, { Component } from 'react'
import SFN from './views/SFN'
import configureStore from './store/configure'
import createAppNavigator from './views/createAppNavigator'
import PerfMonitor from 'react-native/Libraries/Performance/RCTRenderingPerf'
import Spinner from './containers/Spinner'
import geotrack from './services/geotrack'
import Analytics from './services/Analytics'
import { AppState } from 'react-native'
import { LoginManager } from 'react-native-fbsdk'
import { self, authToken } from './store'
import { codes } from './io/api'
import { refresh } from './io/auth'
import { theme } from './common'
import { Provider } from 'react-redux'
import type { InjectableStore } from './store/configure'
import type { BaseAPIResponse } from './io/api'
import type { TokenResponse } from './io/auth'

type State = {
    store: ?InjectableStore,
    initialRoute: string
}

const OFF_APPSTATE = /inactive|background/
const ON_APPSTATE = 'active'

export default class App extends Component<*, *, State> {
    state: State;
    appState: string;

    constructor(props: {}) {
        console.log('App::constructor')
        super(props)
        this.appState = 'active'
        this.state = {
            store: null,
            initialRoute: 'Login'
        }
    }

    componentDidMount() {
        Analytics.appEnter()
        AppState.addEventListener('change', this._handleAppStateChange)


        if (__DEV__) {
            PerfMonitor.toggle()
            setTimeout(() => {
                PerfMonitor.start()
                setTimeout(() => PerfMonitor.stop(), 10000)
            }, 100)
        }
    }

    componentWillUnmount() {
        Analytics.appExit()
        AppState.removeEventListener('change', this._handleAppStateChange)
    }

    _handleAppStateChange = (nextAppState: string) => {
        console.debug('handleAppStateChange', { nextAppState, appState: this.appState })
        if (this.appState.match(OFF_APPSTATE) && nextAppState === ON_APPSTATE) {
            Analytics.appEnter()
        } else if (this.appState === ON_APPSTATE && nextAppState.match(OFF_APPSTATE)) {
            Analytics.appExit()
        }

        this.appState = nextAppState
    }

    async _handleComponentMount() {
        try {
            const store = await configureStore()

            // Initialize geo
            // TODO Remove or re-enable at some point in the future #350
            // geotrack.get(store).catch((err: Error) => {
            //     // TODO Raygun
            //     console.error('Error initializing geofences from App', err)
            // })
            geotrack.kill()

            let additionalState = {}
            let { authToken: token } = store.getState()
            console.log(`[SFNReact] Got existing authToken: ${token.substring(0, 24)}...`)
            if (token) {
                let apiRes: ?BaseAPIResponse<TokenResponse>
                try {
                    apiRes = await refresh(token)
                } catch (err) {
                    console.log(
                            `[SFNReact] Got code=${err.code} status=${err.status}, ` +
                            'clearing out existing authToken and logging out of FB'
                        )
                    // Clear out the stored authToken
                    store.dispatch(authToken.action(''))
                    // Logout of FB
                    // TODO What happens if they were never FB-authed in the first place?
                    LoginManager.logOut()
                    // TODO Add a 'token expired' Toast to SFN.js when this occurs
                    // (add a toast msg to store state shape)
                    additionalState.initialRoute = 'Login'
                }

                // All good
                if (apiRes && apiRes.code === codes.OK) {
                    store.dispatch(authToken.action(apiRes.data.token))
                    store.dispatch(self.action(apiRes.data.member))
                    additionalState.initialRoute = 'TabIndex'
                }
            }

            this.setState({ store, ...additionalState })
        } catch(err) {
            // TODO Raygun
            console.error('Fatal error configuring store, cannot continue', err)
        }
    }

    componentWillMount() {
        // TODO While the store is being rehydrated, may need to display
        // a loading screen to prevent a blank page
        this._handleComponentMount()
    }

    render() {
        const { store, initialRoute } = this.state

        if (store) {
            const { authToken } = store.getState()
            const Navigator = createAppNavigator(store)
            return (
                <Provider store={store}>
                    <SFN
                        initialRoute={initialRoute}
                        store={store}
                        authToken={authToken}
                        navigatorComponent={Navigator} />
                </Provider>
            )
        }

        return <Spinner viewStyle={styles.spinner} />
    }
}

const styles = {
    spinner: {
        marginTop: '-50%',
        backgroundColor: theme.canvasColor,
        opacity: 1
    }
}
