import React, { useState, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DrawingCanvas from '../components/DrawingCanvas';

const { width } = Dimensions.get('window');

export default function QuestionDetailView({ route, navigation }: any) {
  const { questions: list, initialIdx, mode } = route.params;
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [questions, setQuestions] = useState(list);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [solved, setSolved] = useState(false);
  const [myChoice, setMyChoice] = useState<string | null>(null);

  const question = questions[currentIdx];
  const isHataMerkezi = mode === 'wrong';

  const handleAnswer = (choice: string) => {
    if (solved || isDrawingMode) return;
    setMyChoice(choice);
    setSolved(true);
  };

  const removeFromList = async () => {
    Alert.alert('Emin misiniz?', 'Bu soru hata listenizden kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.updateActivity(question.id, 'empty');
            navigation.goBack();
          } catch (err) { console.error(err); }
        }
      }
    ]);
  };

  const toggleFavorite = async () => {
    const newState = !question.is_favorite;
    const updated = [...questions];
    updated[currentIdx].is_favorite = newState;
    setQuestions(updated);
    try { await api.updateActivity(question.id, undefined, newState); } catch (err) { console.error(err); }
  };

  if (!question) return null;

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
              {isHataMerkezi ? `${question.yil} Sınavı` : 'Tüm Kayıtlar'}
            </Text>
          </View>
          <View className="bg-slate-800 px-3 py-1 rounded-lg">
            <Text className="text-white font-black text-xs">{currentIdx + 1} / {questions.length}</Text>
          </View>
        </View>

        <ScrollView className="flex-1" scrollEnabled={!isDrawingMode} showsVerticalScrollIndicator={false}>
          <View className="p-5">
            {/* Meta Bilgiler */}
            <View className="bg-slate-900 p-4 rounded-3xl mb-6 border border-slate-700">
              <View className="flex-row justify-between mb-2">
                <Text className="text-[10px] font-black text-slate-400 uppercase">Zorluk: <Text className="text-amber-400">{question.zorluk_seviyesi || 'Orta'}</Text></Text>
                <Text className="text-[10px] font-black text-slate-400 uppercase">{question.kategori}</Text>
              </View>
              <View className="h-[1px] bg-slate-800 my-2" />
              <View className="space-y-1">
                <Text className="text-xs font-bold text-white uppercase">SINAV YILI: <Text className="text-indigo-400">{question.yil}</Text></Text>
                <Text className="text-xs font-bold text-white uppercase">KONU: <Text className="text-indigo-400">{question.kategori}</Text></Text>
                <Text className="text-xs font-bold text-white uppercase">SORU NO: <Text className="text-indigo-400">{question.soru_no}</Text></Text>
              </View>
            </View>

            {/* Soru Görseli */}
            <View className="w-full bg-white rounded-3xl mb-6 items-center shadow-sm">
              <Text className="text-[9px] font-black text-slate-300 mb-2 self-end">KPSS HUB ENGINE v1.0</Text>
              <Image source={{ uri: api.getImageUrl(question.soru_resmi) }} style={{ width: width - 40, height: 400 }} resizeMode="contain" />
            </View>

            {/* Cevap Paneli */}
            <View className="mb-8">
              <Text className="text-xs font-black text-slate-900 mb-3 uppercase tracking-widest text-center">--- CEVAP PANELİ ---</Text>
              <View className="flex-row justify-between" style={{ gap: 8 }}>
                {['A', 'B', 'C', 'D', 'E'].map((choice) => {
                  const isCorrect = choice === question.dogru_cevap;
                  const isSelected = choice === myChoice;
                  let btn = "flex-1 h-16 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-sm";
                  let txt = "text-2xl font-black text-slate-400";
                  if (solved) {
                    if (isCorrect) { btn = "flex-1 h-16 bg-emerald-500 rounded-2xl items-center justify-center"; txt = "text-2xl font-black text-white"; }
                    else if (isSelected) { btn = "flex-1 h-16 bg-rose-500 rounded-2xl items-center justify-center"; txt = "text-2xl font-black text-white"; }
                    else { btn = "flex-1 h-16 bg-slate-50 opacity-10 items-center justify-center"; }
                  }
                  return (
                    <TouchableOpacity key={choice} onPress={() => handleAnswer(choice)} disabled={solved || isDrawingMode} className={btn}>
                      <Text className={txt}>{choice}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* NAVIGASYON (Çözümün Üstüne Taşındı) */}
            <View className="flex-row mb-8" style={{ gap: 12 }}>
              <TouchableOpacity
                disabled={currentIdx === 0 || isDrawingMode}
                onPress={() => { setCurrentIdx(currentIdx - 1); setSolved(false); setMyChoice(null); }}
                className={`flex-1 h-16 bg-slate-100 rounded-2xl items-center justify-center ${currentIdx === 0 ? 'opacity-0' : ''}`}
              >
                <Text className="text-slate-600 font-bold">← Geri</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isDrawingMode}
                onPress={() => { if (currentIdx < questions.length - 1) { setCurrentIdx(currentIdx + 1); setSolved(false); setMyChoice(null); } }}
                className="flex-[2] h-16 bg-slate-900 rounded-2xl items-center justify-center"
              >
                <Text className="text-white font-bold">Sonraki Soru →</Text>
              </TouchableOpacity>
            </View>

            {/* Özellik Butonları */}
            <View className="space-y-3 mb-8" style={{ gap: 12 }}>
              <TouchableOpacity onPress={toggleFavorite} className="flex-row justify-center items-center py-4 rounded-2xl border border-slate-100 bg-slate-50">
                <Icon name={question.is_favorite ? "star" : "star-outline"} size={22} color={question.is_favorite ? "#f59e0b" : "#cbd5e1"} />
                <Text className={`font-black ml-2 text-xs uppercase ${question.is_favorite ? 'text-amber-600' : 'text-slate-400'}`}>
                  {question.is_favorite ? '★ FAVORİ' : '☆ FAVORİ'}
                </Text>
              </TouchableOpacity>

              {isHataMerkezi && (
                <TouchableOpacity onPress={removeFromList} className="flex-row justify-center items-center py-4 rounded-2xl border border-rose-100 bg-rose-50/30">
                  <Icon name="trash-can-outline" size={18} color="#f43f5e" />
                  <Text className="text-rose-500 font-black ml-2 text-xs uppercase">Hata Listesinden Sil</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ÇÖZÜM ANALİZİ (En Aşağıya Alındı) */}
            <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-10">
              <Text className="text-[10px] font-bold text-slate-900 mb-2 font-black uppercase tracking-widest">Çözüm Analizi</Text>
              <Text className="text-sm text-slate-600 leading-6">{solved ? question.cozum : 'Analiz Bekleniyor'}</Text>
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
