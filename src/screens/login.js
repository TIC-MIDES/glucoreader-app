// components/login.js

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '', // the email is the ci
      password: '',
      isLoading: false,
      isLoggedIn: false,
    };
  }

  componentDidMount() {
    Promise.all([
      AsyncStorage.getItem('user_id'),
      AsyncStorage.getItem('user_ci'),
    ])
      .then(([id, ci]) => {
        if (id) {
          this.setState({isLoggedIn: true});
        }
        if (ci) {
          this.setState({email: ci});
        }
      })
      .catch((_err) => {
        Alert.alert('Error inesperado.');
      });
  }

  updateInputVal = (val, prop) => {
    const state = this.state;
    state[prop] = val;
    this.setState(state);
  };

  userLogin = async (props) => {
    if (this.state.email === '' && this.state.password === '') {
      Alert.alert('Ingrese sus credenciales por favor.');
    } else {
      this.setState({
        isLoading: true,
      });
      await axios
        .post('http://179.27.96.192/api/1.0/auth/login', {
          cedula: this.state.email, // the email is the ci
          password: this.state.password,
        })
        .then(async (response) => {
          await AsyncStorage.setItem(
            'user_id',
            response.data.data.user.id.toString(),
          );
          await AsyncStorage.setItem('user_ci', this.state.email.toString());
          return props.navigation.replace('Camera');
        })
        .catch(async (_error) => {
          Alert.alert(
            'Ha ocurrido un error, ingrese sus credenciales nuevamente.',
          );
          this.setState({
            isLoading: false,
          });
        });
    }
  };

  logout = async () => {
    await AsyncStorage.clear();
    this.setState({isLoggedIn: false});
  };

  render() {
    if (this.state.isLoggedIn) {
      return (
        <View style={styles.container}>
          <TextInput
            style={styles.inputStyle}
            placeholder="Cedula del paciente"
            value={this.state.email}
          />
          <Button
            color="#3740FE"
            title="Cerrar sesión"
            onPress={() => this.logout(this.props)}
          />
          <Text
            style={styles.loginText}
            onPress={() => this.props.navigation.replace('Camera')}>
            Volver a la cámara
          </Text>
        </View>
      );
    }
    if (this.state.isLoading) {
      return (
        <View style={styles.preloader}>
          <ActivityIndicator size="large" color="#9E9E9E" />
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.inputStyle}
          placeholder="Cedula del paciente"
          value={this.state.email}
          onChangeText={(val) => this.updateInputVal(val, 'email')}
        />
        <TextInput
          style={styles.inputStyle}
          placeholder="Contraseña"
          value={this.state.password}
          onChangeText={(val) => this.updateInputVal(val, 'password')}
          maxLength={15}
          secureTextEntry={true}
        />
        <Button
          color="#3740FE"
          title="Iniciar sesión"
          onPress={() => this.userLogin(this.props)}
        />

        <Text
          style={styles.loginText}
          onPress={() => this.props.navigation.replace('Camera')}>
          Volver a la cámara
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 35,
    backgroundColor: '#fff',
  },
  inputStyle: {
    width: '100%',
    marginBottom: 15,
    paddingBottom: 15,
    alignSelf: 'center',
    borderColor: '#ccc',
    borderBottomWidth: 1,
  },
  loginText: {
    color: '#3740FE',
    marginTop: 25,
    textAlign: 'center',
  },
  preloader: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
