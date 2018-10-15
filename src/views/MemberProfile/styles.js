import { theme } from '../../common'
import { StyleSheet, Platform } from 'react-native'
import { fontFamily } from '../../common/defaults'

export default StyleSheet.create({
    gradientBg: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0)'
    },

    memberProfileContainer: {
        width: '100%',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },

    formElementRow: {
        width: '85%',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        height: 40,
        marginBottom: 20,
        backgroundColor: 'transparent'
    },

    lastName: {
        marginLeft: 15
    },

    image: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 1,
        borderColor: theme.borderColor
    },

    imagePanel: {
        flex: 1,
        marginTop: 40
    },

    noImageText: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 20,
        color: theme.canvasColor,
        backgroundColor: 'transparent',
        fontFamily: fontFamily.Special
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

    formPanel: {
        flex: 2,
        marginTop: 20
    },

    btnPanel: {
        flex: 1,
        alignItems: 'center'
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
    },

    input: {
        flex: 1,
        justifyContent: 'center',
        padding: Platform.select({ ios: 16, android: 12 })
    }
})