// @flow
import React, { Component } from 'react'
import { ProgressBarAndroid  } from 'react-native'

type Props = {
  progress?: number;
  color?: string;
}

export default class ProgressBarDroid extends Component<void, Props, void> {
    props: Props;

    render() {
        const { progress, color, ...props } = this.props
        return (
          <ProgressBarAndroid
              {...props}
              styleAttr='Horizontal'
              indeterminate={false}
              progress={progress ? progress / 100 : 0.5}
              color={color ? color : '#fff'}/>
        )
    }
}
