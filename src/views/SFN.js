// @flow
import React, { Component } from 'react'
import codePush from 'react-native-code-push'
import Modal from 'react-native-modalbox'
// $FlowFixMe - Flow doesn't understand *.ios or *.android extensions
import ProgressBar from '../containers/ProgressBar'
// $FlowFixMe
import { addNavigationHelpers } from 'react-navigation'
import { rand } from '../util'
import { newAPI } from '../io/api'
import { connect } from 'react-redux'
import { View, StyleSheet } from 'react-native'
import { theme } from '../common'
import { SpecialText } from '../common/defaults'
import { api, gyms } from '../store'
import type { InjectableStore } from '../store/configure'
import type { API } from '../io/api'
import type { Nav } from './createAppNavigator'
import type { SyncStatus } from 'react-native-code-push'

const { SyncStatus: SS } = codePush

type State = {
    showDownloadingModal: boolean,
    showInstalling: boolean,
    downloadProgress: number,
    installProgress: number,
    status: ?SyncStatus
}

type Props = {
    authToken?: string,
    store: InjectableStore,
    initialRoute: string,
    nav: Nav,
    navigatorComponent: ReactComponent<*, *, *>,
    setAPI: typeof api.action,
    fetchGyms: () => Promise<any>
}

class SFN extends Component<*, Props, State> {
    props: Props;
    state: State;
    _api: ?API;
    _lastInitialRoute: ?string;
    _timeout = 0;

    constructor(props: Props) {
        super(...arguments)

        if (props.authToken) {
            this._setAPI(newAPI(props.authToken, props.store))
        }

        this.state = {
            showDownloadingModal: false,
            showInstalling: false,
            downloadProgress: 0,
            installProgress: 0,
            status: null
        }
    }

    _log = (msg: string, ...rest: any) => {
        let isDev = false
        if (__DEV__) {
            isDev = true
        }
        console[isDev ? 'log' : 'warn'](msg, ...rest)
    }

    // Uncomment to add loading transitions between routes
    // componentWillReceiveProps(nextProps: Props) {
    //     let { nav, setGlobalLoading } = this.props
    //     // Check if we're actually switching to a new route
    //     if ((nextProps.nav && !nav) || nextProps.nav.routePath !== nav.routePath) {
    //         // If so, set up global loading
    //         setGlobalLoading(true)
    //     }
    // }

    componentWillUnmount() {
        clearTimeout(this._timeout)
    }

    async _setAPI(api: API) {
        this._api = api
        this.props.setAPI(this._api)
        // Refresh gyms every time the app is opened

        try {
            // TODO Blow out geotrack geofences, add the ones that result from here
            await this.props.fetchGyms(this._api)
        } catch (err) {
            console.error('[SFN] Got error waiting for gymFetch and geotrack to resolve', err)
        }

        // TODO Remove or re-enable at some point #350
        // if (!error) {
        //     if (gyms && gyms.length) {
        //         return geotrack.addGeofences(gyms)
        //     }
        //
        // }
    }

