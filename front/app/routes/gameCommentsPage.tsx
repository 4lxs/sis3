import GameComments from "./gameComments";
import { useParams } from "react-router";

export default function GameCommentsPage() {
    // Get gameId from URL params
    const { gameId } = useParams();
    const id = Number(gameId);

    if (!id) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Game Not Found</h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">The requested game could not be found.</p>
                    <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Back to Home</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-2xl mx-auto py-12 px-4">
                <h1 className="text-3xl font-bold mb-6 text-blue-600 dark:text-blue-400">Game Comments</h1>
                <GameComments gameId={id} />
                <div className="mt-8">
                    <a href="/" className="text-blue-600 hover:underline">&larr; Back to Games</a>
                </div>
            </div>
        </div>
    );
}
