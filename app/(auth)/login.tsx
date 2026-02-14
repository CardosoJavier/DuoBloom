import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { AuthContainer } from '@/components/auth/AuthContainer';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Pressable } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // Auth logic will go here in next iteration
    console.log('Login with:', email, password);
    await login();
  };

  return (
    <AuthContainer>
      <VStack space="xl">
        <VStack space="xs">
          <Heading size="3xl" className="text-typography-900">
            Welcome back
          </Heading>
          <Text size="md" className="text-typography-500">
            Sign in to continue
          </Text>
        </VStack>

        <VStack space="lg" className="mt-4">
          <VStack space="xs">
            <Text size="sm" className="font-medium text-typography-700 ml-1">
              Email
            </Text>
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon as={Mail} className="text-typography-400" />
              </InputSlot>
              <InputField
                placeholder="hello@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Input>
          </VStack>

          <VStack space="xs">
            <Box className="flex-row justify-between items-center ml-1">
              <Text size="sm" className="font-medium text-typography-700">
                Password
              </Text>
              <Pressable onPress={() => console.log('Forgot password pressed')}>
                <Text size="xs" className="text-primary-500 font-semibold">
                  Forgot?
                </Text>
              </Pressable>
            </Box>
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon as={Lock} className="text-typography-400" />
              </InputSlot>
              <InputField
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <InputSlot className="pr-4" onPress={() => setShowPassword(!showPassword)}>
                <InputIcon as={showPassword ? EyeOff : Eye} className="text-typography-400" />
              </InputSlot>
            </Input>
          </VStack>
        </VStack>

        <Button 
          action="dark" 
          size="xl" 
          className="rounded-2xl mt-4 h-14" 
          onPress={handleLogin}
        >
          <ButtonText className="text-lg font-bold">Sign In</ButtonText>
        </Button>

        <Box className="flex-row justify-center items-center mt-2">
          <Text size="sm" className="text-typography-500">
            Don't have an account?{' '}
          </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text size="sm" className="text-primary-500 font-bold">
                Sign up
              </Text>
            </Pressable>
          </Link>
        </Box>
      </VStack>
    </AuthContainer>
  );
}
