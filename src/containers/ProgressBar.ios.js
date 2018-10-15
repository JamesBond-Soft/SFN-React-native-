// @flow
import React, { Component } from 'react'
import { ProgressViewIOS } from 'react-native'

type Props = {
  progress?: number;
  color?: string;
}

export default class ProgressBarIOS extends Component<void, Props, void> {
    props: Props;

    render() {
        const { progress, color, ...props } = this.props
        return (
          <ProgressViewIOS
              {...props}
              progress={progress ? progress / 100 : 0.5}
              progressTintColor={color ? color : '#fff'}
              trackTintColor='#000'/>
        )
    }
}
