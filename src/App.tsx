import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { generateQuestion, GeneratedQuestion } from './services/gemini';
import { BookOpen, Calculator, Shapes, ArrowLeft, Star, Loader2, Sparkles, Trophy } from 'lucide-react';

type ViewState = 'SUBJECT_SELECT' | 'TOPIC_SELECT' | 'DIFFICULTY_SELECT' | 'PLAYING';

interface Topic {
  id: string;
  name: string;
  emoji: string;
}

interface Subject {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  topics: Topic[];
}

const SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: 'Math Magic',
    icon: <Calculator className="w-12 h-12" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
    topics: [
      { id: 'counting', name: 'Counting', emoji: '🔢' },
      { id: 'addition', name: 'Addition', emoji: '➕' },
      { id: 'subtraction', name: 'Subtraction', emoji: '➖' },
      { id: 'numbers', name: 'Numbers', emoji: '1️⃣' },
    ],
  },
  {
    id: 'reading',
    name: 'Reading Fun',
    icon: <BookOpen className="w-12 h-12" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100 hover:bg-rose-200 border-rose-300',
    topics: [
      { id: 'letters', name: 'Letters', emoji: '🔤' },
      { id: 'sight-words', name: 'Sight Words', emoji: '👀' },
      { id: 'rhyming', name: 'Rhyming', emoji: '🎵' },
      { id: 'sounds', name: 'First Sounds', emoji: '🗣️' },
    ],
  },
  {
    id: 'logic',
    name: 'Brain Games',
    icon: <Shapes className="w-12 h-12" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300',
    topics: [
      { id: 'patterns', name: 'Patterns', emoji: '🧩' },
      { id: 'shapes', name: 'Shapes', emoji: '⭐' },
      { id: 'colors', name: 'Colors', emoji: '🎨' },
      { id: 'sizes', name: 'Sizes', emoji: '🐘' },
    ],
  },
];

