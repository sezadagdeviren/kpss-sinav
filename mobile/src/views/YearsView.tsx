import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

export default function YearsView({ route, navigation }: any) {
  const { category } = route.params;
  const [years, setYears] = useState<string[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.fetchExamSummaries(category);
      setSummaries(data);
    } catch (err) {
      console.error('Summary fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [category])
  );

  useEffect(() => {
    const yearList = [];
    for (let y = 2025; y >= 2006; y--) yearList.push(y.toString());
    setYears(yearList);
  }, [category]);

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
    const summary = summaries.find(s => s.yil === item);

    return (
      <TouchableOpacity 
        className="bg-white p-7 rounded-[32px] mb-5 border border-slate-200 shadow-xl shadow-slate-200 relative overflow-hidden active:scale-95"
        onPress={() => navigation.navigate('Quiz', { category, year: item })}
        onLongPress={() => {
          Alert.alert(
            'Sıfırla',
            `${item} yılı verilerini sıfırlamak istiyor musunuz?`,
            [
              { text: 'İptal', style: 'cancel' },
              { 
                text: 'Sıfırla', 
                style: 'destructive', 
                onPress: async () => {
                  try {
                    await api.resetPool(category, item);
                    loadData();
                  } catch (err) {
                    console.error('Reset error:', err);
                  }
                } 
              }
            ]
          );
        }}
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-4xl font-black text-slate-900 tracking-tighter">{item}</Text>
            <View className="bg-indigo-600 self-start px-2 py-0.5 rounded-md mt-1">
              <Text className="text-[8px] font-black text-white uppercase tracking-tighter">Sınav Yılı</Text>
            </View>
          </View>

          {summary ? (
            <View className="flex-row items-center gap-x-[10px]">
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
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sınav Geçmişi ve Kayıtlar</Text>
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
