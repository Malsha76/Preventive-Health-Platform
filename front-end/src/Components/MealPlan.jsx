import { useState } from 'react';
import axios from 'axios';
import { apiGet } from '../api/client';
import { Store } from 'react-notifications-component';

const ComponentThree = ({ formData, onBack, loggedInUser }) => {
    const patientId = typeof loggedInUser === 'string' ? loggedInUser : (loggedInUser?._id || loggedInUser?.userId);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [mealPlan, setMealPlan] = useState(null);
    const [error, setError] = useState(null);
    const [userConfirmed, setUserConfirmed] = useState(false);
    const [latestConsultation, setLatestConsultation] = useState(null);

    const getOptimizationExplanation = () => {
        const points = [];
        if (formData?.goal) {
            points.push(`Calories and meal structure were optimized to support your goal: ${formData.goal}.`);
        } else {
            points.push('Calories and meal structure were optimized for overall health and consistency.');
        }

        if (formData?.dietType && formData.dietType !== 'No restrictions') {
            points.push(`Meals were selected to match your dietary preference: ${formData.dietType}.`);
        }

        if (Array.isArray(formData?.healthRisks) && formData.healthRisks.length > 0) {
            points.push(`Health constraints were applied based on the selected risks: ${formData.healthRisks.join(', ')}.`);
            if (formData.healthRisks.some(r => /diabet/i.test(r))) {
                points.push('Lower added-sugar options were prioritized due to diabetes-related risk.');
            }
            if (formData.healthRisks.some(r => /hypertens/i.test(r) || /blood pressure/i.test(r))) {
                points.push('Lower-sodium choices were prioritized due to blood-pressure risk.');
            }
        }

        if (formData?.activityLevel) {
            points.push(`Plan intensity and portion sizing were adjusted to your activity profile: ${formData.activityLevel}.`);
        }

        points.push('The final plan was produced using genetic-algorithm based optimization with constraint-driven decision making.');
        return points;
    };

    const generateMealPlan = async () => {
        // Check for goal/BMI mismatch and if user hasn't confirmed yet
        if (formData.showWarning && !userConfirmed) {
            return; // Don't generate if there's a warning and user hasn't confirmed
        }

        setIsGenerating(true);
        setError(null);

        try {
            // If a doctor/advisor has added recommendations, apply them automatically
            let merged = { ...formData };
            if (patientId) {
                try {
                    const c = await apiGet(`/api/consultations/patient/${patientId}/latest`);
                    const consult = c.data;
                    setLatestConsultation(consult);
                    const dietRecs = consult?.recommendations?.diet || [];
                    const avoidRecs = consult?.recommendations?.avoid || [];

                    const risks = new Set(Array.isArray(merged.healthRisks) ? merged.healthRisks : []);
                    const addRiskIf = (pattern, label) => {
                        if (dietRecs.some(t => pattern.test(String(t)))) risks.add(label);
                    };
                    addRiskIf(/sugar/i, 'Diabetes');
                    addRiskIf(/salt|sodium|blood pressure/i, 'High blood pressure');
                    addRiskIf(/cholesterol|lipid/i, 'High cholesterol');

                    merged.healthRisks = Array.from(risks);
                    merged.doctorRecommendations = {
                        diet: dietRecs,
                        activity: consult?.recommendations?.activity || [],
                        avoid: avoidRecs,
                        notes: consult?.notes || '',
                    };
                } catch {
                    // ignore if no consultation
                }
            }

            const response = await axios.post('http://127.0.0.1:5000/generate-meal-plan', merged);
            setMealPlan(response.data);
        } catch (err) {
            setError('Failed to generate nutrition plan. Please try again.');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const saveMealPlan = async () => {
        if (!patientId) {
            Store.addNotification({
                title: "Error!",
                message: "You must be logged in to save nutrition plans",
                type: "danger",
                insert: "top",
                container: "top-right",
                dismiss: {
                    duration: 3000,
                    onScreen: true
                }
            });
            return;
        }

        setIsSaving(true);
        try {
            const response = await axios.post('http://localhost:3001/save-meal-plan', {
                userId: patientId,
                mealPlan: mealPlan.mealPlan,
                nutritionSummary: mealPlan.nutritionSummary,
                userData: formData
            });

            Store.addNotification({
                title: "Success!",
                message: "Meal plan saved successfully!",
                type: "success",
                insert: "top",
                container: "top-right",
                dismiss: {
                    duration: 3000,
                    onScreen: true
                }
            });
        } catch (err) {
            Store.addNotification({
                title: "Error!",
                message: "Failed to save nutrition plan. Please try again.",
                type: "danger",
                insert: "top",
                container: "top-right",
                dismiss: {
                    duration: 3000,
                    onScreen: true
                }
            });
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const downloadAsPDF = () => {
        // Create a printable version of the nutrition plan
        const content = document.getElementById('meal-plan-content');
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = content.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;

        // Reload the page to restore functionality
        window.location.reload();
    };

    // Function to format numbers to 2 decimal places
    const formatNumber = (num) => {
        return typeof num === 'number' ? num.toFixed(2) : num;
    };

    // BMI Chart component
    const BmiChart = () => {
        return (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-700 mb-2">Your BMI Classification</h4>
                <div className="flex h-6 bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-500 rounded-full overflow-hidden">
                    <div className="w-1/5 text-xs text-center text-white flex items-center justify-center" style={{background: '#3b82f6'}}>Underweight</div>
                    <div className="w-1/5 text-xs text-center text-white flex items-center justify-center" style={{background: '#10b981'}}>Healthy</div>
                    <div className="w-1/5 text-xs text-center text-white flex items-center justify-center" style={{background: '#f59e0b'}}>Overweight</div>
                    <div className="w-2/5 text-xs text-center text-white flex items-center justify-center" style={{background: '#ef4444'}}>Obese</div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span>&lt;18.5</span>
                    <span>18.5-24.9</span>
                    <span>25-29.9</span>
                    <span>30+</span>
                </div>

                {formData.bmi && (
                    <div className="mt-3">
                        <p className="text-sm">
                            Your BMI: <span className="font-bold">{formData.bmi}</span> -
                            <span className={
                                formData.bmiCategory === 'Underweight' ? 'text-blue-600 font-medium' :
                                    formData.bmiCategory === 'Healthy' ? 'text-green-600 font-medium' :
                                        formData.bmiCategory === 'Overweight' ? 'text-yellow-600 font-medium' :
                                            'text-red-600 font-medium'
                            }> {formData.bmiCategory}</span>
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // Goal Mismatch Warning component
    const GoalMismatchWarning = () => {
        if (!formData.showWarning) return null;

        let warningMessage = "";
        if ((formData.bmiCategory === 'Overweight' || formData.bmiCategory === 'Obese') && formData.goal === 'Gain Weight') {
            warningMessage = "Your BMI indicates you are overweight, but you've selected 'Gain Weight' as your goal. This plan may not be appropriate for your health needs.";
        } else if (formData.bmiCategory === 'Underweight' && formData.goal === 'Lose Weight') {
            warningMessage = "Your BMI indicates you are underweight, but you've selected 'Lose Weight' as your goal. This plan may not be appropriate for your health needs.";
        }

        return (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Goal Mismatch Warning</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>{warningMessage}</p>
                            <p className="mt-2 font-medium">Do you want to continue with this plan or adjust your goals?</p>
                        </div>
                        <div className="mt-4">
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setUserConfirmed(true)}
                                    className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-yellow-50 transition-colors"
                                >
                                    Continue Anyway
                                </button>
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-yellow-50 transition-colors"
                                >
                                    Adjust Goals
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Meal Timing Recommendations component
    const MealTimingRecommendations = () => {
        if (!formData.mealTimings) return null;

        return (
            <div className="mt-6 p-4 bg-purple-50 rounded-md">
                <h4 className="font-medium text-purple-800 mb-3">Optimal Meal Times for Your Activity Level</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.mealTimings.breakfast && (
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span className="font-medium">Breakfast:</span>
                            <span className="ml-2">{formData.mealTimings.breakfast}</span>
                        </div>
                    )}
                    {formData.mealTimings.lunch && (
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="font-medium">Lunch:</span>
                            <span className="ml-2">{formData.mealTimings.lunch}</span>
                        </div>
                    )}
                    {formData.mealTimings.dinner && (
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                            <span className="font-medium">Dinner:</span>
                            <span className="ml-2">{formData.mealTimings.dinner}</span>
                        </div>
                    )}
                    {formData.mealTimings.snack && (
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            <span className="font-medium">Snack:</span>
                            <span className="ml-2">{formData.mealTimings.snack}</span>
                        </div>
                    )}
                    {formData.mealTimings.postWorkout && (
                        {/* <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="font-medium">Post-workout:</span>
                            <span className="ml-2">{formData.mealTimings.postWorkout}</span>
                        </div> */}
                    )}
                </div>
                {formData.mealTimings.recommendation && (
                    <p className="mt-3 text-sm text-purple-700">{formData.mealTimings.recommendation}</p>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Summary & Nutrition Plan</h2>

            <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-600"><span className="font-medium">Primary Goal:</span> {formData.goal}</p>
                        <p className="text-gray-600"><span className="font-medium">Diet Type:</span> {formData.dietType}</p>
                        <p className="text-gray-600"><span className="font-medium">Activity Level:</span> {formData.activityLevel}</p>
                    </div>
                    <div>
                        <p className="text-gray-600"><span className="font-medium">Allergies:</span> {formData.allergies.length > 0 ? formData.allergies.join(', ') : 'None'}</p>
                        <p className="text-gray-600"><span className="font-medium">Health Risks:</span> {formData.healthRisks.length > 0 ? formData.healthRisks.join(', ') : 'None'}</p>
                    </div>
                </div>

                {/* BMI Chart Display */}
                <BmiChart />

                {/* Meal Timing Recommendations */}
                <MealTimingRecommendations />

                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                    {/* <p className="text-blue-800 font-medium">
                        Recommended daily calories: <span className="font-bold">{formData.adjustedCalories} kcal</span>
                    </p> */}
                </div>
            </div>

            {/* Goal Mismatch Warning */}
            <GoalMismatchWarning />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={generateMealPlan}
                    disabled={isGenerating || (formData.showWarning && !userConfirmed)}
                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? 'Generating...' : 'Generate Nutrition Plan'}
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {mealPlan && (
                <div id="meal-plan-content">
                    <div className="border-t pt-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">Your Personalized Nutrition Plan</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={saveMealPlan}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Saving...' : 'Save Meals'}
                                </button>
                                <button
                                    onClick={downloadAsPDF}
                                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                                >
                                    Download as PDF
                                </button>
                            </div>

                        {/* Explainability / Optimization summary */}
                        <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Why this plan?</h4>
                            <p className="text-sm text-gray-600 mb-3">How this plan was optimized</p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                {getOptimizationExplanation().map((p, idx) => (
                                    <li key={idx}>{p}</li>
                                ))}
                            </ul>
                        </div>

                        </div>

                        <div className="space-y-6">
                            {mealPlan.mealPlan && mealPlan.mealPlan.map((day) => (
                                <div key={day.day} className="border rounded-lg overflow-hidden">
                                    <div className="bg-blue-100 px-4 py-2 font-medium">
                                        Day {day.day} - {formatNumber(day.totalNutrition.calories)} kcal
                                    </div>
                                    <div className="p-4">
                                        {day.meals && day.meals.map((mealObj, index) => {
                                            const mealType = Object.keys(mealObj)[0];
                                            const meal = mealObj[mealType];
                                            return (
                                                <div key={index} className="mb-4">
                                                    <h4 className="font-medium text-gray-700 mb-2 capitalize">
                                                        {mealType}
                                                    </h4>
                                                    <div className="flex flex-col">
                                                        <div className="flex-1">
                                                            <p className="font-medium">{meal.meal_name}</p>
                                                            <p className="text-sm text-gray-600">{formatNumber(meal.calories)} kcal</p>
                                                            <p className="text-sm text-gray-600">
                                                                Protein: {formatNumber(meal.protein)}g |
                                                                Carbs: {formatNumber(meal.carbs)}g |
                                                                Fat: {formatNumber(meal.fat)}g
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Fiber: {formatNumber(meal.fiber)}g |
                                                                Sugar: {formatNumber(meal.sugar)}g |
                                                                Sodium: {formatNumber(meal.sodium)}mg
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Ingredients: {meal.ingredients.join(', ')}
                                                            </p>
                                                            <p className="text-sm text-gray-600">Vitamins: {meal.vitamins}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Daily Nutrition Summary */}
                                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                            <h5 className="font-medium text-gray-700 mb-2">Daily Nutrition Summary</h5>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Calories: </span>
                                                    <span className="font-medium">{formatNumber(day.totalNutrition.calories)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Protein: </span>
                                                    <span className="font-medium">{formatNumber(day.totalNutrition.protein)}g</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Carbs: </span>
                                                    <span className="font-medium">{formatNumber(day.totalNutrition.carbs)}g</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Fat: </span>
                                                    <span className="font-medium">{formatNumber(day.totalNutrition.fat)}g</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Overall Nutrition Summary */}
                        {mealPlan.nutritionSummary && (
                            <div className="mt-6 p-4 bg-green-50 rounded-md">
                                <h4 className="font-medium text-green-800 mb-2">Overall Nutrition Summary (7-Day Average)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-green-700">Avg. Calories</p>
                                        <p className="font-medium">{formatNumber(mealPlan.nutritionSummary.avgCalories)} kcal</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-700">Avg. Protein</p>
                                        <p className="font-medium">{formatNumber(mealPlan.nutritionSummary.avgProtein)}g</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-700">Avg. Carbs</p>
                                        <p className="font-medium">{formatNumber(mealPlan.nutritionSummary.avgCarbs)}g</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-700">Avg. Fat</p>
                                        <p className="font-medium">{formatNumber(mealPlan.nutritionSummary.avgFat)}g</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save and Download Buttons */}
                        <div className="mt-6 flex justify-center space-x-4">
                            <button
                                onClick={saveMealPlan}
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Save Meals'}
                            </button>
                            <button
                                onClick={downloadAsPDF}
                                className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                            >
                                Download as PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComponentThree;
