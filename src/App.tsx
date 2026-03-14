import type React from 'react';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { generateQuestion, GeneratedQuestion } from './services/gemini';
import { BookOpen, Calculator, Shapes, ArrowLeft, Star, Sparkles, Trophy, Lightbulb, Microscope, RotateCcw, Award, Flame, Heart, ChevronRight } from 'lucide-react';

type ViewState = 'SUBJECT_SELECT' | 'TOPIC_SELECT' | 'DIFFICULTY_SELECT' | 'PLAYING' | 'RESULTS';

const QUESTIONS_PER_ROUND = 10;

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
  hoverColor: string;
  borderColor: string;
  cardClass: string;
  topics: Topic[];
}

const SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: 'Math Magic',
    icon: <Calculator className="w-12 h-12" />,
    color: 'text-blue-600',
    hoverColor: 'hover:bg-blue-200',
    borderColor: 'border-blue-300',
    cardClass: 'subject-card-math',
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
    hoverColor: 'hover:bg-rose-200',
    borderColor: 'border-rose-300',
    cardClass: 'subject-card-reading',
    topics: [
      { id: 'letters', name: 'Letters', emoji: '🔤' },
      { id: 'sight-words', name: 'Sight Words', emoji: '👀' },
      { id: 'rhyming', name: 'Rhyming', emoji: '🎵' },
      { id: 'sounds', name: 'First Sounds', emoji: '🗣️' },
    ],
  },
  {
    id: 'science',
    name: 'Science Explorer',
    icon: <Microscope className="w-12 h-12" />,
    color: 'text-amber-600',
    hoverColor: 'hover:bg-amber-200',
    borderColor: 'border-amber-300',
    cardClass: 'subject-card-science',
    topics: [
      { id: 'animals', name: 'Animals', emoji: '🦁' },
      { id: 'plants', name: 'Plants', emoji: '🌻' },
      { id: 'weather', name: 'Weather', emoji: '🌈' },
      { id: 'space', name: 'Space', emoji: '🚀' },
    ],
  },
  {
    id: 'logic',
    name: 'Brain Games',
    icon: <Shapes className="w-12 h-12" />,
    color: 'text-emerald-600',
    hoverColor: 'hover:bg-emerald-200',
    borderColor: 'border-emerald-300',
    cardClass: 'subject-card-logic',
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

const LOADING_MESSAGES = [
  "Thinking of a fun question... 🤔",
  "Cooking up something cool... 🍳",
  "Finding the perfect puzzle... 🧩",
  "Getting your next adventure ready... 🚀",
  "Mixing up some brain magic... ✨",
  "Almost there, superstar... 🌟",
];

const DECORATIONS = [
  { emoji: '⭐', top: '10%', left: '5%', delay: 0, size: 'text-3xl' },
  { emoji: '🌈', top: '20%', right: '8%', delay: 1, size: 'text-2xl' },
  { emoji: '🎈', top: '60%', left: '3%', delay: 2, size: 'text-3xl' },
  { emoji: '🦋', top: '70%', right: '5%', delay: 0.5, size: 'text-2xl' },
  { emoji: '☁️', top: '15%', left: '80%', delay: 1.5, size: 'text-4xl' },
  { emoji: '🌸', top: '85%', left: '10%', delay: 3, size: 'text-2xl' },
];

function getRandomLoadingMessage() {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

function getEncouragingReaction(isCorrect: boolean, streak: number): string {
  if (isCorrect) {
    if (streak >= 5) return "You're on FIRE! Unstoppable! 🔥🔥🔥";
    if (streak >= 3) return "Amazing streak! Keep going! 🌟🌟";
    return "Yay! You got it! 🌟";
  }
  const messages = [
    "Almost! You're learning so much! 🎈",
    "Good try! Let's keep going! 💪",
    "No worries! Every try makes you smarter! 🧠",
    "Oopsie! But you're doing great! 🌈",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export default function App() {
  const [view, setView] = useState<ViewState>('SUBJECT_SELECT');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  
  // Enhanced tracking
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showFunFact, setShowFunFact] = useState(false);

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
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setQuestionCount(0);
    setCorrectCount(0);
    await loadQuestion(selectedSubject!.name, selectedTopic!.name, diff);
  };

  const loadQuestion = useCallback(async (subjectName: string, topicName: string, diff: string) => {
    setLoading(true);
    setLoadingMessage(getRandomLoadingMessage());
    setError(null);
    setQuestion(null);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowHint(false);
    setShowFunFact(false);
    try {
      const q = await generateQuestion(subjectName, topicName, diff);
      setQuestion(q);
    } catch (err) {
      console.error(err);
      setError("Oops! The magic machine had a hiccup. Let's try again!");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    const correct = answer === question?.correctAnswer;
    setIsCorrect(correct);
    setQuestionCount(q => q + 1);

    if (correct) {
      setScore(s => s + 1);
      setCorrectCount(c => c + 1);
      setStreak(s => {
        const newStreak = s + 1;
        setBestStreak(b => Math.max(b, newStreak));
        return newStreak;
      });
      
      const particleCount = streak >= 4 ? 300 : streak >= 2 ? 200 : 150;
      confetti({
        particleCount,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#facc15', '#f472b6', '#38bdf8', '#4ade80', '#a78bfa']
      });
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (questionCount >= QUESTIONS_PER_ROUND) {
      setView('RESULTS');
      return;
    }
    if (selectedSubject && selectedTopic && difficulty) {
      loadQuestion(selectedSubject.name, selectedTopic.name, difficulty);
    }
  };

  const handlePlayAgain = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setQuestionCount(0);
    setCorrectCount(0);
    if (selectedSubject && selectedTopic && difficulty) {
      setView('PLAYING');
      loadQuestion(selectedSubject.name, selectedTopic.name, difficulty);
    }
  };

  const handleBackToHome = () => {
    setView('SUBJECT_SELECT');
    setSelectedSubject(null);
    setSelectedTopic(null);
    setDifficulty(null);
    setQuestion(null);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setQuestionCount(0);
    setCorrectCount(0);
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
    } else if (view === 'RESULTS') {
      handleBackToHome();
    }
  };

  const getStarRating = () => {
    const pct = questionCount > 0 ? correctCount / questionCount : 0;
    if (pct >= 0.9) return 3;
    if (pct >= 0.6) return 2;
    if (pct >= 0.3) return 1;
    return 0;
  };

  const getResultMessage = () => {
    const stars = getStarRating();
    if (stars === 3) return "You're a SUPERSTAR! Amazing job! 🏆";
    if (stars === 2) return "Great work! You're getting so smart! 🌟";
    if (stars === 1) return "Good effort! Keep practicing! 💪";
    return "Nice try! Every question makes you smarter! 🧠";
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 font-sans text-slate-800 relative">
      {/* Floating Decorations */}
      {DECORATIONS.map((dec, i) => (
        <div
          key={i}
          className={`fixed ${dec.size} animate-float pointer-events-none opacity-30 z-0`}
          style={{
            top: dec.top,
            left: dec.left,
            right: dec.right,
            animationDelay: `${dec.delay}s`,
          }}
        >
          {dec.emoji}
        </div>
      ))}

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
          {view !== 'SUBJECT_SELECT' && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-slate-600 hover:text-slate-900 border-2 border-slate-200 hover:border-indigo-300 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
          )}
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-sparkle" />
            Kiddo Quest
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Streak indicator */}
          {view === 'PLAYING' && streak > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-orange-100 px-3 py-1.5 rounded-full shadow-md border-2 border-orange-200"
            >
              <Flame className="w-5 h-5 text-orange-500 streak-fire" />
              <span className="text-lg font-black text-orange-600">{streak}</span>
            </motion.div>
          )}
          
          {/* Score */}
          {view === 'PLAYING' && (
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border-2 border-yellow-200">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span className="text-2xl font-bold text-slate-700">{score}</span>
            </div>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      {view === 'PLAYING' && (
        <div className="w-full max-w-4xl mb-4 relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-slate-500">Question {Math.min(questionCount + 1, QUESTIONS_PER_ROUND)} of {QUESTIONS_PER_ROUND}</span>
            <span className="text-sm font-bold text-indigo-500">{correctCount} correct</span>
          </div>
          <div className="progress-bar-track h-3">
            <div
              className="progress-bar-fill h-full"
              style={{ width: `${(questionCount / QUESTIONS_PER_ROUND) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center relative z-10">
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
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-black text-slate-700 mb-3">
                  What do you want to play today? 🤔
                </h2>
                <p className="text-lg text-slate-500 font-semibold">Pick a fun adventure!</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {SUBJECTS.map((subject, index) => (
                  <motion.button
                    key={subject.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -8 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubjectSelect(subject)}
                    className={`flex flex-col items-center justify-center p-7 rounded-3xl border-4 ${subject.borderColor} shadow-xl ${subject.cardClass} ${subject.hoverColor} ${subject.color} transition-all`}
                  >
                    <div className="bg-white/80 p-5 rounded-full shadow-md mb-4 animate-float" style={{ animationDelay: `${index * 0.3}s` }}>
                      {subject.icon}
                    </div>
                    <span className="text-xl font-black tracking-wide">{subject.name}</span>
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-block mb-3"
                >
                  <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full ${selectedSubject.cardClass} border-2 ${selectedSubject.borderColor}`}>
                    {selectedSubject.icon}
                    <span className={`text-xl font-black ${selectedSubject.color}`}>{selectedSubject.name}</span>
                  </div>
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-700 mb-2">
                  Pick your game! 🎉
                </h2>
                <p className="text-xl text-slate-500 font-semibold">Choose what sounds fun!</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
                {selectedSubject.topics.map((topic, index) => (
                  <motion.button
                    key={topic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTopicSelect(topic)}
                    className="flex items-center gap-4 p-6 rounded-2xl border-4 shadow-lg bg-white/80 backdrop-blur-sm border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all group"
                  >
                    <span className="text-5xl group-hover:animate-wiggle">{topic.emoji}</span>
                    <div className="flex-1 text-left">
                      <span className="text-2xl font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{topic.name}</span>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 transition-colors" />
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-block mb-3"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border-2 border-slate-200">
                    <span className="text-2xl">{selectedTopic.emoji}</span>
                    <span className="text-lg font-bold text-slate-600">{selectedTopic.name}</span>
                  </div>
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-700 mb-2">
                  How tricky should it be? 🎚️
                </h2>
                <p className="text-xl text-slate-500 font-semibold">Pick your challenge level!</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
                {DIFFICULTIES.map((diff, index) => (
                  <motion.button
                    key={diff.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -8 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDifficultySelect(diff.id)}
                    className={`flex flex-col items-center justify-center p-7 rounded-3xl border-4 shadow-xl transition-all ${diff.color}`}
                  >
                    <span className="text-6xl mb-3">{diff.emoji}</span>
                    <span className="text-xl font-black tracking-wide">{diff.name}</span>
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
                    {loadingMessage}
                  </h3>
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl border-4 border-rose-200 shadow-xl p-8">
                  <p className="text-2xl font-bold text-rose-600 mb-6">{error}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => loadQuestion(selectedSubject!.name, selectedTopic!.name, difficulty!)}
                    className="px-8 py-4 bg-rose-500 text-white text-xl font-bold rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                  >
                    Try Again! 🔄
                  </motion.button>
                </div>
              ) : question ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl border-4 border-slate-200 shadow-2xl overflow-hidden">
                  {/* Question Header */}
                  <div className={`p-7 text-center ${selectedSubject?.cardClass} border-b-4 border-slate-100`}>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                      {question.questionText}
                    </h2>
                  </div>

                  {/* Hint Button */}
                  {!showHint && selectedAnswer === null && question.hint && (
                    <div className="px-7 pt-4 flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowHint(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-100 text-amber-700 border-2 border-amber-300 font-bold text-lg hover:bg-amber-200 transition-colors shadow-sm"
                      >
                        <Lightbulb className="w-5 h-5" />
                        Need a hint?
                      </motion.button>
                    </div>
                  )}

                  {/* Hint Display */}
                  <AnimatePresence>
                    {showHint && selectedAnswer === null && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-7 pt-4"
                      >
                        <div className="hint-box rounded-2xl p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Lightbulb className="w-5 h-5 text-amber-600" />
                            <span className="font-black text-amber-700">Hint:</span>
                          </div>
                          <p className="text-lg font-bold text-amber-800">{question.hint}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Options */}
                  <div className="p-7">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {question.options.map((option, index) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrectAnswer = option === question.correctAnswer;
                        
                        let buttonStyle = "bg-slate-50 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:shadow-md";
                        
                        if (selectedAnswer !== null) {
                          if (isCorrectAnswer) {
                            buttonStyle = "bg-green-100 border-green-400 text-green-800 shadow-md";
                          } else if (isSelected && !isCorrectAnswer) {
                            buttonStyle = "bg-rose-100 border-rose-400 text-rose-800 opacity-60";
                          } else {
                            buttonStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-40";
                          }
                        }

                        return (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            whileHover={selectedAnswer === null ? { scale: 1.03 } : {}}
                            whileTap={selectedAnswer === null ? { scale: 0.97 } : {}}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={selectedAnswer !== null}
                            className={`p-5 rounded-2xl border-4 text-xl md:text-2xl font-bold transition-all ${buttonStyle}`}
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
                          className="mt-7 space-y-4"
                        >
                          {/* Correct/Wrong Feedback */}
                          {isCorrect ? (
                            <div className="bg-green-100 border-4 border-green-300 rounded-2xl p-5 text-center">
                              <h3 className="text-2xl font-black text-green-600 mb-1">
                                {getEncouragingReaction(true, streak)}
                              </h3>
                              <p className="text-lg text-green-800 font-bold">{question.encouragement}</p>
                            </div>
                          ) : (
                            <div className="bg-rose-50 border-4 border-rose-300 rounded-2xl p-5 text-center">
                              <h3 className="text-2xl font-black text-rose-600 mb-1">
                                {getEncouragingReaction(false, 0)}
                              </h3>
                              <p className="text-lg text-rose-800 font-bold">
                                The answer is <strong className="underline">{question.correctAnswer}</strong>
                              </p>
                              {question.explanation && (
                                <p className="text-base text-rose-700 mt-2 font-semibold">{question.explanation}</p>
                              )}
                            </div>
                          )}

                          {/* Fun Fact Toggle */}
                          {question.funFact && !showFunFact && (
                            <div className="text-center">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowFunFact(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-100 text-blue-700 border-2 border-blue-300 font-bold text-lg hover:bg-blue-200 transition-colors"
                              >
                                <Sparkles className="w-5 h-5" />
                                Show me a fun fact!
                              </motion.button>
                            </div>
                          )}

                          {/* Fun Fact Display */}
                          <AnimatePresence>
                            {showFunFact && question.funFact && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                              >
                                <div className="fun-fact-box rounded-2xl p-4 text-center">
                                  <div className="flex items-center justify-center gap-2 mb-1">
                                    <span className="text-xl">🧪</span>
                                    <span className="font-black text-blue-700">Fun Fact!</span>
                                  </div>
                                  <p className="text-lg font-bold text-blue-800">{question.funFact}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Next Button */}
                          <div className="text-center pt-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleNextQuestion}
                              className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xl font-black rounded-full shadow-xl hover:from-indigo-600 hover:to-purple-600 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all"
                            >
                              {questionCount >= QUESTIONS_PER_ROUND ? "See Results! 🏆" : "Next Question! 🚀"}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* RESULTS VIEW */}
          {view === 'RESULTS' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full max-w-2xl"
            >
              <div className="results-card rounded-3xl shadow-2xl p-8 text-center">
                {/* Stars */}
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3].map((star) => (
                    <motion.div
                      key={star}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: star * 0.2, type: 'spring' }}
                    >
                      <Star
                        className={`w-16 h-16 ${star <= getStarRating() ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                      />
                    </motion.div>
                  ))}
                </div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-3xl md:text-4xl font-black text-slate-700 mb-6"
                >
                  {getResultMessage()}
                </motion.h2>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="grid grid-cols-3 gap-4 mb-8"
                >
                  <div className="bg-white/80 rounded-2xl p-4 border-2 border-green-200">
                    <div className="flex justify-center mb-2">
                      <Heart className="w-8 h-8 text-green-500 fill-green-500" />
                    </div>
                    <div className="text-3xl font-black text-green-600">{correctCount}</div>
                    <div className="text-sm font-bold text-slate-500">Correct</div>
                  </div>
                  <div className="bg-white/80 rounded-2xl p-4 border-2 border-yellow-200">
                    <div className="flex justify-center mb-2">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div className="text-3xl font-black text-yellow-600">{score}</div>
                    <div className="text-sm font-bold text-slate-500">Score</div>
                  </div>
                  <div className="bg-white/80 rounded-2xl p-4 border-2 border-orange-200">
                    <div className="flex justify-center mb-2">
                      <Flame className="w-8 h-8 text-orange-500" />
                    </div>
                    <div className="text-3xl font-black text-orange-600">{bestStreak}</div>
                    <div className="text-sm font-bold text-slate-500">Best Streak</div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlayAgain}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xl font-black rounded-full shadow-xl hover:from-indigo-600 hover:to-purple-600 transition-all"
                  >
                    <RotateCcw className="w-6 h-6" />
                    Play Again!
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBackToHome}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 text-xl font-bold rounded-full shadow-lg border-2 border-slate-200 hover:border-indigo-300 transition-all"
                  >
                    <Award className="w-6 h-6" />
                    New Adventure
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center mt-8 relative z-10">
        <p className="text-sm font-semibold text-slate-400">
          Made with ❤️ for little learners • Powered by AI ✨
        </p>
      </footer>
    </div>
  );
}
