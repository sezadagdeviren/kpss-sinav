import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Question } from '../../types';

interface QuestionGridProps {
  questions: Question[];
  currentIdx: number;
  onJump: (idx: number) => void;
}

export function QuestionGrid({ questions, currentIdx, onJump }: QuestionGridProps) {
  return (
    <View className="bg-slate-900 px-1 py-3 border-b border-white/10">
      <View className="flex-row flex-wrap justify-center items-center">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIdx;
          const isCorrect = q.status === 'correct';
          const isWrong = q.status === 'wrong';
          
          let btnClass = "w-6 h-6 rounded-md items-center justify-center m-0.5 border";
          let txtClass = "font-black text-[8px]";

          if (isCurrent) {
            btnClass += " bg-indigo-500 border-white scale-125 z-10 shadow-lg shadow-white/20";
            txtClass += " text-white";
          } else if (isCorrect) {
            btnClass += " bg-emerald-500 border-emerald-400";
            txtClass += " text-white";
          } else if (isWrong) {
            btnClass += " bg-rose-500 border-rose-400";
            txtClass += " text-white";
          } else {
            // Answered but no status (shouldn't happen with our new logic) or Unanswered
            btnClass += " bg-slate-800 border-slate-700";
            txtClass += " text-slate-500";
          }

          return (
            <TouchableOpacity 
              key={`${q.id}-${idx}`} 
              onPress={() => onJump(idx)}
              className={btnClass}
              activeOpacity={0.7}
            >
              <Text className={txtClass}>{idx + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
