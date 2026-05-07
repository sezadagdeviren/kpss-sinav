import React, { useState, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DrawingCanvas from '../components/DrawingCanvas';
import { useQuiz } from '../hooks/useQuiz';
import { useTimer } from '../hooks/useTimer';

// Components
import { QuizHeader } from '../components/quiz/QuizHeader';
import { QuizAnswerPanel } from '../components/quiz/QuizAnswerPanel';
import { QuestionGrid } from '../components/quiz/QuestionGrid';

const { width } = Dimensions.get('window');

export default function QuizView({ route, navigation }: any) {
  const { category, year } = route.params;
  
  const {
    questions, currentIdx, currentQuestion, loading, selectedAnswer,
    handleAnswer, toggleFavorite, nextQuestion, prevQuestion, jumpToQuestion
  } = useQuiz({ category, year });

  const { timer, setIsActive } = useTimer(true);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const stats = useMemo(() => {
    const s = { correct: 0, wrong: 0, empty: 0 };
    questions.forEach(q => {
      if (q.status === 'correct') s.correct++;
      else if (q.status === 'wrong') s.wrong++;
      else s.empty++;
    });
    return s;
  }, [questions]);

  const handleFinish = async () => {
    setIsActive(false);
    try {
      await api.saveExamSummary({
        kategori: category, 
        yil: year, 
        last_time: timer,
        last_correct: stats.correct, 
        last_wrong: stats.wrong, 
        last_empty: stats.empty
      });
      Alert.alert('Sınav Kaydedildi', 'Sonuçlarınız başarıyla kaydedildi.');
      navigation.goBack();
    } catch (err) {
      console.error('❌ Kayıt hatası:', err);
      Alert.alert('Hata', 'Sınav kaydedilemedi. İnternet bağlantınızı kontrol edin.');
    }
  };

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator size="large" color="#6366f1" /></View>;

  const isAnswered = !!(selectedAnswer || (currentQuestion?.status && currentQuestion.status !== 'empty'));

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView className="flex-1">
        <QuizHeader 
          onBack={() => navigation.goBack()} timer={timer} formatTime={formatTime}
          onFinish={() => Alert.alert('Sınavı Bitir', 'Emin misiniz?', [{text:'İptal'}, {text:'Bitir', onPress: handleFinish}])}
          stats={stats} currentIdx={currentIdx} totalQuestions={questions.length}
        />

        <QuestionGrid 
          questions={questions}
          currentIdx={currentIdx}
          onJump={jumpToQuestion}
        />

        <ScrollView className="flex-1" scrollEnabled={!isDrawingMode} showsVerticalScrollIndicator={false}>
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

            <QuizAnswerPanel 
              currentQuestion={currentQuestion} selectedAnswer={selectedAnswer}
              isAnswered={isAnswered} onAnswer={handleAnswer} isDrawingMode={isDrawingMode}
            />

            <View className="flex-row mb-8 mt-4" style={{ gap: 12 }}>
              <TouchableOpacity onPress={prevQuestion} disabled={currentIdx === 0 || isDrawingMode} className={`flex-1 h-16 bg-slate-100 rounded-2xl items-center justify-center ${currentIdx === 0 ? 'opacity-0' : ''}`}><Text className="text-slate-600 font-bold">← Geri</Text></TouchableOpacity>
              <TouchableOpacity onPress={nextQuestion} disabled={currentIdx >= questions.length - 1 || isDrawingMode} className="flex-[2] h-16 bg-slate-900 rounded-2xl items-center justify-center"><Text className="text-white font-bold">Sonraki Soru →</Text></TouchableOpacity>
            </View>

            <TouchableOpacity onPress={toggleFavorite} className="flex-row justify-center items-center py-4 rounded-2xl border border-slate-100 mb-6 bg-slate-50">
               <Icon name={currentQuestion?.is_favorite ? "star" : "star-outline"} size={20} color={currentQuestion?.is_favorite ? "#f59e0b" : "#94a3b8"} />
               <Text className={`font-black ml-2 text-xs uppercase ${currentQuestion?.is_favorite ? 'text-amber-500' : 'text-slate-400'}`}>{currentQuestion?.is_favorite ? '★ FAVORİ' : '☆ FAVORİ'}</Text>
            </TouchableOpacity>

            {isAnswered && (
              <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                <Text className="text-[10px] font-bold text-slate-900 mb-2 uppercase">Çözüm Analizi</Text>
                <Text className="text-sm text-slate-600 leading-6">{currentQuestion?.cozum || 'Çözüm henüz eklenmemiş.'}</Text>
              </View>
            )}
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
