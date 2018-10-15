// @flow
import React, { PureComponent } from 'react'
import { Platform } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { globalStyles, theme } from '../../common'

type TabBarIconProps = {
    tintColor: string
}

class ProfileTabBarIcon extends PureComponent {
    props: TabBarIconProps

    render() {
        return (
            <Ionicon
                {...theme.tabIcon}
                style={globalStyles.tabIconStyle}
                name={Platform.OS === 'ios' ? 'ios-person' : 'md-person'}
                color={this.props.tintColor}/>
        )
    }
}

export default ProfileTabBarIcon
