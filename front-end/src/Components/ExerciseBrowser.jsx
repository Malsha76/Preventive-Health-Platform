import React, { useState, useEffect } from 'react';
import WorkoutService from '../services/workoutService';

const ExerciseBrowser = () => {
    const [exercises, setExercises] = useState([]);
    const [filteredExercises, setFilteredExercises] = useState([]);
    const [filters, setFilters] = useState({
        bodyPart: '',
        equipment: '',
        difficulty: '',
        searchTerm: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        setLoading(true);
        try {
            await WorkoutService.load();
            const allExercises = WorkoutService.getAllExercises();
            setExercises(allExercises);
            setFilteredExercises(allExercises.slice(0, 50));
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        
        // Apply filters
        const filtered = WorkoutService.getExercisesByCriteria(newFilters);
        setFilteredExercises(filtered);
    };

    const clearFilters = () => {
        setFilters({
            bodyPart: '',
            equipment: '',
            difficulty: '',
            searchTerm: ''
        });
        setFilteredExercises(exercises.slice(0, 50));
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">💪 Exercise Database</h2>
            
            {/* Stats */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{exercises.length}</p>
                        <p className="text-sm text-gray-600">Total Exercises</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {[...new Set(exercises.map(e => e.BodyPart))].length}
                        </p>
                        <p className="text-sm text-gray-600">Body Parts</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                            {[...new Set(exercises.map(e => e.Equipment))].length}
                        </p>
                        <p className="text-sm text-gray-600">Equipment Types</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">
                            {[...new Set(exercises.map(e => e.Level))].length}
                        </p>
                        <p className="text-sm text-gray-600">Difficulty Levels</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Body Part</label>
                        <select
                            name="bodyPart"
                            value={filters.bodyPart}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">All Body Parts</option>
                            {[...new Set(exercises.map(e => e.BodyPart))].map(part => (
                                <option key={part} value={part}>{part}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
                        <select
                            name="equipment"
                            value={filters.equipment}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">All Equipment</option>
                            {[...new Set(exercises.map(e => e.Equipment))].map(eq => (
                                <option key={eq} value={eq}>{eq}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                        <select
                            name="difficulty"
                            value={filters.difficulty}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">All Levels</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Expert">Expert</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            name="searchTerm"
                            value={filters.searchTerm}
                            onChange={handleFilterChange}
                            placeholder="Search exercises..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
                
                <div className="mt-4 flex justify-between">
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                        Clear Filters
                    </button>
                    <p className="text-sm text-gray-600">
                        Showing {filteredExercises.length} of {exercises.length} exercises
                    </p>
                </div>
            </div>

            {/* Exercises Grid */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading exercise data...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExercises.map((exercise, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-bold text-gray-800">{exercise.Title}</h3>
                                <span className={`px-2 py-1 rounded text-xs ${
                                    exercise.Level === 'Beginner' ? 'bg-green-100 text-green-800' :
                                    exercise.Level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {exercise.Level}
                                </span>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    {exercise.Desc ? exercise.Desc.substring(0, 100) + '...' : 'No description available'}
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                    {exercise.BodyPart}
                                </span>
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                    {exercise.Equipment}
                                </span>
                                {exercise.Rating && (
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                        ⭐ {exercise.Rating}
                                    </span>
                                )}
                            </div>
                            
                            {exercise.Muscle_Group && (
                                <p className="text-sm text-gray-700">
                                    <strong>Muscle Group:</strong> {exercise.Muscle_Group}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExerciseBrowser;