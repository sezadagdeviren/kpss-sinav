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
  const { category, year, mode = 'exam' } = route.params;
  
  const {
    questions, currentIdx, currentQuestion, loading, selectedAnswer,
    handleAnswer, toggleFavorite, removeMistake, nextQuestion, prevQuestion, jumpToQuestion
  } = useQuiz({ category, year, mode });

  const isReview = mode === 'wrong';
  const isFavoritesMode = mode === 'favorites';

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
    <View className="flex-1 bg-white">
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
          <View className="p-3">
            <View className="bg-slate-900 px-4 py-2 rounded-2xl mb-2 border border-slate-700">
              <View className="flex-row justify-between items-center">
                <Text className="text-[10px] font-black text-white uppercase">{category} <Text className="text-indigo-400">({year})</Text></Text>
                <Text className="text-[10px] font-black text-indigo-400 uppercase">SORU: {currentIdx + 1}</Text>
              </View>
              {(currentQuestion?.konu || currentQuestion?.alt_konu) && (
                <View className="flex-row flex-wrap gap-x-2 gap-y-1 mt-2">
                  {currentQuestion?.konu ? (
                    <View className="bg-white/10 px-3 py-1 rounded-full">
                      <Text className="text-[9px] font-bold text-slate-300 uppercase">{currentQuestion.konu}</Text>
                    </View>
                  ) : null}
                  {currentQuestion?.alt_konu ? (
                    <View className="bg-violet-500/20 px-3 py-1 rounded-full border border-violet-500/20">
                      <Text className="text-[9px] font-bold text-violet-300 uppercase">{currentQuestion.alt_konu}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            <View className="w-full bg-white rounded-2xl mb-4 items-center">
               <Image source={{ uri: api.getImageUrl(currentQuestion?.soru_resmi) }} style={{ width: width - 24, height: 320 }} resizeMode="contain" />
            </View>

            <QuizAnswerPanel 
              currentQuestion={currentQuestion} selectedAnswer={selectedAnswer}
              isAnswered={isAnswered} onAnswer={handleAnswer} isDrawingMode={isDrawingMode}
            />

            <View className="flex-row mb-6 mt-2 gap-x-[10px]">
              <TouchableOpacity onPress={prevQuestion} disabled={currentIdx === 0 || isDrawingMode} className={`flex-1 h-12 bg-slate-100 rounded-xl items-center justify-center ${currentIdx === 0 ? 'opacity-0' : ''}`}><Text className="text-slate-600 font-bold text-xs">← Geri</Text></TouchableOpacity>
              <TouchableOpacity onPress={nextQuestion} disabled={currentIdx >= questions.length - 1 || isDrawingMode} className="flex-[2] h-12 bg-slate-900 rounded-xl items-center justify-center"><Text className="text-white font-bold text-xs">Sonraki Soru →</Text></TouchableOpacity>
            </View>

            <TouchableOpacity onPress={toggleFavorite} className="flex-row justify-center items-center py-4 rounded-2xl border border-slate-100 mb-6 bg-slate-50">
               <Icon name={currentQuestion?.is_favorite ? "star" : "star-outline"} size={20} color={currentQuestion?.is_favorite ? "#f59e0b" : "#94a3b8"} />
               <Text className={`font-black ml-2 text-xs uppercase ${currentQuestion?.is_favorite ? 'text-amber-500' : 'text-slate-400'}`}>{currentQuestion?.is_favorite ? '★ FAVORİ' : '☆ FAVORİ'}</Text>
            </TouchableOpacity>

            {isReview && currentQuestion && (
              <TouchableOpacity 
                onPress={async () => {
                  const isEmpty = await removeMistake();
                  if (isEmpty) {
                    Alert.alert('Tebrikler', 'Tüm hataları temizlediniz!');
                    navigation.goBack();
                  }
                }} 
                className="py-4 rounded-2xl border border-rose-100 bg-rose-50 mb-6 flex-row justify-center items-center"
              >
                <Icon name="delete-outline" size={20} color="#f43f5e" />
                <Text className="text-rose-500 font-black ml-2 text-xs uppercase">Hata Listesinden Sil</Text>
              </TouchableOpacity>
            )}

            {isAnswered && (
              <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[10px] font-bold text-slate-900 uppercase">📝 Çözüm Analizi</Text>
                  {currentQuestion?.alt_konu ? (
                    <View className="bg-violet-100 px-3 py-1 rounded-full">
                      <Text className="text-[9px] font-bold text-violet-600 uppercase">{currentQuestion.alt_konu}</Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-sm text-slate-600 leading-6">{currentQuestion?.cozum || 'Çözüm henüz eklenmemiş.'}</Text>
              </View>
            )}

            {!isReview && !isFavoritesMode && (
              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    'İlerlemeyi Sıfırla',
                    'Bu yıla ait çözdüğünüz tüm soruların ilerlemesi sıfırlanacak. Emin misiniz?',
                    [
                      { text: 'İptal', style: 'cancel' },
                      { 
                        text: 'Sıfırla', 
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await api.resetPool(category, year);
                            Alert.alert('Başarılı', 'İlerleme sıfırlandı.');
                            navigation.goBack();
                          } catch (error) {
                            Alert.alert('Hata', 'Sıfırlama işlemi başarısız oldu.');
                          }
                        }
                      }
                    ]
                  );
                }}
                className="py-4 mt-2 mb-10 items-center"
              >
                <Text className="text-[10px] text-rose-500/80 font-black uppercase tracking-[0.2em] underline">Tüm İlerlemeyi Sıfırla</Text>
              </TouchableOpacity>
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
