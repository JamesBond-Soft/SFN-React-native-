// @flow
import React, { Component } from 'react'
import styles from './styles'
import withAsyncDeps from '../../containers/withAsyncDeps'
import Touchable from '../../containers/Touchable'
import { connect } from 'react-redux'
import { View, Switch } from 'react-native'
import { SFNText } from '../../common'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { LoginButton } from 'react-native-fbsdk'
import type { FeedPrivacy } from '../../store/models'
import { updateFeedPrivacy, getFeedPrivacy } from '../../io/setting'
import Toast from 'react-native-root-toast'

import type { NavigatorProps, NavigationStackScreenOptions } from '../../types'
import type { API } from '../../io/api'

import { loginModes, RESET_STORE } from '../../store'
import {
    StackNavigator as stackNavigator,
    NavigationActions,
    // $FlowFixMe
} from 'react-navigation'


type PrivacyState = {
    isEveryone: boolean,
    isFriend: boolean,
    isPrivate: boolean,
    syncing: boolean,
    isToastVisible: boolean
}

type PrivacyProps = {
    memberId: number,
    feedPrivacy: FeedPrivacy,
    api: API,
    setFeedPrivacy: () => Promise<any>,
    getFeedPrivacy: () => Promise<any>,
} & NavigatorProps

// TODO Find a home
const TOAST_DURATION_MS = 5000

class PrivacySetting extends Component<void, PrivacyProps, PrivacyState> {
    state: PrivacyState;
    props: PrivacyProps;
    _toastTimeout = 0;

    constructor(props) {
        super(props)

        this.state = {
            ...this.feedPrivacyToState(props.feedPrivacy),
            syncing: true,
            isToastVisible: false,
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.syncing) {
            this.setState({
                ...this.feedPrivacyToState(nextProps.feedPrivacy),
                syncing: false
            })
        }
    }

    componentWillUnmount() {
        this.setState({ isToastVisible: false })
        clearTimeout(this._toastTimeout)
    }

    feedPrivacyToState(feedPrivacy: FeedPrivacy) {
        if (feedPrivacy.privacy == 'public') {
            return { isEveryone: true, isFriend: false, isPrivate: false }
        } else if (feedPrivacy.privacy == 'friends') {
            return { isEveryone: false, isFriend: true, isPrivate: false }
        } else if (feedPrivacy.privacy == 'private') {
            return { isEveryone: false, isFriend: false, isPrivate: true }
        }
    }

    setFeedPrivacy = async (param) => {
        try {
            await this.props.setFeedPrivacy(this.props.api, param)
        } catch (error) {
            this.setState({
                syncing: false,
                isToastVisible: true,
            }, () => this._toastTimeout = setTimeout(() => this.setState({ isToastVisible: false }), TOAST_DURATION_MS))
        }
    }

    _toggleEveryone = (value) => {
        if (value) {
            this.setState({ isEveryone: value, isFriend: false, isPrivate: false, syncing: true })
            let param : FeedPrivacy = { memberId: this.props.memberId, privacy: 'public' }

            this.setFeedPrivacy(param)
        }
    }

    _toggleFriend = (value) => {
        if (value) {
            this.setState({ isEveryone: false, isFriend: value, isPrivate: false, syncing: true })
            let param : FeedPrivacy = { memberId: this.props.memberId, privacy: 'friends' }

            this.setFeedPrivacy(param)
        }
    }

    _togglePrivate = (value) => {
        if (value) {
            this.setState({ isEveryone: false, isFriend: false, isPrivate: value, syncing: true })
            let param : FeedPrivacy = { memberId: this.props.memberId, privacy: 'private' }

            this.setFeedPrivacy(param)
        }
    }

    render() {
        let content = (
            <View>
                <View style={styles.itemContainer}>
                    <SFNText style={styles.itemLabel}>Everyone</SFNText>
                    <Switch
                        disabled={this.state.isEveryone}
                        onValueChange={this._toggleEveryone}
                        value={this.state.isEveryone}/>
                </View>
                <View style={styles.itemContainer}>
                    <SFNText style={styles.itemLabel}>Friends</SFNText>
                    <Switch
                        disabled={this.state.isFriend}
                        onValueChange={this._toggleFriend}
                        value={this.state.isFriend}/>
                </View>
                <View style={styles.itemContainer}>
                    <SFNText style={styles.itemLabel}>Private</SFNText>
                    <Switch
                        disabled={this.state.isPrivate}
                        onValueChange={this._togglePrivate}
                        value={this.state.isPrivate}/>
                </View>
            </View>
        )

        let maybeToast = !this.state.isToastVisible ? null : (
            <Toast
                visible={true}
                shadow={true}
                animation={true}
                hideOnPress={true}>
                Sync Failed
            </Toast>
        )

        return (
            <View style={styles.container}>
                {/* privacy setting */}
                <View style={styles.sectionContainer}>
                    <SFNText style={styles.sectionLabel}>LEVEL</SFNText>
                </View>
                {content}
                {maybeToast}
            </View>
        )
    }

    static RoutePath = 'settings'

    static navigationOptions: NavigationStackScreenOptions = {
        title: 'Privacy'
    }
}

const privacyMapStateToProps = ({ self:{ id }, api, settingFeedprivacy }) => {
    return {
        memberId: id,
        feedPrivacy: settingFeedprivacy,
        api
    }
}

const privacyMapDispatchToProps = {
    setFeedPrivacy: updateFeedPrivacy,
    getFeedPrivacy
}

const PrivacySettingCmpt = withAsyncDeps({
    fetchDeps: (props: any): Promise<any> => props.getFeedPrivacy(props.api),
    ForComponent: PrivacySetting
})
const PrivacySettingScreen = connect(privacyMapStateToProps, privacyMapDispatchToProps)(PrivacySettingCmpt)

