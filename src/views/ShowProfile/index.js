// @flow
import React, { Component } from 'react'
import { Platform, Text, View, Image } from 'react-native'
import withAsyncDeps from '../../containers/withAsyncDeps'
import tabView from '../../containers/tabView'
import { connect } from 'react-redux'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { globalStyles, SpecialText, theme } from '../../common'
import Touchable from '../../containers/Touchable'
import { self, gyms } from '../../store'
import styles from './styles'
// $FlowFixMe
import LinearGradient from 'react-native-linear-gradient'
import type { NavigationStackScreenOptions, NavDispatch } from '../../types'
import type { UserJSON } from '../../store/models'

type ProfileProps = {
    self: UserJSON,
    homeGymName: string | null,
    tintColor: string,
    navigation: NavDispatch
}

class ShowProfile extends Component {
    props: ProfileProps

    static RoutePath = 'show'

    static navigationOptions: NavigationStackScreenOptions = ({ navigation }) => {
        // eslint-disable-next-line
        const { params = {} } = navigation.state
        return {
            title: 'Profile',
            headerRight: <Touchable underlayColor='transparent'
                onPress={params.onEdit} style={globalStyles.headerActionContainer}>
                <View>
                    <Text style={[ globalStyles.headerActionTxt, theme.fontSizes.med ]}>
                        Edit
                    </Text>
                </View>
            </Touchable>
        }
    }

    componentDidMount() {
        this.props.navigation.setParams({ onEdit: this._onEdit })
    }

    _onEdit = () => {
        const { navigation } = this.props
        navigation.navigate('EditProfile')
    }

    _onSettingPress = () => {
        const { navigation } = this.props
        navigation.navigate('Settings')
    }

    render() {
        let { self, homeGymName } = this.props
        let { firstName, lastName, phone, email, photoUrl } = self

        let profilePicture

        if (photoUrl) {
            profilePicture = (
                <View style={styles.imagePanel}>
                    <Image
                        style={styles.image}
                        source={{ uri: photoUrl }} />
                </View>
            )
        } else {
            profilePicture = (
                <View style={styles.noImagePanel}>
                    <View style={styles.noImageCircle}>
                        <Text style={styles.noImageText}>ADD A PROFILE PICTURE</Text>
                    </View>
                </View>
            )
        }

        return(
            <LinearGradient { ...theme.linearGradSpec }
                style={styles.gradientBg}>

                <View style={styles.showProfileContainer}>
                    {profilePicture}
                    <View style={styles.infoPanel}>
                        <Text style={styles.fullNameTxt}>{firstName} {lastName}</Text>
                        <Text style={styles.emailTxt}>{email}</Text>
                        <View style={styles.infoBox}>
                            <View style={styles.infoRow}>
                                <Ionicon
                                    style={styles.infoIcon}
                                    name={Platform.OS === 'ios' ? 'ios-call' : 'md-call'}
                                    color={this.props.tintColor}/>
                                <Text style={styles.infoTxt}>{phone}</Text>
                            </View>
                        </View>
                        <View style={styles.infoBox}>
                            <View style={styles.infoRow}>
                                <Ionicon
                                    style={styles.infoIcon}
                                    name={Platform.OS === 'ios' ? 'ios-trophy' : 'md-trophy'}
                                    color={this.props.tintColor}/>
                                <Text style={styles.infoTxt}>{homeGymName}</Text>
                            </View>
                        </View>
                        <Touchable onPress={this._onSettingPress} underlayColor={theme.disabledTextColor}>
                            <View style={styles.btn}>
                                <SpecialText style={[ globalStyles.btnTxt, styles.btnTxt ]}>
                                    SETTINGS
                                </SpecialText>
                            </View>
                        </Touchable>
                    </View>
                </View>

            </LinearGradient>
        )
    }
}

const mapStateToProps = ({ api, gyms, self }) => {
    let homeGymName
    if (gyms.length > 0 && self.homeGym) {
        let intendedGym = gyms.find((gym) => gym.id === self.homeGym)
        homeGymName = (typeof intendedGym !== 'undefined') ?
            intendedGym.name : null
    }
    return { api, self, homeGymName }
}

const ShowProfileCmpt = withAsyncDeps({
    fetchDeps: ({ api, self, fetchGyms, fetchSelf }: any): Promise<any> =>
        Promise.all([
            fetchGyms(api),
            fetchSelf(api, self)
        ]),
    ForComponent: tabView(ShowProfile)
})

const liftActions = { fetchGyms: gyms.fetch, fetchSelf: self.fetch }

export default connect(mapStateToProps, liftActions)(ShowProfileCmpt)
