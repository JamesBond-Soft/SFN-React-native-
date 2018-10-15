// @flow
import React from 'react'

// react-navigation
export type NavDispatch = {
  dispatch(any): void;
  setParams(any): void;
  navigate(string): void;
};

export type NavigatorProps = {
  navigation: NavDispatch;
};

export type NavigationScreenOptions = {
  title?: string,
};

export type Style =
  | { [key: string]: any }
  | number
  | false
  | null
  | void
  | Array<Style>;

export type NavigationStackScreenOptions = NavigationScreenOptions & {
  header?: ?(React.Element<*> | ((headerProps: { [key: string]: any }/*HeaderProps*/) => React.Element<*>));
  headerTitle?: string | React.Element<*>;
  headerTitleStyle?: Style;
  headerTintColor?: string;
  headerLeft?: ?React.Element<*>;
  headerBackTitle?: string;
  headerTruncatedBackTitle?: string;
  headerBackTitleStyle?: Style;
  headerPressColorAndroid?: string;
  headerRight?: React.Element<*>;
  headerStyle?: Style;
  gesturesEnabled?: boolean;
}