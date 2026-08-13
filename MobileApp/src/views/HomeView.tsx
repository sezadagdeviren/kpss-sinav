import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EXAM_TYPES = ['Lisans', 'Önlisans', 'Ortaöğretim', 'AGS'];

export default function HomeView({ navigation }: any) {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedExamType, setSelectedExamType] = useState('Lisans');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.fetchCategories(selectedExamType)
      .then(setCategories)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedExamType]);

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      className="bg-white p-5 rounded-2xl mb-4 border border-slate-100 shadow-sm flex-row items-center"
      onPress={() => navigation.navigate('Years', { category: item, sinavTuru: selectedExamType })}
    >
      <View className="bg-indigo-50 p-3 rounded-xl mr-4">
        <Icon name="book-outline" size={24} color="#6366f1" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-900">{item}</Text>
        <Text className="text-xs text-slate-500 font-medium">Testleri Çözmeye Başla</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  // Remove full-screen loading block to prevent entire view from disappearing during exam type changes

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        <View className="px-6 py-10">
          <Text className="text-3xl font-black text-slate-900">KPSS <Text className="text-indigo-600">HUB</Text></Text>
          <Text className="text-slate-500 mt-1">Geleceğinize hazırlanın</Text>

          <View className="flex-row space-x-3 mt-8">
            <TouchableOpacity 
              onPress={() => navigation.navigate('HatalarSekme')}
              className="flex-1 bg-rose-500 p-4 rounded-2xl items-center shadow-lg shadow-rose-200"
            >
              <Icon name="alert-circle-outline" size={24} color="white" />
              <Text className="text-white font-bold mt-2">Hatalarım</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('FavorilerSekme')}
              className="flex-1 bg-amber-500 p-4 rounded-2xl items-center shadow-lg shadow-amber-200"
            >
              <Icon name="star-outline" size={24} color="white" />
              <Text className="text-white font-bold mt-2">Favoriler</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xl font-bold text-slate-900 mt-8 mb-3">Sınav Türü</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: 10, paddingRight: 20 }}
            className="flex-row mb-6"
          >
            {EXAM_TYPES.map((type) => {
              const isActive = selectedExamType === type;
              const activeClass = 
                type.toLowerCase().includes('lisans') && !type.toLowerCase().includes('ön') ? 'bg-violet-600 border-violet-600 shadow-md shadow-violet-100' :
                type.toLowerCase().includes('önlisans') ? 'bg-emerald-600 border-emerald-600 shadow-md shadow-emerald-100' :
                type.toLowerCase().includes('ortaöğretim') || type.toLowerCase().includes('ortaogretim') ? 'bg-amber-500 border-amber-500 shadow-md shadow-amber-100' :
                type.toLowerCase().includes('ags') ? 'bg-fuchsia-600 border-fuchsia-600 shadow-md shadow-fuchsia-100' : 
                'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100';

              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedExamType(type)}
                  className={`px-5 py-2.5 rounded-full border ${isActive ? activeClass : 'bg-white border-slate-200'}`}
                >
                  <Text className={`font-black text-xs ${isActive ? 'text-white' : 'text-slate-600'}`}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text className="text-xl font-bold text-slate-900 mt-4 mb-4">Kategoriler</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#6366f1" className="my-8" />
          ) : (
            categories.map((item) => (
              <View key={item}>
                {renderItem({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
