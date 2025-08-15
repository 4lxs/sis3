import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

// Configure axios to include credentials by default
axios.defaults.withCredentials = true;

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSkillLevel, setSelectedSkillLevel] = useState("All");
    const [activeTab, setActiveTab] = useState("all");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [availableSports, setAvailableSports] = useState<any[]>([]);
    const [isLoadingSports, setIsLoadingSports] = useState(true);
    const [selectedSport, setSelectedSport] = useState("");
    const [newSport, setNewSport] = useState("");

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    // Check authentication status on component mount
    useEffect(() => {
        checkAuthStatus();
        fetchEvents();
        fetchSports();
    }, []);

    // Fetch joined games when login status changes
    useEffect(() => {
        fetchMyGames();
    }, [isLoggedIn]);

    const fetchSports = async () => {
        try {
            setIsLoadingSports(true);
            const response = await axios.get(`${API_BASE_URL}/sports`, {
                withCredentials: true
            });

            if (response.data.success) {
                setAvailableSports(response.data.sports || []);
            }
        } catch (error) {
            console.error('Failed to fetch sports:', error);
            // If fetch fails, use fallback sports
            setAvailableSports([
                { id: 1, name: 'Basketball' },
                { id: 2, name: 'Soccer' },
                { id: 3, name: 'Tennis' },
                { id: 4, name: 'Volleyball' }
            ]);
        } finally {
            setIsLoadingSports(false);
        }
    };

    const fetchEvents = async () => {
        try {
            setIsLoadingEvents(true);
            const response = await axios.get(`${API_BASE_URL}/events`, {
                withCredentials: true
            });

            console.log('Events response:', response.data); // Debug log

            if (response.data.success) {
                console.log('Setting events:', response.data.events); // Debug log
                setEvents(response.data.events || []);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
            // If fetch fails, keep using mock data as fallback
            setEvents([]);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    const handleCreateGame = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoggedIn) {
            setShowLoginPrompt(true);
            setTimeout(() => setShowLoginPrompt(false), 3000);
            return;
        }

        // Combine date and time into datetime format
        const datetime = `${newGame.date} ${newGame.time}:00`;

        try {
            const response = await axios.post(`${API_BASE_URL}/events/create`, {
                title: newGame.title,
                sport: newGame.sport,
                location: newGame.location,
                datetime: datetime,
                max_players: newGame.totalPlayers,
                skill_level: newGame.skillLevel
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                // Reset form
                setNewGame({
                    title: "",
                    sport: "",
                    location: "",
                    date: "",
                    time: "",
                    totalPlayers: 8,
                    skillLevel: "Intermediate",
                    description: ""
                });
                setSelectedSport("");
                setNewSport("");

                // Close form
                setShowCreateForm(false);

                // Refresh events list and sports list
                fetchEvents();
                fetchSports();

                // Show success message (you could add a toast notification here)
                alert('Game created successfully!');
            }
        } catch (error: any) {
            console.error('Failed to create game:', error);
            alert(error.response?.data?.message || 'Failed to create game. Please try again.');
        }
    };

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            // Check if the click is outside the user menu and not on the logout button
            if (showUserMenu && !target.closest('[data-user-menu]')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    const checkAuthStatus = async () => {
        try {
            // Try to make an authenticated request to check if user is logged in
            const response = await axios.get(`${API_BASE_URL}/users/profile`, {
                withCredentials: true
            });

            if (response.data.success) {
                setUser(response.data.user);
                setIsLoggedIn(true);
            }
        } catch (error) {
            // User is not logged in or token is invalid
            setIsLoggedIn(false);
            setUser(null);
        }
    };

    const handleLogout = async () => {
        console.log('Logout button clicked'); // Debug log
        setIsLoggingOut(true);
        try {
            console.log('Making logout request...'); // Debug log
            await axios.post(`${API_BASE_URL}/users/logout`, {}, {
                withCredentials: true
            });

            // Clear local state
            setIsLoggedIn(false);
            setUser(null);
            setShowUserMenu(false);

            console.log('Successfully logged out'); // Debug log
        } catch (error) {
            console.error('Logout error:', error);
            // Even if the logout request fails, clear local state
            setIsLoggedIn(false);
            setUser(null);
            setShowUserMenu(false);
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Create game form state
    const [newGame, setNewGame] = useState({
        title: "",
        sport: "Basketball",
        location: "",
        date: "",
        time: "",
        totalPlayers: 8,
        skillLevel: "Intermediate",
        description: ""
    });

    // Mock user games (games the user has joined)
    const [myGameIds, setMyGameIds] = useState<number[]>([]); // User has joined games with these IDs

    // Fetch user's joined games
    const fetchMyGames = async () => {
        if (!isLoggedIn) {
            setMyGameIds([]);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/users/joined-games`, {
                withCredentials: true
            });

            if (response.data.success) {
                const joinedGameIds = response.data.games.map((game: any) => game.id);
                setMyGameIds(joinedGameIds);
            }
        } catch (error) {
            console.error('Failed to fetch joined games:', error);
            setMyGameIds([]);
        }
    };

    // Handle joining a game
    const handleJoinGame = async (gameId: number) => {
        if (!isLoggedIn) {
            setShowLoginPrompt(true);
            setTimeout(() => setShowLoginPrompt(false), 3000);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/events/${gameId}/join`, {}, {
                withCredentials: true
            });

            if (response.data.success) {
                // Update local state
                setMyGameIds(prev => [...prev, gameId]);
                // Refresh events to update player counts
                fetchEvents();
                alert('Successfully joined the game!');
            }
        } catch (error: any) {
            console.error('Failed to join game:', error);
            alert(error.response?.data?.message || 'Failed to join game. Please try again.');
        }
    };

    // Handle leaving a game
    const handleLeaveGame = async (gameId: number) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/events/${gameId}/leave`, {}, {
                withCredentials: true
            });

            if (response.data.success) {
                // Update local state
                setMyGameIds(prev => prev.filter(id => id !== gameId));
                // Refresh events to update player counts
                fetchEvents();
                alert('Successfully left the game!');
            }
        } catch (error: any) {
            console.error('Failed to leave game:', error);
            alert(error.response?.data?.message || 'Failed to leave game. Please try again.');
        }
    };

    // Transform events data to match the expected format
    const transformedEvents = events.map(event => ({
        id: event.id,
        sport: event.sport_name || event.sport, // Use sport_name from JOIN query
        title: event.title || `${event.sport_name || event.sport} Game`, // Use actual title from database
        location: event.location,
        date: new Date(event.datetime).toISOString().split('T')[0],
        time: new Date(event.datetime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }),
        playersNeeded: Math.max(0, event.max_players - (event.current_players || 0)),
        totalPlayers: event.max_players,
        skillLevel: event.skill_level,
        organizer: event.organizer_name || 'Unknown',
        description: event.description || `${event.skill_level}`,
        icon: (event.sport_name || event.sport || '').toLowerCase() === 'basketball' ? '🏀' :
            (event.sport_name || event.sport || '').toLowerCase() === 'soccer' ? '⚽' :
                (event.sport_name || event.sport || '').toLowerCase() === 'tennis' ? '🎾' :
                    (event.sport_name || event.sport || '').toLowerCase() === 'volleyball' ? '🏐' : '⚽'
    }));

    // Use real events data only - no fallback to mock data
    const allGames = transformedEvents;

    const myGames = allGames.filter(game => myGameIds.includes(game.id));

    // Apply filtering
    let baseGames = activeTab === "my" ? myGames : allGames;

    const filteredGames = baseGames.filter(game => {
        // Search filter
        const matchesSearch = searchTerm === "" ||
            game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            game.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            game.organizer.toLowerCase().includes(searchTerm.toLowerCase());

        // Sport filter
        const matchesSport = selectedSport === "" || game.sport === selectedSport;

        return matchesSearch && matchesSport;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">SIS</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Pickup Sports Information System</p>
                        </div>
                        <nav className="hidden md:flex space-x-6 items-center">
                            {isLoggedIn && user ? (
                                <div className="relative" data-user-menu>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors duration-200"
                                    >
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{user.username}</span>
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log('Logout button direct click'); // Debug
                                                    handleLogout();
                                                }}
                                                disabled={isLoggingOut}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoggingOut ? (
                                                    <div className="flex items-center">
                                                        <svg className="animate-spin mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Signing Out...
                                                    </div>
                                                ) : (
                                                    'Sign Out'
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link to="/signin" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                                    Sign In
                                </Link>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Find Your Next Game
                        </h1>
                        <p className="text-xl mb-8 text-blue-100">
                            Join pickup sports games in your area or organize your own
                        </p>
                        <div className="relative">
                            <button
                                onClick={() => {
                                    if (!isLoggedIn) {
                                        setShowLoginPrompt(true);
                                        setTimeout(() => setShowLoginPrompt(false), 3000); // Hide after 3 seconds
                                        return;
                                    }
                                    setShowCreateForm(!showCreateForm);
                                }}
                                className="bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Create New Game
                            </button>

                            {showLoginPrompt && (
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap z-10">
                                    <div className="flex items-center space-x-2">
                                        <span>Please sign in to create a game</span>
                                        <Link
                                            to="/signin"
                                            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs font-medium"
                                        >
                                            Sign In
                                        </Link>
                                    </div>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                                </div>
                            )}
                        </div>

                        {showCreateForm && (
                            <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 text-left">
                                <h3 className="text-xl font-semibold text-white mb-6">Organize Your Game</h3>

                                <form onSubmit={handleCreateGame} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Game Title */}
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium text-blue-100 mb-2">
                                                Game Title *
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                value={newGame.title}
                                                onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
                                                className="w-full px-3 py-2 border border-white/30 rounded-md focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/20 text-white placeholder-blue-200"
                                                placeholder="e.g., Morning Basketball at Central Park"
                                                required
                                            />
                                        </div>

                                        {/* Sport */}
                                        <div>
                                            <label htmlFor="sport" className="block text-sm font-medium text-blue-100 mb-2">
                                                Sport *
                                            </label>
                                            <select
                                                id="sport"
                                                value={selectedSport}
                                                onChange={(e) => {
                                                    setSelectedSport(e.target.value);
                                                    if (e.target.value !== 'new') {
                                                        setNewGame({ ...newGame, sport: e.target.value });
                                                        setNewSport('');
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-white/30 rounded-md focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/20 text-white"
                                                required
                                            >
                                                <option value="" className="text-gray-900">Select a sport</option>
                                                {availableSports.map((sport) => (
                                                    <option key={sport.id} value={sport.name} className="text-gray-900">{sport.name}</option>
                                                ))}
                                                <option value="new" className="text-gray-900">+ Create new sport</option>
                                            </select>

                                            {selectedSport === 'new' && (
                                                <input
                                                    type="text"
                                                    placeholder="Enter new sport name"
                                                    value={newSport}
                                                    onChange={(e) => {
                                                        setNewSport(e.target.value);
                                                        setNewGame({ ...newGame, sport: e.target.value });
                                                    }}
                                                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/20 text-white placeholder-blue-200 mt-2"
                                                    required
                                                />
                                            )}
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label htmlFor="location" className="block text-sm font-medium text-blue-100 mb-2">
                                                Location *
                                            </label>
                                            <input
                                                type="text"
                                                id="location"
                                                value={newGame.location}
                                                onChange={(e) => setNewGame({ ...newGame, location: e.target.value })}
                                                className="w-full px-3 py-2 border border-white/30 rounded-md focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/20 text-white placeholder-blue-200"
                                                placeholder="e.g., Central Park Courts"
                                                required
                                            />
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <label htmlFor="date" className="block text-sm font-medium text-blue-100 mb-2">
                                                Date *
                                            </label>
                                            <input
                                                type="date"
                                                id="date"
                                                value={newGame.date}
                                                onChange={(e) => setNewGame({ ...newGame, date: e.target.value })}
                                                className="w-full px-3 py-2 border border-white/30 rounded-md focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/20 text-white"
                                                required
                                            />
                                        </div>

                                        {/* Time */}
                                        <div>
                                            <label htmlFor="time" className="block text-sm font-medium text-blue-100 mb-2">
                                                Time *
                                            </label>
                                            <input
                                                type="time"
                                                id="time"
                                                value={newGame.time}
                                                onChange={(e) => setNewGame({ ...newGame, time: e.target.value })}
                                                className="w-full px-3 py-2 border border-white/30 rounded-md focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/20 text-white"
                                                required
                                            />
                                        </div>

                                        {/* Total Players */}
                                        <div>
                                            <label htmlFor="totalPlayers" className="block text-sm font-medium text-blue-100 mb-2">
                                                Total Players *
                                            </label>
                                            <input
                                                type="number"
                                                id="totalPlayers"
                                                min="2"
                                                max="50"
                                                value={newGame.totalPlayers}
                                                onChange={(e) => setNewGame({ ...newGame, totalPlayers: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-white/30 rounded-md focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/20 text-white"
                                                required
                                            />
                                        </div>

                                        {/* Skill Level */}
                                        <div>
                                            <label htmlFor="skillLevel" className="block text-sm font-medium text-blue-100 mb-2">
                                                Difficulty
                                            </label>
                                            <input
                                                type="text"
                                                id="skillLevel"
                                                value={newGame.skillLevel}
                                                onChange={(e) => setNewGame({ ...newGame, skillLevel: e.target.value })}
                                                className="w-full px-3 py-2 border border-white/30 rounded-md focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/20 text-white placeholder-blue-200"
                                                placeholder="e.g., Beginner, Intermediate, Advanced"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        <button
                                            type="submit"
                                            className="flex-1 sm:flex-none bg-white text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg font-medium transition duration-300 flex items-center justify-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Create Game
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateForm(false)}
                                            className="flex-1 sm:flex-none border border-white/30 text-white hover:bg-white/10 px-6 py-2 rounded-lg font-medium transition duration-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Filters Section */}
            <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        {/* Search Bar */}
                        <div className="flex-1">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search games, locations, or organizers..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Sport Filter */}
                        <div className="min-w-0 md:w-48">
                            <select
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                value={selectedSport}
                                onChange={(e) => setSelectedSport(e.target.value)}
                            >
                                <option value="">All Sports</option>
                                {availableSports.map(sport => (
                                    <option key={sport.id} value={sport.name}>{sport.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Games List */}
            <section className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Tab Navigation */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab("all")}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === "all"
                                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                    }`}
                            >
                                All Games ({allGames.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("my")}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === "my"
                                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                    }`}
                            >
                                My Games ({myGames.length})
                            </button>
                        </div>
                    </div>

                    {isLoadingEvents ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading games...</p>
                        </div>
                    ) : filteredGames.length === 0 ? (
                        <div className="text-center py-12">
                            {activeTab === "my" ? (
                                <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2m16-7H4m16 0l-2-2m2 2l-2 2M4 13l2-2m-2 2l2 2" />
                                    </svg>
                                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">You haven't joined any games yet.</p>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Browse all games and join one to get started!</p>
                                    <button
                                        onClick={() => setActiveTab("all")}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                                    >
                                        Browse All Games
                                    </button>
                                </>
                            ) : (
                                <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No games found matching your criteria.</p>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Try adjusting your search filters or create a new game.</p>
                                    <button
                                        onClick={() => {
                                            if (!isLoggedIn) {
                                                setShowLoginPrompt(true);
                                                setTimeout(() => setShowLoginPrompt(false), 3000); // Hide after 3 seconds
                                                return;
                                            }
                                            setShowCreateForm(true);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                                    >
                                        Create New Game
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredGames.map(game => (
                                <div key={game.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition duration-300">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-3">{game.icon}</span>
                                                <div>
                                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{game.title}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{game.sport}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${game.skillLevel === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                game.skillLevel === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                {game.skillLevel}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {game.location}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {game.date} at {game.time}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Organized by {game.organizer}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {game.playersNeeded} spots left
                                                </span>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {" "}/ {game.totalPlayers} total
                                                </span>
                                            </div>
                                            {myGameIds.includes(game.id) ? (
                                                <button
                                                    onClick={() => handleLeaveGame(game.id)}
                                                    className="bg-green-600 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300 flex items-center"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Joined
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleJoinGame(game.id)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300"
                                                >
                                                    Join Game
                                                </button>
                                            )}
                                        </div>

                                        {/* Comments Button */}
                                        <div className="mt-4 flex justify-end">
                                            <Link
                                                to={`/game/${game.id}/comments`}
                                                className="bg-gray-200 dark:bg-gray-700 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition duration-300"
                                            >
                                                View Comments
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
