// @flow
import React, { PureComponent } from 'react'
import { Text, Platform, StyleSheet } from 'react-native'
import theme from './theme'

function isNil(children: ?any) {
    return children === undefined || children === null
}

const fmt = (children: ?string | ?Array<string> | ?number) => {
    if (isNil(children)) {
        return ''
    } else if (Array.isArray(children)) {
        return children.map(fmt).join('')
    }

    // $FlowFixMe
    return /number|string/.test(typeof children) ? `${children}` : ''
}

export function spaces(str: string, amount: number): string {
    return str.split('').join('\u200A'.repeat(amount))
}

export class SFNText extends PureComponent<void, any, void> {
    render() {
        // Default text style
        let style = [ DefaultStyle.baseTxt, DefaultStyle.sfnTxt ]
        if (Array.isArray(this.props.style)) {
            style = style.concat(this.props.style)
        } else {
            style.push(this.props.style)
        }

        let spacing = this.props.spacing || 0
        let str = spaces(fmt(this.props.children), spacing)

        return (
            <Text {...this.props} style={style}>
                {str}
            </Text>
        )
    }
}

const SPECIAL_SPACING = Platform.select({ ios: 8, android: 1 })
export class SpecialText extends PureComponent<void, any, void> {
    render() {
        // Default text style
        let style = [ DefaultStyle.baseTxt, DefaultStyle.specialTxt ]
        if (Array.isArray(this.props.style)) {
            style = style.concat(this.props.style)
        } else {
            style.push(this.props.style)
        }

        let spacing = this.props.spacing === undefined ? SPECIAL_SPACING : this.props.spacing
        let str = spaces(fmt(this.props.children), spacing)

        return (
            <Text {...this.props} style={style}>
                {str}
            </Text>
        )
    }
}

export const fontFamily = {
    Regular: Platform.select({ ios: 'Graphik', android: 'graphik' }),
    Special: Platform.select({ ios: 'GiorgioSans-Medium', android: 'GiorgioSans' })
}

const DefaultStyle = StyleSheet.create({
    baseTxt: {
        fontSize: 12,
        color: theme.primaryTextColor
    },

    specialTxt: { fontFamily: fontFamily.Special, fontSize: 18 },
    sfnTxt: { fontFamily: fontFamily.Regular }
})