    render() {
        const { showDownloadingModal, showInstalling, installProgress, downloadProgress } = this.state

        // Always attempt an update first
        if (showDownloadingModal) {
            let downloadOrInstallContent
            if (showInstalling) {
                this._log('[SFN] Installing...')
                downloadOrInstallContent = (
                    <View style={styles.installDlWrap}>
                        <SpecialText style={styles.installDlTxt}>
                            INSTALLING UPDATE...
                        </SpecialText>
                        <ProgressBar color={theme.accentColor} progress={parseInt(installProgress, 10)} />
                    </View>
                )
            } else {
                this._log('[SFN] Downloading...')
                downloadOrInstallContent = (
                    <View style={styles.installDlWrap}>
                        <SpecialText style={styles.installDlTxt}>
                            DOWNLOADING UPDATE...
                        </SpecialText>
                        <ProgressBar color={theme.accentColor} progress={parseInt(downloadProgress, 10)} />
                    </View>
                )
            }

            return (
                <View>
                    <Modal
                        isOpen={true}
                        style={styles.modal}
                        backdrop={false}
                        swipeToClose={false}>
                        <View style={styles.contentWrap}>
                            {downloadOrInstallContent}
                        </View>
                    </Modal>
                </View>
            )
        }

        const { initialRoute, nav, store, authToken, navigatorComponent: Navigator } = this.props

        // If we didn't already handle this initial route
        if (this._lastInitialRoute !== initialRoute) {
            this._lastInitialRoute = initialRoute

            console.log('[SFN] Navigating to initialRoute', initialRoute)
            store.dispatch({
                type: 'Navigation/RESET',
                index: 0,
                actions: [{
                    type: 'Navigation/NAVIGATE',
                    routeName: initialRoute
                }],
                meta: { lastUpdated: new Date() }
            })

            // Wait for the dispatch above to propagate back via store.getState().nav
            // because it will trigger a re-render
            return null
        } else if (!nav) {
            // TODO Deal with this somehow
            throw new Error('Nav state was not provided!')
        }

        if (!authToken) { //in case we reset authToken
            this._api = null
        }

        if (!this._api) {
            if (authToken) {
                this._setAPI(newAPI(authToken, store))
                console.log('[SFN] Got authToken and created API', this._api)
            } else {
                console.log("[SFN] No authToken, can't supply API yet")
            }
        }

        // This is needed in order to make navigation redux compatible
        let navHelpers = addNavigationHelpers({
            state: nav,
            dispatch: store.dispatch,
            authToken
        })

        return <Navigator navigation={navHelpers} />
    }

    _updateInstallProgress = () => {
        const { installProgress, status } = this.state
        const updatedProgress = installProgress + rand(5, 25)

        // TODO Gather analytics around these times to see how long the average
        // download + install takes
        if (status === SS.INSTALLING_UPDATE) {
            if (updatedProgress < 95) {
                this.setState({ installProgress: updatedProgress })
                this._timeout = setTimeout(this._updateInstallProgress, rand(1500, 2500))
            }
        }
    }

    // Codepush HOC hook
    codePushDownloadDidProgress({ receivedBytes, totalBytes }) {
        this.setState({ downloadProgress: receivedBytes / totalBytes * 100 })
    }

    // Codepush HOC hook
    codePushStatusDidChange(status: SyncStatus) {

        this._log('Checking for updates...', { status })
        switch (status) {
        case SS.DOWNLOADING_PACKAGE:
            this._log('Downloading update')
            this.setState({ showDownloadingModal: true, status })
            break
        case SS.INSTALLING_UPDATE:
            this._log('Installing update')
            this.setState({ showInstalling: true, status })
            this._updateInstallProgress()
            break
        case SS.UPDATE_INSTALLED:
            this._log('Update installed')
            this.setState({ installProgress: 100 })
            clearTimeout(this._timeout)
            this._timeout = setTimeout(() => {
                this.setState({ showDownloadingModal: false, status })
            }, 150)
            break
        default:
            // Uncomment to debug
            // this._log('Unknown update status!', { status })
            // Object.keys(SS).forEach((k) => {
            //     if (SS.hasOwnProperty(k) && SS[k] === status) {
            //         this._log('Status => ', k)
            //     }
            // })
            break
        }
    }
}

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    contentWrap: {
        flex: 1,
        justifyContent: 'center',
        padding: 20
    },
    installDlTxt: {
        marginTop: 280,
        fontSize: theme.fontSizes.med.fontSize,
        color: theme.primaryColor,
        textAlign: 'center',
        marginBottom: 16
    },
    installDlWrap: {
        width: 220
    }
})

const sfnComponent = codePush({
    checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
    updateDialog: null,
    installMode: codePush.InstallMode.IMMEDIATE,
    mandatoryInstallMode: codePush.InstallMode.IMMEDIATE
})(SFN)

const mapStateToProps = ({ nav, authToken }) => ({ nav, authToken })
export default connect(mapStateToProps, {
    setAPI: api.action,
    fetchGyms: gyms.fetch
})(sfnComponent)
