import { theme } from '../../common'
import { StyleSheet } from 'react-native'

export default StyleSheet.create({
    marginTop: {
        marginTop: 5
    },
    mt: {
        flex: 1,
        width: '100%',
        backgroundColor: '#dee5e9'
    },
    bold: { fontWeight: 'bold' },
    listItemSep: {
        height: 1,
        backgroundColor: theme.borderColor
    },
    checkInItem: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 34,
        paddingLeft: 28,
        paddingRight: 20,
        backgroundColor: 'white'
    },
    checkInItemWrap: {
        flex: 1,
        flexDirection: 'column',
        flexGrow: 2.5,
        marginTop: 5,
        paddingRight: 5
    },
    checkInItemLeft: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxHeight: '75%',
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
    },
    checkInItemText: {
        fontSize: 14
    },
    checkInItemAddress: {
        fontSize: 11
    },
    flatListWrap: {
        flex: 1,
        zIndex: 1
    },
    checkInBtn: {
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 20,
        width: 92,
        alignItems: 'center',
        backgroundColor: theme.accentColor,
    },
    checkInBtnBooked: {
        backgroundColor: 'lightgrey'
    },
    checkInBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: theme.canvasColor
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalInnerContainer: {
        alignItems: 'center',
        width: '90%',
        marginTop: 50,
        paddingTop: 40,
        paddingBottom: 40,
        borderRadius: 5,
        backgroundColor: theme.canvasColor
    },
    modalTextHeader: {
        color: theme.accentColor,
        fontSize: 21,
        paddingBottom: 30
    },
    modalTextNormal: {
        fontSize: 18
    },
    modalTextStrong: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    modalBtn: {
        marginTop: 30,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 30,
        paddingRight: 30,
        backgroundColor: theme.accentColor
    },
    modalBtnText: {
        color: theme.canvasColor,
        fontSize: 18
    },
    modalTextRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    searchContainer: {
        backgroundColor: '#dee5e9',
        alignItems: 'center',
        padding: 20,
        zIndex: 10
    },
    searchBox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#cfd8dc'
    },
    searchIcon: {
        paddingLeft: 15,
        paddingRight: 15
    },
    searchLocation: {
        borderColor: theme.accentColor,
        borderWidth: 2,
        borderRadius: 20,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 5,
        paddingBottom: 5,
        marginTop: 20
    },
    searchLocationView: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    searchLocationText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.accentColor
    },
    overlayButton: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    flex: {
        flex: 1
    }
})
