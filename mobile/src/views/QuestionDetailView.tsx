import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DrawingCanvas from '../components/DrawingCanvas';
import { useQuiz } from '../hooks/useQuiz';

// Shared Components
import { QuizAnswerPanel } from '../components/quiz/QuizAnswerPanel';
import { QuestionGrid } from '../components/quiz/QuestionGrid';

const { width } = Dimensions.get('window');

export default function QuestionDetailView({ route, navigation }: any) {
  const { category, year, initialIdx, mode, questions: initialQuestions } = route.params;
  
  const {
    questions, currentIdx, currentQuestion, loading, selectedAnswer,
    handleAnswer, toggleFavorite, removeMistake, nextQuestion, prevQuestion, jumpToQuestion
  } = useQuiz({ category, year, mode, initialIdx, initialQuestions });

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const isHataMerkezi = mode === 'wrong';

  const handleRemove = async () => {
    Alert.alert('Emin misiniz?', 'Bu soru hata listenizden kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          const isEmpty = await removeMistake();
          if (isEmpty) navigation.goBack();
        }
      }
    ]);
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator size="large" color="#6366f1" /></View>;
  if (!currentQuestion) return null;

  const isAnswered = !!(selectedAnswer || (currentQuestion.status && currentQuestion.status !== 'empty'));

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView className="flex-1">
        {/* Header Bar */}
        <View className="flex-row justify-between items-center px-4 py-3 bg-slate-900 shadow-md">
          <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center">
            <Icon name="chevron-left" size={24} color="white" />
            <Text className="text-white font-bold ml-1">Başa Dön</Text>
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-white font-black text-xs uppercase tracking-widest">
              {isHataMerkezi ? 'HATA MERKEZİ' : '★ FAVORİLERİM'}
            </Text>
            <Text className="text-rose-400 font-bold text-[9px] uppercase">
              {isHataMerkezi ? `${currentQuestion.yil} Sınavı` : 'Tüm Kayıtlar'}
            </Text>
          </View>
          <View className="bg-slate-800 px-3 py-1 rounded-lg">
            <Text className="text-white font-black text-xs">{currentIdx + 1} / {questions.length}</Text>
          </View>
        </View>

        <QuestionGrid 
          questions={questions}
          currentIdx={currentIdx}
          onJump={jumpToQuestion}
        />

        <ScrollView className="flex-1" scrollEnabled={!isDrawingMode} showsVerticalScrollIndicator={false}>
          <View className="p-3">
            {/* Meta Info */}
            <View className="bg-slate-900 px-4 py-2 rounded-2xl mb-4 border border-slate-700 flex-row justify-between items-center">
              <Text className="text-[10px] font-black text-white uppercase">{currentQuestion.kategori} <Text className="text-indigo-400">({currentQuestion.yil})</Text></Text>
              <Text className="text-[10px] font-black text-indigo-400 uppercase">SORU: {currentQuestion.soru_no}</Text>
            </View>

            {/* Question Image */}
            <View className="w-full bg-white rounded-2xl mb-4 items-center">
               <Image source={{ uri: api.getImageUrl(currentQuestion.soru_resmi) }} style={{ width: width - 24, height: 320 }} resizeMode="contain" />
            </View>

            {/* Answer Panel (Shared Component) */}
            <QuizAnswerPanel 
              currentQuestion={currentQuestion} selectedAnswer={selectedAnswer}
              isAnswered={isAnswered} onAnswer={handleAnswer} isDrawingMode={isDrawingMode}
            />

            {/* Navigation */}
            <View className="flex-row mb-6 mt-2" style={{ gap: 10 }}>
              <TouchableOpacity
                disabled={currentIdx === 0 || isDrawingMode}
                onPress={prevQuestion}
                className={`flex-1 h-12 bg-slate-100 rounded-xl items-center justify-center ${currentIdx === 0 ? 'opacity-0' : ''}`}
              >
                <Text className="text-slate-600 font-bold text-xs">← Geri</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isDrawingMode}
                onPress={nextQuestion}
                className="flex-[2] h-12 bg-slate-900 rounded-xl items-center justify-center"
              >
                <Text className="text-white font-bold text-xs">Sonraki Soru →</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View className="space-y-2 mb-6" style={{ gap: 8 }}>
              <TouchableOpacity onPress={toggleFavorite} className="flex-row justify-center items-center py-3 rounded-xl border border-slate-100 bg-slate-50">
                <Icon name={currentQuestion.is_favorite ? "star" : "star-outline"} size={18} color={currentQuestion.is_favorite ? "#f59e0b" : "#cbd5e1"} />
                <Text className={`font-black ml-2 text-[10px] uppercase ${currentQuestion.is_favorite ? 'text-amber-600' : 'text-slate-400'}`}>
                  {currentQuestion.is_favorite ? '★ FAVORİ' : '☆ FAVORİ'}
                </Text>
              </TouchableOpacity>

              {isHataMerkezi && (
                <TouchableOpacity onPress={handleRemove} className="flex-row justify-center items-center py-3 rounded-xl border border-rose-100 bg-rose-50/30">
                  <Icon name="trash-can-outline" size={16} color="#f43f5e" />
                  <Text className="text-rose-500 font-black ml-2 text-[10px] uppercase">Hata Listesinden Sil</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Solution Analysis */}
            <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-10">
              <Text className="text-[10px] font-bold text-slate-900 mb-2 font-black uppercase tracking-widest">Çözüm Analizi</Text>
              <Text className="text-sm text-slate-600 leading-6">{isAnswered ? currentQuestion.cozum : 'Analiz Bekleniyor'}</Text>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>

      <DrawingCanvas isDrawingMode={isDrawingMode} />

      <View className="absolute bottom-10 right-6">
        <TouchableOpacity
          onPress={() => setIsDrawingMode(!isDrawingMode)}
          className={`w-15 h-15 rounded-full items-center justify-center shadow-2xl ${isDrawingMode ? 'bg-black' : 'bg-white border-2 border-slate-900'}`}
          style={{ width: 60, height: 60 }}
        >
          <Icon name={isDrawingMode ? "check-bold" : "pencil"} size={30} color={isDrawingMode ? "white" : "#000"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
