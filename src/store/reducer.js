// @flow
import { AR } from './index'

let reducer = {}
Object.keys(AR).forEach((key) => (reducer[key] = AR[key].reducer))

export default reducer
