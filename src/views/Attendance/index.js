// @flow
import React, { Component, PureComponent } from 'react'
// $FlowFixMe
import LinearGradient from 'react-native-linear-gradient'
import Analytics from '../../services/Analytics'
import Ionicon from 'react-native-vector-icons/Ionicons'
import BadgeCount from '../components/BadgeCount'
import styles from './styles'
import Touchable from '../../containers/Touchable'
import withAsyncDeps from '../../containers/withAsyncDeps'
import tabView from '../../containers/tabView'
import moment from 'moment'
import Spinner from '../../containers/Spinner'
import Calendar, {
    fmtDate,
    isGTE,
    isLTE,
    normalize,
    monthIntervalAgo
} from '../../containers/Calendar'
import { scrollAnalytics } from '../../util'
import { connect } from 'react-redux'
import { attendance } from '../../store'
import { attendanceStatus } from '../../store/models'
import { View, FlatList, Image, Button, Platform } from 'react-native'
import { SFNText, SpecialText, globalStyles, theme } from '../../common'
import { stats, updateAttendanceStatus } from '../../io/attendance'
import type { ScrollAnalyticsProps } from '../../util'
import type { Nav } from '../createAppNavigator'
import type { NavigationStackScreenOptions } from '../../types'
import type { API } from '../../io/api'
import type { Attendance, AttendanceStats, Gym } from '../../store/models'

const { fontSizes, norm } = theme

const B_HEIGHT = 55
const NUM_FSIZE = fontSizes.huge.fontSize
const REG_FSIZE = fontSizes.tiny.fontSize
const REG_SPACE = theme.fontSpacing(4)
const MD_FMT = 'MMM D'
const T_FMT = 'hh:mmA'

const touchOverrides = {
    underlayColor: theme.accentColorRGB(0.2),
    activeOpacity: 0.8
}

type PendingBarProps = {
    pendingCount: number
}
class PendingBar extends Component<void, PendingBarProps, void> {
    props: PendingBarProps

    render() {
        return !this.props.pendingCount ? null : (
            <View
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: B_HEIGHT,
                    maxHeight: B_HEIGHT,
                    padding: 15,
                    paddingLeft: 0,
                    paddingRight: 0,
                    borderBottomWidth: 1,
                    borderColor: theme.borderColor
                }}>
                <View style={{ position: 'relative' }}>
                    <SpecialText style={{ color: theme.accentColor, textAlign: 'center' }}>PENDING</SpecialText>
                    <View
                        style={{
                            flex: 1,
                            top: -2,
                            right: -30,
                            position: 'absolute',
                            backgroundColor: theme.accentColor,
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            justifyContent: 'center'
                        }}>
                        <SpecialText
                            style={{
                                alignItems: 'center',
                                color: theme.canvasColor,
                                backgroundColor: 'transparent',
                                textAlign: 'center'
                            }}>
                            {Math.min(99, this.props.pendingCount)}
                        </SpecialText>
                    </View>
                </View>
            </View>
        )
    }
}

type WeekBarProps = {
    defaultDay: moment.Moment,
    onSwitchDay: number => void,
    onMonthPress: () => void,
    weekItems: Array<ItemProps>
}
type WeekdayStat = {
    pendingCount: number,
    checkedInCount: number
}
class WeekBar extends Component<void, WeekBarProps, void> {
    props: WeekBarProps

