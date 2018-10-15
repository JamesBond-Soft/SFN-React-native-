// @flow
import React, { Component } from 'react'
import styles from './styles'
import Analytics from '../../services/Analytics'
import Touchable from '../../containers/Touchable'
// $FlowFixMe - Does not understand *.android and *.ios extensions
import BGVideo from './BGVideo'
import Toast from 'react-native-root-toast'
import { SpecialText, SFNText } from '../../common/defaults'
import { Loader } from '../../containers/loader'
import { Image, Linking, Text, View, TextInput, KeyboardAvoidingView } from 'react-native'
import { codes } from '../../io/api'
import { connect } from 'react-redux'
import { theme, globalStyles } from '../../common'
import { friends, self, authToken, fbAuthData, loginModes, loginMode } from '../../store'
// $FlowFixMe
import { NavigationActions } from 'react-navigation'
import { LoginManager, LoginButton, AccessToken, GraphRequest, GraphRequestManager } from 'react-native-fbsdk'
import { facebookAuth, sfnAuth } from '../../io/auth'
import type { TokenResponse } from '../../io/auth'
import type { BaseAPIResponse } from '../../io/api'
import type { NavigatorProps, NavigationStackScreenOptions } from '../../types'
import type { FBAuthData } from '../../store'

const BTN_SPECIAL_SPACING = 4
const VIDEO_LOAD_EVT = 'bgVideoLoad'
const FBAPI_VERSION = 'v2.9'
const logo = require('../../../assets/images/logoLarge.png')
const videoPlaceholderImg = require('../../../assets/images/sfnLoginBgBlur.png')

type Props = {
    nav: any,
    loginMode: $Keys<typeof loginModes>,
    fbAuthData: FBAuthData,
    setLoginMode: typeof loginMode.action,
    setSelf: typeof self.action,
    setFriends: typeof friends.action,
    setAuthToken: typeof authToken.action,
    setFBAuthData: typeof fbAuthData.action
} & NavigatorProps

type State = {
    isLoading: boolean,
    isVideoLoaded: boolean,
    isVideoLoading: boolean,
    isToastVisible: boolean,
    toastMessage: string
}

type FacebookUserInfo = {
    name?: string,
    email?: string,
    id: string,
    picture?: {
        data: {
            is_silhouette: boolean,
            url: string
        }
    }
}

type SFNLoginProps = {
    // TODO Figure out how to extract JSX.Element interface from React namespace
    // so we don't have to use `any` here
    renderFBLoginBtn: () => any,
    onLoginPress: (string, string) => Promise<void>,
    isFallback: boolean,
    nav: any
} & NavigatorProps

type SFNLoginState = {
    loginEmail: string,
    loginPassword: string
}

type Friend = {
    name: string,
    id: string
}

// https://developers.facebook.com/docs/facebook-login/permissions
const FBSDK_PERMISSIONS = [ 'public_profile', 'email', 'user_friends' ]

// The SFN login screen (non-FB)
class SFNLogin extends Component<void, SFNLoginProps, SFNLoginState> {
    props: SFNLoginProps;
    state: SFNLoginState;

    constructor() {
        super(...arguments)
        this.state = { loginEmail: '', loginPassword: '' }
    }

    _setEmail = (loginEmail: string) => this.setState({ loginEmail })
    _setPassword = (loginPassword: string) => this.setState({ loginPassword })
    _onLoginPress = () => this.props.onLoginPress(this.state.loginEmail, this.state.loginPassword)

    _onForgotPress = () => {
        Analytics.viewAction('forgotLinkClick')
        Linking.openURL('https://www.socialfitnessnetwork.com/forgot-password/')
    }

    render() {
        let maybeText = null

        if (this.props.isFallback) {
            maybeText = (
                <SFNText style={styles.fallbackTxt}>
                    It looks like this might be your first time logging in with Facebook.
                    Login with your SFN account below so we know who you are.
                </SFNText>
            )
        }

        return (
            <View style={styles.sfnLoginContainer}>
                {maybeText}
                <View style={globalStyles.input12}>
                    <TextInput
                        underlineColorAndroid='transparent'
                        autoCapitalize='none'
                        placeholder='Email'
                        placeholderTextColor={theme.disabledColor}
                        style={globalStyles.txtInput}
                        onChangeText={this._setEmail}
                        value={this.state.loginEmail} />
                </View>
                <View style={[ globalStyles.input12, styles.inputMargin ]}>
                    <TextInput
                        underlineColorAndroid='transparent'
                        placeholder='Password'
                        placeholderTextColor={theme.disabledColor}
                        style={globalStyles.txtInput}
                        onChangeText={this._setPassword}
                        value={this.state.loginPassword}
                        secureTextEntry />
                </View>
                <View style={styles.btnContainer}>
                    <Touchable underlayColor={theme.disabledTextColor} onPress={this._onLoginPress}>
                        <View style={globalStyles.btn}>
                            <SpecialText style={globalStyles.btnTxt} spacing={BTN_SPECIAL_SPACING}>
                                SIGN IN
                            </SpecialText>
                        </View>
                    </Touchable>
                    <Touchable underlayColor={theme.disabledTextColor} onPress={this._onForgotPress}>
                        <View style={[ globalStyles.btnTransparent, styles.rightBtn ]}>
                            <SpecialText style={globalStyles.btnTxt} spacing={BTN_SPECIAL_SPACING}>
                                FORGOT?
                            </SpecialText>
                        </View>
                    </Touchable>
                </View>
                {this.props.renderFBLoginBtn()}
            </View>
        )
    }
}

