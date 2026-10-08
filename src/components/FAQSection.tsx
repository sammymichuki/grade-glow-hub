import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "Is GradeGlow free to use?",
      answer: "Yes! You can sign up for free and start exploring many of our lessons. Premium features unlock more advanced content and tracking tools."
    },
    {
      question: "Is the curriculum CBC-aligned?",
      answer: "Absolutely. Our content is designed to align with the CBC curriculum for Grades 4-9, covering key learning outcomes for each level."
    },
    {
      question: "Can I access lessons offline?",
      answer: "Yes. GradeGlow supports offline access for downloaded lessons so you can keep learning anytime, anywhere."
    },
    {
      question: "Do you have progress tracking for parents?",
      answer: "Yes. Parents can track learning progress, performance, and engagement to stay informed about their child's academic journey."
    },
    {
      question: "What devices does GradeGlow work on?",
      answer: "GradeGlow works on desktop, tablet, and mobile devices. All you need is an internet connection to get started."
    }
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Frequently Asked Questions</h2>
          <p className="text-gray-600">Everything you need to know about GradeGlow</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-lg border border-gray-100 px-4">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
