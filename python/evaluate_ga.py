import time
import random
import csv
import statistics
from typing import Dict, Any, List

from models.genetic_algorithm import MealPlanGeneticAlgorithm
from models.data_preprocessor import DataPreprocessor
from config import DIET_TYPE_MAPPING, COMMON_ALLERGENS, DEFAULT_NUTRITION_TARGETS


def make_profile(idx: int) -> Dict[str, Any]:
    goals = list(DEFAULT_NUTRITION_TARGETS.keys())
    diets = list(DIET_TYPE_MAPPING.values())
    health_risks_all = [
        'High blood pressure', 'High cholesterol', 'Diabetes',
        'Heart disease or stroke', 'Testosterone deficiency', 'Depression'
    ]
    goal = random.choice(goals)
    diet = random.choice(diets)
    allergies = random.sample(list(COMMON_ALLERGENS.keys()), random.randint(0, 2))
    risks = random.sample(health_risks_all, random.randint(0, 2))

    calories = random.randint(1700, 2600)
    return {
        'goal': goal,
        'dietType': next((k for k, v in DIET_TYPE_MAPPING.items() if v == diet), 'No restrictions'),
        'diet_code': diet,
        'allergies': allergies,
        'healthRisks': risks,
        'adjustedCalories': calories,
        'days': 7,
    }


def plan_quality(ga: MealPlanGeneticAlgorithm, plan, target_nutrition, restrictions) -> Dict[str, Any]:
    # Hard constraints
    hard_ok = True
    sodium_cap = 500
    sugar_cap = 10
    added_sugar_cap = 5

    total_cal = 0.0
    days = len(plan)

    for d in plan:
        for mt, idx in d.items():
            m = ga._nutrient_cache[idx]
            total_cal += m['calories']
            if 'High blood pressure' in restrictions.get('health_risks', []):
                if m['sodium_mg'] > sodium_cap:
                    hard_ok = False
            if 'Diabetes' in restrictions.get('health_risks', []):
                if m['sugar_g'] > sugar_cap or m['added_sugar_g'] > added_sugar_cap:
                    hard_ok = False

    # Soft penalties similar to GA fitness
    target_total = target_nutrition.get('calories', 2000.0) * days
    cal_miss = abs(total_cal - target_total) / max(1.0, target_total)

    penalty = 3.0 * cal_miss
    quality = max(0.0, 1.0 - penalty) * 100.0
    return {'hard_ok': hard_ok, 'quality': quality}


def evaluate(num_profiles: int = 30, save_csv: str = 'ga_eval_results.csv'):
    pre = DataPreprocessor()
    pre.load_data()
    # Use raw kcal/macros so targets (kcal/day) match GA fitness & plan_quality
    df = pre.preprocess_data(apply_scaling=False)[0]

    ga = MealPlanGeneticAlgorithm(df)

    results: List[Dict[str, Any]] = []
    times = []

    for i in range(num_profiles):
        profile = make_profile(i)
        restrictions = {
            'vegetarian': profile['dietType'] == 'Vegetarian',
            'vegan': profile['dietType'] == 'Vegan',
            'keto': profile['dietType'] == 'Keto',
            'paleo': profile['dietType'] == 'Paleo',
            'gluten_free': profile['dietType'] == 'Gluten Free',
            'mediterranean': profile['dietType'] == 'Mediterranean',
            'allergies': [a.lower() for a in profile['allergies']],
            'health_risks': profile['healthRisks'],
        }
        target = {'calories': float(profile['adjustedCalories'])}

        t0 = time.time()
        plan = ga.evolve(target, restrictions, days=profile['days'])
        dt = time.time() - t0
        times.append(dt)

        q = plan_quality(ga, plan, target, restrictions)
        results.append({
            'idx': i,
            'diet': profile['dietType'],
            'allergies': '|'.join(profile['allergies']),
            'risks': '|'.join(profile['healthRisks']),
            'calories': profile['adjustedCalories'],
            'hard_ok': q['hard_ok'],
            'quality_pct': round(q['quality'], 2),
            'time_sec': round(dt, 3),
        })

    validity_rate = sum(1 for r in results if r['hard_ok']) / len(results) * 100.0
    avg_quality = sum(r['quality_pct'] for r in results) / len(results)
    median_time = statistics.median(times)

    print("GA Evaluation Summary")
    print(f"- Profiles evaluated: {len(results)}")
    print(f"- Validity rate: {validity_rate:.1f}%")
    print(f"- Average quality: {avg_quality:.1f}%")
    print(f"- Median generation time: {median_time:.3f}s")

    with open(save_csv, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        w.writeheader()
        w.writerows(results)


if __name__ == '__main__':
    evaluate()
