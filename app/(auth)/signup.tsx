import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { AuthContainer } from '@/components/auth/AuthContainer';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Pressable, ScrollView } from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const handleSignup = () => {
    // Auth logic will go here in next iteration
    console.log('Signup with:', formData);
    router.push('/(auth)/sync');
  };

  return (
    <AuthContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="xl">
          <VStack space="xs">
            <Heading size="3xl" className="text-typography-900">
              Create Account
            </Heading>
            <Text size="md" className="text-typography-500">
              Join Sync and start tracking together
            </Text>
          </VStack>

          <VStack space="lg" className="mt-4">
            <HStack space="md">
              <VStack space="xs" className="flex-1">
                <Text size="sm" className="font-medium text-typography-700 ml-1">
                  First Name
                </Text>
                <Input variant="soft" size="xl">
                  <InputSlot className="pl-4">
                    <InputIcon as={User} className="text-typography-400" />
                  </InputSlot>
                  <InputField
                    placeholder="John"
                    value={formData.firstName}
                    onChangeText={(val) => setFormData({ ...formData, firstName: val })}
                  />
                </Input>
              </VStack>
              <VStack space="xs" className="flex-1">
                <Text size="sm" className="font-medium text-typography-700 ml-1">
                  Last Name
                </Text>
                <Input variant="soft" size="xl">
                  <InputField
                    placeholder="Doe"
                    value={formData.lastName}
                    onChangeText={(val) => setFormData({ ...formData, lastName: val })}
                  />
                </Input>
              </VStack>
            </HStack>

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
                  value={formData.email}
                  onChangeText={(val) => setFormData({ ...formData, email: val })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text size="sm" className="font-medium text-typography-700 ml-1">
                Password
              </Text>
              <Input variant="soft" size="xl">
                <InputSlot className="pl-4">
                  <InputIcon as={Lock} className="text-typography-400" />
                </InputSlot>
                <InputField
                  placeholder="••••••••"
                  value={formData.password}
                  onChangeText={(val) => setFormData({ ...formData, password: val })}
                  secureTextEntry={!showPassword}
                />
                <InputSlot className="pr-4" onPress={() => setShowPassword(!showPassword)}>
                  <InputIcon as={showPassword ? EyeOff : Eye} className="text-typography-400" />
                </InputSlot>
              </Input>
              <Text size="xs" className="text-typography-400 ml-1 mt-1">
                Must be at least 8 characters
              </Text>
            </VStack>
          </VStack>

          <Button 
            action="primary" 
            size="xl" 
            className="rounded-2xl mt-4 h-14 bg-primary-500" 
            onPress={handleSignup}
          >
            <ButtonText className="text-lg font-bold text-white">Create Account</ButtonText>
          </Button>

          <Box className="flex-row justify-center items-center mt-2 mb-4">
            <Text size="sm" className="text-typography-500">
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text size="sm" className="text-primary-500 font-bold">
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </Box>
        </VStack>
      </ScrollView>
    </AuthContainer>
  );
}
