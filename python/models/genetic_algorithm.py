import numpy as np
import random
import pickle
from collections import defaultdict
from config import (
    GA_POPULATION_SIZE, GA_GENERATIONS, GA_MUTATION_RATE,
    GA_CROSSOVER_RATE, GA_ELITISM_COUNT, GA_TOURNAMENT_SIZE,
    FITNESS_WEIGHTS, COMMON_ALLERGENS, HEALTH_RISK_THRESHOLDS,
    MODEL_SAVE_PATH
)

class MealPlanGeneticAlgorithm:
    def __init__(self, meals_df):
        self.meals = meals_df
        self.population = []
        self.fitness_scores = []
        self.best_solution = None
        self.best_fitness = -float('inf')

        # Store max values for normalization
        self.nutrition_max = {
            'calories': meals_df['calories'].max() if 'calories' in meals_df.columns else 1.0,
            'protein': meals_df['protein'].max() if 'protein' in meals_df.columns else 1.0,
            'fat': meals_df['fat'].max() if 'fat' in meals_df.columns else 1.0,
            'carbs': meals_df['carbs'].max() if 'carbs' in meals_df.columns else 1.0
        }
        # Cache per-meal nutrient dicts for faster fitness computation
        self._nutrient_cache = {}
        for idx in range(len(self.meals)):
            m = self.meals.iloc[idx]
            self._nutrient_cache[idx] = {
                'calories': float(m.get('calories', 0.0)),
                'protein': float(m.get('protein', 0.0)),
                'fat': float(m.get('fat', 0.0)),
                'carbs': float(m.get('carbs', 0.0)),
                'sodium_mg': float(m.get('sodium_mg', 0.0)) if 'sodium_mg' in self.meals.columns else 0.0,
                'cholesterol_mg': float(m.get('cholesterol_mg', 0.0)) if 'cholesterol_mg' in self.meals.columns else 0.0,
                'saturated_fat_g': float(m.get('saturated_fat_g', 0.0)) if 'saturated_fat_g' in self.meals.columns else 0.0,
                'sugar_g': float(m.get('sugar_g', 0.0)) if 'sugar_g' in self.meals.columns else 0.0,
                'added_sugar_g': float(m.get('added_sugar_g', 0.0)) if 'added_sugar_g' in self.meals.columns else 0.0,
                'omega3_g': float(m.get('omega3_g', 0.0)) if 'omega3_g' in self.meals.columns else 0.0,
                'meal_name': str(m.get('meal_name', f'meal_{idx}')),
            }

    def initialize_population(self, days, dietary_restrictions):
        """Initialize population with valid meal plans"""
        valid_meal_indices = self._get_valid_meals(dietary_restrictions)

        if not valid_meal_indices:
            raise ValueError("No valid meals found for the given restrictions")

        self.population = []
        for _ in range(GA_POPULATION_SIZE):
            individual = []
            for day in range(days):
                daily_meals = {}
                chosen = set()
                for meal_type in ['breakfast', 'lunch', 'dinner']:
                    candidates = [i for i in valid_meal_indices if i not in chosen] or valid_meal_indices
                    meal_idx = random.choice(candidates)
                    chosen.add(meal_idx)
                    daily_meals[meal_type] = meal_idx
                if random.random() < 0.3:
                    daily_meals['snack'] = random.choice(valid_meal_indices)
                individual.append(daily_meals)
            self.population.append(individual)

    def _get_valid_meals(self, dietary_restrictions):
        """Get list of meal indices that meet all dietary restrictions"""
        try:
            valid_mask = np.ones(len(self.meals), dtype=bool)

            # Apply dietary restrictions
            for restriction, value in dietary_restrictions.items():
                if restriction in ['vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'mediterranean'] and value:
                    if restriction in self.meals.columns:
                        valid_mask &= (self.meals[restriction] == 1)
                    else:
                        print(f"Warning: Diet column '{restriction}' not found in dataset")

            # Apply allergy restrictions
            allergies = dietary_restrictions.get('allergies', [])
            for allergy in allergies:
                allergy = allergy.lower()
                if allergy in COMMON_ALLERGENS and allergy in self.meals.columns:
                    valid_mask &= (self.meals[allergy] == 0)

            # Apply health risk restrictions
            health_risks = dietary_restrictions.get('health_risks', [])
            for risk in health_risks:
                if risk == 'High blood pressure' and 'sodium_mg' in self.meals.columns:
                    valid_mask &= (self.meals['sodium_mg'] < 500)
                elif risk == 'High cholesterol' and 'cholesterol_mg' in self.meals.columns and 'saturated_fat_g' in self.meals.columns:
                    valid_mask &= (self.meals['cholesterol_mg'] < 100) & (self.meals['saturated_fat_g'] < 5)
                elif risk == 'Diabetes' and 'sugar_g' in self.meals.columns and 'added_sugar_g' in self.meals.columns:
                    valid_mask &= (self.meals['sugar_g'] < 10) & (self.meals['added_sugar_g'] < 5)
                elif risk == 'Heart disease or stroke':
                    if all(col in self.meals.columns for col in ['saturated_fat_g', 'cholesterol_mg', 'sodium_mg']):
                        valid_mask &= (self.meals['saturated_fat_g'] < 5) & (self.meals['cholesterol_mg'] < 100) & (self.meals['sodium_mg'] < 500)
                elif risk == 'Testosterone deficiency' and 'omega3_g' in self.meals.columns:
                    valid_mask &= (self.meals['omega3_g'] > 0.5)
                elif risk == 'Depression' and 'omega3_g' in self.meals.columns:
                    valid_mask &= (self.meals['omega3_g'] > 0.5)

            return [i for i, valid in enumerate(valid_mask) if valid]

        except Exception as e:
            print(f"Error in _get_valid_meals: {e}")
            return []

    def calculate_fitness(self, individual, target_nutrition, dietary_restrictions):
        """Fitness computed from penalty-based quality model"""
        serving_size = 100
        days = len(individual)
        total = {'calories': 0.0, 'protein': 0.0, 'fat': 0.0, 'carbs': 0.0}
        meal_counts = {}
        sugar_penalty = 0.0
        sodium_penalty = 0.0
        protein_penalty = 0.0
        fiber_penalty = 0.0
        repeat_penalty = 0.0
        health_risks = dietary_restrictions.get('health_risks', [])

        for day_meals in individual:
            for meal_type, idx in day_meals.items():
                m = self._nutrient_cache[idx]
                total['calories'] += m['calories'] * (serving_size / 100)
                total['protein'] += m['protein'] * (serving_size / 100)
                total['fat'] += m['fat'] * (serving_size / 100)
                total['carbs'] += m['carbs'] * (serving_size / 100)
                meal_counts[m['meal_name']] = meal_counts.get(m['meal_name'], 0) + 1
                if 'High blood pressure' in health_risks:
                    sodium_penalty += max(0.0, (m['sodium_mg'] - 500) / 500.0)
                if 'High cholesterol' in health_risks:
                    if m['cholesterol_mg'] > 100 or m['saturated_fat_g'] > 5:
                        sodium_penalty += 0.5
                if 'Diabetes' in health_risks:
                    sugar_penalty += max(0.0, (m['sugar_g'] - 10) / 10.0) + max(0.0, (m['added_sugar_g'] - 5) / 5.0)
                if 'Heart disease or stroke' in health_risks:
                    if m['saturated_fat_g'] > 5 or m['cholesterol_mg'] > 100 or m['sodium_mg'] > 500:
                        sodium_penalty += 0.5

        target_total_cal = target_nutrition.get('calories', 2000.0) * days
        cal_miss = abs(total['calories'] - target_total_cal) / max(1.0, target_total_cal)
        target_protein = 0.3 * target_total_cal / 4.0
        protein_penalty = max(0.0, (target_protein * 0.8 - total['protein']) / max(1.0, target_protein)) if total['protein'] < target_protein * 0.8 else 0.0
        total_fiber = 0.0
        if 'fiber_g' in self.meals.columns:
            for day_meals in individual:
                for meal_type, idx in day_meals.items():
                    total_fiber += float(self.meals.iloc[idx].get('fiber_g', 0.0)) * (serving_size / 100)
        avg_fiber_target = 25.0 * days
        fiber_penalty = max(0.0, (avg_fiber_target - total_fiber) / max(1.0, avg_fiber_target))
        for name, cnt in meal_counts.items():
            if cnt > 2:
                repeat_penalty += (cnt - 2) * 0.1
        penalty = (
            3.0 * cal_miss +
            1.5 * sugar_penalty +
            1.0 * sodium_penalty +
            1.0 * protein_penalty +
            0.5 * fiber_penalty +
            0.5 * repeat_penalty
        )
        fitness = max(0.0, 1.0 - penalty)
        return fitness

    def _calculate_health_penalty(self, meal, health_risks):
        """Calculate penalty for violating health restrictions"""
        penalty = 0

        for risk in health_risks:
            if risk == 'High blood pressure' and 'sodium_mg' in meal:
                if meal['sodium_mg'] > 500:
                    penalty += 0.2
            elif risk == 'High cholesterol' and 'cholesterol_mg' in meal and 'saturated_fat_g' in meal:
                if meal['cholesterol_mg'] > 100 or meal['saturated_fat_g'] > 5:
                    penalty += 0.2
            elif risk == 'Diabetes' and 'sugar_g' in meal and 'added_sugar_g' in meal:
                if meal['sugar_g'] > 10 or meal['added_sugar_g'] > 5:
                    penalty += 0.2
            elif risk == 'Heart disease or stroke':
                if ('saturated_fat_g' in meal and meal['saturated_fat_g'] > 5 or
                        'cholesterol_mg' in meal and meal['cholesterol_mg'] > 100 or
                        'sodium_mg' in meal and meal['sodium_mg'] > 500):
                    penalty += 0.3
            elif risk == 'Testosterone deficiency' and 'omega3_g' in meal:
                if meal['omega3_g'] < 0.5:
                    penalty += 0.1
            elif risk == 'Depression' and 'omega3_g' in meal:
                if meal['omega3_g'] < 0.5:
                    penalty += 0.1

        return min(penalty, 1.0)  # Cap penalty at 1.0

    def tournament_selection(self):
        """Select parents using tournament selection"""
        selected = []
        for _ in range(2):  # Select 2 parents
            tournament = random.sample(list(zip(self.population, self.fitness_scores)), GA_TOURNAMENT_SIZE)
            winner = max(tournament, key=lambda x: x[1])[0]
            selected.append(winner)
        return selected

    def crossover(self, parent1, parent2):
        """Perform crossover between two parents"""
        if random.random() > GA_CROSSOVER_RATE:
            return parent1, parent2

        child1 = []
        child2 = []

        for day_idx in range(len(parent1)):
            if random.random() < 0.5:
                # Swap entire days
                child1.append(parent1[day_idx])
                child2.append(parent2[day_idx])
            else:
                # Swap individual meals
                child1_day = {}
                child2_day = {}
                for meal_type in ['breakfast', 'lunch', 'dinner', 'snack']:
                    if random.random() < 0.5:
                        if meal_type in parent1[day_idx]:
                            child1_day[meal_type] = parent1[day_idx][meal_type]
                        if meal_type in parent2[day_idx]:
                            child2_day[meal_type] = parent2[day_idx][meal_type]
                    else:
                        if meal_type in parent2[day_idx]:
                            child1_day[meal_type] = parent2[day_idx][meal_type]
                        if meal_type in parent1[day_idx]:
                            child2_day[meal_type] = parent1[day_idx][meal_type]
                child1.append(child1_day)
                child2.append(child2_day)

        return self.repair_plan(child1, None), self.repair_plan(child2, None)

    def mutate(self, individual, dietary_restrictions, mutation_rate):
        """Mutate an individual by changing random meals"""
        valid_meal_indices = self._get_valid_meals(dietary_restrictions)

        for day_idx in range(len(individual)):
            for meal_type in ['breakfast', 'lunch', 'dinner', 'snack']:
                if meal_type in individual[day_idx] and random.random() < mutation_rate:
                    individual[day_idx][meal_type] = random.choice(valid_meal_indices)
            if 'snack' not in individual[day_idx] and random.random() < (mutation_rate * 0.5):
                individual[day_idx]['snack'] = random.choice(valid_meal_indices)
            elif 'snack' in individual[day_idx] and random.random() < (mutation_rate * 0.3):
                individual[day_idx].pop('snack', None)

        return self.repair_plan(individual, dietary_restrictions)

    def repair_plan(self, individual, dietary_restrictions):
        """Repair invalid meals by replacing with valid alternatives"""
        if dietary_restrictions is None:
            return individual
        valid = set(self._get_valid_meals(dietary_restrictions))
        if not valid:
            return individual
        for d in range(len(individual)):
            for meal_type, idx in list(individual[d].items()):
                if idx not in valid:
                    individual[d][meal_type] = random.choice(list(valid))
        for d in range(len(individual)):
            seen = set()
            for mt in ['breakfast', 'lunch', 'dinner', 'snack']:
                if mt in individual[d]:
                    if individual[d][mt] in seen:
                        individual[d][mt] = random.choice(list(valid))
                    seen.add(individual[d][mt])
        return individual

    def evolve(self, target_nutrition, dietary_restrictions, days=7):
        """Run the genetic algorithm evolution"""
        self.initialize_population(days, dietary_restrictions)

        for generation in range(GA_GENERATIONS):
            # Calculate fitness for all individuals
            self.fitness_scores = [
                self.calculate_fitness(ind, target_nutrition, dietary_restrictions)
                for ind in self.population
            ]

            # Track best solution
            best_idx = np.argmax(self.fitness_scores)
            if self.fitness_scores[best_idx] > self.best_fitness:
                self.best_fitness = self.fitness_scores[best_idx]
                self.best_solution = self.population[best_idx]

            # Create new population
            new_population = []

            # Elitism: keep best individuals
            elite_indices = np.argsort(self.fitness_scores)[-GA_ELITISM_COUNT:]
            for idx in elite_indices:
                new_population.append(self.population[idx])

            # Fill rest of population with crossover and mutation
            while len(new_population) < GA_POPULATION_SIZE:
                parent1, parent2 = self.tournament_selection()
                child1, child2 = self.crossover(parent1, parent2)

                t = generation / max(1, GA_GENERATIONS - 1)
                mutation_rate = GA_MUTATION_RATE * (0.5 + 0.5 * (1 - t))
                child1 = self.mutate(child1, dietary_restrictions, mutation_rate)
                child2 = self.mutate(child2, dietary_restrictions, mutation_rate)

                new_population.extend([child1, child2])

            self.population = new_population[:GA_POPULATION_SIZE]

            if generation % 50 == 0:
                print(f"Generation {generation}, Best Fitness: {self.best_fitness:.4f}")

        return self.best_solution

    def save_model(self):
        """Save the trained model"""
        try:
            with open(MODEL_SAVE_PATH, 'wb') as f:
                pickle.dump({
                    'best_solution': self.best_solution,
                    'best_fitness': self.best_fitness,
                    'nutrition_max': self.nutrition_max
                }, f)
            print(f"Model saved successfully to {MODEL_SAVE_PATH}")
        except Exception as e:
            print(f"Error saving model: {e}")

    def load_model(self):
        """Load a trained model"""
        try:
            with open(MODEL_SAVE_PATH, 'rb') as f:
                data = pickle.load(f)
                self.best_solution = data['best_solution']
                self.best_fitness = data['best_fitness']
                self.nutrition_max = data['nutrition_max']
            print(f"Model loaded successfully from {MODEL_SAVE_PATH}")
            return True
        except FileNotFoundError:
            print("No saved model found")
            return False
