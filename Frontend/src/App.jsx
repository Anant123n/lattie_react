import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import HistoricalPage from './pages/HistoricalPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="historical" element={<HistoricalPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
