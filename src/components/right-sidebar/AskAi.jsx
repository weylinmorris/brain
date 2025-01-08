import {useState} from "react";

export default function AskAI() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const newMessage = {
            role: 'user',
            content: inputValue
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue("");

        // TODO: Implement AI response logic here
    };

    return (
        <div className="flex flex-col flex-1">
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`p-3 rounded-lg ${
                            msg.role === 'user'
                                ? 'bg-blue-500 text-white ml-8'
                                : 'bg-neutral-200 dark:bg-neutral-700 mr-8'
                        }`}
                    >
                        {msg.content}
                    </div>
                ))}
            </div>

            <div className="flex gap-2 p-4 border-t border-neutral-200 dark:border-neutral-500">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your notes..."
                    className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600"
                />
                <button
                    onClick={handleSend}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
