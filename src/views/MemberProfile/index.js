// @flow
import React, { Component } from 'react'
import Config from 'react-native-config'
// $FlowFixMe
import LinearGradient from 'react-native-linear-gradient'
import Toast from 'react-native-root-toast'
import Touchable from '../../containers/Touchable'
import {
    Text,
    Image,
    TextInput,
    View,
    Linking
} from 'react-native'
import tabView from '../../containers/tabView'
import { globalStyles, SpecialText, theme } from '../../common'
import ImagePicker from 'react-native-image-crop-picker'
import { RNS3 } from 'react-native-aws3'
import { self } from '../../store'
import { connect } from 'react-redux'
import withAsyncDeps from '../../containers/withAsyncDeps'
import styles from './styles'
import generateUUID from '../../services/uuidGenerator'
import type { NavDispatch, NavigationStackScreenOptions } from '../../types'
import type { API } from '../../io/api'
import type { UserJSON } from '../../store/models'


type P = {
    api: API,
    self: UserJSON,
    updateSelf: () => Promise<any>,
    navigation: NavDispatch
}

type S = {
    id?: number,
    firstName?: string,
    lastName?: string,
    email?: string,
    phone?: string,
    photoUrl?: string,
    isToastVisible: boolean
}


class MemberProfile extends Component<void, P, S> {
    props: P
    state: S

    _toastTimeout = 0

    constructor() {
        super(...arguments)
        let { id, firstName, lastName, email, phone, photoUrl } = this.props.self
        this.state = {
            id, firstName, lastName, email, phone, photoUrl,
            isToastVisible: false
        }
    }

    static RoutePath = 'edit'

    static navigationOptions: NavigationStackScreenOptions = ({ navigation }) => {
        // eslint-disable-next-line
        const { params = {} } = navigation.state

        return {
            title: 'Edit Profile',
            headerRight: <Touchable underlayColor='transparent'
                onPress={params.onSubmit} style={globalStyles.headerActionContainer}>
                <View>
                    <Text style={[ globalStyles.headerActionTxt, theme.fontSizes.med ]}>
                        Save
                    </Text>
                </View>
            </Touchable>
        }
    }

    componentDidMount() {
        this.props.navigation.setParams({ onSubmit: this._onSubmit })
    }

    componentWillUnmount() {
        clearTimeout(this._toastTimeout)
    }

    _onSubmit = async () => {
        let { api, updateSelf, self, navigation } = this.props
        let { id, firstName, lastName, email, phone, photoUrl } = this.state
        try {
            await updateSelf(api, self, { id, firstName, lastName, email, phone, photoUrl })
            this.setState({ isToastVisible: true })
            navigation.navigate('ShowProfile')
        } catch (err) {
            // TODO Raygun
            console.log('[MemberProfile] Error _onSubmit', err)
        }
    }

    _onImageUploaded = async () => {
        let { api, updateSelf, self } = this.props

        try {
            let image = await ImagePicker.openPicker({
                width: 150,
                height: 150,
                cropping: true
            })

            let filename = [ generateUUID(), image.mime.split('/')[1] ].join('.')

            const file = {
                uri: image.path,
                name: filename,
                type: image.mime
            }

            // TODO - move access and secret key somewhere else
            // more suitable
            const options = {
                keyPrefix: 'mobile-avatars/',
                bucket: Config.AWS_S3_BUCKET,
                region: Config.AWS_S3_REGION,
                accessKey: Config.AWS_S3_ACCESS_KEY,
                secretKey: Config.AWS_S3_SECRET_KEY,
                successActionStatus: 201
            }

            let response = await RNS3.put(file, options)
            if (response.status !== 201) {
                throw new Error('Failed to upload image to S3')
            }

            let photoUpdate = {
                id: self.id,
                photoUrl: response.body.postResponse.location
            }

            await updateSelf(api, self, photoUpdate)

            this.setState({
                photoUrl: photoUpdate.photoUrl,
                isToastVisible: true
            })
        } catch (err) {
            // TODO Raygun
            console.log('[MemberProfile] Error _onImageUploaded', err)
        }

    }

