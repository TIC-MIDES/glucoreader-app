import {PropTypes} from 'prop-types';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
  AppState,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Scanner, {
  Filters,
  RectangleOverlay,
} from 'react-native-rectangle-scanner';
import axios from 'axios';
import RNFS from 'react-native-fs';
import Tts from 'react-native-tts';
import ImageResizer from 'react-native-image-resizer';
import RNBeep from 'react-native-a-beep';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sqlite-storage';
import SystemSetting from 'react-native-system-setting';

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 70,
    justifyContent: 'center',
    width: 65,
  },
  buttonActionGroup: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  buttonBottomContainer: {
    alignItems: 'flex-end',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 25,
    position: 'absolute',
    right: 25,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    bottom: 25,
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'absolute',
    right: 25,
    top: 25,
  },
  buttonGroup: {
    backgroundColor: '#00000080',
    borderRadius: 17,
  },
  buttonIcon: {
    color: 'white',
    fontSize: 22,
    marginBottom: 3,
    textAlign: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 13,
  },
  buttonTopContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 25,
    position: 'absolute',
    right: 25,
    top: 40,
  },
  cameraButton: {
    backgroundColor: 'white',
    borderRadius: 50,
    flex: 1,
    margin: 3,
  },
  cameraNotAvailableContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 15,
  },
  cameraNotAvailableText: {
    color: 'white',
    fontSize: 25,
    textAlign: 'center',
  },
  cameraOutline: {
    borderColor: 'white',
    borderRadius: 50,
    borderWidth: 3,
    height: 70,
    width: 70,
  },
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  flashControl: {
    alignItems: 'center',
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    margin: 8,
    paddingTop: 7,
    width: 50,
  },
  loadingCameraMessage: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    bottom: 0,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  processingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(220, 220, 220, 0.7)',
    borderRadius: 16,
    height: 140,
    justifyContent: 'center',
    width: 200,
  },
  scanner: {
    flex: 1,
  },
});

const defaultState = {
  flashEnabled: false,
  showScannerView: false,
  didLoadInitialLayout: false,
  filterId: 1,
  detectedRectangle: false,
  isMultiTasking: false,
  loadingCamera: true,
  processingImage: false,
  takingPicture: false,
  overlayFlashOpacity: new Animated.Value(0),
  device: {
    initialized: false,
    hasCamera: false,
    permissionToUseCamera: false,
    flashIsAvailable: false,
    previewHeightPercent: 1,
    previewWidthPercent: 1,
  },
  appState: AppState.currentState,
  number: 0,
};

const db = SQLite.openDatabase({
  name: 'main',
  createFromLocation: '~www/main.db',
});
export default class Camera extends React.Component {
  static propTypes = {
    cameraIsOn: PropTypes.bool,
    onLayout: PropTypes.func,
    onPictureTaken: PropTypes.func,
    onPictureProcessed: PropTypes.func,
  };

  static defaultProps = {
    cameraIsOn: undefined,
    onLayout: () => {},
    onPictureTaken: () => {},
    onPictureProcessed: () => {},
    hideSkip: false,
    initialFilterId: Filters.PLATFORM_DEFAULT_FILTER_ID,
  };

  volumeListener;

  constructor(props) {
    super(props);
    this.state = {
      flashEnabled: false,
      showScannerView: false,
      didLoadInitialLayout: false,
      filterId: 1,
      detectedRectangle: false,
      isMultiTasking: false,
      loadingCamera: true,
      processingImage: false,
      takingPicture: false,
      overlayFlashOpacity: new Animated.Value(0),
      device: {
        initialized: false,
        hasCamera: false,
        permissionToUseCamera: false,
        flashIsAvailable: false,
        previewHeightPercent: 1,
        previewWidthPercent: 1,
      },
      appState: AppState.currentState,
      number: 0,
    };

    this.timer = null;
    this.addOne = this.addOne.bind(this);
    this.stopTimer = this.stopTimer.bind(this);

    this.camera = React.createRef();
    this.imageProcessorTimeout = null;
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
    if (this.state.didLoadInitialLayout && !this.state.isMultiTasking) {
      this.turnOnCamera();
    }
    // listen the volume changing if you need
    this.volumeListener = SystemSetting.addVolumeListener(() => {
      if (this.capture()) this.capture();
    });
  }

