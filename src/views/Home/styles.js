import { theme } from '../../common'
import { StyleSheet } from 'react-native'

export default StyleSheet.create({
    marginTop: {
        marginTop: 5
    },
    container: {
        backgroundColor: theme.canvasColor
    },
    topRowItemActive: {
        borderColor: theme.accentColor,
        borderBottomWidth: 4
    },
    topRowItemText: {
        textAlign: 'center',
        lineHeight: 32
    },
    avatarView: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1
    },
    avatarImg: {
        width: 50,
        height: 50,
        borderRadius: 25
    },
    ribbonView: {
        backgroundColor: '#3B5998',
        width: '45%',
        marginTop: -7.5
    },
    ribbonText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#fff'
    },
    listItemSep: {
        height: 1,
        backgroundColor: theme.borderColor
    },
    feedItemWrap: {
        flex: 1,
        flexDirection: 'column',
        flexGrow: 2.5,
        marginTop: 5,
        paddingRight: 5
    },
    feedItemLeft: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxHeight: '75%',
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
    },
    bold: { fontWeight: 'bold' },
    get topRowItemTextActive() {
        return Object.assign(
            {
                color: theme.accentColor
            },
            this.topRowItemText
        )
    },
    get topRowItemTextInactive() {
        return Object.assign(
            {
                color: theme.primaryTextColor,
                opacity: 0.5
            },
            this.topRowItemText
        )
    },
    topRowItem: {
        flexGrow: 1,
        height: 36
    },
    row: {
        flex: 1,
        alignItems: 'center',
        marginBottom: 10
    },
    input: {
        width: '100%'
    },
    text: {
        fontSize: 20,
        marginBottom: 15,
        alignItems: 'center'
    },
    mt: {
        flex: 1,
        width: '100%'
    },
    button: {
        backgroundColor: theme.accentColor
    },
    feedItem: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        paddingBottom: 18
    },
    feedItemText: {
        marginRight: 5,
        lineHeight: 16
    }
})
