import { View, Text, StyleSheet } from 'react-native'

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <Text>收藏的 Prompts</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
