import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import type { Question } from '../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { groupQuestions } from '../utils/quizUtils';

const { width } = Dimensions.get('window');

const EXAM_TYPES = ['Lisans', 'Önlisans', 'Ortaöğretim', 'AGS'];

export default function ReviewView({ route, navigation }: any) {
  const { type } = route.params; // 'wrong' veya 'favorites'
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedExamType, setSelectedExamType] = useState('Lisans');
  const [loading, setLoading] = useState(true);
  
  // Drill-down states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    api.fetchReview(type, selectedExamType)
      .then(setQuestions)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      // Reset navigation state when switching tabs
      setSelectedCategory(null);
      setSelectedYear(null);
    }, [type, selectedExamType])
  );

  // Grouping logic
  const groupedData = useMemo(() => groupQuestions(questions), [questions]);

  const categories = useMemo(() => Object.keys(groupedData).sort(), [groupedData]);
  const years = useMemo(() => {
    if (!selectedCategory) return [];
    return Object.keys(groupedData[selectedCategory]).sort((a, b) => b.localeCompare(a));
  }, [groupedData, selectedCategory]);

  const filteredQuestions = useMemo(() => {
    if (!selectedCategory || !selectedYear) return [];
    return groupedData[selectedCategory][selectedYear];
  }, [groupedData, selectedCategory, selectedYear]);

  const handleBack = () => {
    if (selectedYear) setSelectedYear(null);
    else if (selectedCategory) setSelectedCategory(null);
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm flex-row items-center"
      onPress={() => setSelectedCategory(item)}
    >
      <View className="bg-indigo-50 p-3 rounded-2xl mr-4">
        <Icon name="folder-outline" size={24} color="#6366f1" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-900">{item}</Text>
        <Text className="text-xs text-slate-500 font-medium">
          {Object.values(groupedData[item]).reduce((acc, curr) => acc + curr.length, 0)} Soru
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  const renderYearItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm flex-row items-center"
      onPress={() => setSelectedYear(item)}
    >
      <View className="bg-slate-50 p-3 rounded-2xl mr-4">
        <Icon name="calendar-outline" size={24} color="#64748b" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-900">{item} Yılı</Text>
        <Text className="text-xs text-slate-500 font-medium">{groupedData[selectedCategory!][item].length} Soru</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  const renderQuestionItem = ({ item, index }: { item: Question, index: number }) => (
    <TouchableOpacity 
      className="bg-white p-4 rounded-3xl mb-4 border border-slate-100 shadow-sm flex-row items-center"
      onPress={() => navigation.navigate('QuestionDetail', { 
        questions: filteredQuestions, 
        initialIdx: index,
        mode: type 
      })}
    >
      <View className="bg-slate-50 w-16 h-16 rounded-2xl items-center justify-center overflow-hidden mr-4 border border-slate-100">
        <Image source={{ uri: api.getImageUrl(item.soru_resmi) }} className="w-full h-full" resizeMode="cover" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-black text-indigo-600 uppercase mb-1">{item.kategori} {item.yil}</Text>
        <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>Soru {item.soru_no}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  if (loading) return <View className="flex-1 justify-center items-center bg-slate-50"><ActivityIndicator color="#6366f1" size="large" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 py-6 border-b border-white">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {type === 'wrong' ? 'HATA MERKEZİ' : '★ FAVORİLERİM'}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className={`w-2 h-2 rounded-full mr-2 ${type === 'wrong' ? 'bg-rose-500' : 'bg-amber-500'}`} />
              <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                {questions.length} TOPLAM KAYIT
              </Text>
            </View>
          </View>
          {(selectedCategory || selectedYear) && (
            <TouchableOpacity 
              onPress={handleBack}
              className="bg-slate-200/50 w-10 h-10 rounded-full items-center justify-center"
            >
              <Icon name="arrow-left" size={20} color="#475569" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Breadcrumbs */}
        {(selectedCategory || selectedYear) && (
          <View className="flex-row items-center mt-4">
             <Text className="text-[10px] font-black text-slate-400 uppercase">TÜMÜ</Text>
             <Icon name="chevron-right" size={14} color="#cbd5e1" />
             {selectedCategory && (
               <>
                 <Text className="text-[10px] font-black text-indigo-600 uppercase">{selectedCategory}</Text>
                 {selectedYear && (
                   <>
                     <Icon name="chevron-right" size={14} color="#cbd5e1" />
                     <Text className="text-[10px] font-black text-indigo-600 uppercase">{selectedYear}</Text>
                   </>
                 )}
               </>
             )}
          </View>
        )}

        {!selectedCategory && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: 10, paddingRight: 20 }}
            className="flex-row mt-4 mb-2"
          >
            {EXAM_TYPES.map((type) => {
              const isActive = selectedExamType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedExamType(type)}
                  className={`px-4 py-2 rounded-full border ${isActive ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'bg-white border-slate-200'}`}
                >
                  <Text className={`font-black text-[10px] uppercase ${isActive ? 'text-white' : 'text-slate-600'}`}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {!selectedCategory ? (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="mt-20 items-center">
              <Icon name="clipboard-check-outline" size={60} color="#e2e8f0" />
              <Text className="text-slate-400 mt-4 font-bold">Kayıt bulunamadı.</Text>
            </View>
          }
        />
      ) : !selectedYear ? (
        <FlatList
          data={years}
          renderItem={renderYearItem}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
        />
      ) : (
        <FlatList
          data={filteredQuestions}
          renderItem={renderQuestionItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}
