// @flow
import React, { Component } from 'react'
import Video from 'react-native-video'
import styles from './styles'

type P = {
    onLoadStart: () => void,
    onLoadEnd: () => void,
    style: { display?: string }
}

// Unfortunately we need to load videos in different ways depending on the platform
// https://github.com/react-native-community/react-native-video/issues/560
export default class BGVideo extends Component<void, P, void> {
    render() {
        return (
            <Video
                source={require('../../../video/sfnLoginBg.m4v')}
                repeat={true}
                muted={true}
                style={[ styles.bgVideo, this.props.style ]}
                onLoadStart={this.props.onLoadStart}
                onLoad={this.props.onLoadEnd}
                resizeMode='cover' />
        )
    }
}