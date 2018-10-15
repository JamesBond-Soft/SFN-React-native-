import { theme } from '../../common'
import { fontFamily } from '../../common/defaults'
import { StyleSheet } from 'react-native'

const React = require('react-native')
const { Dimensions } = React
const deviceHeight = Dimensions.get('window').height
const deviceWidth = Dimensions.get('window').width

export const LOGO_MT = 175

export default StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    logo: {
        marginTop: LOGO_MT,
        marginBottom: 40,
        width: 320,
        height: 113,
        opacity: 0.7,
        alignSelf: 'center',
    },
    bg: {
        width: Math.round(deviceWidth * .9),
        paddingLeft: 10,
        paddingRight: 10,
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    btnContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 10,
        marginTop: 10,
        minHeight: 45,
        maxHeight: 45
    },
    textLink: {
        color: theme.secondaryTextColor,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 45,
        opacity: .8,
        backgroundColor: 'rgba(0,0,0,0)'
    },
    fallbackTxt: {
        textAlign: 'center',
        marginBottom: 18,
        marginTop: -20,
        fontSize: theme.fontSizes.small.fontSize,
        backgroundColor: 'transparent',
        color: theme.canvasColor
    },
    sfnLoginContainer: {
        flex: 1,
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    sfnLoginPlaceholder: {
        fontFamily: fontFamily.Regular
    },
    inputMargin: {
        marginBottom: 10
    },
    bgVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    },
    get bgContainer() {
        return {
            ...this.bgVideo,
            height: deviceHeight,
            width: deviceWidth,
            flex: 1,
            flexDirection: 'row',
            alignItems: 'flex-start'
        }
    },
    videoPlaceholder: {
        flex: 1,
        resizeMode: 'cover',
        height: deviceHeight,
        width: deviceWidth,
        opacity: 0.9
    },
    sfnLogoStyle: {
        marginTop: LOGO_MT - 30
    },
    rightBtn: {
        marginLeft: 20
    }
})
