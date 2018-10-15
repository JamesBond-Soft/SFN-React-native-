// @flow
import React from 'react'
import HomeTabs from '../Home/tabs'
import Settings from '../Settings'
import Analytics from '../../services/Analytics'
import MemberProfile from '../MemberProfile'
import ShowProfile from '../ShowProfile'
import Login from '../Login'
import CheckIns from '../CheckIns'
import { View } from 'react-native'
import {
    TabNavigator as tabNavigator,
    StackNavigator as stackNavigator
    // $FlowFixMe
} from 'react-navigation'
import { styles } from './styles'
import { createNavigationContainer } from './createNavigationContainer'
import { isGlobalLoading } from '../../store'
import type { Reducer } from '../../store'
import type { InjectableStore } from '../../store/configure'
import ProfileTabBarIcon from '../ShowProfile/ProfileTabBarIcon'

type PathWithParams = {
    path: string,
    params: ?{}
}

type WithRoutePath = {
    RoutePath?: string
}

type Router<A, S> = {
    getStateForAction(action: A, state?: S): S,
    getActionForPathAndParams(routeName: string): A,
    getPathAndParamsForState(state: S): PathWithParams,
    getComponentForState(state: S): ReactComponent<*, *, *>,
    getComponentForRouteName(routeName: string): ReactComponent<*, *, *>
}

type Navigator<A, S> = {
    router: Router<A, S>
}

export type Route = {
    index: number,
    routes?: Array<Route>,
    key: string,
    routeName: string,
    params: ?{},
type: ?string
}

export type Nav = {
    index: number,
    routes: Array<Route>,
    routePath: string
}

type NavActionResult = {
    type: string,
    routeName: string,
    action?: ?string,
    params?: ?{},
// TODO These fields do not ever exist on a NavAction, but we add them so compilation does not fail
meta: { lastUpdated: Date },
payload: any
}

// Fixes - https://github.com/react-community/react-navigation/issues/1584
const withBackButtonFix = (Cmpt: any, ignoreIndices: Set<number> = new Set()): any => (props: any) => {
    const { navigationState } = props
    const hidden = ignoreIndices.has(navigationState.index)
    const style = hidden ? { height: 0, opacity: 0 } : undefined
    return (
        <View collapsable={false} style={style}>
            <Cmpt {...props} />
        </View>
    )
}

// https://goo.gl/avQ7Sj
// We always use iOSBottomTabs because that is what the design calls for
const TBCmpt = withBackButtonFix(tabNavigator.Presets['iOSBottomTabs'].tabBarComponent, new Set())
const TabBarCmpt = (props: any) => <TBCmpt {...props} />

const navOpts = {
    tabBarComponent: TabBarCmpt,
    tabBarPosition: 'bottom',
    tabBarOptions: Object.assign(
        {
            showLabel: false,
            showIcon: true,
            inactiveTintColor: 'gray',
        },
        styles.tabs
    ),
    navigationOptions: styles.navigation,
    // Set to true to prevent content from loading ahead of time for tabs
    lazy: false,
    swipeEnabled: false,
    animationEnabled: false,
    pressOpacity: 0.8
}

function createNavReducer(navigator: Navigator<NavActionResult, Nav>): Reducer<Nav, NavActionResult> {
    const NAV_ACTION_PREFIX = 'Navigation/'
    const DEFAULT_ROUTE = 'Login'
    const initialState: Nav = { ...navigator.router.getStateForAction({
        type: `${NAV_ACTION_PREFIX}NAVIGATE`,
        // routeName differs from routePath, routeName=Home routePath=t/home
        routeName: DEFAULT_ROUTE,
        payload: null,
        meta: { lastUpdated: new Date() }
    }), routePath: DEFAULT_ROUTE.toLowerCase() }

    return {
        reducer(state: Nav = initialState, action: NavActionResult): Nav {
            // Handle actions in the Navigation category only
            if (action.type.indexOf(NAV_ACTION_PREFIX) === 0) {
                // smh => https://github.com/react-community/react-navigation/issues/1127
                if (action.type.indexOf('RESET') !== -1) {
                    action = { ...action, key: null }
                }
                let nextState: Nav = navigator.router.getStateForAction(action, state)
                if (nextState) {
                    const pathWithParams = navigator.router.getPathAndParamsForState(nextState)
                    nextState = { ...nextState, routePath: pathWithParams.path }

                    Analytics.viewExitAll()
                    if (nextState.routePath) {
                        Analytics.viewEnter(nextState.routePath)
                    }

                    // console.log('[SFNNavigator] reducer (nextState, merged)', nextState)
                    state = nextState
                }
            }

            return state
        }
    }
}

function extractRoutePath(cmpt: ReactComponentHOC<*, *, *> & WithRoutePath) {
    while (cmpt) {
        if (!cmpt.RoutePath) {
            cmpt = cmpt.WrappedComponent
        } else {
            return cmpt.RoutePath
        }
    }
}

// TODO Various options to deal with redux + nested + uriPrefix
// 1 https://github.com/react-community/react-navigation/issues/1189
// 2 Use CustomTabs example with createNavigationContainer from NavigationPlayground with
//   StackNavigator + Nested TabNavigator
// 3 If that does not work, use TabNavigator only (no nesting) and make Login screen a separate
//   screen which is not a Navigator route

export default function createAppNavigator(store: InjectableStore): ReactComponent<*, *, *> {
    const profileNav = stackNavigator(
        {
            ShowProfile: { screen: ShowProfile, path: extractRoutePath(ShowProfile) },
            EditProfile: { screen: MemberProfile, path: extractRoutePath(MemberProfile) },
            Settings: { screen: Settings, path: extractRoutePath(Settings) }
        }
    )

    profileNav.RoutePath = 'profile'

    profileNav.navigationOptions = {
        header: null,
        tabBarIcon: ({ tintColor }) => <ProfileTabBarIcon tintColor={tintColor} /> // eslint-disable-line
    }

    const tabNav = tabNavigator(
        {
            Home: { screen: HomeTabs, path: extractRoutePath(HomeTabs) },
            CheckIns: { screen: CheckIns, path: extractRoutePath(CheckIns) },
            Profile: {
                screen: profileNav,
                path: extractRoutePath(profileNav),
                navigationOptions: profileNav.navigationOptions
            }
        },
        navOpts
    )

    tabNav.RoutePath = 't'

    const Navigator = stackNavigator(
        {
            Login: { screen: Login, path: extractRoutePath(Login) },
            TabIndex: { screen: tabNav, path: tabNav.RoutePath }
        },
        {
            initialRouteName: 'Login',
            headerMode: 'screen',

            async onTransitionStart() {
                let { api } = store.getState()
                if (!(api && api.hasToken && api.hasToken())) {
                    return
                }
                // TODO Handle the error in the UI somehow?
                store.dispatch(isGlobalLoading.action(false))
            }
        }
    )

    // Thank you, shitty react-navigation redux integration for this wonderful pattern
    // https://reactnavigation.org/docs/guides/redux
    // We need to inject the navReducer into the store because the SFN component requires the nav state
    // in order to function properly. The navReducer requires the Navigator component to run. So we import it
    // in this file so that we can inject the reducer, and pass the same Navigator component down as a prop
    if (store) {
        console.debug('injectNavReducer')
        store.injectReducer('nav', createNavReducer(Navigator).reducer)
    } else {
        throw new Error('Store was null')
    }

    return createNavigationContainer(Navigator)
}
