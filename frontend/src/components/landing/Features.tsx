import { Bot, Target, TrendingUp, Shield, Clock, Award } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Feedback",
    description: "Get instant, detailed analysis of your interview performance with actionable insights."
  },
  {
    icon: Target,
    title: "Role-Specific Practice",
    description: "Practice for your target role with industry-specific questions and scenarios."
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description: "Monitor your improvement with detailed analytics and performance metrics."
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "Your data is encrypted and secure. We never share your practice sessions."
  },
  {
    icon: Clock,
    title: "Practice Anytime",
    description: "24/7 availability means you can practice whenever it suits your schedule."
  },
  {
    icon: Award,
    title: "Expert Guidance",
    description: "Learn from best practices and model answers from industry experts."
  }
];

const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="gradient-text"> Ace Your Interviews</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Comprehensive tools and AI-powered insights to prepare you for success
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-8 hover:glass-glow transition-all duration-300 group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