    render() {
        const { defaultDay, onSwitchDay, weekItems, onMonthPress } = this.props
        const selectedDay = defaultDay.day()
        const now = moment()
        const startOfWeek = normalize(defaultDay.day(0))
        const isPastWeek = startOfWeek.toDate() < normalize(now, false).day(0).toDate()
        const weekdayCmpts = []

        // TODO Move this to constructor and componentWillReceiveProps()
        // Create a table of stats items mapped by weekday, where 0 = Sunday, 6 = Saturday
        const itemsByWeekday = weekItems.reduce((table: Array<WeekdayStat>, item: ItemProps) => {
            let m = moment(item.datetime)
            let day = m.day()
            table[day] = table[day] || { pendingCount: 0, checkedInCount: 0 }

            if (item.status === attendanceStatus.Unverified) {
                ++table[day].pendingCount
            } else if (item.status === attendanceStatus.Confirmed) {
                ++table[day].checkedInCount
            }

            return table
        }, [])

        for (let i = 0; i < 7; i++) {
            const m = startOfWeek.clone().add(i, 'days')
            const weekdayStat = itemsByWeekday[i] || {}
            const isPast = isPastWeek || i < now.day()
            const mainColor = isPast ? theme.canvasColor2 : theme.canvasColor3

            let mainStyle = {
                flex: 1,
                flexGrow: 1,
                alignItems: 'center',
                borderBottomWidth: 4,
                borderBottomColor: mainColor,
                borderRightWidth: 2,
                borderRightColor: theme.canvasColor2,
                backgroundColor: mainColor
            }

            // TODO Setup onPress to filter out for this particular day only

            let monthDateStyle = { color: theme.primaryColor }
            if (selectedDay === i) {
                mainStyle = {
                    ...mainStyle,
                    borderBottomColor: theme.primaryTextColor
                }
            }

            let pendingIndicator = null
            let checkedInIndicator = null

            if (weekdayStat.pendingCount) {
                pendingIndicator = (
                    <View
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: theme.accentColor,
                            position: 'absolute'
                        }} />
                )
                monthDateStyle.color = theme.canvasColor
            } else if (weekdayStat.checkedInCount) {
                checkedInIndicator = (
                    <View
                        style={{
                            width: 3,
                            height: 3,
                            bottom: Platform.select({ ios: -1, android: -2 }),
                            borderRadius: 1.5,
                            backgroundColor: theme.disabledTextColor,
                            position: 'absolute'
                        }} />
                )
            }

            let dayColor = theme.primaryTextColor

            if (isPast) {
                dayColor = theme.disabledTextColor
            }

            if (pendingIndicator) {
                dayColor = theme.canvasColor
            }

            // Only swap days when it's today or a previous day (not in the future)
            let onPressDay = null

            // If it's a day in a previous week, or if the pressed day is in the current week,
            // but prior to today, then we handle it
            if (isPastWeek || m.day() <= now.day()) {
                // TODO Bind on component creation
                onPressDay = () => {
                    Analytics.viewAction(events.SwitchWeekday, {
                        day: m.day(),
                        pending: !!weekdayStat.pendingCount,
                        checkedIn: !!weekdayStat.checkedInCount
                    })

                    onSwitchDay(m.day())
                }
            }

            weekdayCmpts.push(
                <Touchable
                    activeOpacity={0.7}
                    underlayColor={theme.disabledTextColor}
                    onPress={onPressDay}
                    key={m.format('dd')}
                    style={mainStyle}>
                    <View style={{ width: '100%', flex: 1, alignItems: 'center' }}>
                        <SFNText style={styles.wbDayTxt}>{m.format('dd')[0]}</SFNText>
                        <View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            {pendingIndicator}
                            <SpecialText
                                style={{
                                    backgroundColor: 'transparent',
                                    textAlign: 'center',
                                    fontStyle: 'italic',
                                    color: dayColor
                                }}>
                                {m.date()}
                            </SpecialText>
                            {checkedInIndicator}
                        </View>
                    </View>
                </Touchable>
            )
        }

        return (
            <View style={styles.wbContainer}>
                <Touchable
                    onPress={onMonthPress}
                    underlayColor={theme.disabledTextColor2}
                    style={styles.wbTouch}>
                    <View style={styles.wbMonthTxtWrap}>
                        <SFNText
                            spacing={REG_SPACE}
                            style={[ styles.wbMonthTxt, fontSizes.mini ]}>
                            {defaultDay.format('MMM').toUpperCase()}
                        </SFNText>
                    </View>
                </Touchable>
                {weekdayCmpts}
            </View>
        )
    }
}