type NotificationState = {
    once1Day: boolean,
    once3Day: boolean,
    once14Day: boolean,
}

class NotificationSetting extends Component<void, NavigatorProps, NotificationState> {
    props: NavigatorProps
    state: NotificationState

    constructor(props) {
        super(props)

        this.state = {
            once1Day: true,
            once3Day: false,
            once14Day: false,
        }
    }

    _toggleOnce1Day = (value) => {
        if (value) this.setState({ once1Day: value, once3Day: false, once14Day: false })
    }

    _toggleOnce3Day = (value) => {
        if (value) this.setState({ once1Day: false, once3Day: value, once14Day: false })
    }

    _toggleOnce14Day = (value) => {
        if (value) this.setState({ once1Day: false, once3Day: false, once14Day: value })
    }

    render() {
        return (
            <View style={styles.container}>
                {/* privacy setting */}
                <View style={styles.sectionContainer}>
                    <SFNText style={styles.sectionLabel}>FREQUENCY</SFNText>
                </View>
                <View style={styles.itemContainer}>
                    <SFNText style={styles.itemLabel}>Once a day</SFNText>
                    <Switch
                        disabled={this.state.once1Day}
                        onValueChange={this._toggleOnce1Day}
                        value={this.state.once1Day}/>
                </View>
                <View style={styles.itemContainer}>
                    <SFNText style={styles.itemLabel}>Once every 3 days</SFNText>
                    <Switch
                        disabled={this.state.once3Day}
                        onValueChange={this._toggleOnce3Day}
                        value={this.state.once3Day}/>
                </View>
                <View style={styles.itemContainer}>
                    <SFNText style={styles.itemLabel}>Once 2 weeks</SFNText>
                    <Switch
                        disabled={this.state.once14Day}
                        onValueChange={this._toggleOnce14Day}
                        value={this.state.once14Day}/>
                </View>
            </View>
        )
    }
    static navigationOptions: NavigationStackScreenOptions = {
        title: 'Notification',
    }
}


const FBSDK_PERMISSIONS = [ 'public_profile', 'email', 'user_friends' ]

type SettingsProps = {
    resetStore: any,
    nav: any,
    loginMode: $Keys<typeof loginModes>,
    api: any,
    memberId: number,
    getFeedPrivacy: any,
} & NavigatorProps

type SettingsState = {
    isLoading: boolean
}

class Settings extends Component<void, SettingsProps, SettingsState> {
    props: SettingsProps
    state: SettingsState

    constructor(props){
        super(props)

        this.state = {
            isLoading: false
        }
    }

    _handleLogoutFinished = () => {
        this.props.resetStore()
    }

    _pressPrivacy = () => {
        this.props.navigation.dispatch(NavigationActions.navigate({ routeName: 'PrivacySetting' }))
    }

    _pressNotification = () => {
        this.props.navigation.dispatch(NavigationActions.navigate({ routeName: 'NotificationSetting' }))
    }

    render() {
        let LogoutBtn = null

        if (this.props.loginMode !== loginModes.Facebook && !this.state.isLoading) {
            LogoutBtn =
            <Touchable style={styles.itemContainer} onPress={this._handleLogoutFinished}>
                <View>
                    <SFNText style={styles.itemLabel}>Log out</SFNText>
                </View>
            </Touchable>
        } else {
            LogoutBtn =
            <View style={styles.fbLoginButtonWrapper}>
                <LoginButton
                    readPermissions={FBSDK_PERMISSIONS}
                    onLogoutFinished={this._handleLogoutFinished} />
            </View>
        }

        return (
            <View style={styles.container}>
                {/* privacy setting */}
                <View style={styles.sectionContainer}>
                    <SFNText style={styles.sectionLabel}>PRIVACY</SFNText>
                </View>
                <Touchable onPress={this._pressPrivacy}>
                    <View style={styles.itemContainer} >
                        <SFNText style={styles.itemLabel}>Feed</SFNText>
                        <Ionicon
                        name='ios-arrow-forward'
                        size={25}
                        color={'#6eb9cd'} />
                    </View>
                </Touchable>

                {/* notification setting  for now commented out*/}
                {/* <View style={styles.sectionContainer}>
                    <SFNText style={styles.sectionLabel}>NOTIFICATIONS</SFNText>
                </View>
                <Touchable onPress={this._pressNotification}>
                    <View style={styles.itemContainer} >
                        <SFNText style={styles.itemLabel}>Unverified Check-Ins</SFNText>
                        <Ionicon
                        name='ios-arrow-forward'
                        size={25}
                        color={'#6eb9cd'} />
                    </View>
                </Touchable>*/}

                {/* Account Settings */}
                <View style={styles.sectionContainer}>
                <SFNText style={styles.sectionLabel}>ACCOUNT</SFNText>
                </View>
                {LogoutBtn}
            </View>
        )
    }

    static navigationOptions = {
        title: 'Settings'
    }
}

const mapStateToProps = ({ loginMode, nav, api, self:{ id }}) => {
    return {
        loginMode,
        nav,
        api,
        memberId: id
    }
}

const mapDispatchToProps = (dispatch) =>
({
    resetStore: () => {dispatch({ type: RESET_STORE })},
})

const SettingsScreen = connect(mapStateToProps, mapDispatchToProps)(Settings)

const SettingsStack = stackNavigator(
    {
        Settings: { screen: SettingsScreen },
        PrivacySetting: { screen: PrivacySettingScreen },
        NotificationSetting: { screen: NotificationSetting },
    },
    {
        headerMode: 'none'
    }
)

export default SettingsStack