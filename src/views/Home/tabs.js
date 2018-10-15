// @flow
import React from 'react'
import { Platform } from 'react-native'
import { globalStyles, theme } from '../../common'
// $FlowFixMe
import { TabNavigator as tabNavigator } from 'react-navigation'
import Ionicon from 'react-native-vector-icons/Ionicons'
import homeHOC from './index'
import type { NavigationStackScreenOptions } from '../../types'

const navOpts: NavigationStackScreenOptions = {
    tabBarComponent: tabNavigator.Presets['AndroidTopTabs'].tabBarComponent,
    tabBarPosition: 'top',
    tabBarOptions: {
        activeTintColor: theme.accentColor,
        inactiveTintColor: theme.canvasColor2,

        indicatorStyle: {
            borderWidth: 2,
            borderColor: theme.accentColor
        },

        style: {
            backgroundColor: theme.canvasColor,
            borderColor: theme.borderColor,
            borderBottomWidth: 1
        }
    } /* styles */,
    navigationOptions: {} /* styles */,
    // Set to true to prevent content from loading ahead of time for tabs
    // Must keep these options as-is, it fixes an issue with react-navigation not
    // showing content properly
    lazy: false,
    swipeEnabled: false,
    animationEnabled: false,
    pressOpacity: 0.7
}

export default Object.assign(
    tabNavigator(
        {
            Public: { screen: homeHOC('Public'), path: 'public' },
            Me: { screen: homeHOC('Me'), path: 'me' }
        },
        navOpts
    ),
    {
        RoutePath: 'home',
        navigationOptions: {
            title: 'Feed',
            headerLeft: null,
            // eslint-disable-next-line
            tabBarIcon: ({ tintColor }: { tintColor: string }) =>
                <Ionicon
                    {...theme.tabIcon}
                    style={globalStyles.tabIconStyle}
                    name={Platform.OS === 'ios' ? 'ios-home' : 'md-home'}
                    color={tintColor}/>
        }
    }
)
