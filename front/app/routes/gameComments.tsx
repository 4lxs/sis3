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

const API_BASE_URL = "http://localhost:3000";

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
                fetchComments();
            }
        } catch (error) {
            // Optionally show error
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Comments</h4>
            {isLoading ? (
                <div className="text-gray-500">Loading comments...</div>
            ) : (
                <div className="space-y-4 mb-4">
                    {comments.length === 0 ? (
                        <div className="text-gray-400">No comments yet.</div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                                <div className="flex items-center mb-1">
                                    <span className="font-medium text-blue-600 dark:text-blue-400 mr-2">{comment.user}</span>
                                    <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                                </div>
                                <div className="text-gray-800 dark:text-gray-200">{comment.text}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
            <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Add a comment..."
                />
                <button
                    type="submit"
                    disabled={isPosting || !newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                    {isPosting ? "Posting..." : "Post"}
                </button>
            </form>
        </div>
    );
}
