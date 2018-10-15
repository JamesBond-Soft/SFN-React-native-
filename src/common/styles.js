import { StyleSheet } from 'react-native'
import theme from './theme'
import { fontFamily } from './defaults'

const defaultBtnProps = {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: theme.accentColor
}

export default StyleSheet.create({
    buttons: {
        backgroundColor: theme.accentColor
    },

    tabIconStyle: {},

    btn: {
        ... defaultBtnProps
    },
    btnTransparent: {
        ... defaultBtnProps,
        backgroundColor: 'transparent'
    },
    btnTxt: {
        color: theme.canvasColor
    },

    headerActionContainer: {
        marginRight: 15
    },

    headerActionTxt: {
        color: theme.accentColor
    },

    input12: {
        width: '100%',
        marginBottom: 20,
        backgroundColor: 'rgba(60,86,91,0.75)',
        height: 40
    },

    input6: {
        width: '48%',
        marginBottom: 20,
        backgroundColor: 'rgba(60,86,91,0.75)',
        height: 40
    },

    txtInput: {
        fontFamily: fontFamily.Regular,
        width: '100%',
        height: 40,
        paddingLeft: 15,
        paddingRight: 15,
        color: theme.canvasColor2
    }
})
