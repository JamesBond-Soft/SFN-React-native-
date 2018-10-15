// @flow
import React from 'react'
import Spinner from 'react-native-spinkit'
import { View, StyleSheet } from 'react-native'
import { theme } from '../common'

export type Props = {
    noDefaultStyle?: boolean,
    size?: number,
    style?: {},
    viewStyle?: {},
    color?: string
}

type State = {
    defaultStyles: {} | number,
    size: number,
    style: {},
    viewStyle: {},
    color: string
}

export default class StdSpinner extends React.PureComponent<void, Props, State> {
    state: State

    constructor(props: Props) {
        super(...arguments)

        this.state = {
            size: props.size || 60,
            viewStyle: props.viewStyle || {},
            style: props.style || {},
            color: props.color || theme.secondaryTextColor,
            defaultStyles: props.noDefaultStyle ? {} : styles.default
        }
    }

    render() {
        const { size, viewStyle, style, color, defaultStyles } = this.state
        return (
            <View style={[ defaultStyles, viewStyle ]}>
                <Spinner style={style} isVisible={true} size={size} type='WanderingCubes' color={color} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    default: {
        opacity: 0.75,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '50%'
    }
})