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
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({
  name: 'main',
  createFromLocation: '~www/main.db',
});
export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '', // the email is the ci
      password: '',
      isLoading: false,
      isLoggedIn: false,
      exportToEmail: '',
      inputEmailVisible: false,
      records: [],
    };
  }

  componentDidMount() {
    Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('user_ci'),
    ])
      .then(([token, ci]) => {
        if (token) {
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
    const {email, password} = this.state;
    if (!email || !password || (email?.trim() === '' && password === '')) {
      Alert.alert('Ingrese sus credenciales por favor.');
    } else {
      this.setState({
        isLoading: true,
      });
      await axios
        .post('https://179.27.96.192:9443/api/1.0/auth/login', {
          cedula: email.trim().toLowerCase(), // the email is the ci
          password: password,
        })
        .then(async (response) => {
          const {data} = response.data;
          await AsyncStorage.setItem('user_id', data.user.id.toString());
          await AsyncStorage.setItem('user_ci', email.toString());
          await AsyncStorage.setItem('token', data.token.token);
          return props.navigation.replace('Camera');
        })
        .catch(async (_error) => {
          Alert.alert(
            'Verifique sus credenciales de inicio de sesión por favor.',
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

  exportHistoric = async () => {
    try {
      const {exportToEmail, isLoggedIn} = this.state;
      this.setState({
        isLoading: true,
      });

      if (!isLoggedIn) {
        const records = await new Promise((resolve, reject) => {
          db.transaction((tx) => {
            tx.executeSql(
              'SELECT * FROM records',
              [],
              (tx, results) => {
                const rows = results.rows;
                let records = [];
                for (let i = 0; i < rows.length; i++) {
                  records.push({
                    ...rows.item(i),
                  });
                }
                resolve(records);
              },
              (error) => {
                reject(error);
              },
            );
          });
        });
        await axios.post(
          'https://179.27.96.192:9443/api/1.0/measures/excel-anonymous',
          {
            email: exportToEmail?.trim()?.toLowerCase(),
            data: records.map((r) => ({
              date: r.timestamp_ms,
              measure: r.result,
            })),
          },
        );
      } else {
        const token = await AsyncStorage.getItem('token');
        const headers = {
          Authorization: 'token ' + token,
        };
        await axios.post(
          'https://179.27.96.192:9443/api/1.0/measures/excel',
          {
            email: exportToEmail?.trim()?.toLowerCase(),
          },
          {headers},
        );
      }

      this.setState({
        isLoading: false,
      });
      Alert.alert('Registros enviados correctamente.');
    } catch (error) {
      Alert.alert(
        'Ha ocurrido un error inesperado, por favor, intente nuevamente.',
      );
      this.setState({
        isLoading: false,
      });
    }
  };

  render() {
    const {
      exportToEmail,
      inputEmailVisible,
      isLoading,
      isLoggedIn,
      password,
      email,
    } = this.state;

    if (isLoggedIn) {
      return (
        <View style={styles.container}>
          <TextInput
            style={styles.inputStyle}
            placeholder="Cedula del paciente"
            value={email}
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
          <Text
            style={styles.loginText}
            onPress={() =>
              this.updateInputVal(!inputEmailVisible, 'inputEmailVisible')
            }>
            Exportar histórico de resultados
          </Text>
          {inputEmailVisible && (
            <TextInput
              style={styles.inputStyle}
              placeholder="Email del receptor"
              value={exportToEmail}
              onChangeText={(val) => this.updateInputVal(val, 'exportToEmail')}
            />
          )}
          {inputEmailVisible && (
            <Button
              color="#3740FE"
              title="Enviar"
              onPress={() => this.exportHistoric()}
            />
          )}
        </View>
      );
    }
    if (isLoading) {
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
          value={email}
          onChangeText={(val) => this.updateInputVal(val, 'email')}
        />
        <TextInput
          style={styles.inputStyle}
          placeholder="Contraseña"
          value={password}
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

        <Text
          style={styles.loginText}
          onPress={() =>
            this.updateInputVal(!inputEmailVisible, 'inputEmailVisible')
          }>
          Exportar histórico de resultados
        </Text>

        {inputEmailVisible && (
          <TextInput
            style={styles.inputStyle}
            placeholder="Email del receptor"
            value={exportToEmail}
            onChangeText={(val) => this.updateInputVal(val, 'exportToEmail')}
          />
        )}
        {inputEmailVisible && (
          <Button
            color="#3740FE"
            title="Enviar"
            onPress={() => this.exportHistoric()}
          />
        )}
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