class Login extends Component<void, Props, State> {
    state: State;
    props: Props;

    _toastTimeout = 0

    static RoutePath = 'login'
    static navigationOptions: NavigationStackScreenOptions = {
        // Hide the header
        header: null
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            isLoading: false,
            isVideoLoaded: false,
            isVideoLoading: false,
            isToastVisible: false,
            toastMessage: ''
        }
    }

    componentWillUnmount() {
        clearTimeout(this._toastTimeout)
    }

    _loadStart = () => {
        if (!this.state.isVideoLoading) {
            this.setState({ isVideoLoading: true })
            Analytics.timeStart(VIDEO_LOAD_EVT)
        }
    }

    // Called when the background video loads
    _loadEnd = () => {
        if (!this.state.isVideoLoaded) {
            this.setState({ isVideoLoaded: true })
            Analytics.timeEnd(VIDEO_LOAD_EVT)
        }
    }

    // TODO Move to centralized place
    _navToIndex(): void {
        this.props.navigation.dispatch(NavigationActions.reset({
            // Fixes https://github.com/react-community/react-navigation/issues/1127
            key: null,
            index: 0,
            actions: [
                NavigationActions.navigate({ routeName: 'TabIndex' })
            ],
        }))
    }

    _onSFNLoginPress = async (email: string, password: string) => {
        let res
        try {
            this.setState({ isLoading: true })
            res = await sfnAuth({ email, password }, this.props.fbAuthData)
        } catch (err) {
            // TODO Handle expired FB JWT
            // - Redirect to regular Facebook login screen by changing loginMode
            // - Handle different response code of invalid password vs. expired fbAuthData token
            // - Clear fbAuthData if token was expired
            console.log('Error while authorizing with SFN login credentials', err)

            const newState = {
                isToastVisible: true,
                isLoading: false,
                toastMessage: 'Wrong email or password!'
            }

            if (err.code === codes.UNAUTHORIZED_TOKEN_EXPIRED) {
                this.props.setFBAuthData({})
                this.props.setLoginMode(loginModes.Facebook)
                newState.toastMessage = 'Please login with Facebook again'
            }

            this.setState(newState)
            return
        } finally {
            this.setState({ isLoading: false })
        }

        this._handleAuthSuccess(res)
    }

    _handleAuthSuccess(res: BaseAPIResponse<TokenResponse>): void {
        console.log('handleAuthSuccess')
        // TODO Consider moving to async response handlers io/auth.js calls
        this.props.setSelf(res.data.member)
        this.props.setAuthToken(res.data.token)
        this.props.setFBAuthData({})

        // TODO Update friends IDs
        this._navToIndex()
    }

    async _handlePostLoginInfo(userInfo: FacebookUserInfo) {
        let res
        const fbData = {
            fbID: userInfo.id,
            fbEmail: userInfo.email,
            fbPhotoUrl: userInfo.picture && userInfo.picture.data ? userInfo.picture.data.url : ''
        }

        try {
            // TODO Place a loading animation in the view at this point
            res = await facebookAuth(fbData)
        } catch (err) {
            // This occurs on a FB additional auth challenge where we require the user to
            // login to their SFN account first
            if (err.code === codes.E_MEMBER_NOT_FOUND) {
                // We need to challenge the user to login via their SFN account
                this.props.setLoginMode(loginModes.SFNFallback)
                this.props.setFBAuthData({
                    fbToken: err.data.token,
                    fbEmail: fbData.fbEmail,
                    fbPhotoUrl: fbData.fbPhotoUrl
                })
            } else {
                console.error('Error while authorizing via FB', err)
            }

            LoginManager.logOut()
            return
        } finally {
            this.setState({ isLoading: false })
        }

        this.props.setLoginMode(loginModes.Facebook)
        this._handleAuthSuccess(res)
    }

    _handleLoginFinished = (err: ?Error, result: any) => {
        if (err) {
            console.log('[SFNLogin] Error at login', result.error)
        } else if (result.isCancelled) {
            console.log('[SFNLogin] Login was cancelled')
        } else {
            console.log('[SFNLogin] Login finished!', result)
            // TODO Store result.grantedPermissions locally
            AccessToken.getCurrentAccessToken().then((data: any) => {
                this.setState({ isLoading: true })
                const accessToken = data.accessToken.toString()
                let userInfo: FacebookUserInfo

                // $FlowFixMe
                const onUserInfoResponse = (err: ?{ }, result: FacebookUserInfo): void => {
                    if (err) {
                        console.log('[SFNLogin] Error on userInfo request', err)
                        return
                    }

                    userInfo = result
                }

                // $FlowFixMe
                const onFriendInfoResponse = (err: ?{ }, result: { data: Array<Friend> }): void => {
                    if (err) {
                        console.log('[SFNLogin] Error on friendInfo request', err)
                        return
                    }

                    this.props.setFriends(result.data.map((f) => f.id))
                }

                const requestConf = { version: FBAPI_VERSION, accessToken }
                const friendsRequest = new GraphRequest(
                    // '/me/friends?fields=installed',
                    '/me/friends',
                    requestConf,
                    onFriendInfoResponse
                )

                const selfInfo = new GraphRequest('/me?fields=email,id,picture', requestConf, onUserInfoResponse)

                console.log('[SFNLogin] Performing FB API request')
                // Make a graph request for the user's email and attempt to cross reference
                // it within our system
                new GraphRequestManager()
                    // TODO Defer friendsRequest to the Attendance feed page
                    .addRequest(friendsRequest)
                    .addRequest(selfInfo)
                    .addBatchCallback((err: ?{ }, result: ?{ }) => {
                        if (err) {
                            console.error('[SFNLogin] Unexpected error during FB request', err, result)
                        }

                        if (userInfo) {
                            console.log('[SFNLogin] handlePostLoginInfo')
                            this._handlePostLoginInfo(userInfo)
                        } else {
                            // TODO Fallback to SFN login instead
                            console.warn('[SFNLogin] No userInfo found, aborting FB login and logging back out')
                            LoginManager.logOut()
                            this.setState({ isLoading: false })
                        }
                    })
                    .start()
            })
        }
    }

    // TODO Clear out FB login related data - Friends and JWT token, reset loginMode to default
    _handleLogoutFinished = () => {
        this.props.setLoginMode(loginModes.Facebook)
    }
    _setLoginModeSFN = () => this.props.setLoginMode(loginModes.SFN)
    _renderFBLoginBtn = () =>
    <LoginButton
        readPermissions={FBSDK_PERMISSIONS}
        onLoginFinished={this._handleLoginFinished}
        onLogoutFinished={this._handleLogoutFinished}/>

    render() {
        let { loginMode, nav } = this.props
        let renderSFN = false

        // Default content
        let content = (
            <View>
                {this._renderFBLoginBtn()}
            </View>
        )

        let maybeSFNLoginLink = (
            <Text style={styles.textLink} onPress={this._setLoginModeSFN}>
                Login with your SFN account
            </Text>
        )

        if (loginMode === loginModes.SFN || loginMode === loginModes.SFNFallback) {
            renderSFN = true
            maybeSFNLoginLink = null
            content =
                <SFNLogin
                    nav={this.props.nav}
                    navigation={this.props.navigation}
                    renderFBLoginBtn={this._renderFBLoginBtn}
                    isFallback={loginMode === loginModes.SFNFallback}
                    onLoginPress={this._onSFNLoginPress} />
        }

        let videoPlaceholder =
            <Image source={videoPlaceholderImg} style={styles.videoPlaceholder} />

        let videoStyle = { display: 'none' }

        // If video is loaded hide container background to show the video
        if (this.state.isVideoLoaded) {
            delete videoStyle.display
            videoPlaceholder = null
        }

        let video = null
        if (nav && nav.routePath === Login.RoutePath) {
            video = <BGVideo onLoadStart={this._loadStart} onLoadEnd={this._loadEnd} style={videoStyle} />
        }

        let maybeToast

        if (this.state.isToastVisible) {
            clearTimeout(this._toastTimeout)
            this._toastTimeout = setTimeout(() => this.setState({
                isToastVisible: false
            }), 5000) // hide toast after 5s

            maybeToast = (
                <Toast
                    visible={true}
                    shadow={true}
                    animation={true}
                    hideOnPress={true}>
                    {this.state.toastMessage}
                </Toast>
            )
        }

        return (
            <View style={ styles.container }>
                <View style={ styles.bgContainer }>
                    {video}
                    {videoPlaceholder}
                </View>
                <KeyboardAvoidingView behavior='padding'>
                    <Image source={logo} style={[ styles.logo, renderSFN ? styles.sfnLogoStyle : {} ]} />
                    <Loader isLoading={this.state.isLoading}>
                        <KeyboardAvoidingView behavior='padding' style={ styles.bg }>
                            {content}
                        </KeyboardAvoidingView>
                    </Loader>
                </KeyboardAvoidingView>
                {maybeSFNLoginLink}
                {maybeToast}
            </View>
        )
    }
}

export default connect(({ loginMode, nav, fbAuthData }) => ({ loginMode, nav, fbAuthData }), {
    setSelf: self.action,
    setFriends: friends.action,
    setAuthToken: authToken.action,
    setLoginMode: loginMode.action,
    setFBAuthData: fbAuthData.action
})(Login)
