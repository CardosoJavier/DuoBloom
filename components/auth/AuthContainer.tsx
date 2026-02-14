import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Heart } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AuthContainerProps {
  children: React.ReactNode;
}

export function AuthContainer({ children }: AuthContainerProps) {
  return (
    <Box className="flex-1 bg-slate-50">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Center className="mt-8 mb-10">
            <Box className="w-16 h-16 bg-lavender-500/10 rounded-full justify-center items-center mb-4">
              <Heart size={32} color="#9FA0FF" fill="#9FA0FF" />
            </Box>
            <Heading size="3xl" className="text-slate-900 font-bold">
              Sync
            </Heading>
            <Text className="text-slate-500 text-lg">Fitness for Couples</Text>
          </Center>

          <Box className="px-6">
            <Card
              variant="bento"
              className="bg-white p-8 shadow-2xl shadow-slate-200 border-0"
              style={{ borderRadius: 48 }}
            >
              {children}
            </Card>
          </Box>

          <Center className="mt-12 mb-8">
            <Text className="text-slate-400 text-sm">
              Designed for partners to grow together.
            </Text>
          </Center>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
});
