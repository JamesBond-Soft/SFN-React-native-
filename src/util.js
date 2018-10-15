// @flow
import React, { Component } from 'react'
import Analytics from './services/Analytics'

export const throttle = (wait: number, fn: () => void) => {
    let lastCalled = 0
    return (...args: Array<any>) => {
        const now = +new Date
        if (now - lastCalled > wait) {
            lastCalled = now
            fn(...args)
        }
    }
}

export type ScrollAnalyticsProps = {
    onScroll: () => void,
    onMomentumScrollBegin: () => void,
    onMomentumScrollEnd: () => void
}

export function scrollAnalytics(
    WrappedComponent: any,
    evtName: string,
    scrollThrottle: number = 50,
    scrollEndGap: number = 500): any {

    let lastScroll = 0
    let isMomentumScrolling = false
    let scrollEndTimeoutID = 0

    const reset = () => {
        clearTimeout(scrollEndTimeoutID)
        scrollEndTimeoutID = 0
        lastScroll = 0
        isMomentumScrolling = false
    }

    const scheduleScrollEndCheck = () => {
        scrollEndTimeoutID = setTimeout(() => {
            if (!isMomentumScrolling && +new Date - lastScroll > scrollEndGap) {
                reset()
                Analytics.timeEnd(evtName)
            } else {
                // Register again
                scheduleScrollEndCheck()
            }
        }, scrollEndGap)
    }

    return class ScrollAnalytics extends Component {
        static displayName = `ScrollAnalytics(${getDisplayName(WrappedComponent)})`
        static WrappedComponent = WrappedComponent

        componentWillUnmount() {
            reset()
        }

        // Regular scroll events trigger once per frame and keeps triggering while the
        // user is dragging the scroll view. This event can fire during a momentum scroll
        // as well. Because of this, we must have special handling in case both types
        // of scrolls are occurring simultaneously:
        //
        //    - We check every SCROLL_END_GAP time and compare the last (regular) scroll timestamp.
        //    - If it occurred more than SCROLL_END_GAP ago, then we consider the scroll to be complete
        //      ONLY if momentum scrolling is not already underway
        //
        _onScroll = throttle(scrollThrottle, () => {
            if (!lastScroll) {
                scheduleScrollEndCheck()
                Analytics.timeStart(evtName)
            }

            lastScroll = +new Date
        })

        _onMomentumScrollBegin = () => {
            isMomentumScrolling = true
        }

        _onMomentumScrollEnd = () => {
            Analytics.timeEnd(evtName)
            // In case momentum scroll ended before regular scroll
            reset()
        }

        render() {
            return <WrappedComponent
                        {...this.props}
                        onScroll={this._onScroll}
                        onMomentumScrollBegin={this._onMomentumScrollBegin}
                        onMomentumScrollEnd={this._onMomentumScrollEnd} />
        }
    }
}

export function getDisplayName(ComponentClass: { displayName?: string, name?: string }): string {
    return ComponentClass.displayName || ComponentClass.name || 'UnknownComponent'
}

// From our neighborly codebase, sfn-client
export function addOrUpdate<T: $Subtype<{}>>(arr: Array<T>, newObject: T, comparator: T => boolean): Array<T> {
    let newState: Array<T>
    let idx: number = arr.findIndex(comparator)

    if (idx === -1) {
        // Gym isn't in the list yet, add it
        newState = [ ...arr.slice(0), newObject ]
    } else {
        // Update in place
        let oldObject = arr[idx]
        newState = [ ...arr.slice(0, idx), Object.assign({}, oldObject, newObject), ...arr.slice(idx + 1) ]
    }

    return newState
}

export function maybeAddPrimitive<T: string | number>(arr: Array<T>, newObject: T): Array<T> {
    let newArr: Array<T> = arr
    let idx: number = arr.findIndex((v: T) => v === newObject)

    if (idx === -1) {
        // Gym isn't in the list yet, add it
        newArr = [ ...arr.slice(0), newObject ]
    }

    return newArr
}

export function removeItem<T: $Subtype<{}>>(arr: Array<T>, item: T, comparator: T => boolean): Array<T> {
    let newState = arr
    let idx = arr.findIndex(comparator)

    if (idx !== -1) {
        // There might be a quicker way to do this
        newState = [ ...arr.slice(0, idx), ...arr.slice(idx + 1) ]
    }

    return newState
}

export function endsWith(s: string, suffix: string): boolean {
    let suffixLen = suffix.length
    return suffixLen <= s.length && s.lastIndexOf(suffix) === s.length - suffixLen
}

export function rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min
}