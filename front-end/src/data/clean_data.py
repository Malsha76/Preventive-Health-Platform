# import json
# import pandas as pd
# import numpy as np

# def clean_json_file(input_file, output_file=None):
#     """Clean JSON file by replacing NaN with null and fixing other issues"""
    
#     if output_file is None:
#         output_file = input_file.replace('.json', '_clean.json')
    
#     print(f"📂 Loading {input_file}...")
    
#     try:
#         # Try to load as JSON first
#         with open(input_file, 'r', encoding='utf-8') as f:
#             data = json.load(f)
#         print("✅ File is already valid JSON!")
#         return True
#     except json.JSONDecodeError:
#         print("⚠️ File has JSON syntax errors, fixing...")
        
#         # Read as text and fix common issues
#         with open(input_file, 'r', encoding='utf-8') as f:
#             content = f.read()
        
#         # Fix 1: Replace NaN with null
#         content = content.replace(': NaN', ': null')
#         content = content.replace(': nan', ': null')
#         content = content.replace(': "NaN"', ': null')
#         content = content.replace(': "nan"', ': null')
        
#         # Fix 2: Replace Infinity with null
#         content = content.replace(': Infinity', ': null')
#         content = content.replace(': -Infinity', ': null')
        
#         # Fix 3: Remove trailing commas
#         import re
#         content = re.sub(r',\s*}', '}', content)
#         content = re.sub(r',\s*]', ']', content)
        
#         # Fix 4: Fix single quotes (JSON uses double quotes)
#         content = re.sub(r"'(\w+)':", r'"\1":', content)  # Keys
#         content = re.sub(r":\s*'([^']*)'", r': "\1"', content)  # String values
        
#         # Fix 5: Convert Python's None to JSON's null
#         content = content.replace(': None', ': null')
        
#         # Save cleaned file
#         with open(output_file, 'w', encoding='utf-8') as f:
#             f.write(content)
        
#         print(f"✅ Cleaned file saved as {output_file}")
        
#         # Verify it's valid JSON
#         try:
#             with open(output_file, 'r', encoding='utf-8') as f:
#                 data = json.load(f)
#             print("✅ File is now valid JSON!")
#             return True
#         except json.JSONDecodeError as e:
#             print(f"❌ Still invalid JSON. Error: {e}")
            
#             # Try to find the problematic line
#             lines = content.split('\n')
#             for i, line in enumerate(lines):
#                 try:
#                     json.loads(line)
#                 except:
#                     print(f"   Problem near line {i+1}: {line[:100]}...")
            
#             return False

# def create_sample_data():
#     """Create a clean sample dataset if files are too corrupted"""
    
#     print("🔄 Creating clean sample data...")
    
#     sample_data = {
#         "metadata": {
#             "export_date": "2024-01-15T10:30:00",
#             "dataset_name": "MegaGymDataset",
#             "total_exercises": 50,
#             "version": "1.0.0"
#         },
        
#         "exercise_database": [
#             {
#                 "Title": "Bodyweight Squats",
#                 "BodyPart": "Quadriceps",
#                 "Equipment": "Body Only",
#                 "Level": "Beginner",
#                 "Rating": 4.5,
#                 "RatingDesc": "Excellent exercise for beginners"
#             },
#             {
#                 "Title": "Push-ups",
#                 "BodyPart": "Chest",
#                 "Equipment": "Body Only",
#                 "Level": "Beginner",
#                 "Rating": 4.3,
#                 "RatingDesc": "Great for upper body strength"
#             },
#             {
#                 "Title": "Lunges",
#                 "BodyPart": "Quadriceps",
#                 "Equipment": "Body Only",
#                 "Level": "Intermediate",
#                 "Rating": 4.2,
#                 "RatingDesc": "Good for leg strength and balance"
#             },
#             {
#                 "Title": "Plank",
#                 "BodyPart": "Abdominals",
#                 "Equipment": "Body Only",
#                 "Level": "Beginner",
#                 "Rating": 4.6,
#                 "RatingDesc": "Excellent core exercise"
#             },
#             {
#                 "Title": "Burpees",
#                 "BodyPart": "Full Body",
#                 "Equipment": "Body Only",
#                 "Level": "Expert",
#                 "Rating": 4.7,
#                 "RatingDesc": "High intensity full body exercise"
#             }
#         ],
        
#         "statistics": {
#             "total_exercises": 50,
#             "unique_body_parts": 10,
#             "unique_equipment": 5,
#             "average_rating": 4.3,
#             "difficulty_distribution": {
#                 "Beginner": 20,
#                 "Intermediate": 15,
#                 "Expert": 15
#             }
#         },
        
#         "ml_models": {
#             "popularity_model": {
#                 "feature_importance": [
#                     {"feature": "BodyPart", "importance": 0.35},
#                     {"feature": "Level", "importance": 0.25},
#                     {"feature": "Equipment", "importance": 0.20}
#                 ],
#                 "rmse": 0.45,
#                 "sample_predictions": []
#             }
#         },
        
#         "workout_templates": {
#             "full_body_beginner": {
#                 "name": "Full Body Beginner Workout",
#                 "duration": 20,
#                 "difficulty": "Beginner",
#                 "exercises": [
#                     {"Title": "Bodyweight Squats", "BodyPart": "Quadriceps"},
#                     {"Title": "Push-ups", "BodyPart": "Chest"},
#                     {"Title": "Plank", "BodyPart": "Abdominals"}
#                 ],
#                 "estimated_calories": 150
#             },
#             "upper_body_intermediate": {
#                 "name": "Upper Body Intermediate Workout",
#                 "duration": 25,
#                 "difficulty": "Intermediate",
#                 "exercises": [
#                     {"Title": "Push-ups", "BodyPart": "Chest"},
#                     {"Title": "Tricep Dips", "BodyPart": "Triceps"}
#                 ],
#                 "estimated_calories": 180
#             }
#         }
#     }
    
#     with open('sample_workout_data.json', 'w', encoding='utf-8') as f:
#         json.dump(sample_data, f, indent=2, ensure_ascii=False)
    
#     print("✅ Created sample_workout_data.json")
#     return sample_data

# def main():
#     """Main function to clean all JSON files"""
    
#     print("=" * 60)
#     print("🧹 JSON FILE CLEANER")
#     print("=" * 60)
    
#     files_to_clean = [
#         'trained_workout_data.json',
#         'exercise_lookup.json', 
#         'workout_rules.json'
#     ]
    
#     success_count = 0
    
#     for file in files_to_clean:
#         try:
#             if clean_json_file(file):
#                 success_count += 1
#         except FileNotFoundError:
#             print(f"⚠️ File not found: {file}")
#         print()
    
#     print(f"📊 Results: {success_count}/{len(files_to_clean)} files cleaned successfully")
    
#     if success_count == 0:
#         print("\n🔧 Creating sample data instead...")
#         create_sample_data()
    
#     print("\n🎉 Done! Copy the clean files to your React app:")
#     print("   front-end/src/data/")

# if __name__ == "__main__":
#     main()