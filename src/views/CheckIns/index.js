// @flow
import React, { Component, PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, FlatList, Text, Dimensions, TextInput, Modal } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'
import moment from 'moment'
import Fuse from 'fuse.js'
import haversine from 'haversine-distance'
import { createSelector } from 'reselect'

import { scrollAnalytics } from '../../util'
import { SFNText, globalStyles, theme } from '../../common'
import Touchable from '../../containers/Touchable'
// import Analytics from '../../services/Analytics'
import withAsyncDeps from '../../containers/withAsyncDeps'
import tabView from '../../containers/tabView'
import styles from './styles'
import { newAttendance, undoAttendance } from '../../io/attendance'
import { attendanceStatus } from '../../store/models'
import { currentLocation, isGlobalLoading } from '../../store'

import type { API } from '../../io/api'
import type { NavigationStackScreenOptions } from '../../types'
import type { ScrollAnalyticsProps } from '../../util'
import type { Gym, Attendance, UserJSON, LocationType } from '../../store/models'

const UNDO_WINDOW_MS = 1000 * 60 * 30 // 30 minutes
const CHECKIN_LOCK_MS = 1000 * 60 * 60 //1000 * 60 * 60 // 1 hour
// const DISTANCE_RANGE = 4000 // in meters
const { width: WIDTH, height: HEIGHT } = Dimensions.get('window')
const NAME_SEARCH_OPTION: any = {
    shouldSort: true,
    threshold: 0.6,
    minMatchCharLength: 1,
    keys: [ 'name', 'zipCode' ]
}

const METER_TO_MILE = 0.000621371
const formatMeters = (distanceMeters: number) => {
    const milesAway = +(distanceMeters * METER_TO_MILE).toFixed(2)
    return milesAway < 100 ? milesAway : '100+'
}

type SearchBarProps = {
    handleSearch: (term: string) => void
}
type SearchBarState = {
    searching: boolean,
    searchTerm: string,
    overlayTop: number
}
class SearchBar extends Component<void, SearchBarProps, SearchBarState> {
    props: SearchBarProps;
    state: SearchBarState;

    constructor(props) {
        super(props)
        this.state = {
            searching: false,
            searchTerm: '',
            overlayTop: 0,
        }
    }

    _searchInput: any = null;
    _captureRef = (ref: any) => this._searchInput = ref

    _onChangeText = (term) => {
        this.setState({ searchTerm: term })
        this.props.handleSearch(term)
    }

    _onFocus = () => {
        this.setState({ searching: true })
    }

    _onSubmitEditing = () => {
        this.setState({ searching: false })
        this.props.handleSearch(this.state.searchTerm)
    }

    _onPressOverlay = () => {
        this._searchInput.blur()
        this.setState({ searching: false })
    }

    _onLayout = (e) => {
        const { height } = e.nativeEvent.layout
        this.setState({ overlayTop: height })
    }

    render() {
        const { searching, overlayTop } = this.state
        let maybeListViewOverlayButton = null

        if (searching) {
            maybeListViewOverlayButton = (
                <Touchable
                    onPress={this._onPressOverlay}
                    style={[ styles.overlayButton, { top: overlayTop, width: WIDTH, height: HEIGHT }]}>
                    <View style={styles.flex} />
                </Touchable>
            )
        }

        return (
            <View onLayout={this._onLayout} style={styles.searchContainer}>
                {/* Search Box */}
                <View style={styles.searchBox}>
                    <Ionicon
                        name='md-search'
                        size={32}
                        color={theme.accentColor}
                        style={styles.searchIcon} />
                    <TextInput
                        ref={this._captureRef}
                        placeholder='Search by gym, zip code, or class'
                        value={this.state.searchTerm}
                        onChangeText={this._onChangeText}
                        onFocus={this._onFocus}
                        onSubmitEditing={this._onSubmitEditing}
                        underlineColorAndroid={'rgba(0,0,0,0)'}
                        style={{ height: 42, width: WIDTH-102 }} />
                </View>

                {/* <Touchable onPress={this._onSearchByLocation} style={styles.searchLocation} >
                    <View style={styles.searchLocationView} >
                        <Ionicon
                            name='md-pin' size={22}
                            color={theme.accentColor}
                            style={{ paddingLeft: 5, paddingRight: 7 }}/>
                        <Text style={styles.searchLocationText}>Use Current Location</Text>
                    </View>
                </Touchable> */}

                {maybeListViewOverlayButton}
            </View>
        )
    }
}

