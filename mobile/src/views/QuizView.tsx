import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import type { Question } from '../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DrawingCanvas from '../components/DrawingCanvas';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

export default function QuizView({ route, navigation }: any) {
  const { category, year } = route.params;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  useEffect(() => { loadQuestions(); }, [category, year]);

  const loadQuestions = () => {
    setLoading(true);
    api.fetchQuestions(category, year).then(setQuestions).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentQuestion = useMemo(() => questions[currentIdx], [questions, currentIdx]);

  const stats = useMemo(() => {
    const s = { correct: 0, wrong: 0, empty: 0 };
    questions.forEach(q => {
      if (q.status === 'correct') s.correct++;
      else if (q.status === 'wrong') s.wrong++;
      else s.empty++;
    });
    return s;
  }, [questions]);

  const handleAnswer = async (choice: string) => {
    if (!currentQuestion || selectedAnswer || isDrawingMode) return;
    setSelectedAnswer(choice);
    const status = choice === currentQuestion.dogru_cevap ? 'correct' : 'wrong';
    const updated = [...questions];
    updated[currentIdx].status = status;
    updated[currentIdx].user_choice = choice;
    setQuestions(updated);
    api.updateActivity(currentQuestion.id, status, undefined, choice).catch(console.error);
  };

  const toggleFavorite = async () => {
    if (!currentQuestion) return;
    const newState = !currentQuestion.is_favorite;
    const updated = [...questions];
    updated[currentIdx].is_favorite = newState;
    setQuestions(updated);
    api.updateActivity(currentQuestion.id, undefined, newState).catch(console.error);
  };

  const handleFinish = async () => {
    const summary = {
      category,
      year,
      last_time: timer,
      last_correct: stats.correct,
      last_wrong: stats.wrong,
      last_empty: stats.empty
    };
    try {
      await api.saveExamSummary(summary);
      navigation.popToTop();
    } catch (err) {
      console.error('Save summary error:', err);
      Alert.alert('Hata', 'Sınav özeti kaydedilemedi.');
      navigation.popToTop();
    }
  };

  const resetProgress = () => {
    Alert.alert(
      'İlerlemeyi Sıfırla',
      'Bu yıla ait tüm ilerlemenizi sıfırlamak istediğinizden emin misiniz? Yanlışlarınız ve istatistikleriniz silinecektir.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sıfırla', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.resetPool(category, year);
              navigation.goBack();
            } catch (err) {
              console.error('Reset error:', err);
            }
          }
        }
      ]
    );
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator size="large" color="#000" /></View>;

  const isAnswered = !!selectedAnswer || (currentQuestion?.status && currentQuestion.status !== 'empty');

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3 bg-slate-900 border-b border-slate-800">
           <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center">
              <Icon name="chevron-left" size={24} color="white" />
              <Text className="text-white font-bold ml-1">Kapat</Text>
           </TouchableOpacity>
           <View className="items-center">
              <Text className="text-[10px] font-black text-rose-400 uppercase tracking-widest">KRONOMETRE</Text>
              <Text className="text-white font-black text-lg">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</Text>
           </View>
           <TouchableOpacity 
             onPress={() => {
               Alert.alert(
                 'Sınavı Bitir',
                 `Sınavı bitirmek istediğinize emin misiniz?\n\nSonuçlar:\nDoğru: ${stats.correct}\nYanlış: ${stats.wrong}\nBoş: ${stats.empty}`,
                 [
                   { text: 'İptal', style: 'cancel' },
                   { 
                     text: 'Bitir', 
                     style: 'destructive',
                     onPress: handleFinish 
                   }
                 ]
               );
             }} 
             className="bg-rose-500 px-4 py-2 rounded-xl"
           >
             <Text className="text-white font-black text-[10px] uppercase">SINAVI BİTİR</Text>
           </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" scrollEnabled={!isDrawingMode} showsVerticalScrollIndicator={false}>
          <View className="flex-row justify-around py-4 bg-slate-50 border-b border-slate-100">
             <View className="items-center"><Text className="text-[9px] font-bold text-slate-400">DOĞRU</Text><Text className="text-xl font-black text-emerald-500">{stats.correct}</Text></View>
             <View className="items-center"><Text className="text-[9px] font-bold text-slate-400">YANLIŞ</Text><Text className="text-xl font-black text-rose-500">{stats.wrong}</Text></View>
             <View className="items-center"><Text className="text-[9px] font-bold text-slate-400">BOŞ</Text><Text className="text-xl font-black text-slate-700">{stats.empty}</Text></View>
             <View className="items-center"><Text className="text-[9px] font-bold text-slate-400">SORU</Text><Text className="text-xl font-black text-indigo-600">{currentIdx + 1}/{questions.length}</Text></View>
          </View>

          <View className="p-5">
            <View className="bg-slate-900 p-4 rounded-3xl mb-6 shadow-xl border border-slate-700">
               <View className="space-y-1">
                  <Text className="text-xs font-bold text-white uppercase">SINAV YILI: <Text className="text-indigo-400">{year}</Text></Text>
                  <Text className="text-xs font-bold text-white uppercase">KONU: <Text className="text-indigo-400">{category}</Text></Text>
                  <Text className="text-xs font-bold text-white uppercase">SORU NO: <Text className="text-indigo-400">{currentIdx + 1}</Text></Text>
               </View>
            </View>

            <View className="w-full bg-white rounded-3xl mb-6 items-center">
               <Text className="text-[9px] font-black text-slate-300 mb-2 self-end">KPSS HUB ENGINE v1.0</Text>
               <Image source={{ uri: api.getImageUrl(currentQuestion?.soru_resmi) }} style={{ width: width - 40, height: 400 }} resizeMode="contain" />
            </View>

            <View className="mb-4">
               <Text className="text-xs font-black text-slate-900 mb-3 uppercase text-center">--- CEVAP PANELİ ---</Text>
               <View className="flex-row justify-between" style={{ gap: 8 }}>
                  {['A', 'B', 'C', 'D', 'E'].map((choice) => {
                    const isCorrect = choice === currentQuestion?.dogru_cevap;
                    const myChoice = selectedAnswer || currentQuestion?.user_choice;
                    let btn = "flex-1 h-16 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-sm";
                    let txt = "text-2xl font-black text-slate-400";
                    if (isAnswered) {
                      if (isCorrect) { btn = "flex-1 h-16 bg-emerald-500 rounded-2xl items-center justify-center"; txt = "text-2xl font-black text-white"; }
                      else if (myChoice === choice) { btn = "flex-1 h-16 bg-rose-500 rounded-2xl items-center justify-center"; txt = "text-2xl font-black text-white"; }
                      else btn = "flex-1 h-16 bg-slate-50 opacity-10 items-center justify-center";
                    }
                    return (
                      <TouchableOpacity key={choice} onPress={() => handleAnswer(choice)} disabled={isAnswered || isDrawingMode} className={btn}>
                        <Text className={txt}>{choice}</Text>
                      </TouchableOpacity>
                    );
                  })}
               </View>
            </View>

            {/* NAVIGASYON (Çözümün Üstüne Taşındı) */}
            <View className="flex-row mb-8 mt-4" style={{ gap: 12 }}>
              <TouchableOpacity onPress={() => {setCurrentIdx(i => i - 1); setSelectedAnswer(null);}} disabled={currentIdx === 0 || isDrawingMode} className={`flex-1 h-16 bg-slate-100 rounded-2xl items-center justify-center ${currentIdx === 0 ? 'opacity-0' : ''}`}><Text className="text-slate-600 font-bold">← Geri</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => {setCurrentIdx(i => i + 1); setSelectedAnswer(null);}} disabled={currentIdx >= questions.length - 1 || isDrawingMode} className="flex-[2] h-16 bg-slate-900 rounded-2xl items-center justify-center"><Text className="text-white font-bold">Sonraki Soru →</Text></TouchableOpacity>
            </View>

            <TouchableOpacity onPress={toggleFavorite} className="flex-row justify-center items-center py-4 rounded-2xl border border-slate-100 mb-6 bg-slate-50">
               <Icon name={currentQuestion?.is_favorite ? "star" : "star-outline"} size={20} color={currentQuestion?.is_favorite ? "#f59e0b" : "#94a3b8"} />
               <Text className={`font-black ml-2 text-xs uppercase ${currentQuestion?.is_favorite ? 'text-amber-500' : 'text-slate-400'}`}>☆ FAVORİ</Text>
            </TouchableOpacity>

            {/* ÇÖZÜM ANALİZİ (En Aşağıda) */}
            {isAnswered && (
              <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                <Text className="text-[10px] font-bold text-slate-900 mb-2 uppercase">Çözüm Analizi</Text>
                <Text className="text-sm text-slate-600 leading-6">{currentQuestion?.cozum}</Text>
              </View>
            )}

            <TouchableOpacity onPress={resetProgress} className="py-4">
              <Text className="text-rose-500/50 text-center font-black text-[10px] uppercase tracking-widest underline">Tüm İlerlemeyi Sıfırla</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <DrawingCanvas isDrawingMode={isDrawingMode} />

      <View className="absolute bottom-10 right-6">
        <TouchableOpacity onPress={() => setIsDrawingMode(!isDrawingMode)} className={`w-15 h-15 rounded-full items-center justify-center shadow-2xl ${isDrawingMode ? 'bg-black' : 'bg-white border-2 border-slate-900'}`} style={{ width: 60, height: 60 }}>
          <Icon name={isDrawingMode ? "check-bold" : "pencil"} size={30} color={isDrawingMode ? "white" : "#000"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
