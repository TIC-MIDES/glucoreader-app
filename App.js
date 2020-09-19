/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  Text,
  ActivityIndicator,
} from 'react-native';
import Helper from './src/lib/helper';
import commonStyles from './commonStyles';
import Camera, {Constants} from './src/components/camera';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userWord: '',
      errorMsg: '',
      loading: false,
      showCamera: true,
      showWordList: false,
      recogonizedText: null,
      wordList: null,
    };
  }

  onOCRCapture(recogonizedText) {
    this.setState({
      loading: true,
      showCamera: true,
      showWordList: Helper.isNotNullAndUndefined(recogonizedText),
      recogonizedText: recogonizedText,
    });
    this.trimOCRResult(this.state.recogonizedText);
    this.setState({loading: false});
    Alert.alert('', JSON.stringify(this.state.wordList));
  }

  trimOCRResult(wordBlock) {
    let wordList = [];
    if (wordBlock && wordBlock.textBlocks && wordBlock.textBlocks.length > 0) {
      for (let idx = 0; idx < wordBlock.textBlocks.length; idx++) {
        let text = wordBlock.textBlocks[idx].value;
        if (text && text.trim().length > 0) {
          let words = text.split(/[\s,.?]+/);
          if (words && words.length > 0) {
            for (let idx2 = 0; idx2 < words.length; idx2++) {
              if (words[idx2].length > 0) {
                wordList.push(words[idx2]);
              }
            }
          }
        }
      }
    }
    this.setState({wordList: wordList});
  }

  render() {
    return (
      <>
        <StatusBar barStyle="default" backgroundColor="#219bd9" />
        {this.state.showCamera && (
          <Camera
            cameraType={Constants.Type.back}
            flashMode={Constants.FlashMode.off}
            autoFocus={Constants.AutoFocus.on}
            whiteBalance={Constants.WhiteBalance.auto}
            ratio={'4:3'}
            quality={0.5}
            imageWidth={800}
            enabledOCR={true}
            onCapture={(data, recogonizedText) =>
              this.onOCRCapture(recogonizedText)
            }
            onDoctorButtonClick={(_) => {}}
          />
        )}
        {this.state.loading && (
          <ActivityIndicator
            style={commonStyles.loading}
            size="large"
            color={'#219bd9'}
          />
        )}
      </>
    );
  }
}
export default App;
