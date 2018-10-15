import { StyleSheet, Dimensions } from 'react-native'

const deviceWidth = Dimensions.get('window').width

export default StyleSheet.create({
    container: {
        backgroundColor: '#dee5e9',
        flex: 1,
    },

    sectionContainer: {
        backgroundColor: '#dee5e9',
        height: 40,
        paddingLeft: 17,
        paddingRight: 17,
        justifyContent: 'center',
    },
    itemContainer: {
        backgroundColor: 'white',
        height: 50,
        borderBottomWidth: 1,
        borderColor: '#dee5e9',
        paddingLeft: 17,
        paddingRight: 17,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row'
    },

    sectionLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#bbbbbb',
    },
    itemLabel: {
        fontSize: 13,
        color: '#636d6f',
    },
    loadingLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        alignSelf: 'center',
        paddingTop: 20,
    },

    fbLoginButtonWrapper: {
        alignContent: 'center',
        justifyContent: 'center',
        height: 50,
        width: deviceWidth,
        flexDirection: 'row',
        paddingTop: 10 ,
    }
})