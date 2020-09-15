/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {RNCamera} from 'react-native-camera';

declare const global: {HermesInternal: null | {}};

const App = () => {
  return (
    <View style={styles.container}>
      <RNCamera
        ref={(ref) => {
          this.camera = ref;
        }}
        style={styles.scanner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  scanner: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default App;