type ItemProps = {
    id: number,
    facility: string,
    city: string,
    state: string,
    status: $Keys<typeof attendanceStatus>,
    datetime: Date,
    updateStatus: (number, $Keys<typeof attendanceStatus>) => Promise<any>
}
type ItemState = {
    showButtons: boolean,
    isUpdating: boolean
}
class AttendanceItem extends Component<void, ItemProps, ItemState> {
    props: ItemProps;
    state: ItemState;

    constructor(props: ItemProps) {
        super(props)
        this.state = {
            showButtons: true,
            isUpdating: false
        }
    }

    render() {
        // TODO Break all of this heavy lifting out of render() and componentize
        let { props } = this
        let { showButtons, isUpdating } = this.state
        let maybeButtons = null
        let maybeLocation = null

        if (showButtons) {
            let leftPad = 10
            let specialText = {
                spacing: 4,
                style: {
                    fontSize: fontSizes.mini.fontSize,
                    textAlign: 'center',
                    color: theme.accentColor
                }
            }
            let wrapStyle = {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
                borderWidth: 1,
                borderColor: theme.accentColor
            }
            let containerStyle = {
                position: 'relative',
                paddingLeft: leftPad,
                paddingRight: leftPad,
                flex: 1,
                flexDirection: 'row',
                width: '100%',
                marginTop: 15
            }

            if (props.status === attendanceStatus.Unverified) {
                let maybeLoader = null
                if (isUpdating) {
                    maybeLoader = (
                        <View
                            style={{
                                height: 40,
                                width: '100%',
                                position: 'absolute',
                                left: leftPad,
                                backgroundColor: theme.disabledColor
                            }}>
                            <Spinner
                                size={26}
                                viewStyle={{ marginLeft: leftPad, marginTop: 0, justifyContent: 'flex-start' }} />
                        </View>
                    )
                }

                const onButtonPress = (action: $Keys<typeof attendanceStatus>) => async () => {
                    this.setState({ isUpdating: true })
                    let e

                    try {
                        await props.updateStatus(props.id, action)
                    } catch (err) {
                        e = err
                        // TODO Raygun
                        this.setState({ isUpdating: false })
                    }

                    Analytics.viewAction('updateStatus', {
                        status: action,
                        httpStatus: e ? e.status : 200,
                        createdAgoMins: moment.duration(+new Date - +props.datetime).minutes()
                    })
                }

                maybeButtons = (
                    <View style={containerStyle}>
                        <Touchable
                            onPress={onButtonPress(attendanceStatus.Denied)}
                            style={{ width: '50%' }}
                            {...touchOverrides}>
                            <View style={wrapStyle}>
                                <SpecialText {...specialText}>DON&#39;T CHECK IN</SpecialText>
                            </View>
                        </Touchable>
                        <Touchable
                            onPress={onButtonPress(attendanceStatus.Confirmed)}
                            style={{ width: '50%' }}
                            {...touchOverrides}>
                            <View style={[ wrapStyle, { backgroundColor: theme.accentColor }]}>
                                <SpecialText {...specialText}
                                    style={[ specialText.style, { color: theme.canvasColor }]}>
                                    CHECK IN
                                </SpecialText>
                            </View>
                        </Touchable>
                        {maybeLoader}
                    </View>
                )
            } else {
                maybeButtons = (
                    <View style={containerStyle}>
                        <View style={[ wrapStyle, { flexDirection: 'row' }]}>
                            <SpecialText {...specialText}>CHECKED IN</SpecialText>
                            <Ionicon
                                style={{ marginLeft: 5, marginTop: 1 }}
                                name={Platform.OS === 'ios'
                                  ? 'ios-checkmark-circle-outline'
                                  : 'md-checkmark-circle-outline'}
                                size={24}
                                color={theme.accentColor} />
                        </View>
                    </View>
                )
            }
        }

        if (props.city && props.state) {
            maybeLocation = (
                <SFNText spacing={6} style={{ fontSize: REG_FSIZE, marginTop: 3 }}>
                    {`${props.city}, ${props.state}`.toUpperCase()}
                </SFNText>
            )
        }

        let d = moment(props.datetime)

        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: theme.canvasColor,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 15,
                    paddingBottom: 15
                }}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            width: 50,
                            maxWidth: 50
                        }}>
                        <Ionicon
                          name={Platform.OS === 'ios' ? 'ios-pin' : 'md-pin'}
                          size={32} color={theme.primaryTextColor} />
                    </View>
                    <View
                        style={{
                            paddingLeft: 5,
                            marginTop: 5,
                            width: 200,
                            flex: 1,
                            flexDirection: 'column'
                        }}>
                        <SFNText style={fontSizes.mini}>
                            {props.facility}
                        </SFNText>
                        {maybeLocation}
                    </View>
                    <View style={{ width: 120 }}>
                        <SpecialText style={styles.aiTimeTxt} spacing={1}>
                            {d.format(T_FMT)}
                        </SpecialText>
                        <SFNText style={styles.aiMonthDayTxt} spacing={REG_SPACE}>
                            {d.format(MD_FMT).toUpperCase()}
                        </SFNText>
                    </View>
                </View>
                {maybeButtons}
            </View>
        )
    }
}

