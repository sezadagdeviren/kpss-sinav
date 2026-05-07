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
    <View className="mb-2">
      <View className="flex-row justify-between" style={{ gap: 6 }}>
        {['A', 'B', 'C', 'D', 'E'].map((choice) => {
          const isCorrect = choice === currentQuestion?.dogru_cevap;
          const myChoice = selectedAnswer || currentQuestion?.user_choice;
          
          let btn = "flex-1 h-12 bg-white border border-slate-200 rounded-xl items-center justify-center";
          let txt = "text-xl font-black text-slate-300";
          
          if (isAnswered) {
            if (isCorrect) { 
              btn = "flex-1 h-12 bg-emerald-500 rounded-xl items-center justify-center"; 
              txt = "text-xl font-black text-white"; 
            } else if (myChoice === choice) { 
              btn = "flex-1 h-12 bg-rose-500 rounded-xl items-center justify-center"; 
              txt = "text-xl font-black text-white"; 
            } else {
              btn = "flex-1 h-12 bg-slate-50 opacity-20 items-center justify-center";
            }
          } else if (myChoice === choice) {
             btn = "flex-1 h-12 bg-indigo-500 border-indigo-400 rounded-xl items-center justify-center";
             txt = "text-xl font-black text-white";
          }
          
          return (
            <TouchableOpacity 
              key={choice} 
              onPress={() => onAnswer(choice)} 
              disabled={isAnswered || isDrawingMode} 
              className={btn}
              activeOpacity={0.7}
            >
              <Text className={txt}>{choice}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
