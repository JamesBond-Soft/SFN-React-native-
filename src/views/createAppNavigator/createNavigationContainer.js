// @flow
import React, { Component } from 'react'
import { getDisplayName } from '../../util'
import { BackHandler, Linking, Platform } from 'react-native'
// $FlowFixMe
import { NavigationActions } from 'react-navigation'

const NAV_URI_PREFIX = `sfn://${Platform.OS === 'android' ? 'sfn/' : ''}`

type Props = {
    navigation: {
        dispatch: () => void,
        state: {}
    }
}

// Heavily modified version of react-navigation's createNavigationContainer.
// NavigationContainer does not allow custom uriPrefix since we are passing in the navigation prop:
//   https://github.com/react-community/react-navigation/blob/fac91e0/src/createNavigationContainer.js#L85
// We need both a custom uriPrefix and redux support. Redux requires that we pass the navigation as a prop
// since it is now the entity maintaining state and not react-navigation itself.
// In order for the component to receive both as props, we must roll our own custom NavContainer.
// https://github.com/react-community/react-navigation/issues/1189
export function createNavigationContainer(NavigatorComponent: ReactComponent<*, Props, *>) {
    return class NavigationContainer extends Component<void, Props, void> {
        props: Props
        _subs: ?{ remove: () => void } = null

        static router = NavigatorComponent.router
        static displayName = `AppNavigationContainer(${getDisplayName(NavigatorComponent)})`
        static WrappedComponent = NavigatorComponent

        _urlToPathAndParams(url: string) {
            const params = {}
            // TODO Don't have to hardcode this here, we can accept it as an argument to the HOC
            const delimiter = NAV_URI_PREFIX
            let path = url.split(delimiter)[1]

            if (typeof path === 'undefined') {
                path = url
            }

            return { path, params }
        }

        _handleOpenURL(url: string) {
            const parsedUrl = this._urlToPathAndParams(url)
            console.log('handleOpenURL')
            if (parsedUrl) {
                const { path, params } = parsedUrl
                const action = NavigatorComponent.router.getActionForPathAndParams(path, params)
                if (action) {
                    this.props.navigation.dispatch(action)
                }
            }
        }

        componentDidMount() {
            this._subs = BackHandler.addEventListener('backPress', () =>
                this.props.navigation.dispatch(NavigationActions.back())
            )

            Linking.addEventListener('url', ({ url }: { url: string }) => {
                this._handleOpenURL(url)
            })

            Linking.getInitialURL().then((url: ?string) => url && this._handleOpenURL(url))
        }

        componentWillUnmount() {
            Linking.removeEventListener('url', this._handleOpenURL)
            this._subs && this._subs.remove()
        }

        render() {
            console.debug('NavigationContainer::render')
            return <NavigatorComponent {...this.props} />
        }
    }
}
