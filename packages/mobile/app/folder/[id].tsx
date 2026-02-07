import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

export default function FolderScreen() {
  const { id } = useLocalSearchParams()
  
  return (
    <View style={styles.container}>
      <Text>文件夹: {id}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
})
