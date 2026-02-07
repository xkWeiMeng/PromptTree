import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="prompt/[id]" options={{ title: 'Prompt' }} />
        <Stack.Screen name="folder/[id]" options={{ title: '文件夹' }} />
      </Stack>
    </>
  )
}
