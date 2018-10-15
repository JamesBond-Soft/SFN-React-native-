// @flow
import { StyleSheet, Platform } from 'react-native'
import { theme } from '../../common'

const { fontSizes } = theme
const NUM_FSIZE = fontSizes.huge.fontSize
const REG_FSIZE = fontSizes.tiny.fontSize
const B_HEIGHT = 55

export default StyleSheet.create({
    carouselItem: {
        width: '27.5%',
        height: '80%',
        flex: 1
    },

    tabIconStyle: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    tabIconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        height: 50
    },

    cmBackground: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'absolute',
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: '5%',
        width: '100%',
        height: '100%',
        backgroundColor: theme.disabledCanvasColor
    },

    cmWrap: {
        height: 350,
        width: '100%',
        backgroundColor: theme.canvasColor,
        paddingBottom: 15,
        paddingTop: 10
    },

    cmDateWrapperPending: {
        width: 24,
        height: 24
    },

    cmDateWrapperText: {
        textAlign: 'center',
        position: 'absolute',
        fontStyle: 'italic'
    },

    cmDateWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        width: '100%',
        height: 42
    },

    aiTimeTxt: {
        fontSize: Math.floor(NUM_FSIZE * 0.9),
        fontStyle: 'italic'
    },

    aiMonthDayTxt: {
        marginTop: -4,
        fontSize: REG_FSIZE,
        fontWeight: 'bold'
    },

    wbDayTxt: {
        backgroundColor: 'transparent',
        paddingTop: Platform.select({ ios: 5, android: 2 }),
        textAlign: 'center'
    },

    wbMonthTxt: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: theme.accentColor
    },

    wbMonthTxtWrap: {
        height: B_HEIGHT,
        flex: 1,
        justifyContent: 'center'
    },

    wbTouch: {
        flex: 1,
        flexGrow: 2.2,
        justifyContent: 'center',
        backgroundColor: theme.canvasColor,
        height: B_HEIGHT
    },

    wbContainer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        borderTopWidth: 3,
        borderTopColor: theme.canvasColor2,
        height: B_HEIGHT,
        width: '100%',
        backgroundColor: theme.canvasColor2
    }
})