type GymProps = {
    booked: boolean,
    updatedAt: ?Date,
    distance: ?number
} & Gym
type ItemProps = {
    index: number,
    api: API,
    newAttendance: typeof newAttendance,
    undoAttendance: typeof undoAttendance,
    setGlobalLoading: typeof isGlobalLoading.action,
    checkinsLocked: boolean,
    doModal: (index: number) => void,
} & GymProps
class CheckInItem extends Component<void, ItemProps, void> {
    props: ItemProps;

    _onCheckInPress = async () => {
        try {
            this.props.setGlobalLoading(true)
            await this.props.newAttendance(this.props.api, this.props.id, attendanceStatus.Confirmed)
            // Show modal when the creating record returns success
            this.props.doModal(this.props.index)
        } catch (err) {
            console.error(`Error while creating new attendance for gym=${this.props.id}`, err)
            // TODO Raygun
        } finally {
            this.props.setGlobalLoading(false)
        }
    }

    _maybeUndo = async () => {
        console.log('maybeUndo')
        try {
            // TODO Show spinner
            await this.props.undoAttendance(this.props.api)
        } catch (err) {
            console.error(`Error while undoing attendance for gym=${this.props.id}`, err)
            // TODO Raygun
        }
    }

    render() {
        const { booked, checkinsLocked } = this.props
        let maybeCheckInButton = null

        if (booked) {
            const canUndo = +this.props.updatedAt >= (new Date() - UNDO_WINDOW_MS)
            maybeCheckInButton = (
                <Touchable onPress={this._maybeUndo} style={[ styles.checkInBtn, styles.checkInBtnBooked ]}>
                    {/* <SFNText style={{ position: 'absolute', top: -17, fontWeight: 'bold' }}>Booked!</SFNText> */}
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.checkInBtnText}>
                            {canUndo ? 'Undo' : 'Checked In!'}
                        </Text>
                    </View>
                </Touchable>
            )
        } else if (!checkinsLocked) {
            maybeCheckInButton = (
                <Touchable onPress={this._onCheckInPress} style={styles.checkInBtn}>
                    <Text style={styles.checkInBtnText}>Check In</Text>
                </Touchable>
            )
        }

        const { name, address1, address2, city, state, distance } = this.props
        let address = address1
        if (address2) address += `, ${  address2}`
        address += ` - ${  city  }`
        if (state) address += `, ${state}`

        return (
            <View style={styles.checkInItem}>
                {/* Check In - Text */}
                <View style={styles.checkInItemWrap}>
                    <View style={styles.checkInItemLeft}>
                        <SFNText style={[ styles.bold, styles.checkInItemText ]}>
                            {name}
                        </SFNText>
                    </View>
                    <View style={styles.marginTop}>
                        <SFNText style={styles.checkInItemAddress}>
                            {address}
                        </SFNText>
                    </View>
                    {
                        !!distance &&
                        <View style={styles.marginTop}>
                            <SFNText style={styles.checkInItemAddress}>
                                {`${formatMeters(distance)} miles away`}
                            </SFNText>
                        </View>
                    }
                </View>

                {maybeCheckInButton}
            </View>
        )
    }
}


type CheckInListProps = {
    api: API,
    checkInItems: Array<GymProps>,
    newAttendance: typeof newAttendance,
    undoAttendance: typeof undoAttendance,
    setGlobalLoading: typeof isGlobalLoading.action,
    currentCheckin: number
} & ScrollAnalyticsProps
type CheckInListState = {
    modalVisible: boolean,
    checkInWhere: string,
    checkInWhen: string,
    bookedIndex: number,
    checkInItems: Array<GymProps>
}
class CheckInList extends Component<void, CheckInListProps, CheckInListState> {
    props: CheckInListProps;
    state: CheckInListState;

    constructor(props) {
        super(props)
        this.state = {
            modalVisible: false,
            checkInWhere: '',
            checkInWhen: '',
            bookedIndex: -1,
            checkInItems: this._initCheckInItems(props.checkInItems, props.currentCheckin)
        }
    }

    _initCheckInItems = (checkInItems: Array<GymProps>, currentCheckin: number) => {
        const bookedItemIdx = checkInItems.findIndex((item) => item.id === currentCheckin)
        if (bookedItemIdx !== -1) {
            return [
                checkInItems[bookedItemIdx],
                ...checkInItems.slice(0, bookedItemIdx),
                ...checkInItems.slice(bookedItemIdx+1)
            ]
        }
        return checkInItems
    }

    componentWillReceiveProps(nextProps: CheckInListProps) {
        const { checkInItems } = this.props
        if (nextProps.checkInItems !== checkInItems || nextProps.checkInItems.length !== checkInItems.length) {
            this.setState({
                checkInItems: this._initCheckInItems(nextProps.checkInItems, nextProps.currentCheckin)
            })
        }
    }

