import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Question } from '../../types';

interface QuizAnswerPanelProps {
  currentQuestion: Question;
  selectedAnswer: string | null;
  isAnswered: boolean;
  onAnswer: (choice: string) => void;
  isDrawingMode: boolean;
}

export function QuizAnswerPanel({
  currentQuestion, selectedAnswer, isAnswered, onAnswer, isDrawingMode
}: QuizAnswerPanelProps) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-black text-slate-900 mb-3 uppercase text-center">--- CEVAP PANELİ ---</Text>
      <View className="flex-row justify-between" style={{ gap: 8 }}>
        {['A', 'B', 'C', 'D', 'E'].map((choice) => {
          const isCorrect = choice === currentQuestion?.dogru_cevap;
          const myChoice = selectedAnswer || currentQuestion?.user_choice;
          
          let btn = "flex-1 h-16 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-sm";
          let txt = "text-2xl font-black text-slate-400";
          
          if (isAnswered) {
            if (isCorrect) { 
              btn = "flex-1 h-16 bg-emerald-500 rounded-2xl items-center justify-center"; 
              txt = "text-2xl font-black text-white"; 
            } else if (myChoice === choice) { 
              btn = "flex-1 h-16 bg-rose-500 rounded-2xl items-center justify-center"; 
              txt = "text-2xl font-black text-white"; 
            } else {
              btn = "flex-1 h-16 bg-slate-50 opacity-10 items-center justify-center";
            }
          }
          
          return (
            <TouchableOpacity 
              key={choice} 
              onPress={() => onAnswer(choice)} 
              disabled={isAnswered || isDrawingMode} 
              className={btn}
            >
              <Text className={txt}>{choice}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
