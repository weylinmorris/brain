import { Book, Edit, Lightbulb } from "lucide-react";

export function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div className="md:hidden fixed pb-7 bottom-0 left-0 right-0 bg-neutral-100 dark:bg-neutral-600 border-t border-neutral-200 dark:border-neutral-500">
      <div className="flex justify-around items-center h-14">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'notes' ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-300'
          }`}
        >
          <Book size={20} />
          <span className="text-[10px] mt-0.5">Notes</span>
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'editor' ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-300'
          }`}
        >
          <Edit size={20} />
          <span className="text-[10px] mt-0.5">Editor</span>
        </button>
        <button
          onClick={() => setActiveTab('recommended')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'recommended' ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-300'
          }`}
        >
          <Lightbulb size={20} />
          <span className="text-[10px] mt-0.5">Related</span>
        </button>
      </div>
    </div>
  );
} 