type ListProps = {
    api: API,
    items: Array<ItemProps>,
    refreshAttendance: () => Promise<any>,
    updateStatus: () => Promise<any>
} & ScrollAnalyticsProps

type ListState = {
    refreshing: boolean
}

class AttendanceList extends Component<void, ListProps, ListState> {
    props: ListProps;
    state: ListState;

    constructor() {
        super(...arguments)
        this.state = { refreshing: false }
    }

    // By binding here, we avoid unnecessary re-renders
    _updateStatus = (attendanceID: number, status: $Keys<typeof attendanceStatus>) =>
        this.props.updateStatus(this.props.api, attendanceID, status)
    _keyExtractor = (itemProps: ItemProps) => `${itemProps.id}`
    _renderItem = ({ item }) => <AttendanceItem {...item} updateStatus={this._updateStatus} />
    _itemSeparator = () => <View style={{ height: 1, backgroundColor: theme.borderColor }} />
    _refresh = () => {
        this.setState({ refreshing: true }, () => {
            this.props.refreshAttendance().then(() => this.setState({ refreshing: false }))
        })
    }

    shouldComponentUpdate(nextProps: ListProps) {
        let props = this.props
        return (
            props.items.length !== nextProps.items.length ||
            !!props.items.find((item, idx) => {
                let nextItem = nextProps.items[idx]
                for (let p in nextItem) {
                    if (nextItem.hasOwnProperty(p) && typeof nextItem[p] !== 'function') {
                        let v = nextItem[p]
                        if (!item.hasOwnProperty(p) || v !== item[p]) {
                            return true
                        }
                    }
                }
                return false
            })
        )
    }

    render() {
        let { items } = this.props
        let style = { flexGrow: 5, backgroundColor: theme.canvasColor2 }
        let content = null

        if (items.length) {
            content = (
                <FlatList
                    style={style}
                    data={items}
                    onScroll={this.props.onScroll}
                    onMomentumScrollBegin={this.props.onMomentumScrollBegin}
                    onMomentumScrollEnd={this.props.onMomentumScrollEnd}
                    keyExtractor={this._keyExtractor}
                    renderItem={this._renderItem}
                    ItemSeparatorComponent={this._itemSeparator}
                    refreshing={this.state.refreshing}
                    onRefresh={this._refresh} />
            )
        } else {
            let fontStyle = { fontSize: fontSizes.med.fontSize, textAlign: 'center' }
            content = (
                <View style={[
                    style,
                    {
                        flex: 1, flexWrap: 'wrap', flexDirection: 'row',
                        justifyContent: 'center', alignItems: 'baseline'
                    }]}>
                    <Image
                        style={{ width: 120, height: 120, marginTop: 40, marginBottom: 20 }}
                        source={require('../../../assets/images/yoga.png')} />
                    <SFNText style={fontStyle}>
                        Looks like you haven&#39;t visited any of our locations today.
                    </SFNText>
                    <SFNText style={[ fontStyle, { marginTop: 10, fontWeight: 'bold' }]}>
                        Get out there and train!
                    </SFNText>
                </View>
            )
        }

        return content
    }
}

