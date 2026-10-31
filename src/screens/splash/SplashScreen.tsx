import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * King of Properties — Vendor App Splash ("The Partner's Invitation")
 *
 * Same brand language as the Client App splash: deep charcoal canvas,
 * champagne-gold glows, the REAL logo (assets/logo.jpg) centred, tagline
 * beneath, gentle float + breathing glow — with a "Vendor Partner" identity.
 * `exiting` triggers the outro fade handled in RootNavigator.
 */

const CHARCOAL = "#0E0E0E";
const CHARCOAL_SOFT = "#161616";
const GOLD = "#C6A25C";
const GOLD_LIGHT = "#E8D8B8";

export function SplashScreen({ exiting = false }: { exiting?: boolean }) {
  const rootIn = useRef(new Animated.Value(0)).current;
  const logoIn = useRef(new Animated.Value(0)).current;
  const taglineIn = useRef(new Animated.Value(0)).current;
  const loaderIn = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const exitFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(rootIn, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    Animated.timing(logoIn, {
      toValue: 1,
      duration: 1100,
      delay: 350,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();

    Animated.timing(taglineIn, {
      toValue: 1,
      duration: 800,
      delay: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(loaderIn, {
      toValue: 1,
      duration: 600,
      delay: 1750,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (exiting) {
      Animated.timing(exitFade, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exiting]);

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: exitFade }, styles.flex]}>
      <View style={[StyleSheet.absoluteFill, styles.canvas]}>
        <Animated.View
          style={[
            styles.glow,
            { opacity: glowOpacity, backgroundColor: GOLD },
          ]}
        />
      </View>

      <View style={styles.flex}>
        <View style={styles.top}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLine} />
            <Animated.Text style={styles.eyebrow}>VENDOR PARTNER</Animated.Text>
            <View style={styles.eyebrowLine} />
          </View>
        </View>

        <View style={styles.center}>
          <Animated.View style={{ transform: [{ translateY: floatY }] }}>
            <Animated.View
              style={[
                styles.logoWrap,
                { opacity: logoIn, transform: [{ scale: logoIn }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.goldHalo,
                  { opacity: glowOpacity, shadowColor: GOLD },
                ]}
              />
              <Image
                source={require("../../../assets/logo.jpg")}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>

          <Animated.Text style={[styles.tagline, { opacity: taglineIn }]}>
            MANAGE YOUR PROPERTIES · ANYTIME
          </Animated.Text>
        </View>

        <View style={styles.bottom}>
          <Animated.View style={[styles.loaderRow, { opacity: loaderIn }]}>
            <View style={styles.loaderDot} />
            <Text style={styles.loaderText}>Preparing your partner toolkit</Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: CHARCOAL },
  canvas: {
    backgroundColor: CHARCOAL,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.5,
  },
  top: { alignItems: "center", paddingTop: 90 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrowLine: { width: 26, height: StyleSheet.hairlineWidth, backgroundColor: GOLD },
  eyebrow: {
    color: GOLD_LIGHT,
    fontSize: 10.5,
    letterSpacing: 3,
    fontWeight: "800",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoWrap: { alignItems: "center", justifyContent: "center" },
  goldHalo: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    shadowOpacity: 0.5,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  logo: {
    width: 240,
    height: 240,
    borderRadius: 24,
  },
  tagline: {
    marginTop: 26,
    color: GOLD_LIGHT,
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  bottom: { alignItems: "center", paddingBottom: 46 },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CHARCOAL_SOFT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(198,162,92,0.35)",
  },
  loaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  loaderText: { color: GOLD_LIGHT, fontSize: 11.5, letterSpacing: 0.6, fontWeight: "600" },
});
