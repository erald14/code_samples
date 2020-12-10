import React, { Component, useState } from "react";
import { StyleSheet, Text, Animated, SafeAreaView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
//TS IMPORTS
import { NavigationScreenProp } from "react-navigation";
import { AppContext } from "../context/AppContext";
//TS IMPORTS
import Header from "../components/Header";
import HomeContainer from "./Home/HomeContainer";
import Notifications from "./Notifications/Notifications";
import Settings from "./Settings/Settings";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
const FadeInView = (props: any) => {
  const [fadeAnim] = useState(new Animated.Value(0)); // Initial value for opacity: 0

  React.useEffect(() => {
    return Animated.timing(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      duration: 600,
    }).start();
  }, []);

  return (
    <Animated.View // Special animatable View
      style={{
        ...props.style,
        opacity: fadeAnim, // Bind opacity to animated value
      }}
    >
      {props.children}
    </Animated.View>
  );
};

interface Props {
  navigation: NavigationScreenProp<any>;
}
export class Home extends Component<Props> {
  static contextType = AppContext;
  context!: React.ContextType<typeof AppContext>;
  static navigationOptions = {
    header: null,
  };
  constructor(props: any) {
    super(props);
  }

  componentDidMount = () => {};

  render() {
    const {
      loginUser,
      changeLoginUser,
      currentUser,
      currentMainPage,
    } = this.context;
    const renderPage = () => {
      switch (this.context.currentMainPage) {
        case "home":
          return <HomeContainer navigation={this.props.navigation} />;
        case "notifications":
          return <Notifications navigation={this.props.navigation} />;
        case "setting":
          return <Settings navigation={this.props.navigation} />;
        default:
          break;
      }
    };
    return (
      <SafeAreaView style={{ height: hp("100%") }}>
        <Header home={true} navigation={this.props.navigation} />
        {renderPage()}
      </SafeAreaView>
    );
  }
}

const s = StyleSheet.create({
  footer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerTxt: {
    fontFamily: "Rubik-Medium",
    color: "#153D7A",
    borderBottomColor: "rgba(21, 61, 122,0.8)",
    borderBottomWidth: 1,
    fontSize: 18,
  },
});

export default Home;
