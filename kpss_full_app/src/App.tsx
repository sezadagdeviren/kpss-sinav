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
        <Route path="/hata-merkezi" element={<ReviewCategoryView mode="mistakes" />} />
        <Route path="/hata-merkezi/:category" element={<YearsView mode="mistakes" />} />
        <Route path="/hata-merkezi/:category/:year" element={<QuizView />} />

        {/* Favoriler Akışı */}
        <Route path="/favorilerim" element={<ReviewCategoryView mode="favorites" />} />
        <Route path="/favorilerim/:category" element={<YearsView mode="favorites" />} />
        <Route path="/favorilerim/:category/:year" element={<QuizView />} />
      </Routes>
    </Router>
  );
}
