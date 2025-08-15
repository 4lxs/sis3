import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import GameCommentsPage from './pages/GameCommentsPage';

function App() {
    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/game/:gameId/comments" element={<GameCommentsPage />} />
            </Routes>
        </div>
    );
}

export default App;
