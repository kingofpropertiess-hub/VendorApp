import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../theme/ThemeProvider";

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  secure?: boolean;
}

export function Input({ label, error, secure, style, ...rest }: Props) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  const secureEntry = secure && !show;

  return (
    <View style={style}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <View
        style={[
          styles.box,
          { borderColor, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center" },
        ]}
      >
        <TextInput
          {...rest}
          style={[styles.input, { color: colors.text }, rest.editable === false && { color: colors.textMuted }]}
          placeholderTextColor={colors.textMuted}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          secureTextEntry={secureEntry}
          autoCapitalize="none"
          keyboardType={rest.keyboardType}
        />
        {secure ? (
          <Pressable onPress={() => setShow(s => !s)} accessibilityLabel={show ? "Hide password" : "Show password"} style={styles.eye}>
            <Ionicons name={show ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13.5, fontWeight: "600", marginBottom: 6 },
  box: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: 50 },
  input: { flex: 1, fontSize: 15.5, paddingVertical: 13 },
  eye: { paddingHorizontal: 10, paddingVertical: 6 },
  error: { fontSize: 12.5, marginTop: 5, fontWeight: "500" },
});
