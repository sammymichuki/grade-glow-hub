import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2 } from 'lucide-react';
import { toast } from "sonner";

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Subscribed! Check your email for confirmation.');
      setEmail('');
      setTimeout(() => setIsSubmitted(false), 3000);
    }, 800);
  };

  return (
    <section className="py-10 bg-white border-t border-gray-100">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-education-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-education-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold">Stay in the loop</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Get study tips, exam prep advice, and updates delivered straight to your inbox.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
              disabled={isSubmitting || isSubmitted}
            />
            <Button type="submit" disabled={isSubmitting || isSubmitted} size="sm">
              {isSubmitting ? 'Subscribing...' : isSubmitted ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Subscribed
                </span>
              ) : 'Subscribe'}
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