const DIFFICULTIES = [
  { id: 'Easy', name: 'Easy Peasy', emoji: '🌟', color: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' },
  { id: 'Medium', name: 'Just Right', emoji: '⭐⭐', color: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200' },
  { id: 'Hard', name: 'Super Brain', emoji: '🧠', color: 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200' },
  { id: 'Extreme', name: 'Ninja Level', emoji: '🥷', color: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200' },
];

export default function App() {
  const [view, setView] = useState<ViewState>('SUBJECT_SELECT');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setView('TOPIC_SELECT');
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setView('DIFFICULTY_SELECT');
  };

  const handleDifficultySelect = async (diff: string) => {
    setDifficulty(diff);
    setView('PLAYING');
    await loadQuestion(selectedSubject!.name, selectedTopic!.name, diff);
  };

  const loadQuestion = async (subjectName: string, topicName: string, diff: string) => {
    setLoading(true);
    setError(null);
    setQuestion(null);
    setSelectedAnswer(null);
    setIsCorrect(null);
    try {
      const q = await generateQuestion(subjectName, topicName, diff);
      setQuestion(q);
    } catch (err) {
      console.error(err);
      setError("Oops! The magic machine had a hiccup. Let's try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks
    
    setSelectedAnswer(answer);
    const correct = answer === question?.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 1);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#facc15', '#f472b6', '#38bdf8', '#4ade80']
      });
    }
  };

  const handleNextQuestion = () => {
    if (selectedSubject && selectedTopic && difficulty) {
      loadQuestion(selectedSubject.name, selectedTopic.name, difficulty);
    }
  };

  const handleBack = () => {
    if (view === 'TOPIC_SELECT') {
      setView('SUBJECT_SELECT');
      setSelectedSubject(null);
    } else if (view === 'DIFFICULTY_SELECT') {
      setView('TOPIC_SELECT');
      setSelectedTopic(null);
    } else if (view === 'PLAYING') {
      setView('DIFFICULTY_SELECT');
      setQuestion(null);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 font-sans text-slate-800">
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          {view !== 'SUBJECT_SELECT' && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="p-3 bg-white rounded-full shadow-md text-slate-600 hover:text-slate-900 border-2 border-slate-200"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
          )}
          <h1 className="text-3xl md:text-5xl font-black text-indigo-600 tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Kiddo Quest
          </h1>
        </div>
        
        {view === 'PLAYING' && (
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border-2 border-yellow-200">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="text-2xl font-bold text-slate-700">{score}</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          
          {/* SUBJECT SELECTION */}
          {view === 'SUBJECT_SELECT' && (
            <motion.div
              key="subject-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-slate-700">
                What do you want to play today? 🤔
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SUBJECTS.map((subject) => (
                  <motion.button
                    key={subject.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubjectSelect(subject)}
                    className={`flex flex-col items-center justify-center p-8 rounded-3xl border-4 shadow-xl ${subject.bgColor} ${subject.color} transition-colors`}
                  >
                    <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                      {subject.icon}
                    </div>
                    <span className="text-2xl font-black tracking-wide">{subject.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* TOPIC SELECTION */}
          {view === 'TOPIC_SELECT' && selectedSubject && (
            <motion.div
              key="topic-select"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-2">
                  {selectedSubject.name} Time! 🎉
                </h2>
                <p className="text-xl text-slate-500">Pick a fun game to play!</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {selectedSubject.topics.map((topic) => (
                  <motion.button
                    key={topic.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTopicSelect(topic)}
                    className={`flex items-center gap-4 p-6 rounded-2xl border-4 shadow-lg bg-white hover:${selectedSubject.bgColor.split(' ')[0]} border-slate-200 hover:border-slate-300 transition-all`}
                  >
                    <span className="text-5xl">{topic.emoji}</span>
                    <span className="text-2xl font-bold text-slate-700">{topic.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* DIFFICULTY SELECTION */}
          {view === 'DIFFICULTY_SELECT' && selectedSubject && selectedTopic && (
            <motion.div
              key="difficulty-select"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-2">
                  How tricky should it be? 🎚️
                </h2>
                <p className="text-xl text-slate-500">Pick your challenge level for {selectedTopic.name}!</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {DIFFICULTIES.map((diff) => (
                  <motion.button
                    key={diff.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDifficultySelect(diff.id)}
                    className={`flex flex-col items-center justify-center p-8 rounded-3xl border-4 shadow-xl transition-all ${diff.color}`}
                  >
                    <span className="text-6xl mb-4">{diff.emoji}</span>
                    <span className="text-2xl font-black tracking-wide">{diff.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PLAYING VIEW */}
          {view === 'PLAYING' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-3xl"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Star className="w-20 h-20 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-600 mt-6 animate-pulse">
                    Thinking of a fun question...
                  </h3>
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-white rounded-3xl border-4 border-rose-200 shadow-xl p-8">
                  <p className="text-2xl font-bold text-rose-600 mb-6">{error}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => loadQuestion(selectedSubject!.name, selectedTopic!.name, difficulty!)}
                    className="px-8 py-4 bg-rose-500 text-white text-xl font-bold rounded-full shadow-lg hover:bg-rose-600"
                  >
                    Try Again! 🔄
                  </motion.button>
                </div>
              ) : question ? (
                <div className="bg-white rounded-3xl border-4 border-slate-200 shadow-2xl overflow-hidden">
                  {/* Question Header */}
                  <div className={`p-8 text-center ${selectedSubject?.bgColor.split(' ')[0]} border-b-4 border-slate-100`}>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight">
                      {question.questionText}
                    </h2>
                  </div>

                  {/* Options */}
                  <div className="p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {question.options.map((option, index) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrectAnswer = option === question.correctAnswer;
                        
                        let buttonStyle = "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700";
                        
                        if (selectedAnswer !== null) {
                          if (isCorrectAnswer) {
                            buttonStyle = "bg-green-100 border-green-400 text-green-800";
                          } else if (isSelected && !isCorrectAnswer) {
                            buttonStyle = "bg-rose-100 border-rose-400 text-rose-800 opacity-50";
                          } else {
                            buttonStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
                          }
                        }

                        return (
                          <motion.button
                            key={index}
                            whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                            whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={selectedAnswer !== null}
                            className={`p-6 rounded-2xl border-4 text-2xl md:text-3xl font-bold transition-all shadow-sm ${buttonStyle}`}
                          >
                            {option}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Feedback Area */}
                    <AnimatePresence>
                      {selectedAnswer !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          className="mt-8 text-center"
                        >
                          {isCorrect ? (
                            <div className="bg-green-100 border-4 border-green-300 rounded-2xl p-6">
                              <h3 className="text-3xl font-black text-green-600 mb-2">Yay! You got it! 🌟</h3>
                              <p className="text-xl text-green-800 font-bold">{question.encouragement}</p>
                            </div>
                          ) : (
                            <div className="bg-rose-100 border-4 border-rose-300 rounded-2xl p-6">
                              <h3 className="text-3xl font-black text-rose-600 mb-2">Oops! Not quite. 🎈</h3>
                              <p className="text-xl text-rose-800 font-bold">The right answer is <strong>{question.correctAnswer}</strong>.</p>
                            </div>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNextQuestion}
                            className="mt-6 px-10 py-4 bg-indigo-500 text-white text-2xl font-black rounded-full shadow-xl hover:bg-indigo-600 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all"
                          >
                            Next Question! 🚀
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
