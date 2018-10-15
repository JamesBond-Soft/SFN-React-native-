// @flow
import reducer from './reducer'
import thunk from 'redux-thunk'
import Analytics from '../services/Analytics'
import { self } from './index'
import { AsyncStorage } from 'react-native'
import { createStore, applyMiddleware, compose } from 'redux'
import { persistStore, autoRehydrate } from 'redux-persist'
import { combineReducers } from 'redux'
import { LoginManager } from 'react-native-fbsdk'
import { RESET_STORE } from './index'
import type { Store } from 'redux'

export type InjectableReducer = {
    injectReducer: (name: string, injectedReducer: Function) => void
}

// TODO Actually create a type for the app's State
export type InjectableStore = Store<any, *> & InjectableReducer

const composeEnhancers = global.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export default function configureStore(onCompletion: () => void = () => { }): Promise<InjectableStore> {
    return new Promise((resolve) => {
        let enhancer = composeEnhancers(applyMiddleware(thunk, self.middleware), autoRehydrate())
        let injected = {}
        let store
        let appReducer
        let rootReducer

        function injectReducer(name, injectedReducer) {
            injected[name] = injectedReducer
            let storeStateReducer = Object.assign({}, reducer, injected)
            console.log('[SFNStore] Replacing reducer due to injection with', storeStateReducer)
            appReducer = combineReducers(storeStateReducer)
            // Automatically handles dispatching initial state for the newly injected reducer
            store.replaceReducer(rootReducer)
        }

        appReducer = combineReducers(reducer)
        rootReducer = function rootReducer(state: any, action: { type: string }): any {
            if (action.type === RESET_STORE) {
                // Logout of FB
                LoginManager.logOut()
                state = {}
                console.log('🔌[SFNStore] Resetting store', store)
            }

            return appReducer(state, action)
        }

        store = Object.assign({}, createStore(rootReducer, enhancer), { injectReducer })
        const persistor = persistStore(store, { storage: AsyncStorage }, function onRehydrate() {
            // TODO Consider making the default route always TabIndex (home) when logged in, instead of
            // the last visited page before the store data was persisted
            console.log('⚡[SFNStore] Finished rehydrating')
            const state = store.getState()

            // Setup analytics session
            if (state.self && state.self.id !== -1) {
                Analytics.member(state.self)
            }

            onCompletion()
            resolve(store)
        })
        if (__DEV__) {
            // Clear out the store automatically in dev so we start with a fresh state
            // If you're developing and constantly refreshing, you may want to comment this out
            // In production, we never want to do this, but occassionally in dev, we do
            persistor.purge()
            LoginManager.logOut()
        }
    })
}