    _onChangePasswordPress = () => {
        Linking.openURL('https://www.socialfitnessnetwork.com/forgot-password/')
    }

    _setFirstName = (firstName: string) => this.setState({ firstName })
    _setLastName = (lastName: string) => this.setState({ lastName })
    _setEmail = (email: string) => this.setState({ email })
    _setPhone = (phone: string) => this.setState({ phone })

    render() {
        let { firstName, lastName, email, phone, photoUrl } = this.state

        let profilePicture

        if (photoUrl) {
            profilePicture = (
                <Touchable onPress={this._onImageUploaded} style={styles.imagePanel}>
                    <Image
                        style={styles.image}
                        source={{ uri: photoUrl }} />
                </Touchable>
            )
        } else {
            profilePicture = (
                <Touchable onPress={this._onImageUploaded} style={styles.noImagePanel}>
                    <View style={styles.noImageCircle}>
                        <Text style={styles.noImageText}>ADD A PROFILE PICTURE</Text>
                    </View>
                </Touchable>
            )
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
                    Your profile is saved!
                </Toast>
            )
        }

        return (
            <LinearGradient { ...theme.linearGradSpec }
                style={styles.gradientBg}>

                <View style={styles.memberProfileContainer}>
                    {profilePicture}

                    <View style={styles.formPanel}>
                        <View style={styles.formElementRow}>
                            <View style={[ globalStyles.input6, styles.input ]}>
                                <TextInput
                                    underlineColorAndroid='transparent'
                                    placeholder='First Name'
                                    style={globalStyles.txtInput}
                                    placeholderTextColor={theme.disabledCanvasColor}
                                    onChangeText={this._setFirstName}
                                    value={firstName} />
                            </View>

                            <View style={[ globalStyles.input6, styles.input, styles.lastName ]}>
                                <TextInput
                                    underlineColorAndroid='transparent'
                                    placeholder='Last Name'
                                    style={globalStyles.txtInput}
                                    placeholderTextColor={theme.disabledCanvasColor}
                                    onChangeText={this._setLastName}
                                    value={lastName} />
                            </View>
                        </View>

                        <View style={styles.formElementRow}>
                            <View style={[ globalStyles.input12, styles.input ]}>
                                <TextInput
                                    underlineColorAndroid='transparent'
                                    placeholder='Email'
                                    placeholderTextColor={theme.disabledCanvasColor}
                                    style={globalStyles.txtInput}
                                    onChangeText={this._setEmail}
                                    editable={false}
                                    value={email} />
                            </View>
                        </View>

                        <View style={styles.formElementRow}>
                            <View style={[ globalStyles.input12, styles.input ]}>
                                <TextInput
                                    underlineColorAndroid='transparent'
                                    style={globalStyles.txtInput}
                                    placeholder='Phone'
                                    placeholderTextColor={theme.disabledCanvasColor}
                                    onChangeText={this._setPhone}
                                    value={phone} />
                            </View>
                        </View>

                        <View style={styles.btnPanel}>
                            <Touchable onPress={this._onChangePasswordPress} underlayColor={theme.disabledTextColor}>
                                <View style={styles.btn}>
                                    <SpecialText style={[ globalStyles.btnTxt, styles.btnTxt ]}>
                                        CHANGE PASSWORD
                                    </SpecialText>
                                </View>
                            </Touchable>
                        </View>
                    </View>
                </View>
                {maybeToast}
            </LinearGradient>
        )
    }
}


const mapStateToProps = ({ api, self }) => ({ api, self })
const liftActions = { fetchSelf: self.fetch, updateSelf: self.update }

const memberProfileCmpt = withAsyncDeps({
    fetchDeps: ({ api, self, fetchSelf }: any): Promise<any> => fetchSelf(api, self),
    ForComponent: tabView(MemberProfile)
})

export default connect(mapStateToProps, liftActions)(memberProfileCmpt)
