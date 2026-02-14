import { AuthContainer } from "@/components/auth/AuthContainer";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable } from "react-native";

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    try {
      await signUp(email, password);
      // Success redirection is handled by AuthProvider
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  return (
    <AuthContainer>
      <VStack space="xl">
        <VStack space="xs">
          <Heading size="2xl" className="text-slate-900 font-bold">
            Create Account
          </Heading>
          <Text className="text-slate-500">
            Join Sync and start your fitness journey together
          </Text>
        </VStack>

        <VStack space="md" className="mt-4">
          <VStack space="xs">
            <Text className="text-sm font-medium text-slate-800 ml-1">
              Full Name
            </Text>
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon as={User} className="text-slate-400" />
              </InputSlot>
              <InputField
                placeholder="Enter your name"
                value={fullName}
                onChangeText={setFullName}
              />
            </Input>
          </VStack>

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
                placeholder="Create a password"
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
          </VStack>
        </VStack>

        <Button
          size="xl"
          action="primary"
          onPress={handleSignup}
          className="mt-6"
        >
          <ButtonText className="font-bold text-lg">Create Account</ButtonText>
          <ButtonIcon as={ArrowRight} />
        </Button>

        <Box className="flex-row justify-center mt-4">
          <Text className="text-[#6B7280]">Already have an account? </Text>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text className="text-[#9FA0FF] font-bold">Sign In</Text>
          </Pressable>
        </Box>
      </VStack>
    </AuthContainer>
  );
}
