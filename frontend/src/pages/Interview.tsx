import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import Spline from '@splinetool/react-spline';
import { 
  Mic, 
  MicOff, 
  Bookmark, 
  MessageSquare, 
  Volume2,
  Clock,
  ChevronRight,
  AlertCircle,
  List,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const Interview = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [micTesting, setMicTesting] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timer, setTimer] = useState(0);
  const [showInterruptDialog, setShowInterruptDialog] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [robotScale, setRobotScale] = useState(1);
  const [hoverEffect, setHoverEffect] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const questions = [
    "Tell me about yourself and your experience.",
    "What interests you about this role?",
    "Describe a challenging project you've worked on.",
  ];

  // Check viewport height and adjust layout
  useEffect(() => {
    const checkViewport = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const viewportHeight = window.innerHeight;
        setCompactMode(containerHeight > viewportHeight * 0.9);
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, [interviewStarted, currentQuestion]);

  // Robot animation sync with speech
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setRobotScale(prev => prev === 1 ? 1.05 : 1);
      }, 300);
      return () => clearInterval(interval);
    } else {
      setRobotScale(1);
    }
  }, [isSpeaking]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionGranted(true);
      toast.success("Microphone access granted!");
    } catch (error) {
      toast.error("Microphone access denied. Please enable it to continue.");
    }
  };

  const testMicrophone = () => {
    setMicTesting(true);
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setMicTesting(false);
      setAudioLevel(0);
      toast.success("Microphone test successful!");
    }, 3000);
  };

  const startInterview = () => {
    setInterviewStarted(true);
    simulateAISpeaking();
  };

  const simulateAISpeaking = () => {
    setIsSpeaking(true);
    toast("AI is asking a question...", { icon: <Volume2 className="w-4 h-4" /> });
    
    setTimeout(() => {
      setIsSpeaking(false);
      if (!textMode) {
        setIsRecording(true);
        toast.success("Your turn to speak!");
      }
    }, 3000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    toast("Analyzing your answer...", { icon: <AlertCircle className="w-4 h-4" /> });
    
    setTimeout(() => {
      toast.success("Great structure! Try to be more specific with examples.");
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        simulateAISpeaking();
      } else {
        setTimeout(() => {
          navigate("/feedback");
        }, 2000);
      }
    }, 2000);
  };

  const bookmarkQuestion = () => {
    toast.success("Question bookmarked for practice!");
  };

  const handleInterrupt = () => {
    setShowInterruptDialog(true);
  };

  const confirmInterrupt = () => {
    toast.error("Interview interrupted. 1 credit deducted.");
    navigate("/dashboard");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Microphone Permission Screen
  if (!permissionGranted) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <header className="glass sticky top-0 z-50 border-b border-border/50 flex-shrink-0">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="text-lg font-bold gradient-text flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              InterviewAI
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 min-h-0">
          <div className="max-w-md w-full glass-glow rounded-2xl p-6 text-center animate-fade-in">
            <div className="relative mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-glow-pulse shadow-lg">
                <Mic className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center animate-ping opacity-75">
                <Zap className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-3">
              Microphone <span className="gradient-text">Access</span>
            </h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              We need access to your microphone to conduct the interview. Your audio is processed securely and never stored.
            </p>
            <Button 
              onClick={requestMicPermission} 
              size="lg" 
              variant="hero" 
              className="w-full relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Grant Microphone Access
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Mic Test Screen
  if (!interviewStarted) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <header className="glass sticky top-0 z-50 border-b border-border/50 flex-shrink-0">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="text-lg font-bold gradient-text flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              InterviewAI
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 min-h-0">
          <div className="max-w-md w-full glass-glow rounded-2xl p-6 text-center animate-fade-in">
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                {micTesting ? (
                  <div className="w-full h-full rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="w-8 h-8 text-primary-foreground" />
                  </div>
                ) : (
                  <Mic className="w-8 h-8 text-primary-foreground" />
                )}
              </div>
              {micTesting && (
                <div className="absolute -inset-4 rounded-full bg-primary/20 animate-ping" />
              )}
            </div>
            
            <h1 className="text-2xl font-bold mb-3">
              Test Your <span className="gradient-text">Audio</span>
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Let's make sure everything is working perfectly before we start.
            </p>

            {/* Audio Level Visualizer */}
            <div className="mb-6 h-16 flex items-end justify-center gap-1 px-4">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-primary to-accent rounded-full transition-all duration-75 ease-out shadow-sm"
                  style={{
                    height: micTesting
                      ? `${Math.max(15, audioLevel * (0.8 + Math.random() * 0.4))}%`
                      : '15%',
                    transform: micTesting ? 'scaleY(1.1)' : 'scaleY(1)',
                  }}
                />
              ))}
            </div>

            <div className="space-y-3">
              <Button
                onClick={testMicrophone}
                size="lg"
                variant="hero"
                className="w-full relative overflow-hidden group"
                disabled={micTesting}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {micTesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Testing Microphone...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      Test Microphone
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
              <Button
                onClick={startInterview}
                size="lg"
                variant="glass"
                className="w-full group transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  Start Interview
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Interview Screen - No Scroll Layout
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" ref={containerRef}>
      {/* Compact Header for Mobile */}
      <header className={`glass sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl flex-shrink-0 ${compactMode ? 'h-12' : 'h-14'}`}>
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-bold gradient-text flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className={compactMode ? 'text-sm' : 'text-lg'}>InterviewAI</span>
            </Link>
            <div className={`flex items-center gap-1 ${compactMode ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-green-500 animate-pulse' : isSpeaking ? 'bg-blue-500' : 'bg-gray-500'}`} />
              {isRecording ? 'Recording' : isSpeaking ? 'AI Speaking' : 'Ready'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size={compactMode ? "sm" : "default"}
              onClick={handleInterrupt} 
              className={compactMode ? "text-xs h-8" : "text-sm"}
            >
              <X className="w-3 h-3 mr-1" />
              End
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content - No Scroll */}
      <div className="flex-1 p-3 min-h-0 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <div className={`grid h-full ${compactMode ? 'lg:grid-cols-3 gap-2' : 'lg:grid-cols-3 gap-3'} md:gap-4`}>
            
            {/* Left Column - Robot Avatar */}
            <div className={`${compactMode ? 'lg:col-span-2' : 'lg:col-span-2'} flex flex-col min-h-0`}>
              {/* Robot Avatar Container */}
              <div className={`glass-glow rounded-xl overflow-hidden flex-1 min-h-0 ${compactMode ? '' : 'hover:shadow-lg'} transition-all duration-300`}>
                <div 
                  className="relative w-full h-full transition-transform duration-300"
                  style={{ 
                    transform: `scale(${robotScale})`,
                  }}
                  onMouseEnter={() => setHoverEffect(true)}
                  onMouseLeave={() => setHoverEffect(false)}
                >
                  <Spline
                    scene="https://prod.spline.design/SmvaZtW5AFq-1tCV/scene.splinecode"
                    className="w-full h-full"
                  />
                  {/* Status Overlay */}
                  <div className="absolute top-2 right-2">
                    <div className={`px-2 py-1 rounded-full backdrop-blur-sm border text-xs font-medium ${
                      isSpeaking 
                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' 
                        : isRecording 
                        ? 'bg-green-500/20 border-green-500/30 text-green-300'
                        : 'bg-secondary/50 border-border text-muted-foreground'
                    }`}>
                      {isSpeaking ? 'AI Speaking' : isRecording ? 'Your Turn' : 'Ready'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content Stack */}
            <div className="flex flex-col min-h-0 space-y-2 md:space-y-3">
              
              {/* Question Card */}
              <div className={`glass rounded-xl p-3 md:p-4 flex flex-col min-h-0 ${compactMode ? '' : 'hover:scale-[1.01]'} transition-all duration-300`}>
                <div className="flex items-start justify-between mb-2 gap-2 flex-shrink-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>Q{currentQuestion + 1}/{questions.length}</span>
                      </div>
                      <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(timer)}</span>
                      </div>
                    </div>
                    <h2 className={`font-bold leading-tight text-foreground ${compactMode ? 'text-sm' : 'text-base'}`}>
                      {questions[currentQuestion]}
                    </h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={bookmarkQuestion} 
                    className="flex-shrink-0 hover:bg-accent/20 transition-colors h-8 w-8"
                  >
                    <Bookmark className="w-3 h-3" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden shadow-inner mt-auto flex-shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Controls Card */}
              <div className="glass rounded-xl p-3 md:p-4 flex flex-col min-h-0">
                <div className="flex flex-col items-center gap-3 flex-1">
                  
                  {/* Timer Display */}
                  {isRecording && (
                    <div className="flex items-center gap-2 font-bold gradient-text animate-pulse flex-shrink-0">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      <Clock className="w-4 h-4" />
                      <span className={compactMode ? 'text-sm' : 'text-base'}>{formatTime(timer)}</span>
                    </div>
                  )}

                  {/* Waveform Visualizer */}
                  {isRecording && (
                    <div className="w-full h-8 flex items-center justify-center gap-0.5 px-2 flex-shrink-0">
                      {[...Array(compactMode ? 25 : 30)].map((_, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-gradient-to-t from-primary to-accent rounded-full animate-pulse"
                          style={{
                            height: `${20 + Math.random() * 60}%`,
                            animationDelay: `${i * 30}ms`,
                            animationDuration: `${800 + Math.random() * 400}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Mode Toggle */}
                  <div className={`flex items-center gap-2 p-1.5 bg-secondary/50 rounded-xl w-full justify-center ${compactMode ? 'mb-1' : 'mb-2'} flex-shrink-0`}>
                    <Button
                      variant={textMode ? "glass" : "hero"}
                      size="icon"
                      className={`rounded-full transition-all duration-300 ${
                        compactMode ? 'w-10 h-10' : 'w-12 h-12'
                      }`}
                      onClick={() => !isSpeaking && !isRecording && setTextMode(false)}
                      disabled={isSpeaking || isRecording}
                    >
                      <Mic className={compactMode ? "w-4 h-4" : "w-5 h-5"} />
                    </Button>
                    <Button
                      variant={textMode ? "hero" : "glass"}
                      size="icon"
                      className={`rounded-full transition-all duration-300 ${
                        compactMode ? 'w-10 h-10' : 'w-12 h-12'
                      }`}
                      onClick={() => !isSpeaking && !isRecording && setTextMode(true)}
                      disabled={isSpeaking || isRecording}
                    >
                      <MessageSquare className={compactMode ? "w-4 h-4" : "w-5 h-5"} />
                    </Button>
                  </div>

                  {/* Text Input Area */}
                  {textMode && !isSpeaking && (
                    <div className="w-full space-y-2 animate-fade-in flex flex-col flex-1 min-h-0">
                      <div className="relative flex-1 min-h-0">
                        <textarea
                          className="w-full h-full bg-secondary rounded-lg p-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary border border-border/50 min-h-[80px]"
                          placeholder="Type your answer here..."
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                        />
                        <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
                          {textAnswer.length}/500
                        </div>
                      </div>
                      <Button
                        onClick={stopRecording}
                        variant="hero"
                        className="w-full relative overflow-hidden group transition-all duration-300 text-sm"
                        disabled={!textAnswer.trim()}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-1">
                          Submit Answer
                          <TrendingUp className="w-3 h-3" />
                        </span>
                      </Button>
                    </div>
                  )}

                  {/* Recording Control */}
                  {!textMode && isRecording && (
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      size={compactMode ? "default" : "lg"}
                      className="animate-fade-in relative overflow-hidden group transition-all duration-300 w-full flex-shrink-0"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <MicOff className="w-4 h-4" />
                        <span className={compactMode ? 'text-sm' : 'text-base'}>Stop Recording</span>
                      </span>
                    </Button>
                  )}

                  {/* Quick Actions - Only show when space allows */}
                  {!compactMode && (
                    <div className="w-full space-y-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-xs hover:shadow-lg transition-all duration-300 group h-8"
                        onClick={() => toast.info("Practice queue feature coming soon!")}
                      >
                        <List className="w-3 h-3 mr-2 group-hover:scale-110 transition-transform" />
                        Practice Queue
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-xs hover:shadow-lg transition-all duration-300 group h-8"
                        onClick={() => toast.info("Live feedback enabled!")}
                      >
                        <AlertCircle className="w-3 h-3 mr-2 group-hover:scale-110 transition-transform" />
                        Show Feedback
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Stats - Collapsible */}
              {!compactMode && (
                <div className="glass rounded-xl p-3 md:p-4 transform transition-all duration-300">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    Progress
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Questions</span>
                      <span className="font-bold gradient-text">
                        {currentQuestion + 1}/{questions.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Mode</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                        textMode 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {textMode ? "Text" : "Voice"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interrupt Dialog */}
      <AlertDialog open={showInterruptDialog} onOpenChange={setShowInterruptDialog}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md glass-glow border-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              End Interview Early?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              If you end the interview now, you'll lose 1 credit and won't receive
              complete feedback. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="text-sm hover:shadow-lg transition-shadow">
              Continue Interview
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmInterrupt} 
              className="text-sm bg-destructive hover:bg-destructive/90 hover:shadow-lg transition-all"
            >
              End Interview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Interview;