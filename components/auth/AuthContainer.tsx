import React from 'react';
import { ImageBackground, SafeAreaView, StyleSheet } from 'react-native';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';

interface AuthContainerProps {
  children: React.ReactNode;
}

export function AuthContainer({ children }: AuthContainerProps) {
  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop' }} 
      style={styles.background}
      blurRadius={30}
    >
      <SafeAreaView style={styles.container}>
        <Box className="flex-1 justify-center px-6">
          <Card variant="bento" size="lg" className="bg-white/90 dark:bg-background-900/90">
            {children}
          </Card>
        </Box>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
});
