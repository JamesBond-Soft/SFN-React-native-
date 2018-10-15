// @flow
import React, { Component } from 'react'
import Spinner from './Spinner'
import { Text } from 'react-native'
import { getDisplayName } from '../util'
import type { Props as SpinnerProps } from './Spinner'

export type LoaderProps = {
    isLoading: boolean,
    spinnerProps?: SpinnerProps,
    error?: Error,
    children?: any
}

export class Loader extends Component<void, LoaderProps, void> {
    props: LoaderProps

    render() {
        let { isLoading, error, children, spinnerProps } = this.props
        let content = null

        if (isLoading) {
            content = <Spinner {...spinnerProps} />
        } else if (error) {
            // TODO Error routes and Raygun reporting
            console.error('[SFNLoader] View failed to load!', error)
            content = <Text>Uh oh... something bad just happened. Try restarting the app.</Text>
        } else if (React.Children.count(children)) {
            content = React.Children.only(children)
        }

        return content
    }
}

export default function loader(WrappedComponent: ReactComponent<*, *, *>): ReactComponent<*, *, *> {
    return class LoaderHOC extends Component<*, *, *> {
        static displayName = `Loader(${getDisplayName(WrappedComponent)})`
        static WrappedComponent = WrappedComponent
        render() {
            return <Loader {...this.props} />
        }
    }
}
