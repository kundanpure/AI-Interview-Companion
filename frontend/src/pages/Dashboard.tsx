import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Plus,
  Calendar,
  Award,
  Users
} from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold gradient-text">
            InterviewAI
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Award className="w-4 h-4 mr-2" />
              5 Credits
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-semibold">
              JD
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text">John</span>
          </h1>
          <p className="text-muted-foreground">Ready to practice your next interview?</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Sparkles, label: "Credits Left", value: "5", color: "from-primary to-accent" },
            { icon: Clock, label: "Total Practice", value: "12h", color: "from-accent to-primary" },
            { icon: TrendingUp, label: "Avg Score", value: "8.5", color: "from-primary to-accent" },
            { icon: Users, label: "Interviews", value: "23", color: "from-accent to-primary" }
          ].map((stat, index) => (
            <div key={index} className="glass rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start Interview Card */}
            <div className="glass-glow rounded-2xl p-8 animate-fade-in">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Start New Interview</h2>
                  <p className="text-muted-foreground">Practice with AI-powered feedback</p>
                </div>
                <Link to="/interview">
                  <Button variant="hero" size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Start
                  </Button>
                </Link>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: "Job Role", placeholder: "Software Engineer" },
                  { label: "Company", placeholder: "Google" },
                  { label: "Duration", placeholder: "30 minutes" }
                ].map((field, index) => (
                  <div key={index} className="glass rounded-xl p-4">
                    <div className="text-sm text-muted-foreground mb-2">{field.label}</div>
                    <div className="font-medium">{field.placeholder}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Interviews */}
            <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <h3 className="text-xl font-semibold mb-4">Recent Interviews</h3>
              <div className="space-y-3">
                {[
                  { role: "Senior Frontend Developer", company: "Meta", date: "2 days ago", score: 8.5 },
                  { role: "Product Manager", company: "Google", date: "5 days ago", score: 7.8 },
                  { role: "Software Engineer", company: "Amazon", date: "1 week ago", score: 9.2 }
                ].map((interview, index) => (
                  <div key={index} className="glass rounded-xl p-4 hover:glass-glow transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{interview.role}</div>
                          <div className="text-sm text-muted-foreground">{interview.company} · {interview.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold gradient-text">{interview.score}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
              <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
              <div className="space-y-4">
                {[
                  { skill: "Communication", progress: 85 },
                  { skill: "Technical", progress: 75 },
                  { skill: "Problem Solving", progress: 90 }
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{item.skill}</span>
                      <span className="font-medium">{item.progress}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Card */}
            <div className="glass-glow rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
              <h3 className="text-lg font-semibold mb-2">Refer & Earn</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get 3 bonus credits for each friend who joins
              </p>
              <Button variant="hero" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Invite Friends
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
