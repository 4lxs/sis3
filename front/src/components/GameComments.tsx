import { useState, useEffect } from "react";
import axios from "axios";

interface Comment {
    id: number;
    user: string;
    text: string;
    created_at: string;
}

interface GameCommentsProps {
    gameId: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function GameComments({ gameId }: GameCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [gameId]);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/events/${gameId}/comments`, {
                withCredentials: true
            });
            if (response.data.success) {
                setComments(response.data.comments || []);
            }
        } catch (error) {
            setComments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsPosting(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/events/${gameId}/comments`, {
                text: newComment
            }, {
                withCredentials: true
            });
            if (response.data.success) {
                setNewComment("");
                fetchComments(); // Refresh comments
            }
        } catch (error) {
            alert("Failed to add comment. Please try again.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comments</h3>

            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                />
                <button
                    type="submit"
                    disabled={isPosting || !newComment.trim()}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPosting ? "Posting..." : "Post Comment"}
                </button>
            </form>

            {/* Comments list */}
            {isLoading ? (
                <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Loading comments...</p>
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 dark:text-white">{comment.user}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