const attendanceListLift = { updateStatus: updateAttendanceStatus }
const AttendanceListWithAnalytics = scrollAnalytics(AttendanceList, 'attendanceList')
const ConnectedAttendanceList = connect(({ api }) => ({ api }), attendanceListLift)(AttendanceListWithAnalytics)

type StatsProps = {
    stats: AttendanceStats
}
const statItem = {
    numberStyle: {
        fontSize: NUM_FSIZE,
        textAlign: 'center',
        backgroundColor: 'transparent',
        color: theme.canvasColor
    },
    textStyle: {
        fontSize: REG_FSIZE,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'transparent',
        color: theme.canvasColor
    },
    numberSpacing: 1,
    textSpacing: REG_SPACE
}
class Stats extends Component<void, StatsProps, void> {
    props: StatsProps

    render() {
        let { stats } = this.props
        return (
            <LinearGradient
                colors={[ theme.gradient1, theme.accentColor ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1, flexGrow: 1.1, justifyContent: 'center', alignItems: 'center' }}>
                <View>
                    <SFNText
                        spacing={REG_SPACE}
                        style={{
                            color: theme.activeIcon,
                            fontSize: REG_FSIZE,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginTop: norm(12),
                            backgroundColor: 'transparent'
                        }}>
                        CHECK IN ACTIVITY
                    </SFNText>
                </View>
                <View
                    style={{
                        marginTop: norm(2),
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        paddingTop: 10,
                        paddingLeft: 10,
                        paddingRight: 10,
                        paddingBottom: 0,
                        maxHeight: 90,
                        width: '100%'
                    }}>
                    <View style={styles.carouselItem}>
                        <SpecialText spacing={statItem.numberSpacing} style={statItem.numberStyle}>
                            {Math.floor(stats.thisWeek)}
                        </SpecialText>
                        <SFNText spacing={statItem.textSpacing} style={statItem.textStyle}>
                            THIS WEEK
                        </SFNText>
                    </View>
                    <View style={styles.carouselItem}>
                        <SpecialText spacing={statItem.numberSpacing} style={statItem.numberStyle}>
                            {Math.floor(stats.avg)}
                        </SpecialText>
                        <SFNText spacing={statItem.textSpacing} style={statItem.textStyle}>
                            AVERAGE
                        </SFNText>
                    </View>
                    <View style={styles.carouselItem}>
                        <SpecialText spacing={statItem.numberSpacing} style={statItem.numberStyle}>
                            {Math.floor(stats.allTime)}
                        </SpecialText>
                        <SFNText spacing={statItem.textSpacing} style={statItem.textStyle}>
                            ALL TIME
                        </SFNText>
                    </View>
                </View>
            </LinearGradient>
        )
    }
}

// Primary view for this route
type DateData = {
    year: number,
    month: number,
    day: number,
    timestamp: number,
    dateString: string
}
type P = {
    nav: Nav,
    api: API,
    attendanceItems: Array<ItemProps>,
    attendanceStats: AttendanceStats,
    fetchAttendance: () => Promise<any>,
    pendingCount: number
}
type S = {
    defaultDay: moment.Moment,
    showCalendar: boolean
}

