const TrustStrip = () => {
  return (
    <section className="bg-white border-y border-gray-100">
      <div className="container-custom py-2.5 md:py-3">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            CBC-Aligned
          </span>
          <span className="hidden sm:block w-px h-4 bg-gray-300"></span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-education-primary"></span>
            50K+ Students
          </span>
          <span className="hidden sm:block w-px h-4 bg-gray-300"></span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
            Learn Anytime, Anywhere
          </span>
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
