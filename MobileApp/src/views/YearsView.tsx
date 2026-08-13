import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

export default function YearsView({ route, navigation }: any) {
  const { category, sinavTuru } = route.params;
  const [years, setYears] = useState<string[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [yearsData, summaryData] = await Promise.all([
        api.fetchYears(category, sinavTuru),
        api.fetchExamSummaries(category, sinavTuru)
      ]);
      setYears(yearsData);
      setSummaries(summaryData);
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [category, sinavTuru])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderItem = ({ item }: { item: string }) => {
    const summary = summaries.find(s => s.yil === item || s.yil?.toString() === item);

    return (
      <TouchableOpacity 
        className="bg-white p-7 rounded-[32px] mb-5 border border-slate-200 shadow-xl shadow-slate-200 relative overflow-hidden active:scale-95"
        onPress={() => navigation.navigate('Quiz', { category, year: item, sinavTuru })}
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-4xl font-black text-slate-900 tracking-tighter">{item}</Text>
            <View className="bg-indigo-600 self-start px-2 py-0.5 rounded-md mt-1">
              <Text className="text-[8px] font-black text-white uppercase tracking-tighter">Sınav Yılı</Text>
            </View>
          </View>

          {summary ? (
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <View className="items-center">
                <Text className="text-[8px] font-black text-green-500">D</Text>
                <Text className="text-base font-black text-slate-800">{summary.last_correct}</Text>
              </View>
              <View className="items-center">
                <Text className="text-[8px] font-black text-red-500">Y</Text>
                <Text className="text-base font-black text-slate-800">{summary.last_wrong}</Text>
              </View>
              <View className="items-center">
                <Text className="text-[8px] font-black text-slate-400">B</Text>
                <Text className="text-base font-black text-slate-800">{summary.last_empty}</Text>
              </View>
              <View className="w-[1px] h-8 bg-slate-100 mx-1" />
              <View className="bg-slate-900 px-3 py-2 rounded-2xl items-center justify-center">
                 <Icon name="clock-outline" size={10} color="#818cf8" />
                 <Text className="text-[10px] font-black text-white">{formatTime(summary.last_time)}</Text>
              </View>
            </View>
          ) : (
            <View className="bg-indigo-50 px-5 py-3 rounded-2xl flex-row items-center">
              <Text className="text-indigo-600 font-black text-xs mr-1 uppercase">Başlat</Text>
              <Icon name="chevron-right" size={18} color="#4f46e5" />
            </View>
          )}
        </View>

        {/* Decorative background element */}
        <View className="absolute -right-2 -top-2 opacity-[0.03]">
           <Icon name="school" size={80} color="#000" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-8 pt-6 pb-2">
        <Text className="text-3xl font-black text-slate-900 tracking-tight">{category}</Text>
        <View className="flex-row items-center mt-1" style={{ gap: 8 }}>
          <View className={`px-2.5 py-0.5 rounded-md ${
            (sinavTuru || 'Lisans').toLowerCase().includes('lisans') && !(sinavTuru || 'Lisans').toLowerCase().includes('ön') ? 'bg-violet-600' :
            (sinavTuru || 'Lisans').toLowerCase().includes('önlisans') ? 'bg-emerald-600' :
            (sinavTuru || 'Lisans').toLowerCase().includes('ortaöğretim') || (sinavTuru || 'Lisans').toLowerCase().includes('ortaogretim') ? 'bg-amber-500' :
            (sinavTuru || 'Lisans').toLowerCase().includes('ags') ? 'bg-fuchsia-600' : 'bg-indigo-600'
          }`}>
            <Text className="text-[9px] font-black text-white uppercase">{sinavTuru || 'Lisans'}</Text>
          </View>
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sınav Geçmişi</Text>
        </View>
      </View>
      <FlatList
        data={years}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
        }
      />
    </SafeAreaView>
  );
}