const events = {
    CalendarView: 'calendar',
    CalendarDayPress: 'dayPress',
    SwitchWeekday: 'switchWeekday'
}
class CheckInView extends Component<void, P, S> {
    props: P;
    state: S;

    constructor() {
        super(...arguments)
        this.state = { defaultDay: moment(), showCalendar: false }
    }

    _applyCalendarDay = ({ day, month, year }: DateData) => {
        const m = normalize(moment().year(year).month(month - 1).date(day))
        this.setState({ defaultDay: m, showCalendar: false })
    }

    _onSwitchWeekday = (day: number) =>
        this.setState({ defaultDay: this.state.defaultDay.clone().day(day) })

    _onCalendarClose = () => this.setState({ showCalendar: false })
    _onMonthPress = () => this.setState({ showCalendar: true })
    _refreshAttendance = () => this.props.fetchAttendance(this.props.api)

    componentWillReceiveProps(nextProps: P) {
        // Reset everything when the user navigates away
        if (this.state.showCalendar && nextProps.nav && nextProps.nav.routePath.endsWith(CheckInView.RoutePath)) {
            this.setState({ showCalendar: false })
        }

        if (nextProps.nav && nextProps.nav.routePath.endsWith(CheckInView.RoutePath)) {
            this.setState({ defaultDay: moment() })
        }
    }

    componentWillUnmount() {
        Analytics.viewExit()
    }

    render() {
        let { defaultDay, showCalendar } = this.state
        let { attendanceItems, attendanceStats, pendingCount } = this.props

        const startOfWeek = normalize(defaultDay.clone().day(0))
        const endOfWeek = normalize(startOfWeek.clone().day(6).endOf('day'))
        const selectedDate = defaultDay.toDate()
        const weekItems = attendanceItems.filter(
            (ip: ItemProps) => ip.datetime >= startOfWeek.toDate() && ip.datetime <= endOfWeek.toDate()
        )

        // Do some thangs:
        // 1. Filter items out from only the selected day
        // 2. Sort them by date in descending order (newest items first)
        attendanceItems = attendanceItems
            .filter(({ datetime: dt }: ItemProps) => {
                return (
                    dt.getDate() === selectedDate.getDate() &&
                    dt.getFullYear() === selectedDate.getFullYear() &&
                    dt.getMonth() === selectedDate.getMonth()
                )
            })
            .sort(({ datetime: dt1 }, { datetime: dt2 }: ItemProps) => +dt2 - +dt1)

        // Finally, bring all unverified attendance items to the front
        let unverified = attendanceItems.filter(({ status }: ItemProps) => status === attendanceStatus.Unverified)
        let verified = attendanceItems.filter(({ status }: ItemProps) => status === attendanceStatus.Confirmed)
        attendanceItems = unverified.concat(verified)

        let maybeCalendarModal = null
        if (showCalendar) {
            maybeCalendarModal = (
                <CalendarModal
                    nav={this.props.nav}
                    attendanceItems={this.props.attendanceItems}
                    current={defaultDay.clone()}
                    onDayPress={this._applyCalendarDay}
                    onClose={this._onCalendarClose} />
            )
        }

        return (
            <View style={{ flex: 1 }}>
                <Stats stats={attendanceStats} />
                <PendingBar pendingCount={pendingCount} />
                <ConnectedAttendanceList items={attendanceItems} refreshAttendance={this._refreshAttendance} />
                <WeekBar
                    defaultDay={defaultDay.clone()}
                    weekItems={weekItems}
                    onSwitchDay={this._onSwitchWeekday}
                    onMonthPress={this._onMonthPress} />
                {maybeCalendarModal}
            </View>
        )
    }

    static RoutePath = 'attendance'
    static navigationOptions: NavigationStackScreenOptions = {
        title: 'Check Ins',
        tabBarIcon: ({tintColor}: TabProps) => <TabBarIconWrapper tintColor={tintColor} /> // eslint-disable-line
    }
}

