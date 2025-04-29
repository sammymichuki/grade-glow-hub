
import { Link } from 'react-router-dom';

// Sample subject data
const subjects = [
  { 
    id: 1, 
    name: 'Mathematics', 
    icon: '📐', 
    color: 'bg-blue-100 text-blue-600',
    description: 'Algebra, geometry, and more'
  },
  { 
    id: 2, 
    name: 'Science', 
    icon: '🔬', 
    color: 'bg-green-100 text-green-600',
    description: 'Biology, chemistry, physics'
  },
  { 
    id: 3, 
    name: 'English', 
    icon: '📚', 
    color: 'bg-purple-100 text-purple-600',
    description: 'Literature, grammar, writing'
  },
  { 
    id: 4, 
    name: 'History', 
    icon: '🏛️', 
    color: 'bg-amber-100 text-amber-600',
    description: 'World events and civilizations'
  },
  { 
    id: 5, 
    name: 'Geography', 
    icon: '🌍', 
    color: 'bg-teal-100 text-teal-600',
    description: 'Maps, countries, landforms'
  },
  { 
    id: 6, 
    name: 'Computer Science', 
    icon: '💻', 
    color: 'bg-indigo-100 text-indigo-600',
    description: 'Programming and technology'
  },
];

const SubjectsList = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold text-center mb-12">Explore Subjects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Link 
              to={`/courses?subject=${subject.name.toLowerCase()}`}
              key={subject.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex items-start space-x-4 border border-gray-100"
            >
              <div className={`${subject.color} rounded-full p-4 text-2xl`}>
                {subject.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{subject.name}</h3>
                <p className="text-gray-600">{subject.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubjectsList;
