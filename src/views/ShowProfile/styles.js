import { StyleSheet, Platform } from 'react-native'
import { theme } from '../../common'
import { fontFamily } from '../../common/defaults'

export default StyleSheet.create({
    gradientBg: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0)'
    },

    showProfileContainer: {
        width: '100%',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },

    infoPanel: {
        width: '100%',
        flex: 2,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center'
    },

    infoBox: {
        width: '100%',
        backgroundColor: 'rgba(60,86,91,0.75)',
        marginBottom: 2,
        padding: Platform.select({ ios: 38, android: 32 })
    },

    infoRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },

    infoIcon: {
        fontSize: 40,
        marginRight: 20,
        color: theme.canvasColor
    },

    infoTxt: {
        fontSize: 16,
        color: theme.canvasColor
    },

    imagePanel: {
        flex: 1,
        marginTop: 40
    },

    noImagePanel: {
        marginTop: 40,
        width: 150,
        height: 150,
        borderRadius: 75,
        padding: 5,
        backgroundColor: '#38707B'
    },

    noImageCircle: {
        width: 140,
        height: 140,
        borderWidth: 1,
        borderRadius: 75,
        borderColor: theme.borderColor,
        borderStyle: 'dashed',
        padding: 30
    },

    image: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 1,
        borderColor: theme.borderColor
    },

    noImageText: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 20,
        color: theme.canvasColor,
        backgroundColor: 'transparent',
        fontFamily: fontFamily.Special
    },

    fullNameTxt: {
        fontSize: Platform.select({ ios: 25, android: 20 }),
        color: theme.canvasColor,
        marginTop: 20,
        marginBottom: 10
    },

    emailTxt: {
        fontSize: 16,
        color: theme.canvasColor,
        marginBottom: 20
    },

    btn: {
        marginTop: 30,
        width: 275,
        backgroundColor: 'transparent',
        borderColor: theme.borderColor,
        borderWidth: 2,
        padding: 14
    },

    btnTxt: {
        textAlign: 'center'
    }
})