const ConnectedBadgeCmpt = connect(({ attendance, self }) => ({
    count: Math.min(
        99,
        attendance.filter((a: Attendance) => {
            return a.member === self.id && a.status === attendanceStatus.Unverified
        }).length
    )
}))(BadgeCount)

type TabProps = { tintColor: string }
class TabBarIconWrapper extends PureComponent<void, TabProps, void> {
    render() {
        return (
            <View style={styles.tabIconWrapper}>
                <Ionicon
                    {...theme.tabIcon}
                    style={globalStyles.tabIconStyle}
                    name={Platform.OS === 'ios' ? 'ios-stats' : 'md-stats'}
                    color={this.props.tintColor} />
                <ConnectedBadgeCmpt tintColor={this.props.tintColor} />
            </View>
        )
    }
}

type SBD = {
    hasPending: boolean,
    hasCheckedIn: boolean
}
type StatsByDate = {
    [key: string]: SBD
}
type CalendarProps = {
    nav: Nav,
    attendanceItems: Array<ItemProps>,
    current: moment.Moment,
    onDayPress: DateData => void,
    onClose: () => void
}
type CalendarState = {
    statsByDate: StatsByDate
}
class CalendarModal extends Component<void, CalendarProps, CalendarState> {
    _now: moment.Moment;
    _minDate: moment.Moment;
    state: CalendarState;

    constructor(props: CalendarProps) {
        super(...arguments)
        this._now = moment()
        this._minDate = monthIntervalAgo(this._now.clone())
        this._updateState(props.attendanceItems)
    }

    _updateState = (attendanceItems: Array<ItemProps> = []) => {
        const statsByDate: StatsByDate = attendanceItems
            // Map everything out to the date value using the standard fmtDate()
            .reduce((statsByDate: StatsByDate, item: ItemProps) => {
                let dateString = fmtDate(moment(item.datetime))
                statsByDate[dateString] = statsByDate[dateString] || {
                    hasPending: false,
                    hasCheckedIn: false
                }

                if (item.status === attendanceStatus.Unverified) {
                    statsByDate[dateString].hasPending = true
                } else if (item.status === attendanceStatus.Confirmed) {
                    // TODO Right now we don't do anything with this since we're limited by the
                    // open source calendar's functionality, but may change eventually
                    statsByDate[dateString].hasCheckedIn = true
                }
                return statsByDate
            }, {})

        if (!this.state) {
            this.state = { statsByDate }
        } else {
            this.setState({ statsByDate })
        }
    }

    _onDayPress = (dd: DateData) => {
        const { timestamp } = dd
        const m = moment(timestamp).add(7, 'hours').startOf('day')
        const d = m.toDate()
        if (d < this._minDate.toDate() || d > this._now.clone().toDate()) {
            return
        }

        const data = {}
        const sbd = this.state.statsByDate[fmtDate(m)]
        if (sbd) {
            data.pending = sbd.hasPending
            data.checkedIn = sbd.hasCheckedIn
        }

        this.props.onDayPress(dd)
        Analytics.viewAction(events.CalendarDayPress, {
            date: Analytics.fmtDate(d),
            ...data
        })
    }

    _shouldHighlightWeek = (day: any) => {
        const d = day.clone().addHours(7)
        const startOfWeek = this.props.current.clone().day(0).startOf('day').toDate()
        const endOfWeek = this.props.current.clone().day(6).endOf('day').toDate()
        return isGTE(d, startOfWeek) && isLTE(d, endOfWeek)
    }

    componentWillReceiveProps(nextProps: CalendarProps) {
        this._updateState(nextProps.attendanceItems)
    }

    componentDidMount() {
        Analytics.viewEnter(events.CalendarView)
    }

    componentWillUnmount() {
        Analytics.viewExit()
    }