  componentDidUpdate() {
    if (this.state.didLoadInitialLayout) {
      if (this.state.isMultiTasking) return this.turnOffCamera(true);
      if (this.state.device.initialized) {
        if (!this.state.device.hasCamera) return this.turnOffCamera();
        if (!this.state.device.permissionToUseCamera)
          return this.turnOffCamera();
      }

      if (this.props.cameraIsOn === true && !this.state.showScannerView) {
        return this.turnOnCamera();
      }

      if (this.props.cameraIsOn === false && this.state.showScannerView) {
        return this.turnOffCamera(true);
      }

      if (this.props.cameraIsOn === undefined) {
        return this.turnOnCamera();
      }
    }
    return null;
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
    SystemSetting.removeVolumeListener(this.volumeListener);
    clearTimeout(this.imageProcessorTimeout);
  }

  _handleAppStateChange = (nextAppState) => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      this.setState({...defaultState}, () => this.turnOnCamera());
    } else {
      this.setState({appState: nextAppState});
    }
  };

  // Called after the device gets setup. This lets you know some platform specifics
  // like if the device has a camera or flash, or even if you have permission to use the
  // camera. It also includes the aspect ratio correction of the preview
  onDeviceSetup = (deviceDetails) => {
    const {
      hasCamera,
      permissionToUseCamera,
      flashIsAvailable,
      previewHeightPercent,
      previewWidthPercent,
    } = deviceDetails;
    this.setState({
      flashEnabled: true,
      loadingCamera: false,
      device: {
        initialized: true,
        hasCamera,
        permissionToUseCamera,
        flashIsAvailable,
        previewHeightPercent: previewHeightPercent || 1,
        previewWidthPercent: previewWidthPercent || 1,
      },
    });
  };

  // Determine why the camera is disabled.
  getCameraDisabledMessage() {
    if (this.state.isMultiTasking) {
      return 'El acceso a cámara no está habilitado en multi-tarea.';
    }

    const {device} = this.state;
    if (device.initialized) {
      if (!device.hasCamera) {
        return 'No se ha encontrado una cámara en el dispositivo.';
      }
      if (!device.permissionToUseCamera) {
        return 'Permiso de acceso a cámara denegado.';
      }
    }
    return 'Procesando solicitud';
  }

  // On some android devices, the aspect ratio of the preview is different than
  // the screen size. This leads to distorted camera previews. This allows for correcting that.
  getPreviewSize() {
    const dimensions = Dimensions.get('window');
    // We use set margin amounts because for some reasons the percentage values don't align the camera preview in the center correctly.
    const heightMargin =
      ((1 - this.state.device.previewHeightPercent) * dimensions.height) / 2;
    const widthMargin =
      ((1 - this.state.device.previewWidthPercent) * dimensions.width) / 2;
    if (dimensions.height > dimensions.width) {
      // Portrait
      return {
        height: this.state.device.previewHeightPercent,
        width: this.state.device.previewWidthPercent,
        marginTop: heightMargin,
        marginLeft: widthMargin,
      };
    }

    // Landscape
    return {
      width: this.state.device.previewHeightPercent,
      height: this.state.device.previewWidthPercent,
      marginTop: widthMargin,
      marginLeft: heightMargin,
    };
  }

  // Capture the current frame/rectangle. Triggers the flash animation and shows a
  // loading/processing state. Will not take another picture if already taking a picture.
  capture = () => {
    if (this.state.takingPicture) return;
    if (this.state.processingImage) return;
    this.setState({takingPicture: true, processingImage: true});
    this.camera.current.capture();

    // If capture failed, allow for additional captures
    this.imageProcessorTimeout = setTimeout(() => {
      if (this.state.takingPicture) {
        this.setState({takingPicture: false});
      }
    }, 100);
  };

  // The picture was captured but still needs to be processed.
  onPictureTaken = (event) => {
    this.setState({takingPicture: false});
    this.props.onPictureTaken(event);
    try {
      Tts.speak('La foto está siendo procesada, aguarde por favor!', {
        androidParams: {
          KEY_PARAM_PAN: -1,
          KEY_PARAM_VOLUME: 5,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  // The picture was taken and cached. You can now go on to using it.
  onPictureProcessed = async (event) => {
    if (event.initialImage) {
      await ImageResizer.createResizedImage(
        event?.initialImage,
        720,
        1280,
        'PNG',
        100,
        0,
      )
        .then((response) => {
          return RNFS.readFile(response.path, 'base64');
        })
        .then(async (base64) => {
          const value = await AsyncStorage.getItem('user_id');
          return axios.post(
            'https://glucotest.um.edu.uy:9443/api/1.0/measures/measure',
            {
              user_id: value ? +value : 0,
              measure_picture: base64,
            },
          );
        })
        .then((res) => {
          try {
            Tts.speak(
              `Su nivel de glucosa en la sangre es de ${res.data.data.value}`,
              {
                androidParams: {
                  KEY_PARAM_PAN: -1,
                  KEY_PARAM_VOLUME: 5,
                  KEY_PARAM_STREAM: 'STREAM_MUSIC',
                },
              },
            );
            db.transaction(function (tx) {
              tx.executeSql(
                'INSERT INTO records (timestamp_ms, result) VALUES (?,?)',
                [new Date().toLocaleString(), +res.data.data.value],
              );
            });
          } catch (error) {
            console.log(
              '==============================================',
              {
                error,
                name: `Su nivel de glucosa en la sangre es de ${res.data.data.value}`,
              },
              '==============================================',
            );
          }
        })
        .catch(() => {
          try {
            Tts.speak(
              'No se pudo leer correctamente el resultado. Intente nuevamente.',
              {
                androidParams: {
                  KEY_PARAM_PAN: -1,
                  KEY_PARAM_VOLUME: 5,
                  KEY_PARAM_STREAM: 'STREAM_MUSIC',
                },
              },
            );
          } catch (error) {
            console.log(
              '==============================================',
              {
                error,
                name: 'No se pudo leer correctamente el resultado. Intente nuevamente.',
              },
              '==============================================',
            );
          }
        });
    }
    this.props.onPictureProcessed(event);
    this.setState({
      takingPicture: false,
      processingImage: false,
      showScannerView: this.props.cameraIsOn || false,
    });
  };

  // Flashes the screen on capture
  triggerSnapAnimation() {
    Animated.sequence([
      Animated.timing(this.state.overlayFlashOpacity, {
        toValue: 0.2,
        duration: 100,
      }),
      Animated.timing(this.state.overlayFlashOpacity, {
        toValue: 0,
        duration: 50,
      }),
      Animated.timing(this.state.overlayFlashOpacity, {
        toValue: 0.6,
        delay: 100,
        duration: 120,
      }),
      Animated.timing(this.state.overlayFlashOpacity, {
        toValue: 0,
        duration: 90,
      }),
    ]).start();
  }

  // Hides the camera view. If the camera view was shown and onDeviceSetup was called,
  // but no camera was found, it will not uninitialize the camera state.
  turnOffCamera(shouldUninitializeCamera = false) {
    if (shouldUninitializeCamera && this.state.device.initialized) {
      this.setState(({device}) => ({
        showScannerView: false,
        device: {...device, initialized: false},
      }));
    } else if (this.state.showScannerView) {
      this.setState({showScannerView: false});
    }
  }

  // Will show the camera view which will setup the camera and start it.
  // Expect the onDeviceSetup callback to be called
  turnOnCamera() {
    if (!this.state.showScannerView) {
      this.setState({
        showScannerView: true,
        loadingCamera: true,
      });
    }
  }

  // Renders the flashlight button. Only shown if the device has a flashlight.
  renderFlashControl() {
    const {flashEnabled, device} = this.state;
    if (!device.flashIsAvailable) return null;
    return (
      <TouchableOpacity
        style={[
          styles.flashControl,
          {backgroundColor: flashEnabled ? '#FFFFFF80' : '#00000080'},
        ]}
        activeOpacity={0.8}
        onPress={() => this.setState({flashEnabled: !flashEnabled})}>
        <Icon
          name="ios-flashlight"
          style={[
            styles.buttonIcon,
            {fontSize: 28, color: flashEnabled ? '#333' : '#FFF'},
          ]}
        />
      </TouchableOpacity>
    );
  }

  addOne() {
    if (this.state.number > 10) {
      this.setState({number: 0, showScannerView: false}, () => {
        clearTimeout(this.timer);
        this.props.navigation.replace('Login');
      });
    } else {
      this.setState({number: this.state.number + 1});
      this.timer = setTimeout(this.addOne, 200);
    }
  }

  stopTimer() {
    this.setState({number: 0});
    clearTimeout(this.timer);
  }

  // Renders the camera controls. This will show controls on the side for large tablet screens
  // or on the bottom for phones. (For small tablets it will adjust the view a little bit).
  renderCameraControls() {
    const cameraIsDisabled =
      this.state.takingPicture || this.state.processingImage;
    const disabledStyle = {opacity: cameraIsDisabled ? 0.8 : 1};

    return (
      <>
        <View style={styles.buttonBottomContainer}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.button}
              onPress={this.props.onCancel}
              activeOpacity={0.8}
              onPressIn={this.addOne}
              onPressOut={this.stopTimer}>
              <Icon
                name="medkit-outline"
                style={[styles.buttonIcon, {fontSize: 28, color: '#FFF'}]}
              />
              <Text style={styles.buttonText}>Doctor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // Renders the camera controls or a loading/processing state
  renderCameraOverlay() {
    let loadingState = null;
    if (this.state.loadingCamera) {
      loadingState = (
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" />
            <Text style={styles.loadingCameraMessage}>Cargando cámara</Text>
          </View>
        </View>
      );
    } else if (this.state.processingImage) {
      loadingState = (
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.processingContainer}>
              <ActivityIndicator color="#333333" size="large" />
              <Text style={{color: '#333333', fontSize: 30, marginTop: 10}}>
                Procesando
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <>
        {loadingState}
        <SafeAreaView style={[styles.overlay]}>
          {this.renderCameraControls()}
        </SafeAreaView>
      </>
    );
  }

  // Renders either the camera view, a loading state, or an error message
  // letting the user know why camera use is not allowed
  renderCameraView() {
    if (this.state.showScannerView) {
      const previewSize = this.getPreviewSize();
      let rectangleOverlay = null;
      if (!this.state.loadingCamera && !this.state.processingImage) {
        if (this.state.detectedRectangle) {
          RNBeep.beep();
          Vibration.vibrate();
        } else {
          Vibration.cancel();
        }
        rectangleOverlay = (
          <RectangleOverlay
            detectedRectangle={this.state.detectedRectangle}
            previewRatio={previewSize}
            backgroundColor="rgba(255,181,6, 0.2)"
            borderColor="rgb(255,181,6)"
            borderWidth={4}
            // == These let you auto capture and change the overlay style on detection ==
            detectedBackgroundColor="rgba(255,181,6, 0.3)"
            detectedBorderWidth={6}
            detectedBorderColor="rgb(255,218,124)"
            onDetectedCapture={this.capture}
            allowDetection={true}
            detectionCountBeforeCapture={5}
            rectangleDifferenceAllowance={300}
          />
        );
      }
      // NOTE: I set the background color on here because for some reason the view doesn't line up correctly otherwise. It's a weird quirk I noticed.
      return (
        <View
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0)',
            position: 'relative',
            marginTop: previewSize.marginTop,
            marginLeft: previewSize.marginLeft,
            height: `${previewSize.height * 100}%`,
            width: `${previewSize.width * 100}%`,
          }}>
          <Scanner
            onPictureTaken={this.onPictureTaken}
            onPictureProcessed={this.onPictureProcessed}
            enableTorch={this.state.flashEnabled}
            filterId={this.state.filterId}
            ref={this.camera}
            capturedQuality={1}
            onRectangleDetected={({detectedRectangle}) =>
              this.setState({detectedRectangle})
            }
            onDeviceSetup={this.onDeviceSetup}
            onTorchChanged={({enabled}) =>
              this.setState({flashEnabled: enabled})
            }
            style={styles.scanner}
            onErrorProcessingImage={(err) => console.log('error', err)}
          />
          {rectangleOverlay}
          <Animated.View
            style={{
              ...styles.overlay,
              backgroundColor: 'white',
              opacity: this.state.overlayFlashOpacity,
            }}
          />
          {this.renderCameraOverlay()}
        </View>
      );
    }

    let message = null;
    if (this.state.loadingCamera) {
      message = (
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" />
            <Text style={styles.loadingCameraMessage}>Cargando cámara</Text>
          </View>
        </View>
      );
    } else {
      message = (
        <Text style={styles.cameraNotAvailableText}>
          {this.getCameraDisabledMessage()}
        </Text>
      );
    }

    return <View style={styles.cameraNotAvailableContainer}>{message}</View>;
  }

  render() {
    return (
      <View
        style={styles.container}
        onLayout={(event) => {
          // This is used to detect multi tasking mode on iOS/iPad
          // Camera use is not allowed
          this.props.onLayout(event);
          if (this.state.didLoadInitialLayout && Platform.OS === 'ios') {
            const screenWidth = Dimensions.get('screen').width;
            const isMultiTasking =
              Math.round(event.nativeEvent.layout.width) <
              Math.round(screenWidth);
            if (isMultiTasking) {
              this.setState({isMultiTasking: true, loadingCamera: false});
            } else {
              this.setState({isMultiTasking: false});
            }
          } else {
            this.setState({didLoadInitialLayout: true});
          }
        }}>
        <StatusBar
          backgroundColor="black"
          barStyle="light-content"
          hidden={Platform.OS !== 'android'}
        />
        {this.renderCameraView()}
      </View>
    );
  }
}
