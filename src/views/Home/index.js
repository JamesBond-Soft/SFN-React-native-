// @flow
import React, { Component } from 'react'
import withAsyncDeps from '../../containers/withAsyncDeps'
import styles from './styles'
import moment from 'moment'
import tabView from '../../containers/tabView'
import Analytics from '../../services/Analytics'
import { scrollAnalytics } from '../../util'
import { connect } from 'react-redux'
import { View, Image, FlatList } from 'react-native'
import { feed } from '../../io/attendance'
import { SFNText, SpecialText } from '../../common'
import type { ScrollAnalyticsProps } from '../../util'
import type { Nav } from '../createAppNavigator'
import type { NavigationStackScreenOptions } from '../../types'
import type { User, Attendance, Gym } from '../../store/models'
import type { API } from '../../io/api'

type FeedListProps = {
    feedItems: Array<FeedItemProps>,
    refreshFeed: () => Promise<any>
} & ScrollAnalyticsProps

type Props = {
    nav: Nav,
    api: API,
    fetchFeed: () => Promise<any>
} & FeedListProps

type FeedListState = {
    refreshing: boolean
}

type FeedItemProps = {
    id: number,
    person: string,
    verb: string,
    facility: string,
    city: string,
    state: string,
    datetime: Date,
    photoUrl: string,
    connectedVia?: 'fb' | 'sfn' | 'ab'
}

type RibbonedAvatarProps = {
    photoURL: string,
    type?: 'fb' | 'sfn' | 'ab'
}

// Doesn't exactly look like this yet:
// https://projects.invisionapp.com/share/KGCI0SVHJ#/screens/242767793
// TODO: Add the 3D ribbon look later
class RibbonedAvatar extends Component<void, RibbonedAvatarProps, void> {
    render() {
        // TODO Use a default (blank) avatar if no photo URL is available
        let { photoURL } = this.props
        let type = this.props.type

        // Default avatar
        photoURL = photoURL || 'https://api.adorable.io/avatars/60/socialfitnessnetwork@adorable.png'

        // Sometimes query params are HTML escaped, this is a bug which is patched here,
        // the real fix is to find the source of the HTML escaping
        photoURL = photoURL.replace(/&amp;/g, '&')

        let ribbon = null
        if (type) {
            ribbon = (
                <View style={styles.ribbonView}>
                    <SpecialText style={styles.ribbonText}>
                        {type.toUpperCase()}
                    </SpecialText>
                </View>
            )
        }

        return (
            <View style={styles.avatarView}>
                <Image style={styles.avatarImg} source={{ uri: photoURL }} />
                {ribbon}
            </View>
        )
    }
}

class FeedItem extends Component<void, FeedItemProps, void> {
    render() {
        // For now we take strings to output in the page. Eventually we will just take full models
        // here so we have the flexibility to add more data or links to profiles and locations
        let { person, verb, facility, datetime } = this.props

        return (
            <View style={styles.feedItem}>
                <RibbonedAvatar photoURL={this.props.photoUrl} type={this.props.connectedVia} />
                <View style={styles.feedItemWrap}>
                    <View style={styles.feedItemLeft}>
                        <SFNText style={[ styles.bold, styles.feedItemText ]}>
                            {person}
                        </SFNText>
                        <SFNText style={styles.feedItemText}>
                            {verb} at
                        </SFNText>
                        <SFNText style={[ styles.bold, styles.feedItemText ]}>
                            {facility}
                        </SFNText>
                    </View>
                    <View style={styles.marginTop}>
                        <SFNText>
                            {moment(datetime).fromNow()}
                        </SFNText>
                    </View>
                </View>
            </View>
        )
    }
}

// TODO - Disable tabView swipe controls for this page, only
// needed for the Attendance page at this point
class FeedList extends Component<void, FeedListProps, FeedListState> {
    props: FeedListProps;
    state: FeedListState;

    _listRef: any;

    constructor(props: FeedListProps) {
        super(props)
        this.state = { refreshing: false }
    }

    _captureRef = (ref: any) => this._listRef = ref
    // By binding here, we avoid unnecessary re-renders
    _keyExtractor = (feedItemProps: FeedItemProps) => `${feedItemProps.id}`
    _renderItem = ({ item }) => <FeedItem {...item} />
    _itemSeparator = () => <View style={styles.listItemSep} />
    _refresh = () => this.setState({ refreshing: true }, async () => {
        await this.props.refreshFeed()
        this.setState({ refreshing: false })
    })

