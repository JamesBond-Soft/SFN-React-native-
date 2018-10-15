// @flow
import React, { Component } from 'react'
import { StyleSheet } from 'react-native'
import { theme } from '../../common'
import { View, Text } from 'react-native'

type BadgeProps = {
    count: number | string,
    tintColor: string,
    text?: string
}

export default class BadgeCount extends Component<void, BadgeProps, void> {
    props: BadgeProps
    render() {
        let { count, text, tintColor } = this.props
        let maybeBadge = null
        let maybeText = null

        if (isNaN(count) || parseInt(count) > 0) {
            maybeBadge = (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {count}
                    </Text>
                </View>
            )
        }

        if (text) {
            maybeText = (
                <Text style={[ styles.text, { color: tintColor }]}>
                    {text}
                </Text>
            )
        }


        return (
            <View style={styles.view}>
                <View>
                    {maybeBadge}
                    {maybeText}
                </View>
            </View>
        )
    }
}

const textStyle = { fontSize: 12 }

const styles = StyleSheet.create({
    badge: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: 17,
        height: 17,
        borderRadius: 8.5,
        backgroundColor: theme.accentColor
    },

    view: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 3,
        right: 5
    },

    badgeText: {
        color: theme.canvasColor,
        backgroundColor: 'transparent',
        textAlign: 'center',
        ...textStyle
    },

    text: textStyle
})