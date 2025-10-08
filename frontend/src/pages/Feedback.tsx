import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  TrendingUp,
  MessageSquare,
  Target,
  Star,
  Volume2,
  Download,
  ChevronRight,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const Feedback = () => {
  const [isPlayingFeedback, setIsPlayingFeedback] = useState(false);

  const scoreData = [
    { category: "Communication", score: 85, fullMark: 100 },
    { category: "Domain", score: 78, fullMark: 100 },
    { category: "Structure", score: 90, fullMark: 100 },
    { category: "STAR", score: 75, fullMark: 100 },
    { category: "Confidence", score: 88, fullMark: 100 },
  ];

  const overallScore = Math.round(
    scoreData.reduce((acc, curr) => acc + curr.score, 0) / scoreData.length
  );

  const questions = [
    {
      question: "Tell me about yourself and your experience.",
      yourAnswer:
        "I have 5 years of experience in software development, primarily working with React and Node.js...",
      modelAnswer:
        "I'm a software engineer with 5 years of experience specializing in full-stack development. At my current role at TechCorp, I led the development of a customer analytics platform that improved user engagement by 40%. I'm particularly passionate about creating scalable web applications and mentoring junior developers.",
      feedback:
        "Good start! Consider using the STAR framework to structure your response with a specific achievement.",
    },
    {
      question: "What interests you about this role?",
      yourAnswer:
        "I'm interested in the technical challenges and the opportunity to work with modern technologies...",
      modelAnswer:
        "I'm excited about this role for three key reasons. First, your company's focus on AI-driven solutions aligns with my passion for innovative technology. Second, the opportunity to work on large-scale systems matches my experience and growth aspirations. Finally, your commitment to engineering excellence resonates with my values.",
      feedback:
        "Try to be more specific about what excites you. Research the company's products and culture to give tailored examples.",
    },
  ];

  const playVoiceFeedback = () => {
    setIsPlayingFeedback(true);
    // Simulate voice feedback
    setTimeout(() => {
      setIsPlayingFeedback(false);
    }, 5000);
  };

  const downloadReport = () => {
    // Simulate PDF download
    console.log("Downloading report...");
  };

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold gradient-text">
            InterviewAI
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Back to Dashboard
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Overall Score */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">
              Interview <span className="gradient-text">Complete!</span>
            </h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Here's your detailed performance analysis
          </p>

          <div className="glass-glow rounded-3xl p-8 max-w-sm mx-auto">
            <div className="text-6xl font-bold gradient-text mb-2">{overallScore}</div>
            <div className="text-sm text-muted-foreground">Overall Score</div>
          </div>
        </div>

        {/* Voice Feedback */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="glass-glow rounded-3xl p-8 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">AI Voice Feedback</h2>
            <p className="text-muted-foreground mb-6">
              Listen to personalized feedback about your interview performance
            </p>
            <Button
              onClick={playVoiceFeedback}
              size="lg"
              variant="hero"
              disabled={isPlayingFeedback}
              className="min-w-[200px]"
            >
              {isPlayingFeedback ? (
                <>
                  <div className="animate-pulse mr-2">Playing...</div>
                  <Volume2 className="w-5 h-5 animate-pulse" />
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 mr-2" />
                  Play Feedback
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Score Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Radar Chart */}
            <div className="glass rounded-3xl p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <h2 className="text-2xl font-bold mb-6">
                Multi-Dimensional <span className="gradient-text">Analysis</span>
              </h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={scoreData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Individual Scores */}
            <div className="glass rounded-3xl p-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
              <h2 className="text-2xl font-bold mb-6">Score Breakdown</h2>
              <div className="space-y-4">
                {scoreData.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="text-sm font-bold gradient-text">
                        {item.score}/100
                      </span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question-by-Question Feedback */}
            <div className="glass rounded-3xl p-8 animate-fade-in" style={{ animationDelay: "400ms" }}>
              <h2 className="text-2xl font-bold mb-6">
                Question-by-Question <span className="gradient-text">Analysis</span>
              </h2>
              <div className="space-y-6">
                {questions.map((item, index) => (
                  <div key={index} className="glass rounded-2xl p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-foreground">
                          Q{index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{item.question}</h3>
                      </div>
                    </div>

                    {/* Your Answer */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Your Answer
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 pl-6">
                        {item.yourAnswer}
                      </p>
                    </div>

                    {/* Feedback */}
                    <div className="mb-4 bg-secondary/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">AI Feedback</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {item.feedback}
                      </p>
                    </div>

                    {/* Model Answer */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium text-accent">
                          Model Answer
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 pl-6">
                        {item.modelAnswer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="glass rounded-3xl p-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
              <h3 className="text-lg font-semibold mb-4">Key Highlights</h3>
              <div className="space-y-4">
                {[
                  { label: "Strongest", value: "Problem Structure", icon: Trophy },
                  { label: "Improve", value: "STAR Framework", icon: TrendingUp },
                  { label: "Duration", value: "12 minutes", icon: Target },
                ].map((stat, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                      <div className="text-sm font-semibold">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="glass-glow rounded-3xl p-6 animate-fade-in" style={{ animationDelay: "600ms" }}>
              <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
              <div className="space-y-3">
                <Button onClick={downloadReport} variant="hero" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Link to="/interview">
                  <Button variant="glass" className="w-full">
                    Practice Again
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="glass" className="w-full">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
