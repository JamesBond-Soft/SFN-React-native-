// @flow

// !! TODO
// Temporary polyfill for ReactComponent to avoid flowtype errors involving component
// $FlowFixMe
declare type ReactComponent<I, P, S> = typeof Class<Component<I, P, S>>;
declare type ReactComponentHOC<I, P, S> = ReactComponent<I, P, S> & {
  WrappedComponent?: ReactComponentHOC<*, *, *>
};