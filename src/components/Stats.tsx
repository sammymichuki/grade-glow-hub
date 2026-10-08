const Stats = () => {
  const stats = [
    { value: "50K+", label: "Active Students" },
    { value: "500+", label: "Interactive Lessons" },
    { value: "95%", label: "Success Rate" },
    { value: "4.9/5", label: "Parent Rating" }
  ];

  return (
    <section className="bg-white py-8">
      <div className="container-custom">
        <div className="bg-gradient-to-r from-education-primary/5 to-education-secondary/5 border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-1">
                <div className="text-3xl md:text-4xl font-bold text-education-primary">{stat.value}</div>
                <p className="text-sm md:text-base text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
