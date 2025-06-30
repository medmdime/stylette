import { Dimensions, View } from 'react-native';
import { ScannedItem } from '~/utils/types';
import { BarChart } from 'react-native-chart-kit';
import { Text } from '~/components/ui/text';

export function ProfileScoreCard({ items }: { items: ScannedItem[] }) {
  // Get last 5 scores
  const last5 = items.slice(-5);
  const labels = last5.map((item, i) => `#${items.length - last5.length + i + 1}`);
  const scores = last5.map((item) => item.result.outfit_analysis.overall_score);

  return (
    <View
      style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, margin: 16, elevation: 2 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>
        Recent Outfit Scores
      </Text>
      <BarChart
        data={{
          labels,
          datasets: [{ data: scores }],
        }}
        width={Dimensions.get('window').width - 64}
        height={180}
        fromZero
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          labelColor: () => '#222',
        }}
        style={{ borderRadius: 12 }}
        yAxisLabel={''}
        yAxisSuffix={''}
      />
    </View>
  );
}
