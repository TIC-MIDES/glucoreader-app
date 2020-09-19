import React, {Component} from 'react';
import {TouchableOpacity, View, Image, Platform, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import {RNCamera} from 'react-native-camera';

export const Constants = {
  ...RNCamera.Constants,
};

export default class Camera extends Component {
  camera = null;
  state = {
    cameraType: Constants.Type.back,
    flashMode: Constants.FlashMode.off,
    recognizedText: null,
  };

  componentDidMount() {
    this.setState({
      cameraType: this.props.enabledOCR
        ? Constants.Type.back
        : this.props.cameraType,
      flashMode: this.props.flashMode,
      recognizedText: null,
    });
  }

  takePicture = async () => {
    if (this.camera) {
      const options = {
        quality: this.props.quality,
        base64: true,
        width: this.props.imageWidth,
        doNotSave: true,
        fixOrientation: true,
        pauseAfterCapture: true,
      };
      const data = await this.camera.takePictureAsync(options);

      this.props.onCapture &&
        this.props.onCapture(data.base64, this.state.recognizedText);
    }
  };

  onTextRecognized(data) {
    if (this.props.enabledOCR) {
      if (data && data.textBlocks && data.textBlocks.length > 0) {
        this.setState({recognizedText: data});
      }
    }
  }

  render() {
    return (
      <View style={[styles.camera.container, this.props.style]}>
        <RNCamera
          ref={(ref) => {
            this.camera = ref;
          }}
          style={styles.camera.preview}
          type={this.state.cameraType}
          flashMode={this.state.flashMode}
          ratio={this.props.ratio}
          captureAudio={false}
          autoFocus={this.props.autoFocus}
          whiteBalance={this.props.whiteBalance}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          onTextRecognized={
            this.props.enabledOCR
              ? (data) => this.onTextRecognized(data)
              : undefined
          }
        />

        <View style={styles.takePictureButton}>
          {/* flash options button */}
          <TouchableOpacity
            style={styles.camera.capture}
            onPress={(_) => {
              switch (this.state.flashMode) {
                case Constants.FlashMode.off:
                  this.setState({flashMode: Constants.FlashMode.auto});
                  break;

                case Constants.FlashMode.auto:
                  this.setState({flashMode: Constants.FlashMode.on});
                  break;

                case Constants.FlashMode.on:
                  this.setState({flashMode: Constants.FlashMode.off});
                  break;
              }
            }}>
            <Image
              source={
                this.state.flashMode === Constants.FlashMode.auto
                  ? require('../../../assets/camera/flashAuto.png')
                  : this.state.flashMode === Constants.FlashMode.on
                  ? require('../../../assets/camera/flashOn.png')
                  : require('../../../assets/camera/flashOff.png')
              }
              style={{width: 30, height: 30}}
              resizeMode={'contain'}
            />
          </TouchableOpacity>

          {/* take picture button */}
          <TouchableOpacity
            onPress={this.takePicture.bind(this)}
            style={styles.camera.capture}>
            <Image
              source={require('../../../assets/camera/cameraButton.png')}
              style={{width: 50, height: 50}}
              resizeMode={'contain'}
            />
          </TouchableOpacity>

          {/* flip camera button */}
          <TouchableOpacity
            style={styles.camera.capture}
            onPress={(_) => {
              if (this.state.cameraType === Constants.Type.back) {
                this.setState({cameraType: Constants.Type.front});
              } else {
                this.setState({cameraType: Constants.Type.back});
              }
            }}>
            <Image
              source={require('../../../assets/camera/cameraFlipIcon.png')}
              style={{width: 40, height: 40}}
              resizeMode={'contain'}
            />
          </TouchableOpacity>
        </View>

        {/* doctor side button */}
        {this.props.onDoctorButtonClick && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              this.props.onDoctorButtonClick &&
                this.props.onDoctorButtonClick();
            }}>
            <Icon
              name={this.props.onLogInDoctor ? 'medkit-outline' : 'ios-close'}
              style={styles.closeButtonIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

Camera.propTypes = {
  cameraType: PropTypes.any,
  flashMode: PropTypes.any,
  autoFocus: PropTypes.any,
  whiteBalance: PropTypes.any,
  ratio: PropTypes.string,
  quality: PropTypes.number,
  imageWidth: PropTypes.number,
  style: PropTypes.object,
  onCapture: PropTypes.func,
  enabledOCR: PropTypes.bool,
  onDoctorButtonClick: PropTypes.func,
  onLogInDoctor: PropTypes.bool,
};

Camera.defaultProps = {
  cameraType: Constants.Type.back,
  flashMode: Constants.FlashMode.off,
  autoFocus: Constants.AutoFocus.on,
  whiteBalance: Constants.WhiteBalance.auto,
  ratio: '4:3',
  quality: 0.5,
  imageWidth: 768,
  style: null,
  onCapture: null,
  enabledOCR: false,
  onDoctorButtonClick: null,
  onLogInDoctor: true,
};

const styles = {
  camera: {
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'black',
    },
    preview: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    capture: {
      flex: 0,
      padding: 15,
      paddingHorizontal: 20,
      alignSelf: 'center',
      margin: 20,
    },
  },
  closeButton: {
    position: 'absolute',
    backgroundColor: '#aaaaaab0',
    width: 60,
    height: 60,
    borderRadius: 25,
    justifyContent: 'center',
    top: Platform.OS === 'ios' ? 45 : 10,
    left: 10,
  },
  closeButtonIcon: {
    fontSize: Platform.OS === 'ios' ? 40 : 40,
    fontWeight: 'bold',
    alignSelf: 'center',
    lineHeight: Platform.OS === 'ios' ? 58 : 40,
  },
  takePictureButton: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    height: 80,
  },
};
