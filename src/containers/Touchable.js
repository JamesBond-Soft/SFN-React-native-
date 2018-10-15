import React, { Component } from 'react'
import { theme } from '../common'
import { View, TouchableHighlight, TouchableNativeFeedback, Platform } from 'react-native'

// Uses TouchableHighlight for iOS, or TouchableNativeFeedback for Android
class Touchable extends Component<void, any, void> {
    render() {
        let allProps = { ...this.props }
        let content = null

        if (Platform.OS === 'android') {
            Object.assign(allProps, {
                color: allProps.accentColor || theme.accentColor,
                borderless: allProps.borderless || false,
                // eslint-disable-next-line
                background: allProps.background || TouchableNativeFeedback.Ripple(allProps.underlayColor || theme.accentColor)
            })

            const style = allProps.style || {}
            delete allProps.style
            // We add an extra wrapper because Android does not properly apply styles to the Touchable
            // container as iOS does. This causes container and sizing issues

            content = (
                <View style={style}>
                    <TouchableNativeFeedback {...allProps} />
                </View>
            )
        } else {
            Object.assign(allProps, {
                underlayColor: allProps.underlayColor || theme.accentColorRGB(0.7),
                activeOpacity: allProps.activeOpacity || 0.25
            })

            content = <TouchableHighlight {...allProps} />
        }

        return content
    }
}

export default Touchable
