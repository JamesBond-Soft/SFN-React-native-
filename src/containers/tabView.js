// @flow
import React, { Component } from 'react'
import Spinner from './Spinner'
import { View } from 'react-native'
import { getDisplayName } from '../util'
import styles from './tabViewStyles'

type Props = {
    isGlobalLoading: boolean
}

type State = {
    horizontalIntent: boolean,
    verticalIntent: boolean
}

export default function newTabView(WrappedComponent: ReactComponent<*, *, *>) {
    return class TabView extends Component<void, Props, State> {
        state: State
        props: Props

        constructor(props: Props) {
            super(props)
            this.state = {
                horizontalIntent: false,
                verticalIntent: false
            }
        }

        render() {
            let maybeSpinner = null
            if (this.props.isGlobalLoading) {
                maybeSpinner = <Spinner style={styles.spinner} viewStyle={styles.globalLoading} />
            }
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <WrappedComponent {...this.props} />
                        {maybeSpinner}
                    </View>
                </View>
            )
        }

        static RoutePath = WrappedComponent.RoutePath
        static navigationOptions = WrappedComponent.navigationOptions
        static displayName = `tabView(${getDisplayName(WrappedComponent)})`
        static WrappedComponent = WrappedComponent
    }
}