    _showCheckInModal = (index: number) => {
        const { checkInItems } = this.props
        this.setState({
            modalVisible: true,
            checkInWhere: checkInItems[index].name,
            checkInWhen: moment().format('hh:mmA'),
            bookedIndex: index
        })
    }

    _closeCheckInModal = () => this.setState({ modalVisible:false })
    _keyExtractor = (checkInItemProp: ItemProps) => `${checkInItemProp.id}`
    _itemSeparator = () => <View style={styles.listItemSep} />
    _renderItem = ({ item, index }) => {
        const checkInItem: GymProps = item
        return (
            <CheckInItem
                api={this.props.api}
                undoAttendance={this.props.undoAttendance}
                newAttendance={this.props.newAttendance}
                setGlobalLoading={this.props.setGlobalLoading}
                index={index}
                doModal={this._showCheckInModal}
                booked={this.props.currentCheckin === item.id}
                checkinsLocked={!!this.props.currentCheckin}
                zipCode={checkInItem.zipCode}
                state={checkInItem.state}
                name={checkInItem.name}
                longitude={checkInItem.longitude}
                latitude={checkInItem.latitude}
                id={checkInItem.id}
                description={checkInItem.description}
                city={checkInItem.city}
                affiliateId={checkInItem.affiliateId}
                distance={checkInItem.distance}
                updatedAt={checkInItem.updatedAt}
                address1={checkInItem.address1}
                address2={checkInItem.address2} />
        )
    }

    render() {
        return (
            <View style={styles.flatListWrap}>
                <FlatList
                    data={this.state.checkInItems}
                    onScroll={this.props.onScroll}
                    onMomentumScrollBegin={this.props.onMomentumScrollBegin}
                    onMomentumScrollEnd={this.props.onMomentumScrollEnd}
                    keyExtractor={this._keyExtractor}
                    renderItem={this._renderItem}
                    ItemSeparatorComponent={this._itemSeparator} />

                <Modal
                    transparent
                    visible={this.state.modalVisible}
                    animationType='slide'
                    onRequestClose={this._closeCheckInModal} >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalInnerContainer}>
                            <Text style={styles.modalTextHeader}>Success!</Text>
                            <SFNText style={styles.modalTextNormal}>You successfully checked</SFNText>
                            <View style={styles.modalTextRow}>
                                <SFNText style={styles.modalTextNormal}>into</SFNText>
                                <SFNText style={styles.modalTextStrong}> {this.state.checkInWhere}</SFNText>
                            </View>
                            <View style={styles.modalTextRow}>
                                <SFNText style={styles.modalTextNormal}>at</SFNText>
                                <SFNText style={styles.modalTextStrong}> {this.state.checkInWhen}</SFNText>
                                <SFNText style={styles.modalTextNormal}>.</SFNText>
                            </View>
                            <Touchable style={styles.modalBtn} onPress={this._closeCheckInModal}>
                                <Text style={styles.modalBtnText}>OKAY</Text>
                            </Touchable>
                        </View>
                    </View>
                </Modal>
            </View>
        )
    }
}
const CheckInListWithAnalytics = scrollAnalytics(CheckInList, 'checkInList')

type CheckInsViewProps = {
    api: API,
    checkInItems: Array<GymProps>,
    newAttendance: typeof newAttendance,
    undoAttendance: typeof undoAttendance,
    currentLocation: LocationType,
    currentCheckin: number,
    setGlobalLoading: typeof isGlobalLoading.action
}
type CheckInsViewState = {
    isNameOrLocationSearch: boolean,
    searchTerm: string,
    checkInItems: Array<GymProps>
}
class CheckInsView extends Component<void, CheckInsViewProps, CheckInsViewState> {
    props: CheckInsViewProps;
    state: CheckInsViewState;

    // Tab Navigation
    static RoutePath = 'checkIns';
    static navigationOptions: NavigationStackScreenOptions = {
        title: 'Check In',
        headerLeft: null,
        tabBarIcon: ({ tintColor }: TabProps) => <TabBarIcon tintColor={tintColor} /> // eslint-disable-line
    }

    constructor(props) {
        super(props)
        this.state = {
            isNameOrLocationSearch: false,
            searchTerm: '',
            checkInItems: []
        }
    }

    _geolocationEnabled: boolean = true;

    _handleSearch = (searchValue: string) => {
        if (searchValue !== '') {
            this.setState({
                isNameOrLocationSearch: true,
                searchTerm: searchValue
            })
        } else {
            this._geolocationEnabled = this.props.currentLocation.lat !== 0
            this.setState({
                isNameOrLocationSearch: false,
                searchTerm: ''
            })
        }
    }

