import { AuthContainer } from "@/components/auth/AuthContainer";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await login();
      // Success redirection is handled by AuthProvider
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <AuthContainer>
      <VStack space="xl">
        <VStack space="xs">
          <Heading size="2xl" className="text-slate-800 font-bold">
            Welcome Back
          </Heading>
          <Text className="text-slate-500">
            Sign in to continue your journey together
          </Text>
        </VStack>

        <VStack space="md" className="mt-4">
          <VStack space="xs">
            <Text className="text-sm font-medium text-slate-800 ml-1">
              Email address
            </Text>
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon as={Mail} className="text-slate-400" />
              </InputSlot>
              <InputField
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Input>
          </VStack>

          <VStack space="xs">
            <Text className="text-sm font-medium text-slate-800 ml-1">
              Password
            </Text>
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon as={Lock} className="text-slate-400" />
              </InputSlot>
              <InputField
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <InputSlot
                className="pr-4"
                onPress={() => setShowPassword(!showPassword)}
              >
                <InputIcon
                  as={showPassword ? EyeOff : Eye}
                  className="text-slate-400"
                />
              </InputSlot>
            </Input>
            <Box className="items-end mt-1">
              <Pressable onPress={() => console.log("Forgot password")}>
                <Text className="text-sm text-lavender-500 font-medium">
                  Forgot Password?
                </Text>
              </Pressable>
            </Box>
          </VStack>
        </VStack>

        <Button
          size="xl"
          action="primary"
          onPress={handleLogin}
          className="mt-6"
        >
          <ButtonText className="font-bold text-lg">Sign In</ButtonText>
          <ButtonIcon as={ArrowRight} />
        </Button>

        <Box className="flex-row justify-center mt-4">
          <Text className="text-[#6B7280]">Don't have an account? </Text>
          <Pressable onPress={() => router.push("/(auth)/signup")}>
            <Text className="text-[#9FA0FF] font-bold">Sign Up</Text>
          </Pressable>
        </Box>
      </VStack>
    </AuthContainer>
  );
}
