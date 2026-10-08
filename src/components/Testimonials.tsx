import { Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah K.",
      role: "Parent",
      grade: "Grade 8",
      quote: "GradeGlow helped my daughter improve her math scores from C to A in just 2 months!",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&auto=format&fit=crop&q=80"
    },
    {
      name: "James M.",
      role: "Student",
      grade: "Grade 9",
      quote: "The interactive lessons make learning fun. I actually look forward to studying now!",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&auto=format&fit=crop&q=80"
    },
    {
      name: "Amina N.",
      role: "Parent",
      grade: "Grade 7",
      quote: "The progress tracking is amazing. I can easily see how my son is doing every week.",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&auto=format&fit=crop&q=80"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">Loved by Students & Parents</h2>
          <p className="text-gray-600">
            See what our community has to say about their learning journey
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-md transition-all duration-300 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center mb-3">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                  />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role} • {testimonial.grade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
