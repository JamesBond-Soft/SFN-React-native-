// @flow
import React, { Component } from 'react'
import loader from './loader'
import { Dimensions, StyleSheet } from 'react-native'
import { getDisplayName } from '../util'

type Props = {
    nav: ReactComponent<*, *, *>
}

type DepsArgs = {
    fetchDeps: (props: any) => Promise<any>,
    ForComponent: ReactComponent<*, *, *> & { RoutePath: string }
}

type LoadableState = {
    componentLoaded: ReactComponent<*, *, *>,
    isLoading: boolean,
    error?: Error
}

const isDirty = (o1: {}, o2: {}) => {
    const keySpace = new Set(Object.keys(o1).concat(Object.keys(o2)))

    for (let key of keySpace) {
        if (o1[key] !== o2[key]) {
            return true
        }
    }

    return false
}

export default function withAsyncDeps({ fetchDeps, ForComponent }: DepsArgs) {
    const cmptName = getDisplayName(ForComponent)

    if (!ForComponent.RoutePath) {
        const msg = `${cmptName}.RoutePath is required as a static property!`
        console.error(msg)
        throw new Error(msg)
    }

    class AsyncDepsLoadable extends Component<void, Props, LoadableState> {
        state: LoadableState
        props: Props

        constructor(props) {
            super(props)
            this.state = {
                componentLoaded: null,
                isLoading: false
            }
        }

        shouldComponentUpdate(nextProps: Props, nextState: LoadableState) {
            // if (nextProps.nav) {
            //     // If we're navigating away
            //     // TODO endsWith() check may not be robust when we start having identical route names under different
            //     // top level routes. Look to refactor this to take into account parent Navigator paths
            //     // eg. t/attendance (tabs->attendance) and (hypothetically) s/attendance (stack->attendance)
            //     let hasSuffix = endsWith(nextProps.nav.routePath, ForComponent.RoutePath)
            //     let cleanup = !(nextProps.nav.routePath && hasSuffix)
            //     if (cleanup) {
            //         // Force cleanup if we're navigating away
            //         this.componentWillUnmount()
            //     }
            // }

            // Fixes loading animation jitter
            const { state } = this
            const should = nextState.componentLoaded !== state.componentLoaded ||
                nextState.isLoading !== state.isLoading ||
                nextState.error !== state.error

            if (should) {
                return true
            }

            // Component is likely loaded at this point, use default behavior
            return (nextState.componentLoaded || state.componentLoaded) ?
                isDirty(nextProps, this.props) : false
        }

        _performFetchDeps = async () => {
            this.setState({ isLoading: true })
            try {
                await fetchDeps(this.props)
                this.setState({ componentLoaded: true, isLoading: false })
            } catch (err) {
                // TODO Raygun
                console.error('Error loading dependencies for component:', cmptName, err)
                this.setState({ isLoading: false, error: err })
                throw err
            }
        }

        componentDidMount() {
            // Eager and late check
            // If the dependencies have already loaded OR if we're already trying to load them, then do nothing
            if (!this.state.componentLoaded) {
                this._performFetchDeps()
            }
        }

        componentWillUnmount() {
            console.log('withAsyncDeps::componentWillUnmount')
            this.setState({ isLoading: false, componentLoaded: false })
        }

        render() {
            let content = null

            if (this.state.componentLoaded) {
                content = <ForComponent {...this.props} />
            } else {
                const AsyncDepsLoader = loader(ForComponent)
                const spinnerProps = { viewStyle: styles.spinnerView }

                content = (
                    <AsyncDepsLoader
                        spinnerProps={spinnerProps}
                        isLoading={this.state.isLoading}
                        error={this.state.error} />
                )
            }

            return content
        }

        static displayName = `WithAsyncDepsLoadable(${cmptName})`
        static WrappedComponent = ForComponent
    }

    return class withAsyncDeps extends Component<void, Props, void> {
        render() {
            return <AsyncDepsLoadable {...this.props} />
        }

        static RoutePath = ForComponent.RoutePath
        static navigationOptions = ForComponent.navigationOptions
        static displayName = `withAsyncDeps(${cmptName})`
        static WrappedComponent = ForComponent
    }
}

const styles = StyleSheet.create({
    spinnerView: {
        position: 'absolute',
        left: Dimensions.get('screen').width / 2 - (60 / 2),
        top: '-12.5%'
    }
})