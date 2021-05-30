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
import {openDatabase} from 'react-native-sqlite-storage';

var db = openDatabase({name: 'sqlite.db'});
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
    const {email, password} = this.state;
    if (email === '' && password === '') {
      Alert.alert('Ingrese sus credenciales por favor.');
    } else {
      this.setState({
        isLoading: true,
      });
      await axios
        .post('http://179.27.96.192/api/1.0/auth/login', {
          cedula: email, // the email is the ci
          password: password,
        })
        .then(async (response) => {
          await AsyncStorage.setItem(
            'user_id',
            response.data.data.user.id.toString(),
          );
          await AsyncStorage.setItem('user_ci', email.toString());
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

  exportHistoric = async () => {
    const {records, exportToEmail, isLoggedIn} = this.state;
    if (isLoggedIn) {
      await db.transaction((tx) => {
        tx.executeSql('SELECT * FROM records;', [], (tx, results) => {
          const rows = results.rows;
          let records = [];
          for (let i = 0; i < rows.length; i++) {
            records.push({
              ...rows.item(i),
            });
          }
          this.setState({records});
        });
      });
    }
    this.setState({
      isLoading: true,
    });
    await axios
      .post('http://179.27.96.192/api/1.0/measures', {
        email: exportToEmail, // the email is the ci
        data: records.map((r) => ({date: r.timestamp_ms, measure: r.result})),
      })
      .then(async (response) => {
        Alert.alert('Registros enviados correctamente.');
        this.setState({
          isLoading: false,
        });
      })
      .catch(async (_error) => {
        Alert.alert(
          'Ha ocurrido un error, ingrese sus credenciales nuevamente.',
        );
        this.setState({
          isLoading: false,
        });
      });
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