    render() {
        const { current, onClose } = this.props

        // First we organize the items by date
        const { statsByDate } = this.state

        const markedDates = Object.keys(statsByDate).reduce((markedDates: {}, date: string) => {
            let sbd = statsByDate[date]
            if (sbd.hasCheckedIn && !sbd.hasPending) markedDates[date] = { marked: true }
            return markedDates
        }, {})

        // Normalize
        const min = this._minDate.toDate()
        const max = this._now.toDate()
        const getDayTextColor = (day: any, sbd: ?SBD): string => {
            const dt = day.clone().addHours(7).toDate()
            if (dt < min || dt > max) return theme.disabledTextColor
            return sbd && sbd.hasPending ? theme.canvasColor : theme.primaryTextColor
        }

        // A component factory which closes over the date value
        const dateWrapper = ({ day, textStyle, state }: { day: any, textStyle: any, state: string }) => {
            const dateString = day.toString('yyyy-MM-dd')
            const sbd = statsByDate[dateString]

            let viewStyle = { backgroundColor: 'transparent' }
            if (sbd && sbd.hasPending && state !== 'disabled') {
                viewStyle = { borderRadius: 12, backgroundColor: theme.accentColor }
            }

            return (
                <View style={styles.cmDateWrapper}>
                    <View style={[ styles.cmDateWrapperPending, viewStyle ]} />
                    <SpecialText
                        style={[
                            textStyle,
                            styles.cmDateWrapperText,
                            fontSizes.med,
                            { color: getDayTextColor(day, sbd) }]}
                        spacing={0}>
                        {day.getDate()}
                    </SpecialText>
                </View>
            )
        }

        return (
            <View style={styles.cmBackground}>
                <View style={styles.cmWrap}>
                    <Calendar
                        shouldHighlightWeek={this._shouldHighlightWeek}
                        selectedDate={fmtDate(current)}
                        markedDates={markedDates}
                        minDate={fmtDate(this._minDate)}
                        maxDate={fmtDate(this._now)}
                        current={current}
                        onDayPress={this._onDayPress}
                        dateWrapper={dateWrapper} />
                    <Button onPress={onClose} title='Cancel' color={theme.accentColor} />
                </View>
            </View>
        )
    }
}

const mapStateToProps = ({ api, attendance, gyms, attendanceStats, self, nav }) => {
    let gymsByID: {[key: number]: Gym } = gyms.reduce((dict: {[key: number]: Gym }, gym: Gym) => {
        dict[gym.id] = gym
        return dict
    }, {})

    let attendanceItems: Array<any> = []
    let pendingCount = 0
    let monthAgo = monthIntervalAgo(moment()).toDate()

    // TODO We do pendingCount calculations for items up to a month back, but we have
    // no way yet to go back more than a week (calendar picker not implemented yet)

    attendance.forEach((a: Attendance) => {
        if (a.member === self.id && new Date(a.createdAt) >= monthAgo) {
            if (a.status === attendanceStatus.Unverified) {
                pendingCount++
            }

            let gym: Gym = gymsByID[a.gym]

            if (gym) {
                attendanceItems.push({
                    id: a.id,
                    facility: gym.name,
                    city: gym.city,
                    state: gym.state,
                    status: a.status,
                    // TODO Do this at the store level
                    datetime: new Date(a.createdAt)
                })
            } else {
                // TODO Raygun
                console.error(`Gym ID=${a.gym} not found for attendance ID=${a.id}`)
            }
        }
    })

    return {
        api,
        attendanceItems,
        attendanceStats,
        nav,
        pendingCount
    }
}

const attendanceCmpt = withAsyncDeps({
    fetchDeps: ({ api, fetchAttendance, fetchStats }: any): Promise<any> =>
        Promise.all([ fetchAttendance(api), fetchStats(api) ]),
    ForComponent: tabView(CheckInView)
})

const liftActions = { fetchAttendance: attendance.fetch, fetchStats: stats }

export default connect(mapStateToProps, liftActions)(attendanceCmpt)