    componentWillReceiveProps(nextProps: CheckInsViewProps) {
        const { currentLocation, checkInItems } = nextProps

        if (checkInItems !== this.props.checkInItems && checkInItems.length) {
            // Search by current location
            if (this._geolocationEnabled) {
                const ll = {
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lon
                }

                const matchItems: Array<GymProps> = checkInItems.map((item) => {
                    const gymProps: GymProps = item
                    gymProps.distance = haversine(ll, {
                        latitude: item.latitude,
                        longitude: item.longitude
                    })

                    return gymProps
                })

                this.setState({ checkInItems: matchItems.sort(byDistance) })
            }
        }
    }

    render() {
        const {
            setGlobalLoading,
            newAttendance,
            undoAttendance,
            api,
            currentCheckin
        } = this.props

        let {
            checkInItems,
            isNameOrLocationSearch,
            searchTerm
        } = this.state

        if (isNameOrLocationSearch) {
            // Search by name, zip, class
            const searchStr = searchTerm.trim()
            if (searchTerm) {
                // TODO Cache instance?
                const fuse = new Fuse(checkInItems, NAME_SEARCH_OPTION)
                const results = fuse.search(searchStr)
                checkInItems = results.length ? results : checkInItems
            }
        }

        return (
            <View style={styles.mt}>
                <SearchBar handleSearch={this._handleSearch} />
                <CheckInListWithAnalytics
                    api={api}
                    currentCheckin={currentCheckin}
                    checkInItems={checkInItems}
                    newAttendance={newAttendance}
                    undoAttendance={undoAttendance}
                    setGlobalLoading={setGlobalLoading} />
            </View>
        )
    }
}

type TabProps = { tintColor: string }
class TabBarIcon extends PureComponent<void, TabProps, void> {
    render() {
        return (
            <Ionicon
                {...theme.tabIcon}
                style={globalStyles.tabIconStyle}
                name='md-checkmark-circle-outline'
                color={this.props.tintColor}/>
        )
    }
}

type StoreProps = {
    gyms: Array<Gym>,
    attendance: Array<Attendance>,
    api: API,
    self: UserJSON,
    currentLocation: LocationType,
    isGlobalLoading: boolean
}

const byName = (gym1: Gym, gym2: Gym) => {
    const n1 = gym1.name.toLowerCase()
    const n2 = gym2.name.toLowerCase()
    if (n1 < n2) {
        return -1
    }

    if (n2 < n1) {
        return 1
    }

    return 0
}

const byDistance = (gym1: GymProps, gym2: GymProps) => {
    if (gym1.distance && gym2.distance) {
        if (gym1.distance < gym2.distance) return -1
        if (gym2.distance < gym1.distance) return 1
    }

    return 0
}

const getSelf = (state) => state.self
const getAttendance = (state) => state.attendance
const getGyms = (state) => state.gyms

const getCurrentAttendance = createSelector(
    [ getAttendance, getSelf ],
    (attendance, self) => {
        const checkinWindowLockStart = new Date() - CHECKIN_LOCK_MS
        return attendance.find((att) => {
            if (att.member === self.id &&
                att.status === attendanceStatus.Confirmed &&
                +new Date(att.updatedAt) >= checkinWindowLockStart) {
                return att
            }
        })
    }
)

const getCheckInItems = createSelector(
    [ getCurrentAttendance, getGyms ],
    (currentAttendance, gyms) => gyms.sort(byName).map((gym) => ({
        id: gym.id,
        affiliateId: gym.affiliateId,
        name: gym.name,
        description: gym.description,
        zipCode: gym.zipCode,
        latitude: gym.latitude,
        longitude: gym.longitude,
        address1: gym.address1,
        address2: gym.address2,
        city: gym.city,
        state: gym.state,
        updatedAt: currentAttendance ? new Date(currentAttendance.updatedAt) : null
    }))
)

const mapStateToProps = (state: StoreProps) => {
    const { api, currentLocation, isGlobalLoading } = state

    const currentAttendance = getCurrentAttendance(state)
    const currentCheckin = currentAttendance ? currentAttendance.gym : 0
    const checkInItems = getCheckInItems(state)

    return {
        api,
        currentLocation,
        currentCheckin,
        isGlobalLoading,
        checkInItems
    }
}

const checkInsCmpt = withAsyncDeps({
    fetchDeps: ({ fetchCurrentLocation }: any): Promise<any> => fetchCurrentLocation(),
    ForComponent: tabView(CheckInsView)
})

export default connect(mapStateToProps, {
    newAttendance,
    undoAttendance,
    setGlobalLoading: isGlobalLoading.action,
    fetchCurrentLocation: currentLocation.fetch
})(checkInsCmpt)