    render() {
        return (
            <FlatList
                ref={this._captureRef}
                data={this.props.feedItems}
                onScroll={this.props.onScroll}
                onMomentumScrollBegin={this.props.onMomentumScrollBegin}
                onMomentumScrollEnd={this.props.onMomentumScrollEnd}
                keyExtractor={this._keyExtractor}
                renderItem={this._renderItem}
                ItemSeparatorComponent={this._itemSeparator}
                refreshing={this.state.refreshing}
                onRefresh={this._refresh} />
        )
    }
}

// TODO We may need to trigger the gym fetch here, but for now, we can depend a higher-up
// component (SFN.js) fetching it first
function mapStateToProps(visibility: 'Me' | 'Public' = 'Public') {
    return ({ users, attendance, gyms, api, self, nav }) => {
        const stateProps = { api, nav, feedItems: []}

        let attendanceToFeed = attendance

        if (visibility === 'Me') {
            attendanceToFeed = attendanceToFeed.filter((a) => a.member === self.id)
        }

        if (users.length && gyms.length) {
            const usersByID = users.reduce((table, user: User) => {
                table[user.id] = user
                return table
            }, { [self.id]: self })

            const gymsByID = gyms.reduce((table, gym: Gym) => {
                table[gym.id] = gym
                return table
            }, {})

            // May need to sort by date
            const feedItems: Array<FeedItemProps> = []
            let err = false

            for (let i = 0; i < attendanceToFeed.length; i++) {
                const record: Attendance = attendanceToFeed[i]
                const member: User = usersByID[record.member]
                const gym: Gym = gymsByID[record.gym]

                if (!member) {
                    // TODO Raygun
                    console.error(`member ID=${record.member} not found for attendance ID=${record.id}`)
                    err = true
                    break
                }

                if (!gym) {
                    // TODO Raygun
                    console.error(`gym ID=${record.gym} not found for attendance ID=${record.id}`)
                    err = true
                    break
                }

                // TODO May need to handle when member or gym is not found
                feedItems.push({
                    id: record.id,
                    person: `${member.firstName} ${member.lastName}`,
                    // TODO Hardcode for now, dynamic if/when there are other types of actions in the feed
                    verb: 'checked in',
                    facility: gym.name,
                    city: gym.city,
                    state: gym.state,
                    datetime: new Date(record.createdAt),
                    photoUrl: member.photoUrl,
                    connectedVia: member.connectedVia
                })
            }

            if (!err) {
                feedItems.sort((a, b: FeedItemProps) => +b.datetime - +a.datetime)
                stateProps.feedItems = feedItems
            }
        }

        return stateProps
    }
}

const FeedListWithAnalytics = scrollAnalytics(FeedList, 'homeFeed')
const liftActions = { fetchFeed: feed }

export default function homeHOC(visibility: 'Me' | 'Public' = 'Public') {
    let visText = (visibility == 'Public' ? 'Everyone' : 'Me').toUpperCase()

    type S = {
        refreshFeed: () => Promise<any>
    }

    class Home extends Component<void, Props, S> {
        props: Props;
        state: S;

        constructor(props: Props) {
            super(props)
            this.state = {
                // TODO - May need to rebind this when a new fetchFeed function is bound to props
                refreshFeed: (): Promise<any> => props.fetchFeed(props.api, visibility)
            }
        }

        componentWillUnmount() {
            Analytics.viewExit()
        }

        render() {
            return (
                <View style={styles.mt}>
                    <FeedListWithAnalytics feedItems={this.props.feedItems} refreshFeed={this.state.refreshFeed} />
                </View>
            )
        }

        static RoutePath = 'home'
        static navigationOptions: NavigationStackScreenOptions = {
            // eslint-disable-next-line
            tabBarLabel: ({ tintColor }) =>
                <SpecialText style={{ color: tintColor }}>
                    {visText}
                </SpecialText>
        }
    }

    const homeView = withAsyncDeps({
        fetchDeps: (props: any): Promise<any> => props.fetchFeed(props.api, visibility),
        ForComponent: tabView(Home)
    })

    return connect(mapStateToProps(visibility), liftActions)(homeView)
}
