import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeView from './views/HomeView';
import YearsView from './views/YearsView';
import QuizView from './views/QuizView';
import ReviewCategoryView from './views/ReviewCategoryView';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Ana Akış */}
        <Route path="/" element={<HomeView />} />
        <Route path="/ders/:category" element={<YearsView />} />
        <Route path="/ders/:category/:year" element={<QuizView />} />

        {/* Hata Merkezi Akışı */}
        <Route path="/hata-merkezi" element={<ReviewCategoryView />} />
        <Route path="/hata-merkezi/:category" element={<YearsView />} />
        <Route path="/hata-merkezi/:category/:year" element={<QuizView />} />

        {/* Favoriler (Opsiyonel: Benzer mantıkla genişletilebilir) */}
        <Route path="/favorilerim" element={<QuizView />} /> 
      </Routes>
    </Router>
  );
}
