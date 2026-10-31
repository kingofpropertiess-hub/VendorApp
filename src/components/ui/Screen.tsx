import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  scrollProps?: ScrollViewProps & { keyboardShouldPersistTaps?: "always" | "handled" | undefined };
  style?: ViewStyle;
  padTop?: number;
}

export function Screen({ children, scroll, scrollProps, style, padTop = 0 }: Props) {
  const { colors } = useTheme();
  const content = (
    <View style={[{ flexGrow: 1, paddingTop: padTop }, style]}>{children}</View>
  );

  if (scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom", "left", "right"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            {...scrollProps}
          >
            {content}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, styles.fill]} edges={["bottom", "left", "right"]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ fill: { flexGrow: 1 } });
