import os
import json
from datetime import datetime
from dotenv import load_dotenv
from groq import Groq
import requests

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def calculate_days(start, end):
    start_date = datetime.strptime(start, "%d-%m-%Y")
    end_date = datetime.strptime(end, "%d-%m-%Y")
    return (end_date - start_date).days + 1

def get_images(destination):
    try:
        access_key = os.getenv("UNSPLASH_KEY")

        url = f"https://api.unsplash.com/search/photos?query={destination}&per_page=3&client_id={access_key}"
        res = requests.get(url).json()

        images = []
        for img in res.get("results", []):
            images.append(img["urls"]["regular"])

        return images

    except Exception as e:
        print("Image error:", e)
        return []
      
def generate_trip_plan(data: dict):
    try:
        total_days = calculate_days(data["startDate"], data["endDate"])

        prompt = f"""
            You are a travel planner.

            Destination: {data.get('destination')}
            Budget: {data.get('budget')}
            Dates: {data.get('startDate')} to {data.get('endDate')}
            Days: {total_days}

            DESCRIPTION RULE:
            - Write a detailed description (3-4 lines)
            - Make it engaging and travel-style
            - Explain experience, vibe, and highlights

            Rules:
            - Create EXACT {total_days} days
            - Stay within budget

            COST RULES:
            - Temple / Religious places = 0
            - Beach / Public places = 0
            - Museum = 20-100
            - Transport = realistic
            - DO NOT give random cost

            Return ONLY JSON in this format:

            {{
              "title":"",
              "description":"",
              "destination": "",
              "total_budget": "",
              "days": [
                {{
                  "day": "Day 1",
                  "title": "",
                  "activities": [
                    {{
                      "time": "",
                      "title": "",
                      "description": "",
                      "cost": 0,
                      "type": ""
                    }}
                  ]
                }}
              ]
            }}
          """
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.replace("```json", "").replace("```", "").strip()

        trip_data = json.loads(text)


        trip_data["images"] = get_images(data.get("destination"))

        return trip_data
      

    except Exception as e:
        return {
            "error": str(e),
            "message": "AI generation failed"
        }